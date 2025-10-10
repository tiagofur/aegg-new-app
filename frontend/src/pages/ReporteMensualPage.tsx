/**
 * Página: Vista de Reporte Mensual
 *
 * Página completa para visualizar un reporte mensual específico
 * Muestra los datos crudos del reporte en una tabla
 */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TIPOS_REPORTE_NOMBRES } from "../types/trabajo";
import { reportesMensualesService } from "../services";

export const ReporteMensualPage: React.FC = () => {
  const { trabajoId, mesId, reporteId, tipo } = useParams<{
    trabajoId: string;
    mesId: string;
    reporteId: string;
    tipo: string;
  }>();
  const navigate = useNavigate();
  const [datos, setDatos] = useState<any[][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!mesId || !reporteId) return;

      try {
        setLoading(true);
        const response = await reportesMensualesService.obtenerDatos(
          mesId,
          reporteId
        );
        setDatos(response.datos);
      } catch (err: any) {
        console.error("Error al cargar datos:", err);
        setError(
          err.response?.data?.message ||
            "Error al cargar los datos del reporte"
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [mesId, reporteId]);

  // Validar parámetros
  if (!trabajoId || !mesId || !reporteId || !tipo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-xl mb-2">
            ⚠️ Parámetros inválidos
          </h2>
          <p className="text-red-600 mb-4">
            No se especificaron todos los parámetros necesarios.
          </p>
          <button
            onClick={() => navigate("/trabajos")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Volver a Trabajos
          </button>
        </div>
      </div>
    );
  }

  const nombreTipo =
    TIPOS_REPORTE_NOMBRES[tipo as keyof typeof TIPOS_REPORTE_NOMBRES] || tipo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-2 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/trabajos/${trabajoId}`)}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">←</span>
              <span>Volver al Proyecto</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">{nombreTipo}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-2 py-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">Cargando reporte...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-xl mb-2">
              ⚠️ Error al cargar reporte
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(`/trabajos/${trabajoId}`)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Volver al Proyecto
            </button>
          </div>
        ) : datos && datos.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <tbody className="bg-white divide-y divide-gray-200">
                  {datos.map((fila, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={
                        rowIndex === 0 ? "bg-gray-50 font-semibold" : ""
                      }
                    >
                      {Array.isArray(fila) &&
                        fila.map((celda, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-3 py-2 whitespace-nowrap text-gray-900 border-r last:border-r-0"
                          >
                            {celda !== null && celda !== undefined
                              ? String(celda)
                              : ""}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
              <span>
                {datos.length} fila{datos.length !== 1 ? "s" : ""} •{" "}
                {datos[0]?.length || 0} columna
                {datos[0]?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No hay datos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

