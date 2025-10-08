/**
 * Footer con fila de totales para Auxiliar de Ingresos
 * Muestra totales calculados y comparación de totales si está activa
 */

import { formatCurrency } from "../utils";
import { getFooterBackgroundColor } from "../utils";
import type { AuxiliarIngresosTotales, TotalesComparison } from "../types";

interface AuxiliarIngresosFooterProps {
  /** Totales calculados */
  totales: AuxiliarIngresosTotales;
  /** Comparación de totales (null si no está activa) */
  totalesComparison: TotalesComparison | null;
  /** Si la comparación está activa */
  isComparisonActive: boolean;
}

/**
 * Componente de footer con totales
 */
export const AuxiliarIngresosFooter: React.FC<AuxiliarIngresosFooterProps> = ({
  totales,
  totalesComparison,
  isComparisonActive,
}) => {
  const bgColorClass = getFooterBackgroundColor(
    totalesComparison?.match ?? null
  );

  return (
    <div className={`${bgColorClass} px-4 py-4`}>
      <div className="grid grid-cols-12 gap-4">
        {/* Label */}
        <div className="col-span-6 flex items-center">
          <span className="text-lg">TOTALES</span>
          {isComparisonActive && totalesComparison && (
            <span className="ml-2 text-sm">
              {totalesComparison.match ? "✅" : "❌"}
            </span>
          )}
        </div>

        {/* Total Subtotal MXN */}
        <div className="col-span-3 flex flex-col">
          <span className="text-xs text-gray-600 uppercase">Subtotal MXN</span>
          <span className="text-lg font-bold">
            {formatCurrency(totales.totalSubtotal)}
          </span>
        </div>

        {/* Comparison info */}
        {isComparisonActive && totalesComparison && (
          <div className="col-span-3 flex flex-col">
            <span className="text-xs text-gray-600 uppercase">
              {totalesComparison.match ? "Diferencia" : "Discrepancia"}
            </span>
            <span className="text-base font-bold">
              {formatCurrency(Math.abs(totalesComparison.difference))}
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 uppercase">
              Total Facturas
            </span>
            <span className="text-sm font-semibold">
              {totales.cantidadTotal}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-600 uppercase">Vigentes</span>
            <span className="text-sm font-semibold text-green-700">
              {totales.cantidadVigentes} (
              {totales.porcentajeVigentes.toFixed(1)}%)
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-600 uppercase">Canceladas</span>
            <span className="text-sm font-semibold text-purple-700">
              {totales.cantidadCanceladas} (
              {totales.porcentajeCanceladas.toFixed(1)}%)
            </span>
          </div>

          {totales.cantidadVigentes > 0 && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 uppercase">
                Promedio Vigentes
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(totales.promedioSubtotalVigentes)}
              </span>
            </div>
          )}
        </div>

        {/* Comparison stats */}
        {isComparisonActive && totalesComparison && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-600 uppercase">
                Mi Admin Total
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(totalesComparison.miadminTotal)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-600 uppercase">
                {totalesComparison.match ? "Coincidencia" : "Diferencia"}
              </span>
              <span
                className={`text-sm font-bold ${
                  totalesComparison.match ? "text-green-700" : "text-red-700"
                }`}
              >
                {totalesComparison.match
                  ? `≈ $${Math.abs(totalesComparison.difference).toFixed(2)}`
                  : `$${
                      totalesComparison.difference >= 0 ? "+" : ""
                    }${totalesComparison.difference.toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
