/**
 * Tipos para el Reporte Auxiliar de Ingresos
 */

/**
 * Estado SAT de una factura
 */
export type EstadoSat = 'Vigente' | 'Cancelada'

/**
 * Fila de datos del reporte Auxiliar de Ingresos
 */
export interface AuxiliarIngresosRow {
    /** UUID de la factura (identificador único, opcional) */
    id: string

    /** Folio de la factura - CAMPO CLAVE para comparación con Mi Admin */
    folio: string

    /** Fecha de emisión de la factura */
    fecha: string | null

    /** RFC del receptor */
    rfc: string | null

    /** Razón social del receptor */
    razonSocial: string | null

    /** Subtotal en MXN (ya viene convertido en el Excel) */
    subtotal: number

    /** Código de moneda original (USD, EUR, MXN) - solo informativo */
    moneda: string

    /** Tipo de cambio aplicado (solo informativo, no se usa para cálculos) */
    tipoCambio: number | null

    /** Estado SAT de la factura (editable) */
    estadoSat: EstadoSat

    /** Indica si la fila es de resumen (Totales) */
    isSummary?: boolean

    /** Otras columnas dinámicas del Excel */
    [key: string]: any
}

/**
 * Totales calculados del reporte
 */
export interface AuxiliarIngresosTotales {
    /** Suma de subtotales en MXN (solo vigentes) */
    totalSubtotal: number

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

    /** Promedio del subtotal de facturas vigentes */
    promedioSubtotalVigentes: number

    /** Indica si el total es viable (sin canceladas) */
    totalViable: boolean
}

/**
 * Estado de comparación entre Auxiliar y Mi Admin
 */
export type ComparisonStatus =
    | 'match' // UUID existe en ambos y valores coinciden
    | 'mismatch' // UUID existe en ambos pero valores discrepan
    | 'only-auxiliar' // UUID solo existe en Auxiliar
    | 'only-miadmin' // UUID solo existe en Mi Admin

/**
 * Resultado de comparación de una fila
 */
export interface ComparisonResult {
    /** UUID de la factura */
    uuid: string

    /** Estado de la comparación */
    status: ComparisonStatus

    /** Subtotal del Auxiliar (si existe) */
    auxiliarSubtotal?: number

    /** Subtotal de Mi Admin (si existe) */
    miadminSubtotal?: number

    /** Diferencia absoluta entre subtotales */
    difference?: number

    /** Mensaje descriptivo para tooltip */
    tooltip: string
}

/**
 * Estado de edición del reporte
 */
export interface AuxiliarIngresosEditState {
    /** Mapa de ediciones por UUID */
    editedRows: Map<string, Partial<AuxiliarIngresosRow>>

    /** Indica si hay cambios sin guardar */
    isDirty: boolean

    /** Indica si se está guardando */
    isSaving: boolean
}

/**
 * Resultado de comparación de totales
 */
export interface TotalesComparison {
    /** Indica si los totales coinciden */
    match: boolean

    /** Total del Auxiliar */
    auxiliarTotal: number

    /** Total de Mi Admin */
    miadminTotal: number

    /** Diferencia absoluta */
    difference: number
}

/**
 * Datos de una fila del reporte Mi Admin (para comparación)
 */
export interface MiAdminIngresosRow {
    /** Identificador único (id del registro en Mi Admin) */
    id: string

    /** Folio de la factura (para comparación) */
    folio: string

    /** Estado SAT de la factura */
    estadoSat: 'Vigente' | 'Cancelada'

    /** Subtotal calculado en MXN */
    subtotalMXN: number

    /** Subtotal AUX vinculado (si existe) */
    subtotalAUX?: number | null

    /** Indica si la fila es de totales */
    isSummary?: boolean

    /** Otras propiedades opcionales */
    [key: string]: any
}

/**
 * Constantes de configuración
 */
export const AUXILIAR_INGRESOS_CONFIG = {
    /** Tolerancia para considerar valores iguales (en pesos) */
    COMPARISON_TOLERANCE: 0.1,

    /** Decimales para formateo de moneda */
    CURRENCY_DECIMALS: 2,

    /** Decimales para formato de tipo de cambio */
    TC_DECIMALS: 4,

    /** Moneda base del sistema */
    BASE_CURRENCY: 'MXN',

    /** Tipo de cambio por defecto para MXN */
    DEFAULT_MXN_EXCHANGE_RATE: 1.0,
} as const
