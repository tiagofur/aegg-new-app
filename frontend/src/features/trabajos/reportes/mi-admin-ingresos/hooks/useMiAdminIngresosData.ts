/**
 * Hook para cargar y guardar datos de Mi Admin Ingresos
 * Integra con React Query y datos de Auxiliar Ingresos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportesMensualesService } from '@/services';
import { parseExcelToMiAdminIngresos, convertToExcelFormat } from '../utils';
import type { MiAdminIngresosRow } from '../types';
import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos';

interface UseMiAdminIngresosDataProps {
    mesId: string | undefined;
    reporteId: string | undefined;
    auxiliarData: AuxiliarIngresosRow[] | undefined;
    enabled?: boolean;
}

export const useMiAdminIngresosData = ({
    mesId,
    reporteId,
    auxiliarData,
    enabled = true,
}: UseMiAdminIngresosDataProps) => {
    const queryClient = useQueryClient();
    const queryKey = ['reporte-mi-admin-ingresos', mesId, reporteId];

    // Query para cargar datos
    const {
        data: miAdminData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!mesId || !reporteId) return [];

            const response = await reportesMensualesService.obtenerDatos(mesId, reporteId);
            
            if (!response?.datos) return [];

            // Parsear Excel e integrar con datos de Auxiliar
            const parsedData = parseExcelToMiAdminIngresos(response.datos, auxiliarData || []);

            return parsedData;
        },
        enabled: enabled && !!mesId && !!reporteId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

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
    });    const handleSave = async (data: MiAdminIngresosRow[]) => {
        await saveMutation.mutateAsync(data);
    };

    return {
        data: miAdminData || [],
        isLoading,
        error: error as Error | null,
        refetch,
        handleSave,
        isSaving: saveMutation.isPending,
        saveError: saveMutation.error as Error | null,
    };
};
