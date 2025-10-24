/**
 * FASE 7 - Sistema de Reporte Anual
 * Hook para actualizar ventas con React Query Mutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteAnualService, trabajosService } from '@/services';
import type { ActualizarVentasRequest, ReporteAnual } from '../types';
import type { ReporteBaseAnual } from '@/types/trabajo';

interface UseReporteAnualUpdateProps {
    trabajoId: string;
    onSuccess?: (data: ReporteAnual) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook para actualizar/crear registro de ventas mensuales
 * Invalida cache de reportes anuales y resumen
 */
export const useReporteAnualUpdate = ({
    trabajoId,
    onSuccess,
    onError,
}: UseReporteAnualUpdateProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (request: ActualizarVentasRequest) => {
            return reporteAnualService.actualizarVentas(trabajoId, request);
        },
        onSuccess: (data: ReporteAnual) => {
            // Invalidar queries relacionadas para refrescar datos
            queryClient.invalidateQueries({
                queryKey: ['reporte-anual', trabajoId, data.anio],
            });
            queryClient.invalidateQueries({
                queryKey: ['reporte-anual-resumen', trabajoId, data.anio],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    'reporte-mensual',
                    trabajoId,
                    data.anio,
                    data.mes,
                ],
            });

            // Callback personalizado
            if (onSuccess) {
                onSuccess(data);
            }
        },
        onError: (error: Error) => {
            console.error('Error al actualizar ventas:', error);
            if (onError) {
                onError(error);
            }
        },
    });

    return {
        actualizarVentas: mutation.mutate,
        actualizarVentasAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
};

interface UseReporteBaseAnualUpdateProps {
    trabajoId: string;
    onSuccess?: (data: ReporteBaseAnual) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook para actualizar ventas mensuales en el Excel del Reporte Base Anual
 * Modifica directamente el JSONB de la tabla reportes_base_anual
 */
export const useReporteBaseAnualUpdate = ({
    trabajoId,
    onSuccess,
    onError,
}: UseReporteBaseAnualUpdateProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (request: { mes: number; ventas: number }) => {
            return trabajosService.actualizarVentasMensualesEnExcel(
                trabajoId,
                request.mes,
                request.ventas
            );
        },
        onSuccess: (data: ReporteBaseAnual) => {
            // Invalidar queries del trabajo para refrescar el reporte base
            queryClient.invalidateQueries({
                queryKey: ['trabajo', trabajoId],
            });
            queryClient.invalidateQueries({
                queryKey: ['reporte-base-anual', trabajoId],
            });

            // Callback personalizado
            if (onSuccess) {
                onSuccess(data);
            }
        },
        onError: (error: Error) => {
            console.error('Error al actualizar ventas en Excel:', error);
            if (onError) {
                onError(error);
            }
        },
    });

    return {
        actualizarVentasEnExcel: mutation.mutate,
        actualizarVentasEnExcelAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
};
