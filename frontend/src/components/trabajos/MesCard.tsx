import React, { useState } from "react";
import { Mes, MESES_NOMBRES } from "../../types/trabajo";
import { ReporteCard } from "./ReporteCard";
import { reportesMensualesService } from "../../services";

interface MesCardProps {
  mes: Mes;
  trabajoId: string;
  trabajoYear: number;
}

export const MesCard: React.FC<MesCardProps> = ({
  mes,
  trabajoId,
  trabajoYear,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const getEstadoColor = () => {
    switch (mes.estado) {
      case "COMPLETADO":
        return "bg-green-100 text-green-800";
      case "EN_PROCESO":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const todosImportados = mes.reportes.every(
    (r) => r.estado === "IMPORTADO" || r.estado === "PROCESADO"
  );

  const handleProcesarYGuardar = async () => {
    if (!todosImportados || mes.estado === "COMPLETADO") return;

    setProcessing(true);
    try {
      await reportesMensualesService.procesarYGuardar(mes.id);
      alert("Mes procesado y guardado correctamente");
      window.location.reload(); // Refrescar para ver cambios
    } catch (error: any) {
      console.error("Error al procesar:", error);
      alert(error.response?.data?.message || "Error al procesar el mes");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div
        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-800">
              {MESES_NOMBRES[mes.mes - 1]}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor()}`}
            >
              {mes.estado}
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-gray-600 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-white">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Reportes Mensuales:
          </p>

          <div className="space-y-3 mb-4">
            {mes.reportes.map((reporte) => (
              <ReporteCard
                key={reporte.id}
                reporte={reporte}
                mesId={mes.id}
                trabajoId={trabajoId}
                trabajoYear={trabajoYear}
                mesNumber={mes.mes}
              />
            ))}
          </div>

          {todosImportados && mes.estado !== "COMPLETADO" && (
            <button
              onClick={handleProcesarYGuardar}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Procesando...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Procesar y Guardar Mes
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
