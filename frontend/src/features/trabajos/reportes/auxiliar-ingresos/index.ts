/**
 * Exportaciones públicas del feature Auxiliar de Ingresos
 */

// Componente principal
export { AuxiliarIngresosTable } from './components/AuxiliarIngresosTable';

// Componentes auxiliares (por si se necesitan individualmente)
export { AuxiliarIngresosToolbar } from './components/AuxiliarIngresosToolbar';
export { AuxiliarIngresosFooter } from './components/AuxiliarIngresosFooter';
export { EditableTipoCambioCell } from './components/cells/EditableTipoCambioCell';
export { EditableEstadoSatCell } from './components/cells/EditableEstadoSatCell';

// Hooks (por si se necesitan en otros lugares)
export { useAuxiliarIngresosData } from './hooks/useAuxiliarIngresosData';
export { useAuxiliarIngresosEdit } from './hooks/useAuxiliarIngresosEdit';
export { useAuxiliarIngresosCalculations } from './hooks/useAuxiliarIngresosCalculations';
export { useAuxiliarIngresosComparison } from './hooks/useAuxiliarIngresosComparison';

// Types
export type {
  AuxiliarIngresosRow,
  AuxiliarIngresosTotales,
  ComparisonResult,
  ComparisonStatus,
  TotalesComparison,
  EstadoSat,
} from './types';

// Utils (por si se necesitan externamente)
export {
  formatCurrency,
  formatDate,
  calculateTotales,
  parseExcelToAuxiliarIngresos,
  getRowBackgroundColor,
  getComparisonIcon,
  getComparisonTooltipMessage,
} from './utils';
