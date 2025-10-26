import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Trabajo, MESES_NOMBRES } from "../../types/trabajo";
import { ReporteAnualHeader } from "./ReporteAnualHeader";
import { ReportesTabSelector } from "./ReportesTabSelector";
import { ReporteMensualViewer } from "./ReporteMensualViewer";
import { ImportReporteBaseDialog } from "./ImportReporteBaseDialog";
import { ImportReporteMensualDialog } from "./ImportReporteMensualDialog";
import { EditTrabajoDialog } from "./EditTrabajoDialog";
import {
  trabajosService,
  reportesMensualesService,
  mesesService,
} from "../../services";
import { MesSelectorModal } from "./MesSelectorModal";
import { getMesEstadoVisual, MES_ESTADO_TONE_CLASSES } from "./mesEstadoVisual";
import { useAuth } from "../../context/AuthContext";

interface TrabajoDetailProps {
  trabajo: Trabajo;
  onAddMes: () => void;
  onBack: () => void;
  onReload: () => void;
  canManage: boolean;
}

export const TrabajoDetail: React.FC<TrabajoDetailProps> = ({
  trabajo,
  onAddMes,
  onBack,
  onReload,
  canManage,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [reabriendo, setReabriendo] = useState(false);
  const [mostrarSelectorMeses, setMostrarSelectorMeses] = useState(false);
  const [enviandoMes, setEnviandoMes] = useState(false);

  const { user } = useAuth();
  const role = user?.role ?? "Gestor";
  const userId = user?.id ?? "";
  const isAdmin = role === "Admin";
  const esGestorResponsable =
    !!trabajo.gestorResponsableId && trabajo.gestorResponsableId === userId;

  const isAprobado = trabajo.estadoAprobacion === "APROBADO";
  const canEdit = canManage && !isAprobado && (isAdmin || esGestorResponsable);
  const canReabrir =
    canManage && isAprobado && (isAdmin || esGestorResponsable);

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

  // Auto-expandir mes al llegar desde el dashboard de aprobaciones
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mesIdParam = params.get("mes");

    if (mesIdParam && trabajo.meses) {
      // Buscar si el mes existe en este trabajo
      const mesEncontrado = trabajo.meses.find((m) => m.id === mesIdParam);

      if (mesEncontrado) {
        // Establecer el mes seleccionado
        setMesSeleccionado(mesEncontrado.id);

        // Hacer scroll al mes después de un pequeño delay
        setTimeout(() => {
          const mesElement = document.getElementById(
            `mes-card-${mesEncontrado.id}`
          );
          if (mesElement) {
            mesElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Agregar highlight temporal
            mesElement.classList.add(
              "ring-2",
              "ring-blue-500",
              "ring-offset-2"
            );
            setTimeout(() => {
              mesElement.classList.remove(
                "ring-2",
                "ring-blue-500",
                "ring-offset-2"
              );
            }, 2000);
          }
        }, 300);

        // Limpiar el parámetro de la URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [trabajo.meses, location.search, navigate, location.pathname]);

  // Cuando cambia el mes, seleccionar el primer reporte automáticamente
  React.useEffect(() => {
    if (mesActual && mesActual.reportes && mesActual.reportes.length > 0) {
      setReporteSeleccionado(mesActual.reportes[0].id);
    } else {
      setReporteSeleccionado(undefined);
    }
  }, [mesSeleccionado, mesActual]);

  const mesEstadoVisual = mesActual ? getMesEstadoVisual(mesActual) : null;
  const mesToneClasses = mesEstadoVisual
    ? MES_ESTADO_TONE_CLASSES[mesEstadoVisual.tone]
    : null;
  const mesSeleccionadoLabel = mesActual
    ? MESES_NOMBRES[mesActual.mes - 1]
    : "Seleccionar mes";

  const mesEstaBloqueado = Boolean(
    mesActual &&
      (mesActual.estadoRevision === "ENVIADO" ||
        mesActual.estadoRevision === "APROBADO")
  );

  const puedeEnviarMesManual = Boolean(
    mesActual && !mesEstaBloqueado && (isAdmin || esGestorResponsable)
  );

  const puedeEditarMesActual = Boolean(canEdit && !mesEstaBloqueado);

  // Encontrar el reporte seleccionado
  const reporteActual = mesActual?.reportes?.find(
    (r) => r.id === reporteSeleccionado
  );

  const formatLabel = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

  const estadoAprobacionLabel = formatLabel(trabajo.estadoAprobacion);
  const miembroAsignadoNombre =
    trabajo.miembroAsignado?.nombre ?? trabajo.miembroAsignado?.name ?? "";
  const aprobadorNombre =
    trabajo.aprobadoPor?.nombre ?? trabajo.aprobadoPor?.name ?? "";
  const gestorResponsableNombre =
    trabajo.gestorResponsable?.nombre ?? trabajo.gestorResponsable?.name ?? "";

  const handleEliminarProyecto = async () => {
    if (!canEdit) {
      return;
    }
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

  const handleImportarReporte = () => {
    if (!puedeEditarMesActual) {
      return;
    }
    setMostrarImportReporteMensualDialog(true);
  };

  const handleReimportarReporte = () => {
    if (!puedeEditarMesActual) {
      return;
    }
    setMostrarImportReporteMensualDialog(true);
  };

  const handleLimpiarDatos = async () => {
    if (!puedeEditarMesActual) {
      return;
    }
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

  const handleReabrirTrabajo = async () => {
    if (!canReabrir) {
      return;
    }

    const confirmar = window.confirm(
      "Este trabajo está aprobado. ¿Desea reabrirlo para continuar editando?"
    );

    if (!confirmar) {
      return;
    }

    setReabriendo(true);
    try {
      await trabajosService.update(trabajo.id, {
        estadoAprobacion: "REABIERTO",
        aprobadoPorId: null,
      });
      alert("Trabajo reabierto correctamente");
      onReload();
    } catch (error: any) {
      console.error("Error al reabrir trabajo:", error);
      alert(error.response?.data?.message || "Error al reabrir el trabajo");
    } finally {
      setReabriendo(false);
    }
  };

  const handleEnviarMesManual = async () => {
    if (!mesActual || !puedeEnviarMesManual) {
      return;
    }

    if (mesEstaBloqueado) {
      alert("El mes está bloqueado por revisión o aprobación.");
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas enviar el mes de ${
        MESES_NOMBRES[mesActual.mes - 1]
      } a revisión del gestor?`
    );

    if (!confirmar) {
      return;
    }

    setEnviandoMes(true);
    try {
      await mesesService.enviarRevisionManual(mesActual.id);
      alert("Mes enviado a revisión.");
      onReload();
    } catch (error: any) {
      console.error("Error al enviar mes manualmente a revisión:", error);
      alert(
        error?.response?.data?.message ||
          "No fue posible enviar el mes a revisión."
      );
    } finally {
      setEnviandoMes(false);
    }
  };

  return (
    <div className="px-2 py-3">
      {/* Header consolidado con breadcrumbs, título y acciones */}
      <div className="mb-3">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-blue-600 transition-colors"
          >
            Inicio
          </button>
          <span>/</span>
          <button
            onClick={onBack}
            className="hover:text-blue-600 transition-colors"
          >
            Trabajos
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {trabajo.clienteNombre}
          </span>
        </nav>

        {isAprobado && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Trabajo aprobado.{" "}
            {canReabrir
              ? "Puedes reabrirlo para retomar las ediciones."
              : "Contacta a un gestor si necesitas reabrirlo."}
          </div>
        )}

        {/* Título y controles */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {trabajo.clienteNombre} - {trabajo.anio}
              </h1>
              <button
                type="button"
                onClick={() => setMostrarSelectorMeses(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-haspopup="dialog"
                aria-expanded={mostrarSelectorMeses}
                title="Cambiar mes"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    mesToneClasses?.dotClass ?? "bg-slate-300"
                  }`}
                  aria-hidden
                />
                <span>{mesSeleccionadoLabel}</span>
                <CalendarDays className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {trabajo.clienteRfc && <span>RFC: {trabajo.clienteRfc}</span>}
              <span>Estado aprobación: {estadoAprobacionLabel}</span>
              {gestorResponsableNombre && (
                <span>Gestor responsable: {gestorResponsableNombre}</span>
              )}
              {miembroAsignadoNombre && (
                <span>Asignado a: {miembroAsignadoNombre}</span>
              )}
              {aprobadorNombre && <span>Aprobado por: {aprobadorNombre}</span>}
              <span>
                Visibilidad: {trabajo.visibilidadEquipo ? "Equipo" : "Privado"}
              </span>
              {trabajo.meses.length > 0 && (
                <span>{progreso}/12 meses completados</span>
              )}
            </div>
          </div>
          {(canEdit || canReabrir || puedeEnviarMesManual) && (
            <div className="flex flex-wrap gap-2">
              {puedeEnviarMesManual && (
                <button
                  onClick={handleEnviarMesManual}
                  disabled={enviandoMes}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {enviandoMes ? (
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
                      Enviando...
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
                          d="M6.267 3.455A2 2 0 017.956 2h4.088a2 2 0 011.689.955l1.911 3.185A2 2 0 0116 6.92V17a1 1 0 01-1 1H5a1 1 0 01-1-1V6.918a2 2 0 01.356-1.13l1.911-3.333zM8 4l-1 2h6l-1-2H8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Enviar a revisión
                    </>
                  )}
                </button>
              )}
              {canEdit && (
                <>
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
                </>
              )}

              {canReabrir && (
                <button
                  onClick={handleReabrirTrabajo}
                  disabled={reabriendo}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {reabriendo ? (
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
                      Reabriendo...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M4 3a1 1 0 011-1h6a1 1 0 01.8.4l3 4a1 1 0 010 1.2l-3 4a1 1 0 01-.8.4H5a1 1 0 01-1-1V3z" />
                        <path d="M4 13a1 1 0 011-1h11a1 1 0 110 2H5a1 1 0 01-1-1z" />
                      </svg>
                      Reabrir trabajo
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reporte Base Anual Header */}
      <ReporteAnualHeader
        trabajoId={trabajo.id}
        anio={trabajo.anio}
        progreso={progreso}
        onVerReporte={() =>
          navigate(`/trabajos/${trabajo.id}/reporte-anual/${trabajo.anio}`)
        }
        onVerReporteBase={() =>
          navigate(`/trabajos/${trabajo.id}/reporte-base-anual`)
        }
        onImportarExcel={() => {
          if (!canEdit) {
            return;
          }
          setMostrarImportDialog(true);
        }}
        onDescargarExcel={() =>
          alert("Funcionalidad de descarga en desarrollo")
        }
        tieneHojas={tieneHojas}
        canImport={canEdit}
        ultimaActualizacion={trabajo.reporteBaseAnual?.ultimaActualizacion}
      />

      {/* Reportes Mensuales del mes seleccionado */}
      {mesActual ? (
        <div
          id={`mes-card-${mesActual.id}`}
          className="mt-3 scroll-mt-20 transition-all duration-200"
        >
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
                  mesId={mesActual.id}
                  trabajoId={trabajo.id}
                  trabajoYear={trabajo.anio}
                  mesNumber={mesActual.mes}
                  onImportarReporte={handleImportarReporte}
                  onReimportarReporte={handleReimportarReporte}
                  onLimpiarDatos={handleLimpiarDatos}
                  canManage={puedeEditarMesActual}
                  mesEstadoRevision={mesActual.estadoRevision}
                  gestorResponsableId={trabajo.gestorResponsableId}
                  onMesUpdated={onReload}
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
          {trabajo.meses.length === 0 && canEdit && (
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

      {canEdit && (
        <EditTrabajoDialog
          trabajo={trabajo}
          isOpen={mostrarEditDialog}
          onClose={() => setMostrarEditDialog(false)}
          onSuccess={onReload}
        />
      )}

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

      <MesSelectorModal
        isOpen={mostrarSelectorMeses}
        onClose={() => setMostrarSelectorMeses(false)}
        meses={trabajo.meses}
        mesSeleccionado={mesSeleccionado}
        onSelectMes={(mesId) => {
          setMesSeleccionado(mesId);
          setMostrarSelectorMeses(false);
        }}
        onAddMesRequest={canEdit ? onAddMes : undefined}
      />
    </div>
  );
};
