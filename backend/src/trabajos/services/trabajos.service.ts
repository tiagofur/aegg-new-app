import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
    Logger,
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
import * as ExcelJS from 'exceljs';
import { Cliente } from '../../clientes/entities';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { UserRole, User } from '../../auth/entities/user.entity';

@Injectable()
export class TrabajosService {
    private readonly logger = new Logger(TrabajosService.name);

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
        this.logger.log('Iniciando creación de trabajo', createTrabajoDto);

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

        const gestorResponsableId =
            createTrabajoDto.gestorResponsableId ?? currentUser.userId;

        const gestorResponsable = await this.userRepository.findOne({ where: { id: gestorResponsableId } });

        if (!gestorResponsable) {
            throw new NotFoundException(
                `Usuario con id ${gestorResponsableId} no encontrado para asignar como gestor`,
            );
        }

        if (gestorResponsable.role !== UserRole.ADMIN && gestorResponsable.role !== UserRole.GESTOR) {
            throw new BadRequestException('El gestor responsable debe tener rol de Admin o Gestor.');
        }

        if (
            currentUser.role === UserRole.GESTOR &&
            currentUser.equipoId &&
            gestorResponsable.role === UserRole.GESTOR &&
            gestorResponsable.equipoId &&
            gestorResponsable.equipoId !== currentUser.equipoId
        ) {
            throw new ForbiddenException('Solo puedes asignar gestores de tu equipo.');
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
                gestorResponsableId: gestorResponsable.id,
            });
            trabajo.gestorResponsable = gestorResponsable;
            const trabajoGuardado = await queryRunner.manager.save(trabajo);
            this.logger.log('Trabajo guardado', { id: trabajoGuardado.id });

            // Crear reporte base anual inicial
            const reporteBase = this.reporteBaseRepository.create({
                trabajoId: trabajoGuardado.id,
                mesesCompletados: [],
                hojas: this.getHojasIniciales(),
            });
            await queryRunner.manager.save(reporteBase);
            this.logger.log('Reporte base anual creado');

            // Crear los 12 meses automáticamente
            this.logger.log('Iniciando creación de meses automáticos...');
            await this.crearMesesAutomaticosEnTransaccion(trabajoGuardado.id, queryRunner);
            this.logger.log('Meses automáticos creados');

            // Confirmar transacción
            await queryRunner.commitTransaction();
            this.logger.log('Transacción confirmada');

            // Retornar trabajo con reporte base y meses
            const trabajoCompleto = await this.findOne(trabajoGuardado.id, currentUser);
            this.logger.log('Trabajo completo con meses', {
                id: trabajoCompleto.id,
                cantidadMeses: trabajoCompleto.meses?.length || 0,
            });
            return trabajoCompleto;
        } catch (error) {
            // Revertir transacción en caso de error
            this.logger.error('Error en transacción, revirtiendo', error);
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
                'gestorResponsable',
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

        if (
            payload.gestorResponsableId &&
            payload.gestorResponsableId !== trabajo.gestorResponsableId
        ) {
            const nuevoGestor = await this.userRepository.findOne({
                where: { id: payload.gestorResponsableId },
            });

            if (!nuevoGestor) {
                throw new NotFoundException(
                    `Usuario con id ${payload.gestorResponsableId} no encontrado para asignar como gestor`,
                );
            }

            if (nuevoGestor.role !== UserRole.ADMIN && nuevoGestor.role !== UserRole.GESTOR) {
                throw new BadRequestException('El gestor responsable debe tener rol de Admin o Gestor.');
            }

            if (
                currentUser.role === UserRole.GESTOR &&
                currentUser.equipoId &&
                nuevoGestor.role === UserRole.GESTOR &&
                nuevoGestor.equipoId &&
                nuevoGestor.equipoId !== currentUser.equipoId
            ) {
                throw new ForbiddenException('Solo puedes asignar gestores de tu equipo.');
            }

            trabajo.gestorResponsable = nuevoGestor;
            trabajo.gestorResponsableId = nuevoGestor.id;
        } else if (payload.gestorResponsableId === null) {
            trabajo.gestorResponsable = null;
            trabajo.gestorResponsableId = null;
        }

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
            // Leer el archivo Excel con ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer as any);

            // Validar que tenga al menos una hoja
            if (!workbook.worksheets || workbook.worksheets.length === 0) {
                throw new BadRequestException('El archivo Excel no contiene hojas');
            }

            // Extraer todas las hojas
            const hojas = workbook.worksheets.map((worksheet) => {
                const datos: any[][] = [];

                worksheet.eachRow({ includeEmpty: true }, (row) => {
                    const rowValues: any[] = [];
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        let value = cell.value;

                        // Si es una fórmula, obtener el resultado
                        if (cell.type === ExcelJS.ValueType.Formula && cell.result !== undefined) {
                            value = cell.result;
                        }

                        // Si es fecha, convertir a Date
                        if (cell.type === ExcelJS.ValueType.Date) {
                            value = cell.value as Date;
                        }

                        rowValues.push(value);
                    });
                    datos.push(rowValues);
                });

                return {
                    nombre: worksheet.name,
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(
                `Error al procesar el archivo Excel: ${errorMessage}`,
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
     * Versión con transacción explícita para crear los 12 meses del año automáticamente
     */
    private async crearMesesAutomaticosEnTransaccion(trabajoId: string, queryRunner: any): Promise<void> {
        this.logger.log(`Creando meses automáticos para trabajo (con transacción): ${trabajoId}`);
        const mesesCreados: Mes[] = [];

        // Crear los 12 meses
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }

        this.logger.log(`${mesesCreados.length} meses creados en memoria, guardando...`);
        // Guardar todos los meses usando el queryRunner
        const mesesGuardados = await queryRunner.manager.save(mesesCreados);
        this.logger.log(`${mesesGuardados.length} meses guardados en BD`);

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

        this.logger.log(`${reportes.length} reportes mensuales creados en memoria, guardando...`);
        // Guardar todos los reportes usando el queryRunner
        await queryRunner.manager.save(reportes);
        this.logger.log('Reportes mensuales guardados en BD');
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

            if (trabajo.gestorResponsableId === currentUser.userId) {
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
                'gestorResponsable',
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

            if (trabajo.gestorResponsableId === currentUser.userId) {
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

    /**
     * Actualiza las ventas mensuales en el Reporte Base Anual (Excel)
     * Busca la fila "Ventas" y la columna del mes para actualizar la celda
     */
    async actualizarVentasMensualesEnExcel(
        trabajoId: string,
        mes: number,
        ventas: number,
        _currentUser: CurrentUserPayload,
    ): Promise<ReporteBaseAnual> {
        // Los Miembros, Gestores y Admins pueden actualizar las ventas mensuales en el Excel
        // Esta validación se hace en el controlador con @Roles, aquí solo verificamos autenticación

        // Validar mes
        if (mes < 1 || mes > 12) {
            throw new BadRequestException('Mes debe estar entre 1 y 12');
        }

        // Obtener el trabajo con el reporte base anual
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
            relations: ['reporteBaseAnual'],
        });

        if (!trabajo) {
            throw new NotFoundException(`Trabajo con ID ${trabajoId} no encontrado`);
        }

        if (!trabajo.reporteBaseAnual) {
            throw new NotFoundException(
                'Reporte Base Anual no encontrado. Debe importar el Excel primero.',
            );
        }

        const reporte = trabajo.reporteBaseAnual;

        // Verificar que exista al menos una hoja
        if (!reporte.hojas || reporte.hojas.length === 0) {
            throw new BadRequestException(
                'El Reporte Base Anual no contiene hojas',
            );
        }

        this.logger.log(`Reporte Base tiene ${reporte.hojas.length} hojas`);
        this.logger.log('Nombres de hojas', reporte.hojas.map((h: any) => h.nombre));

        // Trabajar con la hoja 0 (PRIMERA HOJA del Excel importado)
        const hoja0 = reporte.hojas[0];

        if (!hoja0 || !hoja0.datos || hoja0.datos.length === 0) {
            throw new BadRequestException('La hoja 0 no contiene datos');
        }

        this.logger.log(`Trabajando con hoja: "${hoja0.nombre}"`);
        this.logger.log(`La hoja tiene ${hoja0.datos.length} filas`);

        const datos = hoja0.datos;

        // Función auxiliar para normalizar texto
        const normalize = (text: any): string => {
            if (!text) return '';
            return text
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '');
        };

        // 1. Buscar la fila de encabezado (debe contener los meses)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(datos.length, 20); i++) {
            const row = datos[i];
            if (Array.isArray(row)) {
                const rowText = row.map((cell) => normalize(cell)).join(' ');
                // Buscar si contiene varios nombres de meses
                const mesesEncontrados = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ].filter(m => rowText.includes(m)).length;

                if (mesesEncontrados >= 3) {
                    headerRowIndex = i;
                    break;
                }
            }
        }

        if (headerRowIndex === -1) {
            // Log de diagnóstico: mostrar primeras 10 filas
            this.logger.warn('No se encontró el encabezado. Mostrando primeras 10 filas:');
            for (let i = 0; i < Math.min(datos.length, 10); i++) {
                this.logger.debug(`Fila ${i}:`, datos[i]);
            }
            throw new BadRequestException(
                'No se encontró la fila de encabezado con los nombres de los meses',
            );
        }

        this.logger.log(`Encabezado encontrado en fila ${headerRowIndex}`);

        const headerRow = datos[headerRowIndex];
        this.logger.debug('Contenido del encabezado', headerRow);

        // 2. Buscar la columna del mes
        const mesesNombres = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        ];
        const mesNombre = mesesNombres[mes - 1];

        let mesColumnIndex = -1;
        for (let i = 0; i < headerRow.length; i++) {
            const cellNorm = normalize(headerRow[i]);
            if (cellNorm === mesNombre) {
                mesColumnIndex = i;
                break;
            }
        }

        if (mesColumnIndex === -1) {
            this.logger.warn('No se encontró la columna del mes');
            this.logger.debug(`Mes buscado: "${mesNombre}"`);
            this.logger.debug('Columnas normalizadas', headerRow.map((c: string, i: number) => `[${i}]="${normalize(c)}"`));
            throw new BadRequestException(
                `No se encontró la columna del mes "${mesesNombres[mes - 1].toUpperCase()}"`,
            );
        }

        this.logger.log(`Columna del mes "${mesNombre.toUpperCase()}" encontrada en índice ${mesColumnIndex}`);

        // 3. Buscar la fila "Ventas" (después del encabezado)
        // Buscar en la columna de CONCEPTO (normalmente índice 1)
        let ventasRowIndex = -1;
        for (let i = headerRowIndex + 1; i < datos.length; i++) {
            const row = datos[i];
            if (Array.isArray(row) && row.length > 1) {
                const concepto = normalize(row[1]); // Columna CONCEPTO
                // Buscar la fila que tenga exactamente "ventas"
                if (concepto === 'ventas') {
                    ventasRowIndex = i;
                    break;
                }
            }
        }

        if (ventasRowIndex === -1) {
            this.logger.warn('No se encontró la fila de Ventas');
            this.logger.debug('Buscando filas después del encabezado:');
            for (let i = headerRowIndex + 1; i < Math.min(datos.length, headerRowIndex + 20); i++) {
                const row = datos[i];
                if (Array.isArray(row) && row.length > 1) {
                    this.logger.debug(`Fila ${i}: [0]="${normalize(row[0])}" [1]="${normalize(row[1])}"`);
                }
            }
            throw new BadRequestException(
                'No se encontró la fila "( = ) Ventas" en la hoja',
            );
        }

        this.logger.log(`Fila de Ventas encontrada en índice ${ventasRowIndex}`);

        // 4. Actualizar la celda en la intersección
        this.logger.log('Actualizando celda en Excel', {
            trabajoId,
            mes: mesesNombres[mes - 1],
            ventas,
            fila: ventasRowIndex,
            columna: mesColumnIndex,
            valorAnterior: datos[ventasRowIndex][mesColumnIndex],
        });

        datos[ventasRowIndex][mesColumnIndex] = ventas;

        // 5. Guardar cambios
        hoja0.datos = datos;
        reporte.hojas[0] = hoja0;
        reporte.ultimaActualizacion = new Date();

        const reporteActualizado = await this.reporteBaseRepository.save(reporte);

        this.logger.log(`Ventas actualizadas en Excel para ${mesesNombres[mes - 1]}`);

        return reporteActualizado;
    }
}
