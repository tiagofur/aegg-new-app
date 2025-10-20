import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import {
    Trabajo,
    ReporteBaseAnual,
    Mes,
    ReporteMensual,
    TipoReporteMensual,
    EstadoAprobacion,
} from '../entities';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';
import * as XLSX from 'xlsx';
import { Cliente } from '../../clientes/entities';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { UserRole, User } from '../../auth/entities/user.entity';

@Injectable()
export class TrabajosService {
    constructor(
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        @InjectRepository(Cliente)
        private clienteRepository: Repository<Cliente>,
        @InjectRepository(ReporteBaseAnual)
        private reporteBaseRepository: Repository<ReporteBaseAnual>,
        @InjectRepository(Mes)
        private mesRepository: Repository<Mes>,
        @InjectRepository(ReporteMensual)
        private reporteMensualRepository: Repository<ReporteMensual>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private dataSource: DataSource,
    ) { }

    async create(
        createTrabajoDto: CreateTrabajoDto,
        currentUser: CurrentUserPayload,
    ): Promise<Trabajo> {
        this.assertCanManage(currentUser);
        console.log('[TrabajosService] Iniciando creación de trabajo:', createTrabajoDto);

        if (!createTrabajoDto.clienteId) {
            throw new BadRequestException('clienteId es requerido para crear un trabajo.');
        }

        const cliente = await this.clienteRepository.findOne({
            where: { id: createTrabajoDto.clienteId },
        });

        if (!cliente) {
            throw new NotFoundException(
                `Cliente con id ${createTrabajoDto.clienteId} no encontrado`,
            );
        }

        const miembroAsignadoId =
            createTrabajoDto.miembroAsignadoId ??
            createTrabajoDto.usuarioAsignadoId ??
            null;

        if (miembroAsignadoId) {
            const miembroAsignado = await this.userRepository.findOne({ where: { id: miembroAsignadoId } });

            if (!miembroAsignado) {
                throw new NotFoundException(
                    `Usuario con id ${miembroAsignadoId} no encontrado para asignar al trabajo`,
                );
            }

            if (
                currentUser.role === UserRole.GESTOR &&
                currentUser.equipoId &&
                miembroAsignado.equipoId !== currentUser.equipoId
            ) {
                throw new ForbiddenException('Solo puedes asignar miembros de tu equipo.');
            }
        }

        // Verificar que no exista un trabajo para ese cliente y año
        const existe = await this.trabajoRepository.findOne({
            where: {
                clienteId: createTrabajoDto.clienteId,
                anio: createTrabajoDto.anio,
            },
        });

        if (existe) {
            throw new ConflictException(
                `Ya existe un trabajo para el cliente ${cliente.nombre} en el año ${createTrabajoDto.anio}`,
            );
        }

        // Usar transacción para garantizar que todo se guarde correctamente
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Crear trabajo
            const trabajo = this.trabajoRepository.create({
                ...createTrabajoDto,
                clienteNombre: cliente.nombre,
                clienteRfc: cliente.rfc,
                estadoAprobacion:
                    createTrabajoDto.estadoAprobacion ?? EstadoAprobacion.EN_PROGRESO,
                miembroAsignadoId,
            });
            const trabajoGuardado = await queryRunner.manager.save(trabajo);
            console.log('[TrabajosService] Trabajo guardado:', trabajoGuardado.id);

            // Crear reporte base anual inicial
            const reporteBase = this.reporteBaseRepository.create({
                trabajoId: trabajoGuardado.id,
                mesesCompletados: [],
                hojas: this.getHojasIniciales(),
            });
            await queryRunner.manager.save(reporteBase);
            console.log('[TrabajosService] Reporte base anual creado');

            // Crear los 12 meses automáticamente
            console.log('[TrabajosService] Iniciando creación de meses automáticos...');
            await this.crearMesesAutomaticosEnTransaccion(trabajoGuardado.id, queryRunner);
            console.log('[TrabajosService] Meses automáticos creados');

            // Confirmar transacción
            await queryRunner.commitTransaction();
            console.log('[TrabajosService] Transacción confirmada');

            // Retornar trabajo con reporte base y meses
            const trabajoCompleto = await this.findOne(trabajoGuardado.id, currentUser);
            console.log('[TrabajosService] Trabajo completo con meses:', {
                id: trabajoCompleto.id,
                cantidadMeses: trabajoCompleto.meses?.length || 0,
            });
            return trabajoCompleto;
        } catch (error) {
            // Revertir transacción en caso de error
            console.error('[TrabajosService] Error en transacción, revirtiendo:', error);
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar el queryRunner
            await queryRunner.release();
        }
    }

    async findAll(
        currentUser: CurrentUserPayload,
        usuarioId?: string,
    ): Promise<Trabajo[]> {
        const whereCondition = this.buildListadoWhere(currentUser, usuarioId);

        const trabajos = await this.trabajoRepository.find({
            where: whereCondition,
            relations: [
                'reporteBaseAnual',
                'meses',
                'meses.reportes',
                'meses.enviadoRevisionPor',
                'meses.aprobadoPor',
                'miembroAsignado',
                'cliente',
                'aprobadoPor',
            ],
            order: {
                fechaCreacion: 'DESC',
            },
        });

        return this.applyEquipoVisibility(trabajos, currentUser);
    }

    async findOne(id: string, currentUser: CurrentUserPayload): Promise<Trabajo> {
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);
        return trabajo;
    }

    async update(
        id: string,
        updateTrabajoDto: UpdateTrabajoDto,
        currentUser: CurrentUserPayload,
    ): Promise<Trabajo> {
        this.assertCanManage(currentUser);
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);

        if (updateTrabajoDto.clienteId && updateTrabajoDto.clienteId !== trabajo.clienteId) {
            const nuevoCliente = await this.clienteRepository.findOne({
                where: { id: updateTrabajoDto.clienteId },
            });

            if (!nuevoCliente) {
                throw new NotFoundException(
                    `Cliente con id ${updateTrabajoDto.clienteId} no encontrado`,
                );
            }

            trabajo.cliente = nuevoCliente;
            trabajo.clienteId = nuevoCliente.id;
            trabajo.clienteNombre = nuevoCliente.nombre;
            trabajo.clienteRfc = nuevoCliente.rfc;
        }

        const payload: UpdateTrabajoDto = { ...updateTrabajoDto };

        if (payload.usuarioAsignadoId && !payload.miembroAsignadoId) {
            payload.miembroAsignadoId = payload.usuarioAsignadoId;
        }

        if (
            payload.miembroAsignadoId &&
            payload.miembroAsignadoId !== trabajo.miembroAsignadoId
        ) {
            const nuevoMiembro = await this.userRepository.findOne({
                where: { id: payload.miembroAsignadoId },
            });

            if (!nuevoMiembro) {
                throw new NotFoundException(
                    `Usuario con id ${payload.miembroAsignadoId} no encontrado para asignar al trabajo`,
                );
            }

            if (
                currentUser.role === UserRole.GESTOR &&
                currentUser.equipoId &&
                nuevoMiembro.equipoId !== currentUser.equipoId
            ) {
                throw new ForbiddenException('Solo puedes asignar miembros de tu equipo.');
            }

            trabajo.miembroAsignado = nuevoMiembro;
            trabajo.miembroAsignadoId = nuevoMiembro.id;
        } else if (payload.miembroAsignadoId === null) {
            trabajo.miembroAsignado = null;
            trabajo.miembroAsignadoId = null;
        }

        Object.assign(trabajo, payload);

        if (trabajo.cliente) {
            trabajo.clienteNombre = trabajo.cliente.nombre;
            trabajo.clienteRfc = trabajo.cliente.rfc;
        }

        await this.trabajoRepository.save(trabajo);

        return this.findOne(id, currentUser);
    }

    async remove(id: string, currentUser: CurrentUserPayload): Promise<void> {
        this.assertCanManage(currentUser);
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);
        await this.trabajoRepository.remove(trabajo);
    }

    async importarReporteBase(
        trabajoId: string,
        fileBuffer: Buffer,
        currentUser: CurrentUserPayload,
    ): Promise<ReporteBaseAnual> {
        this.assertCanManage(currentUser);
        const trabajo = await this.findOne(trabajoId, currentUser);

        if (!trabajo.reporteBaseAnual) {
            const nuevoReporteBase = this.reporteBaseRepository.create({
                trabajoId: trabajo.id,
                mesesCompletados: [],
                hojas: this.getHojasIniciales(),
            });
            trabajo.reporteBaseAnual = await this.reporteBaseRepository.save(
                nuevoReporteBase,
            );
        }

        try {
            // Leer el archivo Excel
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

            // Validar que tenga al menos una hoja
            if (workbook.SheetNames.length === 0) {
                throw new BadRequestException('El archivo Excel no contiene hojas');
            }

            // Extraer todas las hojas
            const hojas = workbook.SheetNames.map((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                return {
                    nombre: sheetName,
                    datos: datos,
                };
            });

            // Actualizar el reporte base anual
            trabajo.reporteBaseAnual.hojas = hojas;
            await this.reporteBaseRepository.save(trabajo.reporteBaseAnual);

            return trabajo.reporteBaseAnual;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error al procesar el archivo Excel: ${error.message}`,
            );
        }
    }

    private getHojasIniciales(): any[] {
        return [
            {
                nombre: 'Resumen Anual',
                datos: [],
            },
            {
                nombre: 'Ingresos Consolidados',
                datos: [],
            },
            {
                nombre: 'Comparativas',
                datos: [],
            },
        ];
    }

    /**
     * Crea los 12 meses del año automáticamente para un trabajo
     * Cada mes tiene 3 reportes mensuales vacíos (INGRESOS, INGRESOS_AUXILIAR, INGRESOS_MI_ADMIN)
     */
    private async crearMesesAutomaticos(trabajoId: string): Promise<void> {
        console.log(`[TrabajosService] Creando meses automáticos para trabajo: ${trabajoId}`);
        const mesesCreados: Mes[] = [];

        // Crear los 12 meses
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }

        console.log(`[TrabajosService] ${mesesCreados.length} meses creados en memoria, guardando...`);
        // Guardar todos los meses
        const mesesGuardados = await this.mesRepository.save(mesesCreados);
        console.log(`[TrabajosService] ${mesesGuardados.length} meses guardados en BD`);

        // Crear los 3 reportes mensuales para cada mes
        const reportes: ReporteMensual[] = [];

        for (const mes of mesesGuardados) {
            // Reporte Ingresos
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS,
                    datos: [],
                }),
            );

            // Reporte Ingresos Auxiliar
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS_AUXILIAR,
                    datos: [],
                }),
            );

            // Reporte MI Admin Ingresos
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS_MI_ADMIN,
                    datos: [],
                }),
            );
        }

        console.log(`[TrabajosService] ${reportes.length} reportes mensuales creados en memoria, guardando...`);
        // Guardar todos los reportes
        await this.reporteMensualRepository.save(reportes);
        console.log(`[TrabajosService] Reportes mensuales guardados en BD`);
    }

    /**
     * Versión con transacción explícita para crear los 12 meses del año automáticamente
     */
    private async crearMesesAutomaticosEnTransaccion(trabajoId: string, queryRunner: any): Promise<void> {
        console.log(`[TrabajosService] Creando meses automáticos para trabajo (con transacción): ${trabajoId}`);
        const mesesCreados: Mes[] = [];

        // Crear los 12 meses
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }

        console.log(`[TrabajosService] ${mesesCreados.length} meses creados en memoria, guardando...`);
        // Guardar todos los meses usando el queryRunner
        const mesesGuardados = await queryRunner.manager.save(mesesCreados);
        console.log(`[TrabajosService] ${mesesGuardados.length} meses guardados en BD`);

        // Crear los 3 reportes mensuales para cada mes
        const reportes: ReporteMensual[] = [];

        for (const mes of mesesGuardados) {
            // Reporte Ingresos
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS,
                    datos: [],
                }),
            );

            // Reporte Ingresos Auxiliar
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS_AUXILIAR,
                    datos: [],
                }),
            );

            // Reporte MI Admin Ingresos
            reportes.push(
                this.reporteMensualRepository.create({
                    mesId: mes.id,
                    tipo: TipoReporteMensual.INGRESOS_MI_ADMIN,
                    datos: [],
                }),
            );
        }

        console.log(`[TrabajosService] ${reportes.length} reportes mensuales creados en memoria, guardando...`);
        // Guardar todos los reportes usando el queryRunner
        await queryRunner.manager.save(reportes);
        console.log(`[TrabajosService] Reportes mensuales guardados en BD`);
    }

    private buildListadoWhere(
        currentUser: CurrentUserPayload,
        miembroFiltro?: string,
    ): FindOptionsWhere<Trabajo> {
        if (currentUser.role === UserRole.MIEMBRO) {
            return { miembroAsignadoId: currentUser.userId };
        }

        if (miembroFiltro) {
            return { miembroAsignadoId: miembroFiltro };
        }

        return {};
    }

    private assertCanManage(currentUser: CurrentUserPayload) {
        if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.GESTOR) {
            return;
        }
        throw new ForbiddenException('No tienes permisos para modificar trabajos.');
    }

    private assertCanAccess(trabajo: Trabajo, currentUser: CurrentUserPayload) {
        if (currentUser.role === UserRole.ADMIN) {
            return;
        }

        if (currentUser.role === UserRole.GESTOR) {
            if (!trabajo.visibilidadEquipo) {
                return;
            }

            if (!currentUser.equipoId) {
                return;
            }

            if (trabajo.miembroAsignadoId === currentUser.userId) {
                return;
            }

            const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
            if (miembroEquipoId === currentUser.equipoId) {
                return;
            }

            if (trabajo.aprobadoPorId === currentUser.userId) {
                return;
            }

            if (!trabajo.miembroAsignadoId) {
                return;
            }

            throw new ForbiddenException('No tienes permisos para ver este trabajo.');
        }

        if (trabajo.miembroAsignadoId === currentUser.userId) {
            return;
        }

        throw new ForbiddenException('No tienes permisos para ver este trabajo.');
    }

    private async getTrabajoOrThrow(id: string): Promise<Trabajo> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id },
            relations: [
                'reporteBaseAnual',
                'meses',
                'meses.reportes',
                'meses.enviadoRevisionPor',
                'meses.aprobadoPor',
                'miembroAsignado',
                'cliente',
                'aprobadoPor',
            ],
        });

        if (!trabajo) {
            throw new NotFoundException(`Trabajo con id ${id} no encontrado`);
        }

        return trabajo;
    }

    private applyEquipoVisibility(
        trabajos: Trabajo[],
        currentUser: CurrentUserPayload,
    ): Trabajo[] {
        if (currentUser.role !== UserRole.GESTOR || !currentUser.equipoId) {
            return trabajos;
        }

        return trabajos.filter((trabajo) => {
            if (!trabajo.visibilidadEquipo) {
                return true;
            }

            if (!trabajo.miembroAsignadoId) {
                return true;
            }

            if (trabajo.miembroAsignadoId === currentUser.userId) {
                return true;
            }

            const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
            if (miembroEquipoId === currentUser.equipoId) {
                return true;
            }

            if (trabajo.aprobadoPorId === currentUser.userId) {
                return true;
            }

            return false;
        });
    }
}
