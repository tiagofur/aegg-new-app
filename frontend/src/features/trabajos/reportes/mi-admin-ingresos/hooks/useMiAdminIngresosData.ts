/**
 * Hook para cargar y guardar datos de Mi Admin Ingresos
 * Integra con React Query y datos de Auxiliar Ingresos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrabajoExcel, saveTrabajoExcel } from '@/services/trabajoService';
import { parseExcelToMiAdminIngresos } from '../utils';
import type { MiAdminIngresosRow } from '../types';
import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos';

interface UseMiAdminIngresosDataProps {
  trabajoId: string | undefined;
  auxiliarData: AuxiliarIngresosRow[] | undefined;
}

export const useMiAdminIngresosData = ({
  trabajoId,
  auxiliarData,
}: UseMiAdminIngresosDataProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['trabajo-excel', trabajoId, 'mi-admin-ingresos'];

  // Query para cargar datos
  const {
    data: miAdminData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!trabajoId) return [];

      const excelData = await fetchTrabajoExcel(trabajoId, 'mi-admin-ingresos');

      // Parsear Excel e integrar con datos de Auxiliar
      const parsedData = parseExcelToMiAdminIngresos(excelData, auxiliarData || []);

      return parsedData;
    },
    enabled: !!trabajoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para guardar cambios
  const saveMutation = useMutation({
    mutationFn: async (updatedData: MiAdminIngresosRow[]) => {
      if (!trabajoId) {
        throw new Error('No hay ID de trabajo');
      }

      await saveTrabajoExcel(trabajoId, 'mi-admin-ingresos', updatedData);
    },
    onSuccess: () => {
      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey });
      
      // También invalidar auxiliar por si hay cambios relacionados
      queryClient.invalidateQueries({ 
        queryKey: ['trabajo-excel', trabajoId, 'auxiliar-ingresos'] 
      });
    },
  });

  const handleSave = async (data: MiAdminIngresosRow[]) => {
    await saveMutation.mutateAsync(data);
  };

  return {
    data: miAdminData || [],
    isLoading,
    error,
    refetch,
    handleSave,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
};
