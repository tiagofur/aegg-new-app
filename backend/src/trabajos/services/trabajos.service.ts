import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajo, ReporteBaseAnual, Mes, ReporteMensual, TipoReporteMensual } from '../entities';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';
import * as XLSX from 'xlsx';

@Injectable()
export class TrabajosService {
    constructor(
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        @InjectRepository(ReporteBaseAnual)
        private reporteBaseRepository: Repository<ReporteBaseAnual>,
        @InjectRepository(Mes)
        private mesRepository: Repository<Mes>,
        @InjectRepository(ReporteMensual)
        private reporteMensualRepository: Repository<ReporteMensual>,
    ) { }

    async create(createTrabajoDto: CreateTrabajoDto): Promise<Trabajo> {
        // Verificar que no exista un trabajo para ese cliente y año
        const existe = await this.trabajoRepository.findOne({
            where: {
                clienteNombre: createTrabajoDto.clienteNombre,
                anio: createTrabajoDto.anio,
            },
        });

        if (existe) {
            throw new ConflictException(
                `Ya existe un trabajo para el cliente ${createTrabajoDto.clienteNombre} en el año ${createTrabajoDto.anio}`,
            );
        }

        // Crear trabajo
        const trabajo = this.trabajoRepository.create(createTrabajoDto);
        const trabajoGuardado = await this.trabajoRepository.save(trabajo);

        // Crear reporte base anual inicial
        const reporteBase = this.reporteBaseRepository.create({
            trabajoId: trabajoGuardado.id,
            mesesCompletados: [],
            hojas: this.getHojasIniciales(),
        });
        await this.reporteBaseRepository.save(reporteBase);

        // Crear los 12 meses automáticamente
        await this.crearMesesAutomaticos(trabajoGuardado.id);

        // Retornar trabajo con reporte base y meses
        return this.findOne(trabajoGuardado.id);
    }

    async findAll(usuarioId?: string): Promise<Trabajo[]> {
        const whereCondition = usuarioId
            ? { usuarioAsignadoId: usuarioId }
            : {};

        return this.trabajoRepository.find({
            where: whereCondition,
            relations: ['reporteBaseAnual', 'meses', 'meses.reportes', 'usuarioAsignado'],
            order: {
                fechaCreacion: 'DESC',
            },
        });
    }

    async findOne(id: string): Promise<Trabajo> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id },
            relations: ['reporteBaseAnual', 'meses', 'meses.reportes', 'usuarioAsignado'],
        });

        if (!trabajo) {
            throw new NotFoundException(`Trabajo con id ${id} no encontrado`);
        }

        return trabajo;
    }

    async update(id: string, updateTrabajoDto: UpdateTrabajoDto): Promise<Trabajo> {
        const trabajo = await this.findOne(id);

        Object.assign(trabajo, updateTrabajoDto);
        await this.trabajoRepository.save(trabajo);

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const trabajo = await this.findOne(id);
        await this.trabajoRepository.remove(trabajo);
    }

    async importarReporteBase(trabajoId: string, fileBuffer: Buffer): Promise<ReporteBaseAnual> {
        const trabajo = await this.findOne(trabajoId);

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
        const mesesCreados: Mes[] = [];

        // Crear los 12 meses
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }

        // Guardar todos los meses
        const mesesGuardados = await this.mesRepository.save(mesesCreados);

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

        // Guardar todos los reportes
        await this.reporteMensualRepository.save(reportes);
    }
}
