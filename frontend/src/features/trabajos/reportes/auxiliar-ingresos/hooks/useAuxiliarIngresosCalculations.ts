/**
 * Hook para cálculos automáticos del reporte Auxiliar de Ingresos
 * Calcula totales con memoización para optimizar performance
 */

import { useMemo } from 'react';
import { AuxiliarIngresosRow, AuxiliarIngresosTotales } from '../types';
import { calculateTotales } from '../utils';

interface UseAuxiliarIngresosCalculationsProps {
    /** Datos del reporte */
    data: AuxiliarIngresosRow[];
}

interface UseAuxiliarIngresosCalculationsReturn {
    /** Totales calculados */
    totales: AuxiliarIngresosTotales;
    /** Datos con fila de totales incluida */
    dataWithTotals: AuxiliarIngresosRow[];
}

/**
 * Hook para calcular totales y estadísticas del reporte
 * Usa memoización para evitar recálculos innecesarios
 */
export const useAuxiliarIngresosCalculations = ({
    data,
}: UseAuxiliarIngresosCalculationsProps): UseAuxiliarIngresosCalculationsReturn => {
    /**
     * Calcula totales principales
     * Solo recalcula cuando cambian los datos
     */
    const totales = useMemo(() => {
        return calculateTotales(data);
    }, [data]);

    const dataWithTotals = useMemo(() => {
        if (!data || data.length === 0) {
            return data;
        }

        const alreadyHasSummary = data.some(
            (row) => row.id === '__auxiliar_totals__' || row.folio?.toLowerCase() === 'totales'
        );

        if (alreadyHasSummary) {
            return data;
        }

        const totalsRow: AuxiliarIngresosRow = {
            id: '__auxiliar_totals__',
            folio: 'Totales',
            fecha: null,
            rfc: null,
            razonSocial: null,
            subtotal: totales.totalSubtotal,
            moneda: 'MXN',
            tipoCambio: null,
            estadoSat: 'Vigente',
            isSummary: true,
        };

        return [...data, totalsRow];
    }, [data, totales]);

    return {
        totales,
        dataWithTotals,
    };
};
