/**
 * Hook para cálculos memoizados de totales en Mi Admin Ingresos
 */

import { useMemo } from 'react';
import { calculateTotales } from '../utils';
import type { MiAdminIngresosRow, MiAdminIngresosTotales } from '../types';

interface UseMiAdminIngresosCalculationsProps {
  data: MiAdminIngresosRow[];
}

export const useMiAdminIngresosCalculations = ({
  data,
}: UseMiAdminIngresosCalculationsProps) => {
  // Calcular totales (excluyendo canceladas)
  const totales: MiAdminIngresosTotales = useMemo(() => {
    return calculateTotales(data);
  }, [data]);

  return {
    totales,
  };
};
