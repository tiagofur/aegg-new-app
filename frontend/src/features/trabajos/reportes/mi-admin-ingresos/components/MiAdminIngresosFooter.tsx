/**
 * Footer con fila de totales para Mi Admin Ingresos
 * Muestra totales calculados con columnas específicas (Subtotal, Subtotal AUX, Subtotal MXN)
 */

import { formatCurrency } from '../utils';
import { getFooterBackgroundColor } from '../utils';
import type { MiAdminIngresosTotales, TotalesComparison } from '../types';

interface MiAdminIngresosFooterProps {
  /** Totales calculados */
  totales: MiAdminIngresosTotales;
  /** Comparación de totales (null si no está activa) */
  totalesComparison: TotalesComparison | null;
  /** Si la comparación está activa */
  isComparisonActive: boolean;
}

/**
 * Componente de footer con totales
 */
export const MiAdminIngresosFooter: React.FC<MiAdminIngresosFooterProps> = ({
  totales,
  totalesComparison,
  isComparisonActive,
}) => {
  const bgColorClass = getFooterBackgroundColor(
    totalesComparison?.isMatch ?? null
  );

  return (
    <div className={`${bgColorClass} px-4 py-4`}>
      <div className="grid grid-cols-12 gap-4">
        {/* Label */}
        <div className="col-span-5 flex items-center">
          <span className="text-lg">TOTALES</span>
          {isComparisonActive && totalesComparison && (
            <span className="ml-2 text-sm">
              {totalesComparison.isMatch ? '✅' : '❌'}
            </span>
          )}
        </div>

        {/* Total Subtotal (Mi Admin) */}
        <div className="col-span-2 flex flex-col">
          <span className="text-xs text-gray-600 uppercase">Subtotal</span>
          <span className="text-base font-bold">
            {formatCurrency(totales.totalSubtotal)}
          </span>
        </div>

        {/* Total Subtotal AUX */}
        <div className="col-span-2 flex flex-col">
          <span className="text-xs text-gray-600 uppercase">Subtotal AUX</span>
          <span className="text-base font-bold">
            {formatCurrency(totales.totalSubtotalAUX)}
          </span>
        </div>

        {/* Total Subtotal MXN */}
        <div className="col-span-2 flex flex-col">
          <span className="text-xs text-gray-600 uppercase">Subtotal MXN</span>
          <span className="text-base font-bold">
            {formatCurrency(totales.totalSubtotalMXN)}
          </span>
        </div>

        {/* Comparison info */}
        {isComparisonActive && totalesComparison && (
          <div className="col-span-1 flex flex-col">
            <span className="text-xs text-gray-600 uppercase">
              {totalesComparison.isMatch ? 'Dif' : 'Disc'}
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
              {totales.cantidadVigentes + totales.cantidadCanceladas}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-600 uppercase">Vigentes</span>
            <span className="text-sm font-semibold text-green-700">
              {totales.cantidadVigentes}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-600 uppercase">Canceladas</span>
            <span className="text-sm font-semibold text-red-700">
              {totales.cantidadCanceladas}
            </span>
          </div>
        </div>

        {/* Comparison stats */}
        {isComparisonActive && totalesComparison && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-600 uppercase">
                Auxiliar Total
              </span>
              <span className="text-sm font-semibold">
                {formatCurrency(totalesComparison.auxiliarTotal)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-600 uppercase">
                {totalesComparison.isMatch ? 'Coincidencia' : 'Diferencia'}
              </span>
              <span
                className={`text-sm font-bold ${
                  totalesComparison.isMatch ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {totalesComparison.isMatch
                  ? `≈ $${Math.abs(totalesComparison.difference).toFixed(2)}`
                  : `$${
                      totalesComparison.difference >= 0 ? '+' : ''
                    }${totalesComparison.difference.toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip info */}
      {isComparisonActive && totalesComparison && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            {totalesComparison.tooltip}
          </p>
        </div>
      )}
    </div>
  );
};
