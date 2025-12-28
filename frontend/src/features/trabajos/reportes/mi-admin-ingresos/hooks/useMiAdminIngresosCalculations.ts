/**
 * Hook para cálculos memoizados de totales en Mi Admin Ingresos
 */

import { useMemo } from 'react'
import { calculateTotales } from '../utils'
import type { MiAdminIngresosRow, MiAdminIngresosTotales } from '../types'

interface UseMiAdminIngresosCalculationsProps {
    data: MiAdminIngresosRow[]
}

export const useMiAdminIngresosCalculations = ({ data }: UseMiAdminIngresosCalculationsProps) => {
    // Calcular totales (excluyendo canceladas)
    const totales: MiAdminIngresosTotales = useMemo(() => {
        return calculateTotales(data)
    }, [data])

    const dataWithTotals = useMemo(() => {
        if (!data || data.length === 0) {
            return data
        }

        const alreadyHasSummary = data.some(
            (row) => row.id === '__miadmin_totals__' || row.folio?.toLowerCase() === 'totales'
        )

        if (alreadyHasSummary) {
            return data
        }

        const ivaTotal = data.reduce(
            (sum, row) => (row.estadoSat === 'Vigente' ? sum + (row.iva || 0) : sum),
            0
        )

        const totalTotal = data.reduce(
            (sum, row) => (row.estadoSat === 'Vigente' ? sum + (row.total || 0) : sum),
            0
        )

        const totalsRow: MiAdminIngresosRow = {
            id: '__miadmin_totals__',
            folio: 'Totales',
            fecha: null,
            rfc: null,
            razonSocial: null,
            subtotal: totales.totalSubtotal,
            iva: ivaTotal,
            total: totalTotal,
            moneda: 'MXN',
            tipoCambio: null,
            estadoSat: 'Vigente',
            subtotalAUX: totales.totalSubtotalAUX,
            subtotalMXN: totales.totalSubtotalMXN,
            tcSugerido: null,
            isSummary: true,
        }

        return [...data, totalsRow]
    }, [data, totales])

    return {
        totales,
        dataWithTotals,
    }
}
