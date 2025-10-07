/**
 * FASE 7 - Sistema de Reporte Anual
 * Hook para cargar datos de Reporte Anual con React Query
 */

import { useQuery } from '@tanstack/react-query';
import { reporteAnualService } from '@/services';
import type { ReporteAnual, ResumenAnual } from '../types';

interface UseReporteAnualDataProps {
    trabajoId: string | undefined;
    anio: number | undefined;
    enabled?: boolean;
}

/**
 * Hook para obtener todos los reportes mensuales de un año
 * Crea automáticamente los 12 meses si no existen
 */
export const useReporteAnualData = ({
    trabajoId,
    anio,
    enabled = true,
}: UseReporteAnualDataProps) => {
    const queryKey = ['reporte-anual', trabajoId, anio];

    const {
        data: reportes = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!trabajoId || !anio) return [];
            return reporteAnualService.obtenerReporteAnual(trabajoId, anio);
        },
        enabled: enabled && !!trabajoId && !!anio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
    });

    return {
        reportes,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook para obtener el resumen anual con totales y estadísticas
 */
export const useReporteAnualResumen = ({
    trabajoId,
    anio,
    enabled = true,
}: UseReporteAnualDataProps) => {
    const queryKey = ['reporte-anual-resumen', trabajoId, anio];

    const {
        data: resumen,
        isLoading,
        error,
        refetch,
    } = useQuery<ResumenAnual>({
        queryKey,
        queryFn: async () => {
            if (!trabajoId || !anio) {
                throw new Error('trabajoId y anio son requeridos');
            }
            return reporteAnualService.obtenerResumenAnual(trabajoId, anio);
        },
        enabled: enabled && !!trabajoId && !!anio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
    });

    return {
        resumen,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook para obtener el reporte de un mes específico
 */
interface UseReporteMensualProps {
    trabajoId: string | undefined;
    anio: number | undefined;
    mes: number | undefined;
    enabled?: boolean;
}

export const useReporteMensual = ({
    trabajoId,
    anio,
    mes,
    enabled = true,
}: UseReporteMensualProps) => {
    const queryKey = ['reporte-mensual', trabajoId, anio, mes];

    const {
        data: reporte,
        isLoading,
        error,
        refetch,
    } = useQuery<ReporteAnual>({
        queryKey,
        queryFn: async () => {
            if (!trabajoId || !anio || !mes) {
                throw new Error('trabajoId, anio y mes son requeridos');
            }
            return reporteAnualService.obtenerReporteMensual(
                trabajoId,
                anio,
                mes
            );
        },
        enabled: enabled && !!trabajoId && !!anio && !!mes,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
    });

    return {
        reporte,
        isLoading,
        error,
        refetch,
    };
};
