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
    /** Porcentaje de facturas vigentes */
    porcentajeVigentes: number;
    /** Porcentaje de facturas canceladas */
    porcentajeCanceladas: number;
    /** Promedio de subtotal por factura vigente */
    promedioSubtotalVigentes: number;
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

    /**
     * Calcula porcentaje de facturas vigentes
     */
    const porcentajeVigentes = useMemo(() => {
        if (data.length === 0) return 0;
        return (totales.cantidadVigentes / data.length) * 100;
    }, [totales.cantidadVigentes, data.length]);

    /**
     * Calcula porcentaje de facturas canceladas
     */
    const porcentajeCanceladas = useMemo(() => {
        if (data.length === 0) return 0;
        return (totales.cantidadCanceladas / data.length) * 100;
    }, [totales.cantidadCanceladas, data.length]);

    /**
     * Calcula promedio de subtotal por factura vigente
     */
    const promedioSubtotalVigentes = useMemo(() => {
        if (totales.cantidadVigentes === 0) return 0;
        return totales.totalSubtotal / totales.cantidadVigentes;
    }, [totales.totalSubtotal, totales.cantidadVigentes]);

    return {
        totales,
        porcentajeVigentes,
        porcentajeCanceladas,
        promedioSubtotalVigentes,
    };
};
