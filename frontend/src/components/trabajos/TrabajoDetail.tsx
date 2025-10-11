import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trabajo, MESES_NOMBRES } from "../../types/trabajo";
import { MesesSelector } from "./MesesSelector";
import { ReporteAnualHeader } from "./ReporteAnualHeader";
import { ReportesTabSelector } from "./ReportesTabSelector";
import { ReporteMensualViewer } from "./ReporteMensualViewer";
import { ImportReporteBaseDialog } from "./ImportReporteBaseDialog";
import { ImportReporteMensualDialog } from "./ImportReporteMensualDialog";
import { EditTrabajoDialog } from "./EditTrabajoDialog";
import { trabajosService, reportesMensualesService } from "../../services";

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
  const [mesSeleccionado, setMesSeleccionado] = useState<string | undefined>(
    trabajo.meses[0]?.id
  );
  const [reporteSeleccionado, setReporteSeleccionado] = useState<
    string | undefined
  >();
  const [mostrarImportDialog, setMostrarImportDialog] = useState(false);
  const [
    mostrarImportReporteMensualDialog,
    setMostrarImportReporteMensualDialog,
  ] = useState(false);
  const [mostrarEditDialog, setMostrarEditDialog] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const progreso = trabajo.reporteBaseAnual?.mesesCompletados.length || 0;

  const tieneHojas =
    (trabajo.reporteBaseAnual?.hojas &&
      trabajo.reporteBaseAnual.hojas.length > 0 &&
      trabajo.reporteBaseAnual.hojas.some(
        (h) => h.datos && h.datos.length > 0
      )) ||
    false;

  // Encontrar el mes seleccionado
  const mesActual = trabajo.meses.find((m) => m.id === mesSeleccionado);

  // Cuando cambia el mes, seleccionar el primer reporte automáticamente
  React.useEffect(() => {
    if (mesActual && mesActual.reportes && mesActual.reportes.length > 0) {
      setReporteSeleccionado(mesActual.reportes[0].id);
    } else {
      setReporteSeleccionado(undefined);
    }
  }, [mesSeleccionado, mesActual]);

  // Encontrar el reporte seleccionado
  const reporteActual = mesActual?.reportes?.find(
    (r) => r.id === reporteSeleccionado
  );

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
        `Esta acción es IRREVERSIBLE.`
    );

    if (!confirmarFinal) return;

    setEliminando(true);
    try {
      await trabajosService.delete(trabajo.id);
      alert("Proyecto eliminado correctamente");
      // Volver a la lista de trabajos después de eliminar
      onBack();
    } catch (error: any) {
      console.error("Error al eliminar proyecto:", error);
      alert(error.response?.data?.message || "Error al eliminar el proyecto");
    } finally {
      setEliminando(false);
    }
  };

  const handleVerReporte = () => {
    if (!reporteActual || !mesActual) return;
    navigate(
      `/trabajos/${trabajo.id}/reporte-mensual/${mesActual.id}/${reporteActual.id}/${reporteActual.tipo}`
    );
  };

  const handleImportarReporte = () => {
    setMostrarImportReporteMensualDialog(true);
  };

  const handleReimportarReporte = () => {
    setMostrarImportReporteMensualDialog(true);
  };

  const handleLimpiarDatos = async () => {
    if (!reporteActual || !mesActual) return;

    try {
      await reportesMensualesService.limpiarDatos(
        mesActual.id,
        reporteActual.id
      );
      alert("Datos del reporte eliminados correctamente");
      // Recargar el trabajo para actualizar el estado
      onReload();
    } catch (error: any) {
      console.error("Error al limpiar datos del reporte:", error);
      alert(
        error.response?.data?.message ||
          "Error al limpiar los datos del reporte"
      );
    }
  };

  return (
    <div className="px-2 py-3">
      {/* Header */}
      <div className="mb-3">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-2 text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
            <h1 className="text-2xl font-bold text-gray-800">
              {trabajo.clienteNombre} - {trabajo.anio}
            </h1>
            {trabajo.clienteRfc && (
              <p className="text-gray-600 text-sm mt-1">
                RFC: {trabajo.clienteRfc}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMostrarEditDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {eliminando ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reporte Base Anual Header */}
      <ReporteAnualHeader
        anio={trabajo.anio}
        progreso={progreso}
        onVerReporte={() =>
          navigate(`/trabajos/${trabajo.id}/reporte-anual/${trabajo.anio}`)
        }
        onImportarExcel={() => setMostrarImportDialog(true)}
        onDescargarExcel={() =>
          alert("Funcionalidad de descarga en desarrollo")
        }
        tieneHojas={tieneHojas}
      />

      {/* Selector de Meses */}
      <MesesSelector
        meses={trabajo.meses}
        mesSeleccionado={mesSeleccionado}
        onMesClick={(mes) => setMesSeleccionado(mes.id)}
        progreso={`${progreso}/12 meses`}
      />

      {/* Reportes Mensuales del mes seleccionado */}
      {mesActual ? (
        <div className="mt-3">
          {/* Selector de pestañas de reportes */}
          {mesActual.reportes && mesActual.reportes.length > 0 ? (
            <>
              <ReportesTabSelector
                reportes={mesActual.reportes}
                reporteSeleccionado={reporteSeleccionado}
                onReporteClick={(reporte) => setReporteSeleccionado(reporte.id)}
              />

              {/* Visor del reporte seleccionado */}
              {reporteActual && (
                <ReporteMensualViewer
                  reporte={reporteActual}
                  reportes={mesActual.reportes}
                  mesNombre={MESES_NOMBRES[mesActual.mes - 1]}
                  onVerReporte={handleVerReporte}
                  onImportarReporte={handleImportarReporte}
                  onReimportarReporte={handleReimportarReporte}
                  onLimpiarDatos={handleLimpiarDatos}
                />
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠️ No hay reportes disponibles
              </p>
              <p className="text-yellow-700 mt-1 text-xs">
                Los reportes se crean automáticamente al seleccionar el mes
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-semibold text-sm">
            ⚠️ No hay meses disponibles
          </p>
          <p className="text-yellow-700 mt-1 text-xs">
            Selecciona un mes arriba para ver sus reportes
          </p>
          {trabajo.meses.length === 0 && (
            <button
              onClick={onAddMes}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              Crear primer mes
            </button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ImportReporteBaseDialog
        trabajoId={trabajo.id}
        isOpen={mostrarImportDialog}
        onClose={() => setMostrarImportDialog(false)}
        onSuccess={onReload}
      />

      <EditTrabajoDialog
        trabajo={trabajo}
        isOpen={mostrarEditDialog}
        onClose={() => setMostrarEditDialog(false)}
        onSuccess={onReload}
      />

      {/* Diálogo de importación de reportes mensuales */}
      {mesActual && reporteActual && (
        <ImportReporteMensualDialog
          isOpen={mostrarImportReporteMensualDialog}
          onClose={() => setMostrarImportReporteMensualDialog(false)}
          onSuccess={onReload}
          mesId={mesActual.id}
          tipo={reporteActual.tipo}
          mesNombre={MESES_NOMBRES[mesActual.mes - 1]}
        />
      )}
    </div>
  );
};
