/**
 * Barra de herramientas para Mi Admin Ingresos
 * Incluye botones especiales: Aplicar TC Sugerido y Cancelar Folios Únicos
 */

import { ArrowDownCircle, GitCompare, Save, XCircle } from "lucide-react";
import { badgeStyles } from "../utils";
import type { MiAdminIngresosTotales, TotalesComparison } from "../types";
import { GuardarEnBaseButton } from "../../reporte-anual";

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
  /** ID del trabajo (para Guardar en Base) - opcional */
  trabajoId?: string;
  /** Año del trabajo (para Guardar en Base) - opcional */
  anio?: number;
  /** Mes del trabajo (para Guardar en Base) - opcional */
  mes?: number;
  /** Controla si se muestra el botón principal de guardar */
  showSaveButton?: boolean;
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
  trabajoId,
  anio,
  mes,
  showSaveButton = true,
}) => {
  // Calcular total de Auxiliar desde totalesComparison
  const totalAuxiliar = totalesComparison?.auxiliarTotal ?? 0;

  // Determinar si mostrar el botón Guardar en Base
  const showGuardarEnBase = trabajoId && anio && mes && hasAuxiliarData;

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showSaveButton && (
            <button
              onClick={onSave}
              disabled={!isDirty || isSaving}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                isDirty && !isSaving
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              title={
                isDirty
                  ? "Guardar los cambios pendientes"
                  : "No hay cambios por guardar"
              }
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          )}

          <button
            onClick={onToggleComparison}
            disabled={!hasAuxiliarData}
            className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 ${
              !hasAuxiliarData
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : isComparisonActive
                ? "border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
            title={
              !hasAuxiliarData
                ? "No hay datos del Auxiliar para sincronizar"
                : isComparisonActive
                ? "Desactivar la sincronización con el Auxiliar"
                : "Activar la sincronización con el Auxiliar"
            }
          >
            <GitCompare className="h-4 w-4" />
            {isComparisonActive
              ? "Sincronización activa"
              : "Sincronizar con Auxiliar"}
          </button>

          {showGuardarEnBase && (
            <GuardarEnBaseButton
              trabajoId={trabajoId!}
              anio={anio!}
              mes={mes!}
              totalMiAdmin={totales.totalSubtotalMXN}
              totalAuxiliar={totalAuxiliar}
              isDirty={isDirty}
              isComparisonActive={isComparisonActive}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {isDirty && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${badgeStyles.unsavedChanges}`}
              title="Hay cambios sin guardar en el reporte"
            >
              ⚠️ Cambios sin guardar
            </span>
          )}

          {totales.cantidadCanceladas > 0 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${badgeStyles.canceladas}`}
              title={`${totales.cantidadCanceladas} facturas aparecen como canceladas`}
            >
              🚫 {totales.cantidadCanceladas} canceladas
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
                  ? "Los totales coinciden con el Auxiliar"
                  : `Diferencia contra Auxiliar: $${totalesComparison.difference.toFixed(
                      2
                    )}`
              }
            >
              {totalesComparison.match
                ? "✅ Totales conciliados"
                : "❌ Diferencia vs Auxiliar"}
            </span>
          )}
        </div>
      </div>

      {hasAuxiliarData && (
        <details
          className="group mt-3 border-t border-gray-100 pt-2"
          open={isComparisonActive}
        >
          <summary className="flex cursor-pointer items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Automatizaciones
            <span className="text-gray-400 transition-transform group-open:-rotate-180">
              ⌃
            </span>
          </summary>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={onAplicarTCSugeridoATodos}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                isSaving
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              title="Aplicar el tipo de cambio sugerido a todas las filas disponibles"
            >
              <ArrowDownCircle className="h-4 w-4" />
              Aplicar TC sugerido
            </button>

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
                  ? "Activa la sincronización para poder quitar los folios exclusivos de Mi Admin"
                  : "Quitar de Mi Admin los folios que no existen en Auxiliar"
              }
            >
              <XCircle className="h-4 w-4" />
              Quitar folios solo Mi Admin
            </button>

            <span className="ml-auto text-xs text-gray-500">
              {isComparisonActive
                ? "Sincronización lista: puedes automatizar TC y limpieza de folios"
                : "Activa la sincronización con Auxiliar para habilitar estas acciones"}
            </span>
          </div>
        </details>
      )}
    </div>
  );
};
