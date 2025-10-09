import React from "react";

interface ReporteAnualHeaderProps {
  anio: number;
  progreso: number; // 0-12
  onVerReporte: () => void;
  onDescargarExcel: () => void;
  tieneHojas: boolean;
}

export const ReporteAnualHeader: React.FC<ReporteAnualHeaderProps> = ({
  anio,
  progreso,
  onVerReporte,
  onDescargarExcel,
  tieneHojas,
}) => {
  const porcentaje = (progreso / 12) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          📊 Reporte Base Anual {anio}
        </h2>

        {/* Botones a la derecha del título */}
        <div className="flex gap-2">
          <button
            onClick={onVerReporte}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            title="Ver reporte anual completo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            Ver Reporte
          </button>

          <button
            onClick={onDescargarExcel}
            disabled={!tieneHojas}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
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
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-2">
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
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
          <span className="text-sm font-semibold text-gray-700 min-w-[60px]">
            {progreso}/12 meses
          </span>
        </div>
      </div>

      {/* Mensaje de ayuda */}
      {progreso === 0 && (
        <p className="text-sm text-gray-600 mt-2">
          💡 Selecciona un mes abajo para comenzar a trabajar en el reporte
          anual
        </p>
      )}
    </div>
  );
};
