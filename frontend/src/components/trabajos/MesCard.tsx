import React, { useState } from "react";
import { Mes, MESES_NOMBRES } from "../../types/trabajo";
import { ReporteCard } from "./ReporteCard";
import { reportesMensualesService, mesesService } from "../../services";

interface MesCardProps {
  mes: Mes;
  trabajoId: string;
  trabajoYear: number;
  onMesUpdated?: () => void;
}

export const MesCard: React.FC<MesCardProps> = ({
  mes,
  trabajoId,
  trabajoYear,
  onMesUpdated,
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
      if (onMesUpdated) onMesUpdated();
    } catch (error: any) {
      console.error("Error al procesar:", error);
      alert(error.response?.data?.message || "Error al procesar el mes");
    } finally {
      setProcessing(false);
    }
  };

  const handleReabrirMes = async () => {
    if (mes.estado !== "COMPLETADO") return;

    const confirmar = window.confirm(
      `¿Está seguro que desea reabrir el mes de ${
        MESES_NOMBRES[mes.mes - 1]
      }? Esto cambiará su estado de COMPLETADO a EN_PROCESO.`
    );

    if (!confirmar) return;

    setProcessing(true);
    try {
      await mesesService.reabrir(mes.id);
      alert("Mes reabierto correctamente");
      if (onMesUpdated) onMesUpdated();
    } catch (error: any) {
      console.error("Error al reabrir mes:", error);
      alert(error.response?.data?.message || "Error al reabrir el mes");
    } finally {
      setProcessing(false);
    }
  };

  const handleEliminarMes = async () => {
    const confirmar = window.confirm(
      `¿Está seguro que desea eliminar el mes de ${
        MESES_NOMBRES[mes.mes - 1]
      }? Esta acción no se puede deshacer y eliminará todos los reportes asociados.`
    );

    if (!confirmar) return;

    setProcessing(true);
    try {
      await mesesService.delete(mes.id);
      alert("Mes eliminado correctamente");
      if (onMesUpdated) onMesUpdated();
    } catch (error: any) {
      console.error("Error al eliminar mes:", error);
      alert(error.response?.data?.message || "Error al eliminar el mes");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div
        className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
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
        <div className="p-3 bg-white">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Reportes Mensuales:
          </p>

          <div className="space-y-2 mb-3">
            {mes.reportes.map((reporte) => {
              // 🔥 CRITICAL: Find the Auxiliar report ID for Mi Admin integration
              const auxiliarReporte = mes.reportes.find(
                (r) => r.tipo === "INGRESOS_AUXILIAR"
              );
              const auxiliarReporteId = auxiliarReporte?.id;

              return (
                <ReporteCard
                  key={reporte.id}
                  reporte={reporte}
                  mesId={mes.id}
                  trabajoId={trabajoId}
                  trabajoYear={trabajoYear}
                  mesNumber={mes.mes}
                  auxiliarReporteId={auxiliarReporteId}
                />
              );
            })}
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

          {/* Botón para reabrir mes completado */}
          {mes.estado === "COMPLETADO" && (
            <button
              onClick={handleReabrirMes}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
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
                  Reabriendo...
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
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reabrir Mes
                </>
              )}
            </button>
          )}

          {/* Botón para eliminar mes */}
          {(mes.estado === "EN_PROCESO" || mes.estado === "COMPLETADO") && (
            <button
              onClick={handleEliminarMes}
              disabled={processing}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  Eliminando...
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
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Eliminar Mes
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
