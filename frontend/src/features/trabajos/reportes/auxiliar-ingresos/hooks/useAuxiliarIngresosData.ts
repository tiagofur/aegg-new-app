/**
 * Hook para gestionar datos del reporte Auxiliar de Ingresos
 * Maneja fetch, guardado y sincronización con la API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportesMensualesService } from '@/services';
import { parseExcelToAuxiliarIngresos } from '../utils';
import { AuxiliarIngresosRow } from '../types';

interface UseAuxiliarIngresosDataProps {
    /** ID del mes */
    mesId: string;
    /** ID del reporte */
    reporteId: string;
    /** Si debe hacer fetch automáticamente */
    enabled?: boolean;
}

interface UseAuxiliarIngresosDataReturn {
    /** Datos del reporte parseados */
    data: AuxiliarIngresosRow[];
    /** Si está cargando datos */
    isLoading: boolean;
    /** Error al cargar datos */
    error: Error | null;
    /** Función para guardar cambios */
    saveChanges: (updatedData: AuxiliarIngresosRow[]) => Promise<void>;
    /** Si está guardando cambios */
    isSaving: boolean;
    /** Error al guardar */
    saveError: Error | null;
    /** Refetch manual */
    refetch: () => void;
}

/**
 * Hook para obtener y guardar datos del reporte Auxiliar de Ingresos
 */
export const useAuxiliarIngresosData = ({
    mesId,
    reporteId,
    enabled = true,
}: UseAuxiliarIngresosDataProps): UseAuxiliarIngresosDataReturn => {
    const queryClient = useQueryClient();

    // Query para obtener datos del reporte
    const {
        data: rawData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['reporte-auxiliar-ingresos', mesId, reporteId],
        queryFn: async () => {
            const response = await reportesMensualesService.obtenerDatos(mesId, reporteId);
            return response;
        },
        enabled: enabled && !!mesId && !!reporteId,
        staleTime: 5 * 60 * 1000, // 5 minutos
        select: (response) => {
            // Transformar datos del Excel a formato tipado
            if (!response?.datos) return [];
            return parseExcelToAuxiliarIngresos(response.datos);
        },
    });

    // Mutation para guardar cambios
    const saveChangesMutation = useMutation({
        mutationFn: async (updatedData: AuxiliarIngresosRow[]) => {
            // Convertir de vuelta a formato de Excel (array bidimensional)
            const excelData = convertToExcelFormat(updatedData);

            return await reportesMensualesService.actualizarDatos(
                mesId,
                reporteId,
                excelData
            );
        },
        onSuccess: () => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({
                queryKey: ['reporte-auxiliar-ingresos', mesId, reporteId],
            });
            queryClient.invalidateQueries({
                queryKey: ['reporte-anual'],
            });
            queryClient.invalidateQueries({
                queryKey: ['mes', mesId],
            });
        },
    });

    return {
        data: rawData || [],
        isLoading,
        error: error as Error | null,
        saveChanges: async (updatedData: AuxiliarIngresosRow[]) => {
            await saveChangesMutation.mutateAsync(updatedData);
        },
        isSaving: saveChangesMutation.isPending,
        saveError: saveChangesMutation.error as Error | null,
        refetch,
    };
};

/**
 * Convierte datos tipados de vuelta a formato Excel (array bidimensional)
 * @param data - Array de filas tipadas
 * @returns Array bidimensional para Excel
 */
const convertToExcelFormat = (data: AuxiliarIngresosRow[]): any[][] => {
    if (data.length === 0) return [];

    // Construir headers a partir de las keys del primer objeto
    const headers = [
        'UUID',
        'Folio',
        'Fecha',
        'RFC',
        'Razón Social',
        'Subtotal MXN',
        'Moneda',
        'Tipo de Cambio',
        'Estado SAT',
    ];

    // Construir filas de datos
    const rows = data.map((row) => [
        row.id,
        row.folio || '',
        row.fecha || '',
        row.rfc || '',
        row.razonSocial || '',
        row.subtotal,
        row.moneda,
        row.tipoCambio || '',
        row.estadoSat,
    ]);

    // Retornar headers + datos
    return [headers, ...rows];
};
