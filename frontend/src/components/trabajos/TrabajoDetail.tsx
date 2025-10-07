import React, { useState } from "react";
import { Trabajo, MESES_NOMBRES_CORTOS } from "../../types/trabajo";
import { MesCard } from "./MesCard";
import { ReporteViewer } from "./ReporteViewer";
import { ImportReporteBaseDialog } from "./ImportReporteBaseDialog";

interface TrabajoDetailProps {
  trabajo: Trabajo;
  onAddMes: () => void;
  onBack: () => void;
  onReload: () => void;
}

export const TrabajoDetail: React.FC<TrabajoDetailProps> = ({
  trabajo,
  onAddMes,
  onBack,
  onReload,
}) => {
  const [verReporteBase, setVerReporteBase] = useState(false);
  const [mostrarImportDialog, setMostrarImportDialog] = useState(false);

  const progreso =
    ((trabajo.reporteBaseAnual?.mesesCompletados.length || 0) / 12) * 100;

  const tieneHojas =
    trabajo.reporteBaseAnual?.hojas &&
    trabajo.reporteBaseAnual.hojas.length > 0 &&
    trabajo.reporteBaseAnual.hojas.some((h) => h.datos && h.datos.length > 0);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Volver a la lista
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {trabajo.clienteNombre} - {trabajo.anio}
        </h1>
        {trabajo.clienteRfc && (
          <p className="text-gray-600 mt-2">RFC: {trabajo.clienteRfc}</p>
        )}
      </div>

      {/* Reporte Base Anual */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📊 Reporte Base Anual {trabajo.anio}
        </h2>

        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all rounded-full"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {trabajo.reporteBaseAnual?.mesesCompletados.length || 0}/12 meses
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {MESES_NOMBRES_CORTOS.map((nombre, index) => {
            const mes = index + 1;
            const completado =
              trabajo.reporteBaseAnual?.mesesCompletados.includes(mes);
            return (
              <span
                key={mes}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  completado
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {nombre}
              </span>
            );
          })}
        </div>

        <div className="flex gap-3">
          {tieneHojas ? (
            <>
              <button
                onClick={() => setVerReporteBase(!verReporteBase)}
                className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
                {verReporteBase ? "Ocultar Reporte" : "Ver Reporte"}
              </button>
              <button
                onClick={() => alert("Funcionalidad de descarga en desarrollo")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
            </>
          ) : (
            <button
              onClick={() => setMostrarImportDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Importar Reporte Base
            </button>
          )}
        </div>
      </div>

      {/* Visualización del Reporte Base */}
      {verReporteBase && tieneHojas && trabajo.reporteBaseAnual && (
        <div className="mb-6">
          <ReporteViewer
            hojas={trabajo.reporteBaseAnual.hojas}
            titulo={`Reporte Base Anual ${trabajo.anio}`}
          />
        </div>
      )}

      {/* Dialog para importar reporte base */}
      <ImportReporteBaseDialog
        trabajoId={trabajo.id}
        isOpen={mostrarImportDialog}
        onClose={() => setMostrarImportDialog(false)}
        onSuccess={onReload}
      />

      {/* Meses */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">📅 Meses</h2>
          <button
            onClick={onAddMes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Agregar Mes
          </button>
        </div>

        {trabajo.meses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay meses agregados aún</p>
            <button
              onClick={onAddMes}
              className="mt-3 text-blue-600 hover:text-blue-800 underline"
            >
              Agregar el primer mes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trabajo.meses
              .sort((a, b) => a.mes - b.mes)
              .map((mes) => (
                <MesCard
                  key={mes.id}
                  mes={mes}
                  trabajoId={trabajo.id}
                  trabajoYear={trabajo.anio}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
