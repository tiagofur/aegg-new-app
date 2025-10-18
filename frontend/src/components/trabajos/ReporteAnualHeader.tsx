import React from "react";

interface ReporteAnualHeaderProps {
  anio: number;
  progreso: number; // 0-12
  onVerReporte: () => void;
  onDescargarExcel: () => void;
  onImportarExcel: () => void;
  onVerReporteBase?: () => void;
  tieneHojas: boolean;
}

export const ReporteAnualHeader: React.FC<ReporteAnualHeaderProps> = ({
  anio,
  progreso,
  onVerReporte,
  onDescargarExcel,
  onImportarExcel,
  onVerReporteBase,
  tieneHojas,
}) => {
  const porcentaje = (progreso / 12) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md px-4 py-3 mb-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            📊 Reporte Base Anual {anio}
          </h2>

          {/* Barra de progreso inline */}
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  porcentaje === 100
                    ? "bg-green-600"
                    : porcentaje > 0
                    ? "bg-blue-600"
                    : "bg-gray-400"
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {progreso}/12
            </span>
          </div>
        </div>

        {/* Botones a la derecha del título */}
        <div className="flex gap-2">
          {/* Botón Ver Reporte Anual (Ventas mensuales) - Siempre visible */}
          <button
            onClick={onVerReporte}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm font-medium"
            title="Ver resumen anual de ventas (comparación Mi Admin vs Auxiliar)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            Ver Reporte Anual
          </button>

          {/* Botón Ver Base Importada - Solo visible cuando hay hojas */}
          {tieneHojas && onVerReporteBase && (
            <button
              onClick={onVerReporteBase}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm font-medium"
              title="Ver reporte base anual importado (todas las hojas del Excel)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              Ver Base Importada
            </button>
          )}

          <button
            onClick={onImportarExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm font-medium"
            title="Importar archivo Excel del reporte base anual"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {tieneHojas ? "Reimportar" : "Importar"}
          </button>

          <button
            onClick={onDescargarExcel}
            disabled={!tieneHojas}
            className={`
              px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm font-medium
              ${
                tieneHojas
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              tieneHojas
                ? "Descargar reporte en Excel"
                : "Primero importa el reporte base"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Descargar
          </button>
        </div>
      </div>

      {/* Mensaje de ayuda - Solo si no hay hojas */}
      {!tieneHojas && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-4 w-4 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-yellow-700">
                📋 <strong>Reporte Base Anual no importado.</strong> Haz clic en
                "Importar" para cargar el archivo base del reporte anual.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
