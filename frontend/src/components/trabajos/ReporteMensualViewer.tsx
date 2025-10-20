import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, GitCompare, Save, XCircle } from "lucide-react";
import {
  AuxiliarIngresosTable,
  type TotalesComparison,
} from "../../features/trabajos/reportes/auxiliar-ingresos";
import { MiAdminIngresosTable } from "../../features/trabajos/reportes/mi-admin-ingresos";
import { GuardarEnBaseButton } from "../../features/trabajos/reportes/reporte-anual";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";
import type { MiAdminIngresosTotales } from "../../features/trabajos/reportes/mi-admin-ingresos";

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
  canManage: boolean;
};

type ComparacionResultado = {
  foliosUnicos: Set<string>;
  foliosCoinciden: Map<string, boolean>;
};

type GuardarEnBaseContext = {
  trabajoId: string;
  anio: number;
  mes: number;
  totalMiAdmin: number;
  totalAuxiliar: number | null;
  hasAuxiliarData: boolean;
  isDirty: boolean;
};

type SummaryItem = {
  label: string;
  value: string;
  tone?: string;
};

type MiAdminAutomationActions = {
  aplicarTCSugeridoATodos: () => void;
  cancelarFoliosUnicos: () => void;
  isSaving: boolean;
  isComparisonActive: boolean;
  hasAuxiliarData: boolean;
};

type AuxiliarResumenState = {
  cantidadCanceladas: number;
  porcentajeCanceladas: number;
  totalesComparison: TotalesComparison | null;
  isDirty: boolean;
  hasMiAdminData: boolean;
};

type AuxiliarSpecialActions = {
  cancelarFoliosUnicos: () => void;
  isSaving: boolean;
  isComparisonActive: boolean;
  hasMiAdminData: boolean;
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

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

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
  canManage,
}) => {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [comparacionActiva, setComparacionActiva] = useState(false);
  const [tablaSaveContext, setTablaSaveContext] = useState<{
    save: () => Promise<void>;
    isDirty: boolean;
    isSaving: boolean;
  } | null>(null);
  const [guardarEnBaseContext, setGuardarEnBaseContext] =
    useState<GuardarEnBaseContext | null>(null);
  const [miAdminResumen, setMiAdminResumen] =
    useState<MiAdminIngresosTotales | null>(null);
  const [miAdminAutomationActions, setMiAdminAutomationActions] =
    useState<MiAdminAutomationActions | null>(null);
  const [auxiliarResumen, setAuxiliarResumen] =
    useState<AuxiliarResumenState | null>(null);
  const [auxiliarSpecialActions, setAuxiliarSpecialActions] =
    useState<AuxiliarSpecialActions | null>(null);

  const estado = getEstadoInfo(reporte);
  const icono = getIconoReporte(reporte.tipo);
  const nombre = TIPOS_REPORTE_NOMBRES[reporte.tipo];
  const tieneDatos = Boolean(reporte.datos && reporte.datos.length > 1);
  const progresoPorcentaje = Math.min(100, Math.max(0, estado.progreso));
  const reporteVersion =
    reporte.fechaImportacion ?? reporte.fechaProcesado ?? reporte.fechaCreacion;

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
      setGuardarEnBaseContext(null);
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

  const auxiliarReporteVersion = auxiliarReporte
    ? auxiliarReporte.fechaImportacion ??
      auxiliarReporte.fechaProcesado ??
      auxiliarReporte.fechaCreacion
    : undefined;

  const miAdminReporteVersion = miAdminReporte
    ? miAdminReporte.fechaImportacion ??
      miAdminReporte.fechaProcesado ??
      miAdminReporte.fechaCreacion
    : undefined;

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
  useEffect(() => {
    if (!comparacionDisponible && comparacionActiva) {
      setComparacionActiva(false);
    }
  }, [comparacionDisponible, comparacionActiva]);

  useEffect(() => {
    if (reporte.tipo !== "INGRESOS_MI_ADMIN") {
      setMiAdminResumen(null);
      setMiAdminAutomationActions(null);
    }
  }, [reporte.tipo]);

  useEffect(() => {
    if (reporte.tipo !== "INGRESOS_AUXILIAR") {
      setAuxiliarResumen(null);
      setAuxiliarSpecialActions(null);
    }
  }, [reporte.tipo]);

  const resumenTotales = useMemo(() => {
    if (!guardarEnBaseContext || guardarEnBaseContext.totalAuxiliar === null) {
      return null;
    }

    const diferencia = Math.abs(
      guardarEnBaseContext.totalMiAdmin - guardarEnBaseContext.totalAuxiliar
    );

    return {
      totalMiAdmin: guardarEnBaseContext.totalMiAdmin,
      totalAuxiliar: guardarEnBaseContext.totalAuxiliar,
      diferencia,
      coincide: diferencia < 0.1,
    };
  }, [guardarEnBaseContext]);

  const estadoChipClasses = `inline-flex items-center gap-1 rounded-full border bg-white/70 px-2.5 py-0.5 text-xs font-semibold ${
    estado.color
  } ${estado.color.replace("text-", "border-")}`;
  const complementoNombre = reporteComplementario
    ? TIPOS_REPORTE_NOMBRES[reporteComplementario.tipo]
    : null;

  const summaryItems = useMemo<SummaryItem[]>(() => {
    const items: SummaryItem[] = [
      {
        label: "Registros importados",
        value: totalRegistros.toLocaleString("es-MX"),
        tone: "text-gray-900",
      },
      {
        label: "Actualizado",
        value: ultimaActualizacion,
        tone: "text-gray-800",
      },
    ];

    if (complementoNombre) {
      items.push({
        label: "Complemento",
        value: complementoNombre,
        tone: "text-gray-900",
      });
    }

    if (reporte.tipo === "INGRESOS_MI_ADMIN" && miAdminResumen) {
      items.push(
        {
          label: "Facturas",
          value: miAdminResumen.cantidadTotal.toLocaleString("es-MX"),
          tone: "text-gray-900",
        },
        {
          label: "Vigentes",
          value: miAdminResumen.cantidadVigentes.toLocaleString("es-MX"),
          tone: "text-gray-900",
        },
        {
          label: "Canceladas",
          value: miAdminResumen.cantidadCanceladas.toLocaleString("es-MX"),
          tone: "text-gray-900",
        }
      );
    }

    if (resumenTotales) {
      items.push(
        {
          label: "Subtotal Mi Admin",
          value: formatCurrency(resumenTotales.totalMiAdmin),
          tone: "text-gray-900",
        },
        {
          label: "Subtotal Auxiliar",
          value: formatCurrency(resumenTotales.totalAuxiliar),
          tone: "text-gray-900",
        },
        {
          label: "Diferencia",
          value: formatCurrency(resumenTotales.diferencia),
          tone: resumenTotales.coincide ? "text-emerald-600" : "text-rose-600",
        }
      );
    }

    if (comparacionDisponible && complementoNombre) {
      items.push({
        label: "Sincronización",
        value: comparacionActiva
          ? `Comparando con ${complementoNombre}`
          : `Disponible con ${complementoNombre}`,
        tone: comparacionActiva ? "text-purple-700" : "text-gray-700",
      });
    }

    return items;
  }, [
    totalRegistros,
    ultimaActualizacion,
    complementoNombre,
    reporte.tipo,
    miAdminResumen,
    resumenTotales,
    comparacionDisponible,
    comparacionActiva,
  ]);

  const toggleComparacion = useCallback(() => {
    if (!comparacionDisponible) {
      return;
    }
    setComparacionActiva((prev) => !prev);
  }, [comparacionDisponible]);

  const handleGuardarTabla = useCallback(async () => {
    if (!tablaSaveContext) return;
    await tablaSaveContext.save();
  }, [tablaSaveContext]);

  // Memoizar callbacks para evitar re-renders infinitos en las tablas hijas
  const handleSaveContextChange = useCallback(
    (
      context: {
        save: () => Promise<void>;
        isDirty: boolean;
        isSaving: boolean;
      } | null
    ) => {
      setTablaSaveContext(context);
    },
    []
  );

  const handleComparacionActiveChange = useCallback((active: boolean) => {
    setComparacionActiva(active);
  }, []);

  const handleGuardarEnBaseContextChange = useCallback(
    (context: GuardarEnBaseContext | null) => {
      setGuardarEnBaseContext(context);
    },
    []
  );

  const handleMiAdminTotalesResumenChange = useCallback(
    (totales: MiAdminIngresosTotales | null) => {
      setMiAdminResumen(totales);
    },
    []
  );

  const handleMiAdminAutomationActionsChange = useCallback(
    (actions: MiAdminAutomationActions | null) => {
      setMiAdminAutomationActions(actions);
    },
    []
  );

  const handleAuxiliarResumenChange = useCallback(
    (resumen: AuxiliarResumenState | null) => {
      setAuxiliarResumen(resumen);
    },
    []
  );

  const handleAuxiliarSpecialActionsChange = useCallback(
    (actions: AuxiliarSpecialActions | null) => {
      setAuxiliarSpecialActions(actions);
    },
    []
  );

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
            {canManage && guardarEnBaseContext && (
              <GuardarEnBaseButton {...guardarEnBaseContext} />
            )}
            {canManage && tablaSaveContext && (
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
            {canManage &&
              (tieneDatos ? (
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
              ))}
            {canManage && onLimpiarDatos && tieneDatos && (
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
              <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
                <div className="grid gap-4 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {item.label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          item.tone ?? "text-gray-900"
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {(comparacionDisponible ||
                  (reporte.tipo === "INGRESOS_MI_ADMIN" &&
                    miAdminAutomationActions) ||
                  (reporte.tipo === "INGRESOS_AUXILIAR" &&
                    auxiliarSpecialActions)) && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {comparacionDisponible && (
                        <button
                          onClick={toggleComparacion}
                          disabled={!comparacionDisponible}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 ${
                            !comparacionDisponible
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : comparacionActiva
                              ? "border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                          title={
                            comparacionDisponible
                              ? comparacionActiva
                                ? "Desactivar la sincronización entre reportes"
                                : complementoNombre
                                ? `Sincronizar con ${complementoNombre}`
                                : "Sincronizar con reporte complementario"
                              : "Importa ambos reportes para habilitar la sincronización"
                          }
                        >
                          <GitCompare className="h-4 w-4" aria-hidden />
                          {comparacionActiva
                            ? "Sincronización activa"
                            : "Sincronizar"}
                        </button>
                      )}

                      {reporte.tipo === "INGRESOS_MI_ADMIN" &&
                        miAdminAutomationActions && (
                          <>
                            <button
                              onClick={
                                miAdminAutomationActions.aplicarTCSugeridoATodos
                              }
                              disabled={
                                !miAdminAutomationActions.hasAuxiliarData ||
                                miAdminAutomationActions.isSaving
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                                miAdminAutomationActions.hasAuxiliarData &&
                                !miAdminAutomationActions.isSaving
                                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                              title={
                                miAdminAutomationActions.hasAuxiliarData
                                  ? "Aplicar el tipo de cambio sugerido a todas las filas"
                                  : "Importa el Auxiliar para habilitar el TC sugerido"
                              }
                            >
                              <ArrowDownCircle
                                className="h-4 w-4"
                                aria-hidden
                              />
                              Aplicar TC sugerido
                            </button>

                            <button
                              onClick={
                                miAdminAutomationActions.cancelarFoliosUnicos
                              }
                              disabled={
                                miAdminAutomationActions.isSaving ||
                                !miAdminAutomationActions.isComparisonActive
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 ${
                                !miAdminAutomationActions.isSaving &&
                                miAdminAutomationActions.isComparisonActive
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                              title={
                                miAdminAutomationActions.isComparisonActive
                                  ? "Quitar de Mi Admin los folios que no existen en Auxiliar"
                                  : "Activa la sincronización para habilitar la limpieza de folios"
                              }
                            >
                              <XCircle className="h-4 w-4" aria-hidden />
                              Quitar folios solo Mi Admin
                            </button>
                          </>
                        )}
                      {reporte.tipo === "INGRESOS_AUXILIAR" &&
                        auxiliarSpecialActions && (
                          <button
                            onClick={
                              auxiliarSpecialActions.cancelarFoliosUnicos
                            }
                            disabled={
                              auxiliarSpecialActions.isSaving ||
                              !auxiliarSpecialActions.isComparisonActive ||
                              !auxiliarSpecialActions.hasMiAdminData
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 ${
                              auxiliarSpecialActions.hasMiAdminData &&
                              auxiliarSpecialActions.isComparisonActive &&
                              !auxiliarSpecialActions.isSaving
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                            title={
                              auxiliarSpecialActions.isComparisonActive
                                ? "Quitar del Auxiliar los folios que no existen en Mi Admin"
                                : "Activa la sincronización para habilitar la limpieza de folios"
                            }
                          >
                            <XCircle className="h-4 w-4" aria-hidden />
                            Cancelar folios únicos
                          </button>
                        )}
                    </div>
                    {comparacionDisponible && complementoNombre && (
                      <span className="text-xs text-gray-500">
                        {comparacionActiva
                          ? `Analizando diferencias entre ${nombre} y ${complementoNombre}.`
                          : `Sincroniza con ${complementoNombre} para revisar diferencias.`}
                      </span>
                    )}
                  </div>
                )}

                {(resumenTotales ||
                  (reporte.tipo === "INGRESOS_MI_ADMIN" &&
                    miAdminResumen &&
                    miAdminResumen.cantidadCanceladas > 0) ||
                  (reporte.tipo === "INGRESOS_AUXILIAR" &&
                    auxiliarResumen &&
                    (auxiliarResumen.cantidadCanceladas > 0 ||
                      auxiliarResumen.totalesComparison))) && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex-1">
                      {resumenTotales ? (
                        resumenTotales.coincide ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                            Totales coinciden, puedes guardar el valor en el
                            reporte base anual.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                            Diferencia detectada, revisa antes de guardar en
                            base.
                          </span>
                        )
                      ) : reporte.tipo === "INGRESOS_AUXILIAR" &&
                        auxiliarResumen?.totalesComparison ? (
                        auxiliarResumen.totalesComparison.match ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                            Totales conciliados con Mi Admin.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                            Diferencia vs Mi Admin:{" "}
                            {formatCurrency(
                              auxiliarResumen.totalesComparison.difference
                            )}
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {reporte.tipo === "INGRESOS_MI_ADMIN" &&
                        miAdminResumen &&
                        miAdminResumen.cantidadCanceladas > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-600">
                            {miAdminResumen.cantidadCanceladas.toLocaleString(
                              "es-MX"
                            )}{" "}
                            canceladas
                          </span>
                        )}
                      {reporte.tipo === "INGRESOS_AUXILIAR" &&
                        auxiliarResumen &&
                        auxiliarResumen.cantidadCanceladas > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-600">
                            {auxiliarResumen.cantidadCanceladas.toLocaleString(
                              "es-MX"
                            )}{" "}
                            canceladas
                          </span>
                        )}
                      {resumenTotales && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
                            resumenTotales.coincide
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {resumenTotales.coincide
                            ? "Totales conciliados"
                            : "Diferencia detectada"}
                        </span>
                      )}
                      {reporte.tipo === "INGRESOS_AUXILIAR" &&
                        auxiliarResumen?.totalesComparison && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
                              auxiliarResumen.totalesComparison.match
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {auxiliarResumen.totalesComparison.match
                              ? "Totales conciliados"
                              : "Diferencia vs Mi Admin"}
                          </span>
                        )}
                    </div>
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
                    reporteVersion={reporteVersion}
                    miAdminReporteId={miAdminReporte?.id}
                    miAdminReporteVersion={miAdminReporteVersion}
                    showSaveButtonInToolbar={false}
                    showComparisonButtonInToolbar={false}
                    showStatusBadgesInToolbar={false}
                    showSpecialActionsInToolbar={false}
                    onSaveContextChange={handleSaveContextChange}
                    comparisonActive={comparacionActiva}
                    onComparisonActiveChange={handleComparacionActiveChange}
                    onResumenChange={handleAuxiliarResumenChange}
                    onSpecialActionsChange={handleAuxiliarSpecialActionsChange}
                  />
                </div>
              ) : reporte.tipo === "INGRESOS_MI_ADMIN" ||
                reporte.tipo === "INGRESOS" ? (
                <div className="h-[1200px]">
                  <MiAdminIngresosTable
                    mesId={mesId}
                    reporteId={reporte.id}
                    reporteVersion={reporteVersion}
                    auxiliarData={undefined}
                    auxiliarReporteId={auxiliarReporte?.id}
                    auxiliarReporteVersion={auxiliarReporteVersion}
                    trabajoId={trabajoId}
                    anio={trabajoYear}
                    mes={mesNumber}
                    showSaveButtonInToolbar={false}
                    showComparisonButtonInToolbar={
                      esReporteComparable ? false : true
                    }
                    showStatusBadgesInToolbar={
                      reporte.tipo === "INGRESOS_MI_ADMIN" ? false : true
                    }
                    onSaveContextChange={handleSaveContextChange}
                    onGuardarEnBaseContextChange={
                      handleGuardarEnBaseContextChange
                    }
                    onTotalesResumenChange={
                      reporte.tipo === "INGRESOS_MI_ADMIN"
                        ? handleMiAdminTotalesResumenChange
                        : undefined
                    }
                    onAutomationActionsChange={
                      reporte.tipo === "INGRESOS_MI_ADMIN"
                        ? handleMiAdminAutomationActionsChange
                        : undefined
                    }
                    comparisonActive={
                      esReporteComparable ? comparacionActiva : undefined
                    }
                    onComparisonActiveChange={
                      esReporteComparable
                        ? handleComparacionActiveChange
                        : undefined
                    }
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

              {canManage ? (
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
              ) : (
                <p className="text-sm text-gray-600">
                  Solicita a un gestor la importación del archivo para comenzar.
                </p>
              )}

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
