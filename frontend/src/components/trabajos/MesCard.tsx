import React, { useMemo, useState } from "react";
import { Mes, MESES_NOMBRES } from "../../types/trabajo";
import { ReporteCard } from "./ReporteCard";
import { reportesMensualesService, mesesService } from "../../services";
import { useAuth } from "../../context/AuthContext";

interface MesCardProps {
  mes: Mes;
  trabajoId: string;
  trabajoYear: number;
  onMesUpdated?: () => void;
  gestorResponsableId?: string | null;
}

export const MesCard: React.FC<MesCardProps> = ({
  mes,
  trabajoId,
  trabajoYear,
  onMesUpdated,
  gestorResponsableId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const role = user?.role ?? "Gestor";
  const userId = user?.id ?? "";
  const isAdmin = role === "Admin";
  const esGestor = role === "Gestor";
  const esGestorResponsable = gestorResponsableId
    ? gestorResponsableId === userId
    : esGestor;
  const puedeRevisar = isAdmin || esGestorResponsable;
  const isMiembro = role === "Miembro";

  const isReadOnly =
    mes.estadoRevision === "ENVIADO" || mes.estadoRevision === "APROBADO";

  // 🔍 DEBUG: Verificar por qué no aparecen los botones
  React.useEffect(() => {
    console.log("🔍 MesCard DEBUG:", {
      mesNombre: MESES_NOMBRES[mes.mes - 1],
      estadoRevision: mes.estadoRevision,
      puedeRevisar,
      esGestorResponsable,
      gestorResponsableId,
      userId,
      role,
      isAdmin,
      esGestor,
      deberianMostrarseLosBotones:
        puedeRevisar && mes.estadoRevision === "ENVIADO",
    });
  }, [mes.estadoRevision, puedeRevisar, mes.mes]);

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

  const revisionBadge = useMemo(() => {
    switch (mes.estadoRevision) {
      case "ENVIADO":
        return {
          label: "En revisión",
          classes: "bg-amber-100 text-amber-800",
        };
      case "APROBADO":
        return {
          label: "Aprobado",
          classes: "bg-green-100 text-green-800",
        };
      case "CAMBIOS_SOLICITADOS":
        return {
          label: "Cambios solicitados",
          classes: "bg-rose-100 text-rose-800",
        };
      default:
        return {
          label:
            mes.estado === "COMPLETADO" ? "Listo para enviar" : "En edición",
          classes: "bg-slate-100 text-slate-600",
        };
    }
  }, [mes.estado, mes.estadoRevision]);

  const todosImportados = mes.reportes.every(
    (r) => r.estado === "IMPORTADO" || r.estado === "PROCESADO"
  );

  const handleProcesarYGuardar = async () => {
    if (isReadOnly) {
      alert("El mes está bloqueado por revisión o aprobación.");
      return;
    }

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
    if (!puedeRevisar) {
      alert(
        "Solo el gestor responsable o un administrador puede reabrir el mes."
      );
      return;
    }

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

  const handleEnviarRevision = async () => {
    if (isReadOnly) {
      return;
    }

    if (mes.estado !== "COMPLETADO") {
      alert("Primero debes procesar el mes antes de enviarlo a revisión.");
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas enviar el mes de ${
        MESES_NOMBRES[mes.mes - 1]
      } a revisión del gestor?`
    );
    if (!confirmar) return;

    setProcessing(true);
    try {
      const comentario =
        mes.estadoRevision === "CAMBIOS_SOLICITADOS"
          ? window.prompt(
              "Opcional: agrega un comentario para el gestor",
              mes.comentarioRevision ?? ""
            ) ?? undefined
          : undefined;

      await mesesService.enviarRevision(
        mes.id,
        comentario?.trim() || undefined
      );
      alert("Mes enviado a revisión");
      onMesUpdated?.();
    } catch (error: any) {
      console.error("Error al enviar a revisión:", error);
      alert(
        error.response?.data?.message || "Error al enviar el mes a revisión"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleEnviarRevisionManual = async () => {
    if (!puedeRevisar) {
      alert(
        "Solo el gestor responsable o un administrador puede enviar el mes manualmente."
      );
      return;
    }

    if (isReadOnly) {
      alert("El mes está bloqueado por revisión o aprobación.");
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas enviar el mes de ${
        MESES_NOMBRES[mes.mes - 1]
      } a revisión del gestor?`
    );

    if (!confirmar) return;

    setProcessing(true);
    try {
      await mesesService.enviarRevisionManual(mes.id);
      alert("Mes enviado a revisión.");
      onMesUpdated?.();
    } catch (error: any) {
      console.error("Error al enviar mes a revisión manual:", error);
      alert(
        error.response?.data?.message ||
          "No fue posible enviar el mes a revisión."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleAprobarMes = async () => {
    if (!puedeRevisar) {
      alert(
        "Solo el gestor responsable o un administrador puede aprobar el mes."
      );
      return;
    }
    setProcessing(true);
    try {
      await mesesService.aprobar(mes.id);
      alert("Mes aprobado correctamente");
      onMesUpdated?.();
    } catch (error: any) {
      console.error("Error al aprobar mes:", error);
      alert(error.response?.data?.message || "Error al aprobar el mes");
    } finally {
      setProcessing(false);
    }
  };

  const handleSolicitarCambios = async () => {
    if (!puedeRevisar) {
      alert(
        "Solo el gestor responsable o un administrador puede solicitar cambios."
      );
      return;
    }
    const comentario = window.prompt(
      "Describe los cambios necesarios para este mes:",
      mes.comentarioRevision ?? ""
    );
    if (!comentario || comentario.trim().length === 0) {
      alert("Debes ingresar un comentario para solicitar cambios.");
      return;
    }

    setProcessing(true);
    try {
      await mesesService.solicitarCambios(mes.id, comentario.trim());
      alert("Se solicitaron cambios al miembro asignado");
      onMesUpdated?.();
    } catch (error: any) {
      console.error("Error al solicitar cambios:", error);
      alert(error.response?.data?.message || "Error al solicitar cambios");
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-800">
              {MESES_NOMBRES[mes.mes - 1]}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor()}`}
            >
              {mes.estado}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${revisionBadge.classes}`}
            >
              {revisionBadge.label}
            </span>

            {/* Indicador prominente para gestor cuando hay que revisar */}
            {puedeRevisar && mes.estadoRevision === "ENVIADO" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md animate-pulse">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                ¡REVISAR AHORA!
              </span>
            )}
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

          {/* Mensaje de bloqueo cuando está en revisión o aprobado */}
          {mes.estadoRevision === "ENVIADO" && (
            <div className="mb-3 rounded-lg border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-amber-900 mb-1">
                    🔒 Mes en Revisión
                  </h4>
                  <p className="text-sm text-amber-800">
                    {isMiembro
                      ? "Este mes está bloqueado mientras el gestor lo revisa. No puedes hacer cambios hasta que el gestor lo apruebe o solicite modificaciones."
                      : "Este mes está en revisión. Los reportes están en modo solo lectura. Revisa los datos y decide si aprobar o solicitar cambios."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mes.estadoRevision === "APROBADO" && (
            <div className="mb-3 rounded-lg border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-emerald-900 mb-1">
                    ✅ Mes Aprobado
                  </h4>
                  <p className="text-sm text-emerald-800">
                    Este mes fue aprobado y permanece en modo de solo lectura
                    permanente. Los datos no pueden modificarse.
                  </p>
                  {mes.aprobadoPor && (
                    <p className="text-xs text-emerald-700 mt-1">
                      Aprobado por:{" "}
                      {mes.aprobadoPor.name || mes.aprobadoPor.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {mes.estadoRevision === "CAMBIOS_SOLICITADOS" &&
            mes.comentarioRevision && (
              <div className="mb-3 rounded-lg border-2 border-rose-400 bg-gradient-to-r from-rose-50 to-orange-50 p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-rose-900 mb-2 flex items-center gap-2">
                      ⚠️ El Gestor Solicitó Cambios
                    </h4>

                    {mes.aprobadoPor && (
                      <div className="mb-2 flex items-center gap-2 text-xs text-rose-700">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          <strong>Gestor:</strong>{" "}
                          {mes.aprobadoPor.name || mes.aprobadoPor.email}
                        </span>
                      </div>
                    )}

                    <div className="bg-white border border-rose-200 rounded-md p-3 mb-3">
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">
                        Comentarios del Gestor:
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {mes.comentarioRevision}
                      </p>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-100 border border-rose-300 rounded-md p-2">
                      <svg
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-semibold">
                        📝 Acción requerida: Realiza los ajustes necesarios en
                        los reportes y vuelve a enviar el mes a revisión.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  isReadOnly={isReadOnly}
                />
              );
            })}
          </div>

          {puedeRevisar &&
            (mes.estadoRevision === "EN_EDICION" ||
              mes.estadoRevision === "CAMBIOS_SOLICITADOS") && (
              <button
                onClick={handleEnviarRevisionManual}
                disabled={processing}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
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
                    Enviando...
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
                        d="M6.267 3.455A2 2 0 017.956 2h4.088a2 2 0 011.689.955l1.911 3.185A2 2 0 0116 6.92V17a1 1 0 01-1 1H5a1 1 0 01-1-1V6.918a2 2 0 01.356-1.13l1.911-3.333zM8 4l-1 2h6l-1-2H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Enviar a revisión
                  </>
                )}
              </button>
            )}

          {todosImportados && mes.estado !== "COMPLETADO" && !isReadOnly && (
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

          {/* Botón para enviar a revisión */}
          {isMiembro &&
            mes.estado === "COMPLETADO" &&
            (mes.estadoRevision === "EN_EDICION" ||
              mes.estadoRevision === "CAMBIOS_SOLICITADOS") && (
              <button
                onClick={handleEnviarRevision}
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884l8-3.2a1 1 0 01.994.106l7 4.666A1 1 0 0118 8.333v7.334a1 1 0 01-.553.894l-8 4a1 1 0 01-.894 0l-8-4A1 1 0 010 15.667V8.333a1 1 0 011.003-.449z" />
                    </svg>
                    Enviar a revisión
                  </>
                )}
              </button>
            )}

          {/* Acciones para el gestor responsable cuando el mes está en revisión */}
          {puedeRevisar && mes.estadoRevision === "ENVIADO" && (
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                onClick={handleAprobarMes}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    Aprobar mes
                  </>
                )}
              </button>
              <button
                onClick={handleSolicitarCambios}
                disabled={processing}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l5.58 9.92C18.086 14.451 17.141 16 15.57 16H4.43c-1.57 0-2.516-1.549-1.753-2.98l5.58-9.92z" />
                    </svg>
                    Solicitar cambios
                  </>
                )}
              </button>
            </div>
          )}

          {mes.estadoRevision === "APROBADO" && mes.fechaAprobacion && (
            <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p>
                Aprobado el{" "}
                {new Date(mes.fechaAprobacion).toLocaleDateString("es-MX")} por{" "}
                {mes.aprobadoPor?.nombre || mes.aprobadoPor?.name || "gestor"}.
              </p>
            </div>
          )}

          {/* Botón para reabrir mes completado */}
          {mes.estado === "COMPLETADO" && puedeRevisar && (
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
          {(mes.estado === "EN_PROCESO" || mes.estado === "COMPLETADO") &&
            puedeRevisar && (
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
