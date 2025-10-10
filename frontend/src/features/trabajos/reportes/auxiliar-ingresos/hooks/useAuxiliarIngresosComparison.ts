/**
 * Hook para comparación entre Auxiliar de Ingresos y Mi Admin
 * Compara por FOLIO (no por UUID) y detecta coincidencias, discrepancias y diferencias
 */

import { useState, useMemo, useCallback } from 'react';
import {
    AuxiliarIngresosRow,
    MiAdminIngresosRow,
    ComparisonResult,
    TotalesComparison,
    AUXILIAR_INGRESOS_CONFIG,
} from '../types';

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
    /** Mapa de resultados de comparación por ID (para renderizado) */
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
 * IMPORTANTE: La comparación se hace por FOLIO, no por UUID
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
     * Genera el mapa de comparación por FOLIO
     * Retorna Map por ID (para renderizado) pero la comparación es por FOLIO
     * Solo se calcula cuando la comparación está activa
     */
    const comparisonMap = useMemo(() => {
        const map = new Map<string, ComparisonResult>();

        // Si no está activa o no hay datos, retornar mapa vacío
        if (!isActive || !hasComparisonData) {
            return map;
        }

        // Crear lookup de Mi Admin por FOLIO para búsqueda rápida
        const miadminLookup = new Map(
            miadminData!
                .filter((row) => row.estadoSat === 'Vigente')
                .map((row) => [row.folio, { subtotal: row.subtotal, uuid: row.uuid }])
        );

        // Comparar cada fila del Auxiliar
        auxiliarData.forEach((auxRow) => {
            // Ignorar facturas canceladas en la comparación
            if (auxRow.estadoSat === 'Cancelada') {
                return;
            }

            // Si no tiene folio, no se puede comparar
            if (!auxRow.folio) {
                const result: ComparisonResult = {
                    uuid: auxRow.id,
                    status: 'only-auxiliar',
                    auxiliarSubtotal: auxRow.subtotal,
                    tooltip: `🔵 Solo en Auxiliar (sin folio) - Subtotal: $${auxRow.subtotal.toFixed(2)}`,
                };
                map.set(auxRow.id, result);
                return;
            }

            const miadminRow = miadminLookup.get(auxRow.folio);

            // Caso 1: FOLIO solo existe en Auxiliar
            if (!miadminRow) {
                const result: ComparisonResult = {
                    uuid: auxRow.id,
                    status: 'only-auxiliar',
                    auxiliarSubtotal: auxRow.subtotal,
                    tooltip: `🔵 Solo en Auxiliar - Folio: ${auxRow.folio} - Subtotal: $${auxRow.subtotal.toFixed(2)}`,
                };
                map.set(auxRow.id, result);
                return;
            }

            // Caso 2 y 3: FOLIO existe en ambos, comparar valores
            const difference = Math.abs(auxRow.subtotal - miadminRow.subtotal);
            const isMatch = difference <= AUXILIAR_INGRESOS_CONFIG.COMPARISON_TOLERANCE;

            if (isMatch) {
                // Coincide (dentro de tolerancia)
                const result: ComparisonResult = {
                    uuid: auxRow.id,
                    status: 'match',
                    auxiliarSubtotal: auxRow.subtotal,
                    miadminSubtotal: miadminRow.subtotal,
                    difference,
                    tooltip: `✅ Coincide - Folio: ${auxRow.folio} - Diferencia: $${difference.toFixed(2)}`,
                };
                map.set(auxRow.id, result);
            } else {
                // Discrepancia
                const result: ComparisonResult = {
                    uuid: auxRow.id,
                    status: 'mismatch',
                    auxiliarSubtotal: auxRow.subtotal,
                    miadminSubtotal: miadminRow.subtotal,
                    difference,
                    tooltip: `❌ Discrepancia - Folio: ${auxRow.folio} - Auxiliar: $${auxRow.subtotal.toFixed(2)} vs Mi Admin: $${miadminRow.subtotal.toFixed(2)} (Dif: $${difference.toFixed(2)})`,
                };
                map.set(auxRow.id, result);
            }

            // Marcar como procesado
            miadminLookup.delete(auxRow.folio);
        });

        // Caso 4: FOLIOs que solo existen en Mi Admin
        miadminLookup.forEach((rowData, folio) => {
            const result: ComparisonResult = {
                uuid: rowData.uuid,
                status: 'only-miadmin',
                miadminSubtotal: rowData.subtotal,
                tooltip: `🟣 Solo en Mi Admin - Folio: ${folio} - Subtotal: $${rowData.subtotal.toFixed(2)}`,
            };
            // Usamos el UUID de Mi Admin como key ya que no existe en Auxiliar
            map.set(rowData.uuid, result);
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
            .reduce((sum, row) => sum + row.subtotal, 0);

        // Sumar totales de Mi Admin
        const miadminTotal = miadminData!.reduce(
            (sum, row) => sum + row.subtotal,
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
