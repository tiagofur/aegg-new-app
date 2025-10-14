/**
 * Barra de herramientas para Auxiliar de Ingresos
 * Contiene botones de acción, toggle de comparación y badges de estado
 */

import { badgeStyles } from "../utils";
import type { AuxiliarIngresosTotales, TotalesComparison } from "../types";

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
  /** Callback para cancelar folios únicos */
  onCancelarFoliosUnicos: () => void;
  /** Totales calculados */
  totales: AuxiliarIngresosTotales;
  /** Comparación de totales (null si no está activa) */
  totalesComparison: TotalesComparison | null;
  /** Indica si hay datos de Mi Admin disponibles */
  hasMiAdminData: boolean;
  /** Controla si se muestra el botón principal de guardar */
  showSaveButton?: boolean;
}

/**
 * Componente de barra de herramientas
 */
export const AuxiliarIngresosToolbar: React.FC<
  AuxiliarIngresosToolbarProps
> = ({
  isDirty,
  onSave,
  isSaving,
  isComparisonActive,
  onToggleComparison,
  onCancelarFoliosUnicos,
  totales,
  totalesComparison,
  hasMiAdminData,
  showSaveButton = true,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Action buttons */}
        <div className="flex items-center gap-3">
          {showSaveButton && (
            <button
              onClick={onSave}
              disabled={!isDirty || isSaving}
              className={`
                px-4 py-2 rounded font-medium transition-colors
                ${
                  isDirty && !isSaving
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
              title={isDirty ? "Guardar cambios" : "No hay cambios"}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          )}

          <button
            onClick={onToggleComparison}
            disabled={!hasMiAdminData}
            className={`
              px-4 py-2 rounded font-medium transition-colors
              ${
                !hasMiAdminData
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isComparisonActive
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
            title={
              !hasMiAdminData
                ? "No hay datos de Mi Admin para comparar"
                : isComparisonActive
                ? "Desactivar comparación"
                : "Activar comparación"
            }
          >
            {isComparisonActive
              ? "🔍 Comparación Activa"
              : "🔍 Comparar con Mi Admin"}
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
              🚫 {totales.cantidadCanceladas} Canceladas (
              {totales.porcentajeCanceladas.toFixed(1)}%)
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
                  ? "Los totales coinciden"
                  : `Diferencia: $${Math.abs(
                      totalesComparison.difference
                    ).toFixed(2)}`
              }
            >
              {totalesComparison.match ? "✅" : "❌"} Totales{" "}
              {totalesComparison.match
                ? "OK"
                : `Dif: $${Math.abs(totalesComparison.difference).toFixed(2)}`}
            </span>
          )}
        </div>
      </div>

      {/* Segunda fila - Acciones especiales */}
      {hasMiAdminData && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-3">
          <span className="text-sm text-gray-600 font-medium">
            Acciones especiales:
          </span>

          <button
            onClick={onCancelarFoliosUnicos}
            disabled={isSaving || !isComparisonActive}
            className={`
              flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors
              ${
                isSaving || !isComparisonActive
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300"
              }
            `}
            title={
              !isComparisonActive
                ? "Activa la comparación para cancelar folios únicos"
                : "Cancelar todos los folios que solo existen en Auxiliar (no en Mi Admin)"
            }
          >
            🚫 Cancelar Folios Únicos
          </button>

          <span className="text-xs text-gray-500">
            {isComparisonActive
              ? "Comparación activa - puedes cancelar folios únicos"
              : "Activa la comparación para cancelar folios únicos"}
          </span>
        </div>
      )}
    </div>
  );
};
