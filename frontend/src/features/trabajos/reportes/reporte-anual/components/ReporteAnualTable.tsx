/**
 * FASE 7 - Sistema de Reporte Anual
 * Componente: Tabla de Reporte Anual
 *
 * Muestra los 12 meses del año con sus ventas, diferencias y estados
 */

import { useReporteAnualData, useReporteAnualResumen } from "../hooks";
import { NOMBRES_MESES } from "../types";
import type { ReporteAnual } from "../types";

interface ReporteAnualTableProps {
  /** ID del trabajo */
  trabajoId: string;
  /** Año del reporte */
  anio: number;
}

/**
 * Obtiene el badge de estado según confirmación y diferencia
 */
const getEstadoBadge = (reporte: ReporteAnual) => {
  if (!reporte.ventas || !reporte.ventasAuxiliar) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
        ⚪ Pendiente
      </span>
    );
  }

  if (reporte.confirmado) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
        ✅ Confirmado
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
      ⚠️ Con diferencia
    </span>
  );
};

/**
 * Formatea un valor de moneda
 */
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return `$${value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Tabla principal del Reporte Anual
 */
export const ReporteAnualTable: React.FC<ReporteAnualTableProps> = ({
  trabajoId,
  anio,
}) => {
  const { reportes, isLoading, error, refetch } = useReporteAnualData({
    trabajoId,
    anio,
  });

  const { resumen, isLoading: isLoadingResumen } = useReporteAnualResumen({
    trabajoId,
    anio,
  });

  if (isLoading || isLoadingResumen) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Cargando reporte anual...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
        <h3 className="text-red-800 font-semibold mb-2">
          Error al cargar reporte anual
        </h3>
        <p className="text-red-600 mb-3">{(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reporte Anual {anio}
          </h2>
          <p className="text-gray-600 mt-1">
            Ventas mensuales consolidadas de Mi Admin Ingresos
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Total Ventas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-600 text-sm font-medium mb-1">
              Total Ventas Mi Admin
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(resumen.totalVentas)}
            </div>
          </div>

          {/* Total Auxiliar */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-purple-600 text-sm font-medium mb-1">
              Total Ventas Auxiliar
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(resumen.totalVentasAuxiliar)}
            </div>
          </div>

          {/* Diferencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-600 text-sm font-medium mb-1">
              Diferencia Total
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(resumen.totalDiferencia)}
            </div>
          </div>

          {/* Meses Confirmados */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-green-600 text-sm font-medium mb-1">
              Meses Confirmados
            </div>
            <div className="text-2xl font-bold text-green-900">
              {resumen.mesesConfirmados} / 12
            </div>
            <div className="text-xs text-green-600 mt-1">
              {resumen.mesesPendientes > 0 &&
                `${resumen.mesesPendientes} pendientes`}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de meses */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                Mes
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                Ventas Mi Admin
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                Ventas Auxiliar
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                Diferencia
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((reporte: ReporteAnual) => (
              <tr
                key={reporte.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {NOMBRES_MESES[reporte.mes as keyof typeof NOMBRES_MESES]}
                    </span>
                    <span className="text-xs text-gray-500">
                      (Mes {reporte.mes})
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={
                      reporte.ventas
                        ? "font-medium text-gray-900"
                        : "text-gray-400"
                    }
                  >
                    {formatCurrency(reporte.ventas)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={
                      reporte.ventasAuxiliar
                        ? "font-medium text-gray-900"
                        : "text-gray-400"
                    }
                  >
                    {formatCurrency(reporte.ventasAuxiliar)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={`font-medium ${
                      reporte.diferencia === null
                        ? "text-gray-400"
                        : reporte.confirmado
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {formatCurrency(reporte.diferencia)}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {getEstadoBadge(reporte)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Acerca de este reporte:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Confirmado:</strong> La diferencia entre Mi Admin y
                Auxiliar es menor a $0.10
              </li>
              <li>
                <strong>Con diferencia:</strong> Hay datos pero la diferencia es
                mayor a $0.10
              </li>
              <li>
                <strong>Pendiente:</strong> No se han guardado datos para este
                mes
              </li>
              <li>
                Para guardar datos, ve a Mi Admin Ingresos del mes
                correspondiente y usa el botón "Guardar en Base"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
