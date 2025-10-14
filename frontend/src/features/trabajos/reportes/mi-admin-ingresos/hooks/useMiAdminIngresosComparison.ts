/**
 * Hook para comparación entre Mi Admin Ingresos y Auxiliar Ingresos
 * Comparación por FOLIO con tolerancia configurable
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { MI_ADMIN_INGRESOS_CONFIG } from '../types';
import type {
    MiAdminIngresosRow,
    MiAdminIngresosComparisonResult,
    TotalesComparison,
} from '../types';
import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos';

interface UseMiAdminIngresosComparisonProps {
    miAdminData: MiAdminIngresosRow[];
    auxiliarData: AuxiliarIngresosRow[] | undefined;
    comparisonActive?: boolean;
    onComparisonActiveChange?: (active: boolean) => void;
}

export const useMiAdminIngresosComparison = ({
    miAdminData,
    auxiliarData,
    comparisonActive,
    onComparisonActiveChange,
}: UseMiAdminIngresosComparisonProps) => {
    const isControlled = typeof comparisonActive === 'boolean';
    const [internalActive, setInternalActive] = useState<boolean>(
        comparisonActive ?? false
    );

    useEffect(() => {
        if (isControlled) {
            setInternalActive(comparisonActive!);
        }
    }, [comparisonActive, isControlled]);

    const setComparisonActive = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setInternalActive(next);
            }
            onComparisonActiveChange?.(next);
        },
        [isControlled, onComparisonActiveChange]
    );

    const isComparisonActive = isControlled ? comparisonActive! : internalActive;

    // Map de Auxiliar por folio para lookup O(1)
    const auxiliarMap = useMemo(() => {
        if (!auxiliarData) return new Map<string, AuxiliarIngresosRow>();

        const map = new Map<string, AuxiliarIngresosRow>();
        auxiliarData
            .filter((row) => row.estadoSat === 'Vigente')
            .forEach((row) => {
                // Usar folio si existe, de lo contrario usar id (UUID)
                const key = row.folio || row.id;
                map.set(key, row);
            });
        return map;
    }, [auxiliarData]);

    // Map de comparación por folio
    const comparisonMap = useMemo(() => {
        if (!isComparisonActive || !auxiliarData) {
            return new Map<string, MiAdminIngresosComparisonResult>();
        }

        const map = new Map<string, MiAdminIngresosComparisonResult>();
        const { COMPARISON_TOLERANCE } = MI_ADMIN_INGRESOS_CONFIG;

        // Comparar cada fila de Mi Admin con Auxiliar
        miAdminData
            .filter((row) => row.estadoSat === 'Vigente')
            .forEach((miAdminRow) => {
                const auxiliarRow = auxiliarMap.get(miAdminRow.folio);

                if (!auxiliarRow) {
                    // Solo existe en Mi Admin
                    map.set(miAdminRow.folio, {
                        folio: miAdminRow.folio,
                        status: 'only-miadmin',
                        miAdminSubtotal: miAdminRow.subtotal,
                        tooltip: `Folio ${miAdminRow.folio} solo existe en Mi Admin`,
                    });
                    return;
                }

                // Comparar subtotales
                const difference = Math.abs(miAdminRow.subtotal - auxiliarRow.subtotal);
                const isMatch = difference <= COMPARISON_TOLERANCE;

                map.set(miAdminRow.folio, {
                    folio: miAdminRow.folio,
                    status: isMatch ? 'match' : 'mismatch',
                    miAdminSubtotal: miAdminRow.subtotal,
                    auxiliarSubtotal: auxiliarRow.subtotal,
                    difference,
                    tooltip: isMatch
                        ? `Coincidencia: $${miAdminRow.subtotal.toFixed(2)}`
                        : `Discrepancia: Mi Admin $${miAdminRow.subtotal.toFixed(2)} vs Auxiliar $${auxiliarRow.subtotal.toFixed(2)} (diff: $${difference.toFixed(2)})`,
                });
            });

        // Verificar folios que solo existen en Auxiliar
        auxiliarData
            .filter((row) => row.estadoSat === 'Vigente')
            .forEach((auxiliarRow) => {
                const auxiliarKey = auxiliarRow.folio || auxiliarRow.id;
                const miAdminRow = miAdminData.find(
                    (r) => r.folio === auxiliarKey && r.estadoSat === 'Vigente'
                );

                if (!miAdminRow) {
                    map.set(auxiliarKey, {
                        folio: auxiliarKey,
                        status: 'only-auxiliar',
                        auxiliarSubtotal: auxiliarRow.subtotal,
                        tooltip: `Folio ${auxiliarKey} solo existe en Auxiliar`,
                    });
                }
            });

        return map;
    }, [isComparisonActive, miAdminData, auxiliarData, auxiliarMap]);

    // Estadísticas de comparación
    const comparisonStats = useMemo(() => {
        if (!isComparisonActive) {
            return {
                totalMatches: 0,
                totalMismatches: 0,
                onlyMiAdmin: 0,
                onlyAuxiliar: 0,
            };
        }

        const stats = {
            totalMatches: 0,
            totalMismatches: 0,
            onlyMiAdmin: 0,
            onlyAuxiliar: 0,
        };

        comparisonMap.forEach((comparison) => {
            switch (comparison.status) {
                case 'match':
                    stats.totalMatches++;
                    break;
                case 'mismatch':
                    stats.totalMismatches++;
                    break;
                case 'only-miadmin':
                    stats.onlyMiAdmin++;
                    break;
                case 'only-auxiliar':
                    stats.onlyAuxiliar++;
                    break;
            }
        });

        return stats;
    }, [isComparisonActive, comparisonMap]);

    // Comparación de totales
    const totalesComparison: TotalesComparison | null = useMemo(() => {
        if (!isComparisonActive || !auxiliarData) return null;

        // Total de Mi Admin (solo vigentes)
        const miAdminTotal = miAdminData
            .filter((row) => row.estadoSat === 'Vigente')
            .reduce((sum, row) => sum + row.subtotal, 0);

        // Total de Auxiliar (solo vigentes)
        const auxiliarTotal = auxiliarData
            .filter((row) => row.estadoSat === 'Vigente')
            .reduce((sum, row) => sum + row.subtotal, 0);

        const difference = Math.abs(miAdminTotal - auxiliarTotal);
        const { COMPARISON_TOLERANCE } = MI_ADMIN_INGRESOS_CONFIG;
        const isMatch = difference <= COMPARISON_TOLERANCE;

        return {
            match: isMatch,
            miAdminTotal,
            auxiliarTotal,
            difference,
            isMatch,
            tooltip: isMatch
                ? `Totales coinciden: $${miAdminTotal.toFixed(2)}`
                : `Discrepancia en totales: Mi Admin $${miAdminTotal.toFixed(2)} vs Auxiliar $${auxiliarTotal.toFixed(2)} (diff: $${difference.toFixed(2)})`,
        };
    }, [isComparisonActive, miAdminData, auxiliarData]);

    const toggleComparison = useCallback(() => {
        setComparisonActive(!isComparisonActive);
    }, [isComparisonActive, setComparisonActive]);

    return {
        comparisonMap,
        comparisonStats,
        totalesComparison,
        isComparisonActive,
        toggleComparison,
        setComparisonActive,
    };
};
