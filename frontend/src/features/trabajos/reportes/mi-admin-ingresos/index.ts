/**
 * Exportaciones públicas de la feature Mi Admin Ingresos
 */

// Types
export type {
    MiAdminIngresosRow,
    MiAdminIngresosTotales,
    ComparisonStatus,
    MiAdminIngresosComparisonResult,
    TotalesComparison,
} from './types'

export { MI_ADMIN_INGRESOS_CONFIG } from './types'

// Utils
export {
    parseExcelToMiAdminIngresos,
    calculateSubtotalMXN,
    calculateTCSugerido,
    calculateTotales,
    recalculateRowAfterTipoCambioChange,
    updateRowEstadoSat,
    formatCurrency,
    formatTipoCambio,
    formatDate,
    isValidTipoCambio,
    convertToExcelFormat,
    rowStyles,
    footerStyles,
    inputStyles,
    badgeStyles,
    getRowBackgroundColor,
    getFooterBackgroundColor,
    getEstadoSatCellClasses,
    getComparisonBadgeVariant,
} from './utils'

// Hooks
export { useMiAdminIngresosData } from './hooks/useMiAdminIngresosData'
export { useMiAdminIngresosEdit } from './hooks/useMiAdminIngresosEdit'
export { useMiAdminIngresosCalculations } from './hooks/useMiAdminIngresosCalculations'
export { useMiAdminIngresosComparison } from './hooks/useMiAdminIngresosComparison'

// Components
export {
    MiAdminIngresosTable,
    MiAdminIngresosToolbar,
    MiAdminIngresosFooter,
    TCSugeridoCell,
    EditableTipoCambioCell,
    EditableEstadoSatCell,
} from './components'
