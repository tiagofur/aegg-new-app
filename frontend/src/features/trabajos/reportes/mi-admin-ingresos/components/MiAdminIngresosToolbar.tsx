/**
 * Barra de herramientas para Mi Admin Ingresos
 * Incluye botones especiales: Aplicar TC Sugerido y Cancelar Folios Únicos
 */

import { ArrowDownCircle, XCircle } from "lucide-react";
import { badgeStyles } from "../utils";
import type { MiAdminIngresosTotales, TotalesComparison } from "../types";

interface MiAdminIngresosToolbarProps {
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
  /** Callback para aplicar TC Sugerido a todas las filas */
  onAplicarTCSugeridoATodos: () => void;
  /** Callback para cancelar folios únicos */
  onCancelarFoliosUnicos: () => void;
  /** Totales calculados */
  totales: MiAdminIngresosTotales;
  /** Comparación de totales (null si no está activa) */
  totalesComparison: TotalesComparison | null;
  /** Si hay datos de Auxiliar disponibles */
  hasAuxiliarData: boolean;
}

/**
 * Componente de barra de herramientas con acciones especiales
 */
export const MiAdminIngresosToolbar: React.FC<MiAdminIngresosToolbarProps> = ({
  isDirty,
  onSave,
  isSaving,
  isComparisonActive,
  onToggleComparison,
  onAplicarTCSugeridoATodos,
  onCancelarFoliosUnicos,
  totales,
  totalesComparison,
  hasAuxiliarData,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col gap-3">
        {/* Primera fila - Botones principales */}
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
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
              title={isDirty ? "Guardar cambios" : "No hay cambios"}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={onToggleComparison}
              disabled={!hasAuxiliarData}
              className={`
                px-4 py-2 rounded font-medium transition-colors
                ${
                  !hasAuxiliarData
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : isComparisonActive
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
              `}
              title={
                !hasAuxiliarData
                  ? "No hay datos de Auxiliar para comparar"
                  : isComparisonActive
                  ? "Desactivar comparación"
                  : "Activar comparación"
              }
            >
              {isComparisonActive
                ? "🔍 Comparación Activa"
                : "🔍 Comparar con Auxiliar"}
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
                🚫 {totales.cantidadCanceladas} Canceladas
              </span>
            )}

            {/* Comparison totals badge */}
            {totalesComparison && (
              <span
                className={`px-3 py-1 rounded-full border text-sm font-medium ${
                  totalesComparison.isMatch
                    ? badgeStyles.totalesMatch
                    : badgeStyles.totalesMismatch
                }`}
                title={totalesComparison.tooltip}
              >
                {totalesComparison.isMatch ? "✅" : "❌"} Totales{" "}
                {totalesComparison.isMatch
                  ? "OK"
                  : `Dif: $${totalesComparison.difference.toFixed(2)}`}
              </span>
            )}
          </div>
        </div>

        {/* Segunda fila - Botones especiales (solo si hay Auxiliar) */}
        {hasAuxiliarData && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600 font-medium">
              Acciones especiales:
            </span>

            <button
              onClick={onAplicarTCSugeridoATodos}
              disabled={isSaving}
              className={`
                flex items-center gap-2 px-4 py-2 rounded font-medium
                transition-colors
                ${
                  isSaving
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300"
                }
              `}
              title="Aplicar TC Sugerido a todas las filas que lo tengan disponible"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Aplicar TC Sugerido a Todos
            </button>

            <button
              onClick={onCancelarFoliosUnicos}
              disabled={isSaving || !isComparisonActive}
              className={`
                flex items-center gap-2 px-4 py-2 rounded font-medium
                transition-colors
                ${
                  isSaving || !isComparisonActive
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300"
                }
              `}
              title={
                !isComparisonActive
                  ? "Activa la comparación para usar esta función"
                  : "Cancelar todos los folios que solo existen en Mi Admin (no en Auxiliar)"
              }
            >
              <XCircle className="w-4 h-4" />
              Cancelar Folios Únicos
            </button>

            <span className="text-xs text-gray-500 ml-2">
              {isComparisonActive
                ? "Comparación activa - Puedes usar ambas acciones"
                : "Activa la comparación para cancelar folios únicos"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
