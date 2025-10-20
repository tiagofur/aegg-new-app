/**
 * Hook para cargar y guardar datos de Mi Admin Ingresos
 * Integra con React Query y datos de Auxiliar Ingresos
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportesMensualesService } from '@/services';
import { parseExcelToMiAdminIngresos, convertToExcelFormat } from '../utils';
import type { MiAdminIngresosRow } from '../types';
import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos';

interface UseMiAdminIngresosDataProps {
    mesId: string | undefined;
    reporteId: string | undefined;
    auxiliarData: AuxiliarIngresosRow[] | undefined;
    version?: string | number | null;
    enabled?: boolean;
}

export const useMiAdminIngresosData = ({
    mesId,
    reporteId,
    auxiliarData,
    version,
    enabled = true,
}: UseMiAdminIngresosDataProps) => {
    const queryClient = useQueryClient();
    const queryKey = ['reporte-mi-admin-ingresos', mesId, reporteId, version ?? null];

    // Query para cargar datos
    const {
        data: rawResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!mesId || !reporteId) return null;

            return await reportesMensualesService.obtenerDatos(mesId, reporteId);
        },
        enabled: enabled && !!mesId && !!reporteId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const miAdminData: MiAdminIngresosRow[] = useMemo(() => {
        if (!rawResponse?.datos) {
            return [];
        }

        const auxiliarRows = auxiliarData?.filter((row) => !row.isSummary) || [];

        return parseExcelToMiAdminIngresos(rawResponse.datos, auxiliarRows);
    }, [rawResponse, auxiliarData]);

    // Mutation para guardar cambios
    const saveMutation = useMutation({
        mutationFn: async (updatedData: MiAdminIngresosRow[]) => {
            if (!mesId || !reporteId) {
                throw new Error('No hay ID de mes o reporte');
            }

            // Convertir de vuelta a formato Excel
            const excelData = convertToExcelFormat(updatedData);

            return await reportesMensualesService.actualizarDatos(
                mesId,
                reporteId,
                excelData
            );
        },
        onSuccess: () => {
            // Invalidar cache para refrescar datos
            queryClient.invalidateQueries({ queryKey });

            // También invalidar auxiliar por si hay cambios relacionados
            queryClient.invalidateQueries({
                queryKey: ['reporte-auxiliar-ingresos', mesId]
            });

            queryClient.invalidateQueries({
                queryKey: ['reporte-anual'],
            });

            queryClient.invalidateQueries({
                queryKey: ['mes', mesId],
            });
        },
    });

    // Memoizar handleSave para evitar re-renders infinitos
    const handleSave = useCallback(
        async (data: MiAdminIngresosRow[]) => {
            await saveMutation.mutateAsync(data);
        },
        [saveMutation]
    );

    return {
        data: miAdminData,
        isLoading,
        error: error as Error | null,
        refetch,
        handleSave,
        isSaving: saveMutation.isPending,
        saveError: saveMutation.error as Error | null,
    };
};
