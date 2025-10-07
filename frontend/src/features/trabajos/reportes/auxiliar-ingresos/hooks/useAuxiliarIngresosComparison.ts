/**
 * Hook para comparación entre Auxiliar de Ingresos y Mi Admin
 * Compara por UUID y detecta coincidencias, discrepancias y diferencias
 */

import { useState, useMemo, useCallback } from 'react';
import {
  AuxiliarIngresosRow,
  MiAdminIngresosRow,
  ComparisonResult,
  TotalesComparison,
  AUXILIAR_INGRESOS_CONFIG,
} from '../types';
import { getComparisonTooltipMessage } from '../utils';

interface UseAuxiliarIngresosComparisonProps {
  /** Datos del Auxiliar de Ingresos */
  auxiliarData: AuxiliarIngresosRow[];
  /** Datos de Mi Admin (opcional) */
  miadminData?: MiAdminIngresosRow[];
}

interface UseAuxiliarIngresosComparisonReturn {
  /** Si la comparación está activa */
  isActive: boolean;
  /** Toggle para activar/desactivar comparación */
  toggle: () => void;
  /** Mapa de resultados de comparación por UUID */
  comparisonMap: Map<string, ComparisonResult>;
  /** Comparación de totales */
  totalesComparison: TotalesComparison | null;
  /** Estadísticas de comparación */
  stats: {
    totalMatches: number;
    totalMismatches: number;
    totalOnlyAuxiliar: number;
    totalOnlyMiAdmin: number;
  };
  /** Si hay datos de Mi Admin disponibles */
  hasComparisonData: boolean;
}

/**
 * Hook para gestionar el sistema de comparación con Mi Admin
 */
export const useAuxiliarIngresosComparison = ({
  auxiliarData,
  miadminData,
}: UseAuxiliarIngresosComparisonProps): UseAuxiliarIngresosComparisonReturn => {
  // Estado: Si la comparación está activa
  const [isActive, setIsActive] = useState(false);

  /**
   * Toggle para activar/desactivar la comparación
   */
  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  /**
   * Verifica si hay datos de Mi Admin disponibles
   */
  const hasComparisonData = useMemo(() => {
    return !!miadminData && miadminData.length > 0;
  }, [miadminData]);

  /**
   * Genera el mapa de comparación por UUID
   * Solo se calcula cuando la comparación está activa
   */
  const comparisonMap = useMemo(() => {
    const map = new Map<string, ComparisonResult>();

    // Si no está activa o no hay datos, retornar mapa vacío
    if (!isActive || !hasComparisonData) {
      return map;
    }

    // Crear lookup de Mi Admin por UUID para búsqueda rápida
    const miadminLookup = new Map(
      miadminData!.map((row) => [row.uuid, row.subtotalMXN])
    );

    // Comparar cada fila del Auxiliar
    auxiliarData.forEach((auxRow) => {
      // Ignorar facturas canceladas en la comparación
      if (auxRow.estadoSat === 'Cancelada') {
        return;
      }

      const miadminSubtotal = miadminLookup.get(auxRow.id);

      // Caso 1: UUID solo existe en Auxiliar
      if (miadminSubtotal === undefined) {
        const result: ComparisonResult = {
          uuid: auxRow.id,
          status: 'only-auxiliar',
          auxiliarSubtotal: auxRow.subtotalMXN,
          tooltip: `🔵 Solo en Auxiliar - Subtotal: $${auxRow.subtotalMXN.toFixed(2)}`,
        };
        map.set(auxRow.id, result);
        return;
      }

      // Caso 2 y 3: UUID existe en ambos, comparar valores
      const difference = Math.abs(auxRow.subtotalMXN - miadminSubtotal);
      const isMatch = difference <= AUXILIAR_INGRESOS_CONFIG.COMPARISON_TOLERANCE;

      if (isMatch) {
        // Coincide (dentro de tolerancia)
        const result: ComparisonResult = {
          uuid: auxRow.id,
          status: 'match',
          auxiliarSubtotal: auxRow.subtotalMXN,
          miadminSubtotal,
          difference,
          tooltip: `✅ Coincide - Diferencia: $${difference.toFixed(2)}`,
        };
        map.set(auxRow.id, result);
      } else {
        // Discrepancia
        const result: ComparisonResult = {
          uuid: auxRow.id,
          status: 'mismatch',
          auxiliarSubtotal: auxRow.subtotalMXN,
          miadminSubtotal,
          difference,
          tooltip: `❌ Discrepancia - Auxiliar: $${auxRow.subtotalMXN.toFixed(2)} vs Mi Admin: $${miadminSubtotal.toFixed(2)} (Dif: $${difference.toFixed(2)})`,
        };
        map.set(auxRow.id, result);
      }

      // Marcar como procesado
      miadminLookup.delete(auxRow.id);
    });

    // Caso 4: UUIDs que solo existen en Mi Admin
    miadminLookup.forEach((subtotal, uuid) => {
      const result: ComparisonResult = {
        uuid,
        status: 'only-miadmin',
        miadminSubtotal: subtotal,
        tooltip: `🟣 Solo en Mi Admin - Subtotal: $${subtotal.toFixed(2)}`,
      };
      map.set(uuid, result);
    });

    return map;
  }, [isActive, hasComparisonData, auxiliarData, miadminData]);

  /**
   * Calcula la comparación de totales
   */
  const totalesComparison = useMemo((): TotalesComparison | null => {
    if (!isActive || !hasComparisonData) {
      return null;
    }

    // Sumar totales de Auxiliar (solo vigentes)
    const auxiliarTotal = auxiliarData
      .filter((row) => row.estadoSat === 'Vigente')
      .reduce((sum, row) => sum + row.subtotalMXN, 0);

    // Sumar totales de Mi Admin
    const miadminTotal = miadminData!.reduce(
      (sum, row) => sum + row.subtotalMXN,
      0
    );

    // Calcular diferencia
    const difference = Math.abs(auxiliarTotal - miadminTotal);
    const match = difference <= AUXILIAR_INGRESOS_CONFIG.COMPARISON_TOLERANCE;

    return {
      match,
      auxiliarTotal,
      miadminTotal,
      difference,
    };
  }, [isActive, hasComparisonData, auxiliarData, miadminData]);

  /**
   * Calcula estadísticas de la comparación
   */
  const stats = useMemo(() => {
    let totalMatches = 0;
    let totalMismatches = 0;
    let totalOnlyAuxiliar = 0;
    let totalOnlyMiAdmin = 0;

    comparisonMap.forEach((result) => {
      switch (result.status) {
        case 'match':
          totalMatches++;
          break;
        case 'mismatch':
          totalMismatches++;
          break;
        case 'only-auxiliar':
          totalOnlyAuxiliar++;
          break;
        case 'only-miadmin':
          totalOnlyMiAdmin++;
          break;
      }
    });

    return {
      totalMatches,
      totalMismatches,
      totalOnlyAuxiliar,
      totalOnlyMiAdmin,
    };
  }, [comparisonMap]);

  return {
    isActive,
    toggle,
    comparisonMap,
    totalesComparison,
    stats,
    hasComparisonData,
  };
};
