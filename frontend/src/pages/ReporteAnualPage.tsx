/**
 * FASE 7 - Sistema de Reporte Anual
 * Página: Vista de Reporte Anual
 *
 * Página completa para visualizar el reporte anual de un trabajo
 */

import { useParams, useNavigate } from "react-router-dom";
import { ReporteAnualTable } from "../features/trabajos/reportes/reporte-anual/components/ReporteAnualTable";

export const ReporteAnualPage: React.FC = () => {
  const { trabajoId, anio } = useParams<{
    trabajoId: string;
    anio: string;
  }>();
  const navigate = useNavigate();

  // Validar parámetros
  if (!trabajoId || !anio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-xl mb-2">
            ⚠️ Parámetros inválidos
          </h2>
          <p className="text-red-600 mb-4">
            No se especificó el trabajo o el año del reporte.
          </p>
          <button
            onClick={() => navigate(`/trabajos/${trabajoId || ""}`)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Volver a Trabajos
          </button>
        </div>
      </div>
    );
  }

  const anioNum = parseInt(anio, 10);

  if (isNaN(anioNum)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-xl mb-2">
            ⚠️ Año inválido
          </h2>
          <p className="text-red-600 mb-4">
            El año especificado no es válido: "{anio}"
          </p>
          <button
            onClick={() => navigate(`/trabajos/${trabajoId}`)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Volver a Trabajos
          </button>
        </div>
      </div>
    );
  }

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
              <span>Volver a Trabajos</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">
              Reporte Anual {anioNum}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-1 py-2">
        <ReporteAnualTable trabajoId={trabajoId} anio={anioNum} />
      </div>
    </div>
  );
};
