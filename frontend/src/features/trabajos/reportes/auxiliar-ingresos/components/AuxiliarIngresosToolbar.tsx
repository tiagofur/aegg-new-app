/**
 * Barra de herramientas para Auxiliar de Ingresos
 * Contiene botones de acción, toggle de comparación y badges de estado
 */

import { GitCompare, Save, XCircle } from "lucide-react";
import type { AuxiliarIngresosTotales, TotalesComparison } from "../types";
import { badgeStyles } from "../utils";

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
  /** Controla si se muestra el botón de comparación */
  showComparisonButton?: boolean;
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
  showComparisonButton = true,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {showSaveButton && (
              <button
                onClick={onSave}
                disabled={!isDirty || isSaving}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                  isDirty && !isSaving
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                title={
                  isDirty ? "Guardar cambios" : "No hay cambios para guardar"
                }
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            )}

            {showComparisonButton && (
              <button
                onClick={onToggleComparison}
                disabled={!hasMiAdminData}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 ${
                  !hasMiAdminData
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isComparisonActive
                    ? "border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
                title={
                  !hasMiAdminData
                    ? "No hay datos de Mi Admin para comparar"
                    : isComparisonActive
                    ? "Desactivar comparación"
                    : "Activar comparación"
                }
              >
                <GitCompare className="h-4 w-4" />
                {isComparisonActive
                  ? "Sincronización activa"
                  : "Sincronizar con Mi Admin"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {isDirty && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${badgeStyles.unsavedChanges}`}
                title="Hay cambios sin guardar"
              >
                ⚠️ Cambios sin guardar
              </span>
            )}

            {totales.cantidadCanceladas > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${badgeStyles.canceladas}`}
                title={`${totales.cantidadCanceladas} facturas canceladas`}
              >
                🚫 {totales.cantidadCanceladas} Canceladas (
                {totales.porcentajeCanceladas.toFixed(1)}%)
              </span>
            )}

            {totalesComparison && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
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
                {totalesComparison.match
                  ? "✅ Totales conciliados"
                  : "❌ Diferencia vs Mi Admin"}
              </span>
            )}
          </div>
        </div>

        {hasMiAdminData && (
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-2">
            <span className="text-sm text-gray-600 font-medium">
              Acciones especiales:
            </span>

            <button
              onClick={onCancelarFoliosUnicos}
              disabled={isSaving || !isComparisonActive}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 ${
                isSaving || !isComparisonActive
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
              title={
                !isComparisonActive
                  ? "Activa la comparación para cancelar folios únicos"
                  : "Cancelar los folios que solo existen en Auxiliar"
              }
            >
              <XCircle className="h-4 w-4" />
              Cancelar folios únicos
            </button>

            <span className="text-xs text-gray-500">
              {isComparisonActive
                ? "Comparación activa: puedes cancelar folios únicos"
                : "Activa la comparación para cancelar folios únicos"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
