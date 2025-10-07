/**
 * Barra de herramientas para Auxiliar de Ingresos
 * Contiene botones de acción, toggle de comparación y badges de estado
 */

import { badgeStyles } from '../utils';
import type { AuxiliarIngresosTotales, TotalesComparison } from '../types';

interface AuxiliarIngresosToolbarProps {
  /** Si hay cambios sin guardar */
  isDirty: boolean;
  /** Callback para guardar cambios */
  onSave: () => void;
  /** Si se está guardando */
  isSaving: boolean;
  /** Si la comparación está activa */
  isComparisonActive: boolean;
  /** Callback para toggle de comparación */
  onToggleComparison: () => void;
  /** Totales calculados */
  totales: AuxiliarIngresosTotales;
  /** Comparación de totales (null si no está activa) */
  totalesComparison: TotalesComparison | null;
}

/**
 * Componente de barra de herramientas
 */
export const AuxiliarIngresosToolbar: React.FC<AuxiliarIngresosToolbarProps> = ({
  isDirty,
  onSave,
  isSaving,
  isComparisonActive,
  onToggleComparison,
  totales,
  totalesComparison,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className={`
              px-4 py-2 rounded font-medium transition-colors
              ${
                isDirty && !isSaving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            title={isDirty ? 'Guardar cambios' : 'No hay cambios'}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            onClick={onToggleComparison}
            className={`
              px-4 py-2 rounded font-medium transition-colors
              ${
                isComparisonActive
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
            title={isComparisonActive ? 'Desactivar comparación' : 'Activar comparación'}
          >
            {isComparisonActive ? '🔍 Comparación Activa' : '🔍 Comparar con Mi Admin'}
          </button>
        </div>

        {/* Right side - Status badges */}
        <div className="flex items-center gap-2">
          {/* Unsaved changes badge */}
          {isDirty && (
            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeStyles.unsavedChanges}`}
              title="Hay cambios sin guardar"
            >
              ⚠️ Cambios sin guardar
            </span>
          )}

          {/* Canceladas badge */}
          {totales.cantidadCanceladas > 0 && (
            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeStyles.canceladas}`}
              title={`${totales.cantidadCanceladas} facturas canceladas`}
            >
              🚫 {totales.cantidadCanceladas} Canceladas ({totales.porcentajeCanceladas.toFixed(1)}%)
            </span>
          )}

          {/* Comparison totals badge */}
          {totalesComparison && (
            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${
                totalesComparison.match
                  ? badgeStyles.totalesMatch
                  : badgeStyles.totalesMismatch
              }`}
              title={
                totalesComparison.match
                  ? 'Los totales coinciden'
                  : `Diferencia: $${Math.abs(totalesComparison.difference).toFixed(2)}`
              }
            >
              {totalesComparison.match ? '✅' : '❌'} Totales{' '}
              {totalesComparison.match ? 'OK' : `Dif: $${Math.abs(totalesComparison.difference).toFixed(2)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
