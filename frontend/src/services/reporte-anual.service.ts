/**
 * FASE 7 - Sistema de Reporte Anual
 * Servicio API para endpoints de Reporte Anual
 */

import api from './api';
import {
    ReporteAnual,
    ResumenAnual,
    ActualizarVentasRequest,
} from '../features/trabajos/reportes/reporte-anual/types';

export const reporteAnualService = {
    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio
     * Obtiene todos los reportes mensuales para un año
     * Crea automáticamente los 12 meses si no existen
     */
    async obtenerReporteAnual(
        trabajoId: string,
        anio: number
    ): Promise<ReporteAnual[]> {
        const { data } = await api.get<ReporteAnual[]>(
            `/trabajos/${trabajoId}/reporte-anual/${anio}`
        );
        return data;
    },

    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio/resumen
     * Obtiene el resumen anual con totales y estadísticas
     */
    async obtenerResumenAnual(
        trabajoId: string,
        anio: number
    ): Promise<ResumenAnual> {
        const { data } = await api.get<ResumenAnual>(
            `/trabajos/${trabajoId}/reporte-anual/${anio}/resumen`
        );
        return data;
    },

    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio/mes/:mes
     * Obtiene el reporte de un mes específico
     */
    async obtenerReporteMensual(
        trabajoId: string,
        anio: number,
        mes: number
    ): Promise<ReporteAnual> {
        const { data } = await api.get<ReporteAnual>(
            `/trabajos/${trabajoId}/reporte-anual/${anio}/mes/${mes}`
        );
        return data;
    },

    /**
     * POST /trabajos/:trabajoId/reporte-anual/actualizar-ventas
     * Actualiza o crea el registro de ventas para un mes específico
     * Body: { anio, mes, ventas, ventasAuxiliar }
     */
    async actualizarVentas(
        trabajoId: string,
        request: ActualizarVentasRequest
    ): Promise<ReporteAnual> {
        const { data } = await api.post<ReporteAnual>(
            `/trabajos/${trabajoId}/reporte-anual/actualizar-ventas`,
            request
        );
        return data;
    },
};
