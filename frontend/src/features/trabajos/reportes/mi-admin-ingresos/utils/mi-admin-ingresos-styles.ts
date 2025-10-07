/**
 * Utilidades de estilos para Mi Admin Ingresos
 */

import type {
  MiAdminIngresosRow,
  MiAdminIngresosComparisonResult,
  ComparisonStatus,
} from '../types';

/**
 * Clases CSS para diferentes estados de fila
 */
export const rowStyles = {
  // Fila cancelada (prioridad alta)
  cancelada: 'bg-gray-100 text-gray-500',

  // Comparación - coincidencia
  comparisonMatch: 'bg-green-50 border-l-4 border-green-500 hover:bg-green-100',

  // Comparación - discrepancia
  comparisonMismatch: 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100',

  // Comparación - solo en Mi Admin o Auxiliar
  comparisonOnly: 'bg-purple-50 border-l-4 border-purple-500 hover:bg-purple-100',

  // Fila normal
  normal: 'hover:bg-gray-50 transition-colors',
} as const;

/**
 * Clases CSS para el footer de totales
 */
export const footerStyles = {
  // Base (sin comparación)
  base: 'sticky bottom-0 bg-gray-100 font-bold border-t-2 border-gray-300',

  // Con comparación - totales coinciden
  comparisonMatch: 'sticky bottom-0 bg-blue-50 text-blue-900 font-bold border-t-2 border-blue-400',

  // Con comparación - totales no coinciden
  comparisonMismatch: 'sticky bottom-0 bg-red-50 text-red-900 font-bold border-t-2 border-red-400',
} as const;

/**
 * Determina la clase CSS de background para una fila según su estado
 * @param row - Fila del reporte
 * @param comparison - Resultado de comparación (si está activa)
 * @param isComparisonActive - Si la comparación está activada
 * @returns String con clases CSS de Tailwind
 */
export const getRowBackgroundColor = (
  row: MiAdminIngresosRow,
  comparison: MiAdminIngresosComparisonResult | undefined,
  isComparisonActive: boolean
): string => {
  // Prioridad 1: Facturas canceladas siempre tienen su estilo
  if (row.estadoSat === 'Cancelada') {
    return rowStyles.cancelada;
  }

  // Prioridad 2: Si hay comparación activa, aplicar colores según status
  if (isComparisonActive && comparison) {
    switch (comparison.status) {
      case 'match':
        return rowStyles.comparisonMatch;
      case 'mismatch':
        return rowStyles.comparisonMismatch;
      case 'only-miadmin':
      case 'only-auxiliar':
        return rowStyles.comparisonOnly;
    }
  }

  // Default: estilo normal
  return rowStyles.normal;
};

/**
 * Determina la clase CSS para el footer según comparación de totales
 * @param totalesMatch - Si los totales coinciden (null si no hay comparación)
 * @returns String con clases CSS de Tailwind
 */
export const getFooterBackgroundColor = (
  totalesMatch: boolean | null
): string => {
  if (totalesMatch === null) {
    return footerStyles.base;
  }

  return totalesMatch
    ? footerStyles.comparisonMatch
    : footerStyles.comparisonMismatch;
};

/**
 * Clases condicionales para la celda de Estado SAT
 * @param estadoSat - Estado de la factura
 * @returns Clases CSS
 */
export const getEstadoSatCellClasses = (
  estadoSat: 'Vigente' | 'Cancelada'
): string => {
  return estadoSat === 'Cancelada'
    ? 'bg-gray-100 text-gray-600 font-medium'
    : 'bg-white text-gray-900';
};

/**
 * Variante de badge según estado de comparación
 * @param status - Estado de comparación
 * @returns Variante de badge
 */
export const getComparisonBadgeVariant = (
  status: ComparisonStatus
): 'success' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'match':
      return 'success';
    case 'mismatch':
      return 'destructive';
    case 'only-miadmin':
    case 'only-auxiliar':
      return 'secondary';
  }
};

/**
 * Clases para inputs editables
 */
export const inputStyles = {
  base: 'w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
  disabled: 'bg-gray-100 cursor-not-allowed',
  error: 'border-red-500 focus:ring-red-500',
} as const;

/**
 * Clases para badges de estado
 */
export const badgeStyles = {
  unsavedChanges: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  totalesMatch: 'bg-green-100 text-green-800 border-green-300',
  totalesMismatch: 'bg-red-100 text-red-800 border-red-300',
  canceladas: 'bg-gray-100 text-gray-800 border-gray-300',
} as const;
