/**
 * FASE 7 - Sistema de Reporte Anual
 * Hook para actualizar ventas con React Query Mutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteAnualService } from '@/services';
import type { ActualizarVentasRequest, ReporteAnual } from '../types';

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
