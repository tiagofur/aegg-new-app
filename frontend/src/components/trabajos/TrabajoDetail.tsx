import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trabajo, MESES_NOMBRES_CORTOS } from "../../types/trabajo";
import { MesCard } from "./MesCard";
import { ReporteViewer } from "./ReporteViewer";
import { ImportReporteBaseDialog } from "./ImportReporteBaseDialog";
import { EditTrabajoDialog } from "./EditTrabajoDialog";
import { trabajosService } from "../../services";

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
  const navigate = useNavigate();
  const [verReporteBase, setVerReporteBase] = useState(false);
  const [mostrarImportDialog, setMostrarImportDialog] = useState(false);
  const [mostrarEditDialog, setMostrarEditDialog] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const progreso =
    ((trabajo.reporteBaseAnual?.mesesCompletados.length || 0) / 12) * 100;

  const tieneHojas =
    trabajo.reporteBaseAnual?.hojas &&
    trabajo.reporteBaseAnual.hojas.length > 0 &&
    trabajo.reporteBaseAnual.hojas.some((h) => h.datos && h.datos.length > 0);

  const handleEliminarProyecto = async () => {
    const confirmar = window.confirm(
      `⚠️ ADVERTENCIA: ¿Está seguro que desea eliminar el proyecto "${trabajo.clienteNombre} - ${trabajo.anio}"?\n\n` +
        `Esta acción eliminará:\n` +
        `- El proyecto completo\n` +
        `- Todos los ${trabajo.meses.length} meses asociados\n` +
        `- Todos los reportes mensuales\n` +
        `- El reporte base anual\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (!confirmar) return;

    // Segunda confirmación para seguridad
    const confirmarFinal = window.confirm(
      `¿REALMENTE desea eliminar el proyecto "${trabajo.clienteNombre} - ${trabajo.anio}"? ` +
        `Escribirá su nombre para confirmar.`
    );

    if (!confirmarFinal) return;

    setEliminando(true);
    try {
      await trabajosService.delete(trabajo.id);
      alert("Proyecto eliminado correctamente");
      navigate("/trabajos"); // Redirigir a la lista
    } catch (error: any) {
      console.error("Error al eliminar proyecto:", error);
      alert(error.response?.data?.message || "Error al eliminar el proyecto");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="px-2 py-4">
      {/* Header */}
      <div className="mb-4">
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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {trabajo.clienteNombre} - {trabajo.anio}
            </h1>
            {trabajo.clienteRfc && (
              <p className="text-gray-600 mt-2">RFC: {trabajo.clienteRfc}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMostrarEditDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Editar
            </button>

            <button
              onClick={handleEliminarProyecto}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {eliminando ? (
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
                  Eliminar Proyecto
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reporte Base Anual */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
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
          <button
            onClick={() =>
              navigate(`/trabajos/${trabajo.id}/reporte-anual/${trabajo.anio}`)
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            📊 Ver Reporte Anual
          </button>

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
        <div className="mb-4">
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
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
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
                  onMesUpdated={onReload}
                />
              ))}
          </div>
        )}
      </div>

      {/* Dialog para editar trabajo */}
      <EditTrabajoDialog
        trabajo={trabajo}
        isOpen={mostrarEditDialog}
        onClose={() => setMostrarEditDialog(false)}
        onSuccess={onReload}
      />
    </div>
  );
};
