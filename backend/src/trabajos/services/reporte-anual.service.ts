import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReporteAnual, MesEnum } from '../entities/reporte-anual.entity';
import { Trabajo } from '../entities/trabajo.entity';

export interface ActualizarVentasDto {
    trabajoId: string;
    anio: number;
    mes: number;
    ventas: number;
    ventasAuxiliar: number;
}

export interface ResumenAnual {
    anio: number;
    totalVentas: number;
    totalVentasAuxiliar: number;
    totalDiferencia: number;
    mesesConfirmados: number;
    mesesPendientes: number;
    reportes: ReporteAnual[];
}

@Injectable()
export class ReporteAnualService {
    constructor(
        @InjectRepository(ReporteAnual)
        private readonly reporteAnualRepository: Repository<ReporteAnual>,
        @InjectRepository(Trabajo)
        private readonly trabajoRepository: Repository<Trabajo>,
    ) { }

    /**
     * Obtiene o crea todos los registros mensuales para un año específico
     * Si no existen, crea los 12 meses automáticamente
     */
    async obtenerOCrearReporteAnual(
        trabajoId: string,
        anio: number,
    ): Promise<ReporteAnual[]> {
        // Verificar que el trabajo existe
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });
        if (!trabajo) {
            throw new NotFoundException(
                `Trabajo con ID ${trabajoId} no encontrado`,
            );
        }

        // Validar año
        if (anio < 2000 || anio > 2100) {
            throw new BadRequestException(
                'Año debe estar entre 2000 y 2100',
            );
        }

        // Buscar reportes existentes
        const reportesExistentes = await this.reporteAnualRepository.find({
            where: {
                trabajoId,
                anio,
            },
            order: {
                mes: 'ASC',
            },
        });

        // Si ya existen los 12 meses, retornarlos
        if (reportesExistentes.length === 12) {
            return reportesExistentes;
        }

        // Identificar meses faltantes
        const mesesExistentes = new Set(
            reportesExistentes.map((r) => r.mes),
        );
        const mesesFaltantes: number[] = [];

        for (let mes = 1; mes <= 12; mes++) {
            if (!mesesExistentes.has(mes)) {
                mesesFaltantes.push(mes);
            }
        }

        // Crear registros para meses faltantes
        const nuevosReportes: ReporteAnual[] = [];
        for (const mes of mesesFaltantes) {
            const nuevoReporte = this.reporteAnualRepository.create({
                trabajoId,
                anio,
                mes,
                ventas: null,
                ventasAuxiliar: null,
                diferencia: null,
                confirmado: false,
            });
            nuevosReportes.push(nuevoReporte);
        }

        // Guardar nuevos reportes
        if (nuevosReportes.length > 0) {
            await this.reporteAnualRepository.save(nuevosReportes);
        }

        // Retornar todos los reportes ordenados por mes
        return this.reporteAnualRepository.find({
            where: {
                trabajoId,
                anio,
            },
            order: {
                mes: 'ASC',
            },
        });
    }

    /**
     * Actualiza o crea el registro de ventas para un mes específico
     * Calcula automáticamente la diferencia y determina si está confirmado
     */
    async actualizarVentas(
        dto: ActualizarVentasDto,
    ): Promise<ReporteAnual> {
        const { trabajoId, anio, mes, ventas, ventasAuxiliar } = dto;

        // Validaciones
        if (mes < 1 || mes > 12) {
            throw new BadRequestException('Mes debe estar entre 1 y 12');
        }

        if (anio < 2000 || anio > 2100) {
            throw new BadRequestException(
                'Año debe estar entre 2000 y 2100',
            );
        }

        // Verificar que el trabajo existe
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });
        if (!trabajo) {
            throw new NotFoundException(
                `Trabajo con ID ${trabajoId} no encontrado`,
            );
        }

        // Calcular diferencia absoluta
        const diferencia = Math.abs(ventas - ventasAuxiliar);

        // Determinar si está confirmado (diferencia menor a $0.10)
        const confirmado = diferencia < 0.1;

        // Buscar si ya existe el reporte
        let reporte = await this.reporteAnualRepository.findOne({
            where: {
                trabajoId,
                anio,
                mes,
            },
        });

        if (reporte) {
            // Actualizar registro existente
            reporte.ventas = ventas;
            reporte.ventasAuxiliar = ventasAuxiliar;
            reporte.diferencia = diferencia;
            reporte.confirmado = confirmado;
        } else {
            // Crear nuevo registro
            reporte = this.reporteAnualRepository.create({
                trabajoId,
                anio,
                mes,
                ventas,
                ventasAuxiliar,
                diferencia,
                confirmado,
            });
        }

        return this.reporteAnualRepository.save(reporte);
    }

    /**
     * Obtiene el resumen anual con totales y estadísticas
     */
    async obtenerResumenAnual(
        trabajoId: string,
        anio: number,
    ): Promise<ResumenAnual> {
        // Obtener o crear todos los reportes del año
        const reportes = await this.obtenerOCrearReporteAnual(
            trabajoId,
            anio,
        );

        // Calcular totales
        let totalVentas = 0;
        let totalVentasAuxiliar = 0;
        let totalDiferencia = 0;
        let mesesConfirmados = 0;
        let mesesPendientes = 0;

        for (const reporte of reportes) {
            if (reporte.ventas !== null) {
                totalVentas += Number(reporte.ventas);
            }
            if (reporte.ventasAuxiliar !== null) {
                totalVentasAuxiliar += Number(reporte.ventasAuxiliar);
            }
            if (reporte.diferencia !== null) {
                totalDiferencia += Number(reporte.diferencia);
            }
            if (reporte.confirmado) {
                mesesConfirmados++;
            } else if (
                reporte.ventas !== null ||
                reporte.ventasAuxiliar !== null
            ) {
                mesesPendientes++;
            }
        }

        return {
            anio,
            totalVentas,
            totalVentasAuxiliar,
            totalDiferencia,
            mesesConfirmados,
            mesesPendientes,
            reportes,
        };
    }

    /**
     * Obtiene un reporte específico por mes
     */
    async obtenerReporteMensual(
        trabajoId: string,
        anio: number,
        mes: number,
    ): Promise<ReporteAnual> {
        const reporte = await this.reporteAnualRepository.findOne({
            where: {
                trabajoId,
                anio,
                mes,
            },
        });

        if (!reporte) {
            throw new NotFoundException(
                `Reporte para ${mes}/${anio} no encontrado`,
            );
        }

        return reporte;
    }

    /**
     * Elimina todos los reportes de un año
     */
    async eliminarReportesAnio(
        trabajoId: string,
        anio: number,
    ): Promise<void> {
        await this.reporteAnualRepository.delete({
            trabajoId,
            anio,
        });
    }
}
