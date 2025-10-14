import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { AuxiliarIngresosTable } from "../../features/trabajos/reportes/auxiliar-ingresos";
import { MiAdminIngresosTable } from "../../features/trabajos/reportes/mi-admin-ingresos";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";

type ReporteMensualViewerProps = {
  reporte: ReporteMensual;
  reportes: ReporteMensual[];
  mesNombre: string;
  mesId: string;
  trabajoId: string;
  trabajoYear: number;
  mesNumber: number;
  onImportarReporte: () => void;
  onReimportarReporte: () => void;
  onLimpiarDatos?: () => void;
};

type ComparacionResultado = {
  foliosUnicos: Set<string>;
  foliosCoinciden: Map<string, boolean>;
};

const getIconoReporte = (tipo: ReporteMensual["tipo"]): string => {
  switch (tipo) {
    case "INGRESOS":
      return "💰";
    case "INGRESOS_AUXILIAR":
      return "📋";
    case "INGRESOS_MI_ADMIN":
      return "🏢";
    default:
      return "📄";
  }
};

const getEstadoInfo = (
  reporte: ReporteMensual
): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  progreso: number;
} => {
  const tieneDatos = reporte.datos && reporte.datos.length > 0;

  switch (reporte.estado) {
    case "PROCESADO":
      return {
        label: "Completado",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: "✓",
        progreso: 100,
      };
    case "IMPORTADO":
      return {
        label: "Importado",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "✓",
        progreso: 80,
      };
    case "ERROR":
      return {
        label: "Error al importar",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: "⚠️",
        progreso: 30,
      };
    default:
      return {
        label: tieneDatos ? "En proceso" : "Sin importar",
        color: tieneDatos ? "text-yellow-600" : "text-gray-500",
        bgColor: tieneDatos ? "bg-yellow-50" : "bg-gray-50",
        icon: tieneDatos ? "⏳" : "○",
        progreso: tieneDatos ? 50 : 10,
      };
  }
};

const formatFecha = (fecha?: string): string => {
  if (!fecha) return "No disponible";

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  const diffMs = Date.now() - date.getTime();
  const minutos = Math.floor(diffMs / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return "Hace unos segundos";
  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;
  }
  if (horas < 24) {
    return `Hace ${horas} hora${horas === 1 ? "" : "s"}`;
  }
  if (dias < 7) {
    return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
  }

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const ReporteMensualViewer: React.FC<ReporteMensualViewerProps> = ({
  reporte,
  reportes,
  mesNombre,
  mesId,
  trabajoId,
  trabajoYear,
  mesNumber,
  onImportarReporte,
  onReimportarReporte,
  onLimpiarDatos,
}) => {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [comparacionActiva, setComparacionActiva] = useState(false);
  const [tablaSaveContext, setTablaSaveContext] = useState<{
    save: () => Promise<void>;
    isDirty: boolean;
    isSaving: boolean;
  } | null>(null);

  const estado = getEstadoInfo(reporte);
  const icono = getIconoReporte(reporte.tipo);
  const nombre = TIPOS_REPORTE_NOMBRES[reporte.tipo];
  const tieneDatos = Boolean(reporte.datos && reporte.datos.length > 1);
  const progresoPorcentaje = Math.min(100, Math.max(0, estado.progreso));

  const esReporteComparable =
    reporte.tipo === "INGRESOS_AUXILIAR" ||
    reporte.tipo === "INGRESOS_MI_ADMIN";
  const usaTablaEspecializada =
    reporte.tipo === "INGRESOS" || esReporteComparable;

  useEffect(() => {
    const soportaEdicionExterna =
      reporte.tipo === "INGRESOS" ||
      reporte.tipo === "INGRESOS_MI_ADMIN" ||
      reporte.tipo === "INGRESOS_AUXILIAR";

    if (!soportaEdicionExterna) {
      setTablaSaveContext(null);
    }
  }, [reporte.tipo]);

  const auxiliarReporte = useMemo(
    () => reportes.find((r) => r.tipo === "INGRESOS_AUXILIAR"),
    [reportes]
  );

  const miAdminReporte = useMemo(
    () => reportes.find((r) => r.tipo === "INGRESOS_MI_ADMIN"),
    [reportes]
  );

  const reporteComplementario = useMemo(() => {
    if (!esReporteComparable) return null;
    const targetTipo =
      reporte.tipo === "INGRESOS_AUXILIAR"
        ? "INGRESOS_MI_ADMIN"
        : "INGRESOS_AUXILIAR";
    return reportes.find((r) => r.tipo === targetTipo) ?? null;
  }, [esReporteComparable, reporte.tipo, reportes]);

  const resultadoComparacion = useMemo<ComparacionResultado>(() => {
    if (
      !comparacionActiva ||
      !reporteComplementario ||
      !tieneDatos ||
      usaTablaEspecializada
    ) {
      return {
        foliosUnicos: new Set(),
        foliosCoinciden: new Map(),
      };
    }

    const datosActuales = reporte.datos ?? [];
    const datosComplementarios = reporteComplementario.datos ?? [];
    if (datosActuales.length < 2 || datosComplementarios.length < 2) {
      return {
        foliosUnicos: new Set(),
        foliosCoinciden: new Map(),
      };
    }

    const headerActual = Object.values(datosActuales[0]);
    const headerComplementario = Object.values(datosComplementarios[0]);

    const colFolioActual = headerActual.indexOf("Folio");
    const colSubtotalActual = headerActual.indexOf("Subtotal");
    const colMonedaActual = headerActual.indexOf("Moneda");
    const colTipoCambioActual = headerActual.indexOf("Tipo Cambio");

    const colFolioComp = headerComplementario.indexOf("Folio");
    const colSubtotalComp = headerComplementario.indexOf("Subtotal");
    const colMonedaComp = headerComplementario.indexOf("Moneda");
    const colTipoCambioComp = headerComplementario.indexOf("Tipo Cambio");

    if (colFolioActual < 0 || colFolioComp < 0) {
      return {
        foliosUnicos: new Set(),
        foliosCoinciden: new Map(),
      };
    }

    const foliosComplementarios = new Map<
      string,
      { valores: unknown[]; subtotal: number }
    >();

    for (let i = 1; i < datosComplementarios.length; i++) {
      const fila = Object.values(datosComplementarios[i]);
      const folio = String(fila[colFolioComp] ?? "").trim();
      if (!folio) continue;

      let subtotal = 0;
      if (colSubtotalComp >= 0) {
        const bruto = Number.parseFloat(String(fila[colSubtotalComp] ?? 0));
        if (!Number.isNaN(bruto)) {
          subtotal = bruto;
          if (colMonedaComp >= 0 && colTipoCambioComp >= 0) {
            const moneda = String(fila[colMonedaComp] ?? "MXN");
            const tipoCambio = Number.parseFloat(
              String(fila[colTipoCambioComp] ?? 1)
            );
            if (!Number.isNaN(tipoCambio) && moneda !== "MXN") {
              subtotal = subtotal * (tipoCambio || 1);
            }
          }
        }
      }

      foliosComplementarios.set(folio, { valores: fila, subtotal });
    }

    const foliosUnicos = new Set<string>();
    const foliosCoinciden = new Map<string, boolean>();

    for (let i = 1; i < datosActuales.length; i++) {
      const fila = Object.values(datosActuales[i]);
      const folio = String(fila[colFolioActual] ?? "").trim();
      if (!folio) continue;

      if (!foliosComplementarios.has(folio)) {
        foliosUnicos.add(folio);
        continue;
      }

      const comp = foliosComplementarios.get(folio)!;
      let subtotal = 0;

      if (colSubtotalActual >= 0) {
        subtotal = Number.parseFloat(String(fila[colSubtotalActual] ?? 0));
        if (Number.isNaN(subtotal)) subtotal = 0;
      }

      if (colMonedaActual >= 0 && colTipoCambioActual >= 0) {
        const moneda = String(fila[colMonedaActual] ?? "MXN");
        const tipoCambio = Number.parseFloat(
          String(fila[colTipoCambioActual] ?? 1)
        );
        if (!Number.isNaN(tipoCambio) && moneda !== "MXN") {
          subtotal = subtotal * (tipoCambio || 1);
        }
      }

      const diferencia = Math.abs(subtotal - comp.subtotal);
      foliosCoinciden.set(folio, diferencia < 0.01);
    }

    return { foliosUnicos, foliosCoinciden };
  }, [
    comparacionActiva,
    reporteComplementario,
    reporte.datos,
    tieneDatos,
    usaTablaEspecializada,
  ]);

  const headers = useMemo(() => {
    if (!tieneDatos || !reporte.datos) return [];
    return Object.values(reporte.datos[0]).map((value) => String(value));
  }, [reporte.datos, tieneDatos]);

  const filas = useMemo(() => {
    if (!tieneDatos || !reporte.datos) return [];
    return reporte.datos.slice(1);
  }, [reporte.datos, tieneDatos]);

  const totalRegistros = filas.length;
  const ultimaActualizacion = formatFecha(
    reporte.fechaImportacion || reporte.fechaCreacion
  );

  const comparacionDisponible = Boolean(
    esReporteComparable && reporteComplementario
  );

  const comparacionStats = useMemo(() => {
    if (!comparacionDisponible || !comparacionActiva) return null;

    const coincidencias = Array.from(resultadoComparacion.foliosCoinciden);
    const coincidenciasOk = coincidencias.filter(([, match]) => match).length;
    const coincidenciasDiferentes = coincidencias.length - coincidenciasOk;

    return {
      foliosUnicos: resultadoComparacion.foliosUnicos.size,
      coincidenciasOk,
      coincidenciasDiferentes,
    };
  }, [comparacionDisponible, comparacionActiva, resultadoComparacion]);

  const accionesSugeridas = useMemo(() => {
    const acciones: string[] = [];

    if (!tieneDatos) {
      acciones.push(
        "Importa el archivo original para empezar a revisar los folios."
      );
    } else {
      acciones.push(
        "Revisa los totales y guarda cambios cuando estés conforme."
      );
    }

    if (comparacionDisponible && !comparacionActiva) {
      acciones.push(
        "Activa la sincronización con el Auxiliar para detectar diferencias al instante."
      );
    }

    if (comparacionDisponible && comparacionActiva) {
      acciones.push(
        "Valida los folios marcados antes de consolidar la información en base."
      );
    }

    if (onLimpiarDatos) {
      acciones.push(
        "Usa la opción ‘Limpiar datos’ si necesitas reiniciar la importación."
      );
    }

    return acciones.slice(0, 3);
  }, [comparacionDisponible, comparacionActiva, tieneDatos, onLimpiarDatos]);

  const estadoChipClasses = `inline-flex items-center gap-1 rounded-full border bg-white/70 px-2.5 py-0.5 text-xs font-semibold ${
    estado.color
  } ${estado.color.replace("text-", "border-")}`;
  const complementoNombre = reporteComplementario
    ? TIPOS_REPORTE_NOMBRES[reporteComplementario.tipo]
    : null;

  const toggleComparacion = () => {
    setComparacionActiva((prev) => !prev);
  };

  const handleGuardarTabla = useCallback(async () => {
    if (!tablaSaveContext) return;
    await tablaSaveContext.save();
  }, [tablaSaveContext]);

  const getRowClassName = (fila: Record<string, unknown>): string => {
    if (!comparacionActiva) return "hover:bg-gray-50";

    const header = reporte.datos?.[0];
    if (!header) return "hover:bg-gray-50";

    const colFolio = Object.values(header).indexOf("Folio");
    if (colFolio < 0) return "hover:bg-gray-50";

    const valores = Object.values(fila);
    const folio = String(valores[colFolio] ?? "").trim();
    if (!folio) return "hover:bg-gray-50";

    if (resultadoComparacion.foliosUnicos.has(folio)) {
      return "bg-yellow-100 hover:bg-yellow-200";
    }

    if (resultadoComparacion.foliosCoinciden.get(folio) === true) {
      return "bg-green-100 hover:bg-green-200";
    }

    if (resultadoComparacion.foliosCoinciden.get(folio) === false) {
      return "bg-red-100 hover:bg-red-200";
    }

    return "hover:bg-gray-50";
  };

  const handleLimpiarDatos = () => {
    setMostrarConfirmacion(false);
    onLimpiarDatos?.();
  };

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <header
        className={`${estado.bgColor} border-b border-gray-200 px-4 py-3`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="text-3xl" aria-hidden>
              {icono}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{nombre}</h2>
                <span className={estadoChipClasses}>
                  <span aria-hidden>{estado.icon}</span>
                  {estado.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span>{mesNombre}</span>
                <div className="flex items-center gap-2">
                  <span>Progreso</span>
                  <div className="h-1.5 w-24 rounded-full bg-white/80">
                    <div
                      className="h-1.5 rounded-full bg-blue-600"
                      style={{ width: `${progresoPorcentaje}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {progresoPorcentaje}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {tablaSaveContext && (
              <button
                onClick={handleGuardarTabla}
                disabled={
                  !tablaSaveContext.isDirty || tablaSaveContext.isSaving
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                  tablaSaveContext.isDirty && !tablaSaveContext.isSaving
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                title={
                  tablaSaveContext.isDirty
                    ? "Guardar los cambios pendientes"
                    : "No hay cambios por guardar"
                }
              >
                <Save className="h-4 w-4" aria-hidden />
                {tablaSaveContext.isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            {tieneDatos ? (
              <button
                onClick={onReimportarReporte}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition-colors hover:border-green-700 hover:text-green-800"
                title="Actualizar el archivo importado"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01-.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Actualizar archivo
              </button>
            ) : (
              <button
                onClick={onImportarReporte}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition-colors hover:border-green-700 hover:text-green-800"
                title="Importar el archivo Excel del reporte"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Importar archivo
              </button>
            )}
            {onLimpiarDatos && tieneDatos && (
              <button
                onClick={() => setMostrarConfirmacion(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                title="Eliminar todos los datos importados"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Limpiar datos
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 lg:px-6">
        <section className="min-w-0 space-y-4">
          {tieneDatos ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-semibold text-gray-700">
                    Registros importados:{" "}
                    {totalRegistros.toLocaleString("es-MX")}
                  </span>
                  <span>
                    Actualizado:{" "}
                    <span className="font-semibold text-gray-800">
                      {ultimaActualizacion}
                    </span>
                  </span>
                  {comparacionActiva &&
                    !usaTablaEspecializada &&
                    complementoNombre && (
                      <span className="text-xs text-blue-700">
                        Comparando contra {complementoNombre}.
                      </span>
                    )}
                </div>
                {comparacionDisponible && !usaTablaEspecializada && (
                  <button
                    onClick={toggleComparacion}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                      comparacionActiva
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    title={
                      comparacionActiva
                        ? "Detener el análisis de diferencias"
                        : `Analizar diferencias con ${complementoNombre}`
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {comparacionActiva
                      ? "Analizando diferencias"
                      : "Analizar diferencias"}
                  </button>
                )}
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white/80 p-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Resumen rápido
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-500">Estado</dt>
                      <dd className={estadoChipClasses}>
                        <span aria-hidden>{estado.icon}</span>
                        {estado.label}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-500">Registros</dt>
                      <dd className="font-semibold">
                        {totalRegistros.toLocaleString("es-MX")}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-500">Actualizado</dt>
                      <dd className="font-semibold text-gray-800">
                        {ultimaActualizacion}
                      </dd>
                    </div>
                    {complementoNombre && (
                      <div className="flex items-center justify-between">
                        <dt className="text-gray-500">Complemento</dt>
                        <dd className="text-right font-semibold text-gray-700">
                          {complementoNombre}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white/80 p-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Sincronización
                  </h3>
                  {comparacionDisponible ? (
                    comparacionActiva && comparacionStats ? (
                      <dl className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Folios únicos</dt>
                          <dd className="font-semibold text-yellow-700">
                            {comparacionStats.foliosUnicos}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Totales iguales</dt>
                          <dd className="font-semibold text-emerald-700">
                            {comparacionStats.coincidenciasOk}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-gray-500">Diferencias</dt>
                          <dd className="font-semibold text-red-600">
                            {comparacionStats.coincidenciasDiferentes}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-3 text-sm text-gray-600">
                        {comparacionActiva
                          ? "Obteniendo resultados de la comparación..."
                          : "Activa la sincronización para comparar con el Auxiliar."}
                      </p>
                    )
                  ) : (
                    <p className="mt-3 text-sm text-gray-600">
                      Este reporte no cuenta con un archivo auxiliar
                      complementario.
                    </p>
                  )}
                </div>

                {accionesSugeridas.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white/80 p-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Acciones sugeridas
                    </h3>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {accionesSugeridas.map((accion, index) => (
                        <li key={index} className="leading-snug">
                          {accion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {comparacionActiva && !usaTablaEspecializada && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold">
                      Leyenda de diferencias
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded border border-yellow-400 bg-yellow-300" />
                      <span>Folio único</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded border border-green-400 bg-green-300" />
                      <span>Subtotal igual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded border border-red-400 bg-red-300" />
                      <span>Subtotal diferente</span>
                    </div>
                  </div>
                </div>
              )}

              {reporte.tipo === "INGRESOS_AUXILIAR" ? (
                <div className="h-[1200px]">
                  <AuxiliarIngresosTable
                    mesId={mesId}
                    reporteId={reporte.id}
                    miAdminReporteId={miAdminReporte?.id}
                    showSaveButtonInToolbar={false}
                    onSaveContextChange={setTablaSaveContext}
                  />
                </div>
              ) : reporte.tipo === "INGRESOS_MI_ADMIN" ||
                reporte.tipo === "INGRESOS" ? (
                <div className="h-[1200px]">
                  <MiAdminIngresosTable
                    mesId={mesId}
                    reporteId={reporte.id}
                    auxiliarData={undefined}
                    auxiliarReporteId={auxiliarReporte?.id}
                    trabajoId={trabajoId}
                    anio={trabajoYear}
                    mes={mesNumber}
                    showSaveButtonInToolbar={false}
                    onSaveContextChange={setTablaSaveContext}
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div
                    className="overflow-auto"
                    style={{ maxHeight: "1200px" }}
                  >
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr>
                          {headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filas.map((fila, rowIndex) => (
                          <tr key={rowIndex} className={getRowClassName(fila)}>
                            {Object.values(fila).map((valor, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-3 py-2 whitespace-nowrap text-gray-900"
                              >
                                {valor !== null && valor !== undefined
                                  ? String(valor)
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span>
                      Total: {totalRegistros.toLocaleString("es-MX")} registro
                      {totalRegistros === 1 ? "" : "s"}
                      {comparacionActiva && (
                        <>
                          {" • "}
                          <span className="font-medium text-yellow-700">
                            {resultadoComparacion.foliosUnicos.size} únicos
                          </span>
                          {" • "}
                          <span className="font-medium text-green-700">
                            {
                              [
                                ...resultadoComparacion.foliosCoinciden.values(),
                              ].filter((match) => match).length
                            }{" "}
                            iguales
                          </span>
                          {" • "}
                          <span className="font-medium text-red-700">
                            {
                              [
                                ...resultadoComparacion.foliosCoinciden.values(),
                              ].filter((match) => match === false).length
                            }{" "}
                            diferentes
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {mostrarConfirmacion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-red-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          ¿Eliminar datos del reporte?
                        </h3>
                        <p className="mb-4 text-sm text-gray-600">
                          Esta acción eliminará todos los datos importados del
                          reporte <strong>{nombre}</strong>. El reporte volverá
                          al estado "Sin importar".
                        </p>
                        <p className="text-sm font-medium text-red-600">
                          Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setMostrarConfirmacion(false)}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleLimpiarDatos}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                      >
                        Sí, eliminar datos
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mb-3 text-5xl" aria-hidden>
                📥
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                {reporte.estado === "ERROR"
                  ? "Error al importar el reporte"
                  : "Reporte sin importar"}
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                {reporte.estado === "ERROR"
                  ? "Hubo un problema al procesar el archivo. Intenta importarlo nuevamente."
                  : "Importa un archivo Excel para comenzar a trabajar con este reporte."}
              </p>

              <button
                onClick={onImportarReporte}
                className="mx-auto inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Importar archivo
              </button>

              {reporte.estado === "ERROR" && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <strong>Error:</strong> Hubo un problema al procesar el
                  archivo.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
