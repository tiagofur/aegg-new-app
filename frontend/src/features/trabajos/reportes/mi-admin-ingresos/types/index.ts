/**
 * Tipos para el reporte Mi Admin Ingresos
 */

/**
 * Fila del reporte Mi Admin Ingresos
 */
export interface MiAdminIngresosRow {
    /** ID único interno - Usa FOLIO como identificador */
    id: string

    /** FOLIO - Clave para comparación con Auxiliar Ingresos */
    folio: string

    /** UUID del SAT (opcional, si existe en el Excel) */
    uuid?: string

    /** Fecha de la factura */
    fecha: string | null

    /** RFC del cliente */
    rfc: string | null

    /** Razón social del cliente */
    razonSocial: string | null

    /** Subtotal original de Mi Admin (en moneda original) */
    subtotal: number

    /** IVA (en moneda original) */
    iva: number

    /** Total (en moneda original) */
    total: number

    /** Moneda de la factura (USD, EUR, MXN) */
    moneda: string

    /** Tipo de Cambio - EDITABLE (null si moneda === 'MXN') */
    tipoCambio: number | null

    /** Estado SAT - EDITABLE */
    estadoSat: 'Vigente' | 'Cancelada'

    /** Subtotal AUX - Copiado desde Auxiliar Ingresos (por folio) */
    subtotalAUX: number | null

    /** Subtotal MXN - CALCULADO: subtotal * tipoCambio (o subtotal si MXN) */
    subtotalMXN: number

    /** TC Sugerido - CALCULADO: subtotalAUX / subtotal */
    tcSugerido: number | null

    /** Indica si la fila es un resumen (Totales) */
    isSummary?: boolean

    /** Columnas adicionales del Excel */
    [key: string]: any
}

/**
 * Estado SAT de una factura
 */
export type EstadoSat = 'Vigente' | 'Cancelada'

/**
 * Totales calculados del reporte Mi Admin Ingresos
 */
export interface MiAdminIngresosTotales {
    /** Total de Subtotales (solo vigentes) */
    totalSubtotal: number

    /** Total de Subtotales AUX (solo vigentes) */
    totalSubtotalAUX: number

    /** Total de Subtotales MXN (solo vigentes) */
    totalSubtotalMXN: number

    /** Cantidad de facturas vigentes */
    cantidadVigentes: number

    /** Cantidad de facturas canceladas */
    cantidadCanceladas: number

    /** Cantidad total de facturas */
    cantidadTotal: number

    /** Porcentaje de facturas vigentes */
    porcentajeVigentes: number

    /** Porcentaje de facturas canceladas */
    porcentajeCanceladas: number
}

/**
 * Estado de comparación de una fila
 */
export type ComparisonStatus =
    | 'match' // ✅ Coincide con Auxiliar
    | 'mismatch' // ❌ Discrepancia con Auxiliar
    | 'only-miadmin' // 🟣 Solo en Mi Admin
    | 'only-auxiliar' // 🟣 Solo en Auxiliar

/**
 * Resultado de comparación de una fila
 */
export interface MiAdminIngresosComparisonResult {
    /** Folio de la factura */
    folio: string

    /** Estado de la comparación */
    status: ComparisonStatus

    /** Subtotal MXN de Mi Admin */
    miAdminSubtotal?: number

    /** Subtotal MXN de Auxiliar */
    auxiliarSubtotal?: number

    /** Diferencia absoluta entre subtotales */
    difference?: number

    /** Mensaje tooltip para el usuario */
    tooltip: string
}

/**
 * Comparación de totales entre Mi Admin y Auxiliar
 */
export interface TotalesComparison {
    /** Si los totales coinciden (diferencia <= tolerancia) */
    match: boolean

    /** Alias para match para compatibilidad con componentes existentes */
    isMatch: boolean

    /** Total de Mi Admin (solo vigentes) */
    miAdminTotal: number

    /** Total de Auxiliar (solo vigentes) */
    auxiliarTotal: number

    /** Diferencia absoluta */
    difference: number

    /** Mensaje descriptivo para tooltips */
    tooltip: string
}

/**
 * Estado de edición del reporte
 */
export interface MiAdminIngresosEditState {
    /** Map de filas editadas por folio */
    editedRows: Map<string, Partial<MiAdminIngresosRow>>

    /** Si hay cambios sin guardar */
    isDirty: boolean

    /** Si se está guardando */
    isSaving: boolean
}

/**
 * Configuración del reporte Mi Admin Ingresos
 */
export const MI_ADMIN_INGRESOS_CONFIG = {
    /** Tolerancia para considerar que dos valores coinciden ($0.10) */
    COMPARISON_TOLERANCE: 0.1,

    /** Decimales para formato de moneda */
    CURRENCY_DECIMALS: 2,

    /** Decimales para formato de tipo de cambio */
    TC_DECIMALS: 4,
} as const
