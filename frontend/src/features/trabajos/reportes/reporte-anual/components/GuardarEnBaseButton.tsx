/**
 * FASE 7 - Sistema de Reporte Anual
 * Componente: Botón "Guardar en Base"
 *
 * Guarda los totales mensuales en el Reporte Anual cuando:
 * - Existe información del Auxiliar vigente
 * - Totales de Mi Admin y Auxiliar coinciden (diferencia < $0.10)
 * - Usuario confirma la acción
 */

import { useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import { useReporteAnualUpdate } from "../hooks";

interface GuardarEnBaseButtonProps {
  /** ID del trabajo actual */
  trabajoId: string;
  /** Año del trabajo */
  anio: number;
  /** Mes del trabajo (1-12) */
  mes: number;
  /** Total Subtotal MXN de Mi Admin Ingresos */
  totalMiAdmin: number;
  /** Total Subtotal MXN del Auxiliar Ingresos (vigentes) */
  totalAuxiliar: number | null;
  /** Indica si existe información auxiliar disponible */
  hasAuxiliarData: boolean;
  /** Si hay cambios sin guardar en Mi Admin */
  isDirty: boolean;
  /** Callback opcional después de guardar exitosamente */
  onSaveSuccess?: () => void;
}

/**
 * Botón para guardar totales mensuales en el Reporte Anual
 * Solo habilitado cuando totales coinciden (diferencia < $0.10)
 */
export const GuardarEnBaseButton: React.FC<GuardarEnBaseButtonProps> = ({
  trabajoId,
  anio,
  mes,
  totalMiAdmin,
  totalAuxiliar,
  hasAuxiliarData,
  isDirty,
  onSaveSuccess,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const totalsAvailable = hasAuxiliarData && totalAuxiliar !== null;
  const diferencia = totalsAvailable
    ? Math.abs(totalMiAdmin - (totalAuxiliar ?? 0))
    : null;
  const isMatch = diferencia !== null && diferencia < 0.1;

  // Hook mutation para guardar
  const { actualizarVentas, isLoading, isSuccess, isError, error } =
    useReporteAnualUpdate({
      trabajoId,
      onSuccess: () => {
        setShowConfirmDialog(false);
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      },
      onError: (err) => {
        console.error("Error al guardar en base:", err);
      },
    });

  // Determinar si el botón debe estar habilitado
  const isDisabled = !totalsAvailable || !isMatch || isDirty || isLoading;

  // Determinar mensaje de tooltip
  const getTooltip = (): string => {
    if (!hasAuxiliarData)
      return "Importa y procesa el Auxiliar para habilitar el guardado";
    if (totalAuxiliar === null)
      return "Calculando totales auxiliares, intenta de nuevo";
    if (isDirty) return "Guarda los cambios pendientes primero";
    if (diferencia !== null && !isMatch)
      return `Totales no coinciden. Diferencia: $${diferencia.toFixed(2)}`;
    if (isLoading) return "Guardando en base...";
    return "Guardar totales en Reporte Anual";
  };

  // Handler para confirmar y guardar
  const handleConfirm = () => {
    if (totalAuxiliar === null) {
      return;
    }
    actualizarVentas({
      anio,
      mes,
      ventas: totalMiAdmin,
      ventasAuxiliar: totalAuxiliar,
    });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmDialog(true)}
        disabled={isDisabled}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${
          isDisabled
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
            : "border-emerald-600 bg-emerald-50 text-emerald-700 hover:border-emerald-700 hover:bg-emerald-100"
        }`}
        title={getTooltip()}
      >
        <Save className="h-4 w-4" />
        {isLoading ? "Guardando..." : "Guardar en Base"}
      </button>

      {/* Diálogo de confirmación */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isLoading && setShowConfirmDialog(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              {isMatch ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Guardado en Base
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Se guardarán los totales mensuales en el Reporte Anual
                </p>
              </div>
            </div>

            {/* Detalles */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Año:</span>
                <span className="font-medium text-gray-900">{anio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mes:</span>
                <span className="font-medium text-gray-900">
                  {new Date(anio, mes - 1).toLocaleString("es-MX", {
                    month: "long",
                  })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Mi Admin:</span>
                <span className="font-medium text-gray-900">
                  $
                  {totalMiAdmin.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {totalsAvailable && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Auxiliar:</span>
                  <span className="font-medium text-gray-900">
                    $
                    {(totalAuxiliar ?? 0).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2"></div>
              {diferencia !== null && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diferencia:</span>
                    <span
                      className={`font-bold ${
                        isMatch ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      $
                      {diferencia.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estado:</span>
                    <span
                      className={`font-bold ${
                        isMatch ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {isMatch ? "✅ Confirmado" : "⚠️ Con diferencia"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Advertencia si hay diferencia */}
            {diferencia !== null && !isMatch && diferencia < 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Hay una pequeña diferencia
                  entre los totales (${diferencia.toFixed(2)}). El registro se
                  guardará como "no confirmado".
                </p>
              </div>
            )}

            {/* Error message */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>❌ Error:</strong>{" "}
                  {error?.message || "Error al guardar en base"}
                </p>
              </div>
            )}

            {/* Success message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <strong>✅ Éxito:</strong> Totales guardados en Reporte Anual
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || isSuccess}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${
                  isLoading || isSuccess
                    ? "cursor-not-allowed border-gray-300 bg-gray-400"
                    : "border-emerald-600 bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isLoading
                  ? "Guardando..."
                  : isSuccess
                  ? "✅ Guardado"
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
