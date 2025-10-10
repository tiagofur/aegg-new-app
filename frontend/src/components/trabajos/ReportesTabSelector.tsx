import React from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";

interface ReportesTabSelectorProps {
  reportes: ReporteMensual[];
  reporteSeleccionado?: string; // ID del reporte seleccionado
  onReporteClick: (reporte: ReporteMensual) => void;
}

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

const getEstadoVisual = (
  reporte: ReporteMensual
): {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} => {
  const tieneDatos = reporte.datos && reporte.datos.length > 0;

  switch (reporte.estado) {
    case "PROCESADO":
      return {
        icon: "✓",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-400",
      };
    case "IMPORTADO":
      return {
        icon: "✓",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-400",
      };
    case "ERROR":
      return {
        icon: "⚠️",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-400",
      };
    default:
      return {
        icon: tieneDatos ? "⏳" : "○",
        bgColor: tieneDatos ? "bg-yellow-100" : "bg-gray-100",
        textColor: tieneDatos ? "text-yellow-800" : "text-gray-600",
        borderColor: tieneDatos ? "border-yellow-400" : "border-gray-300",
      };
  }
};

// Orden fijo de los tipos de reportes
const ORDEN_TIPOS: ReporteMensual["tipo"][] = [
  "INGRESOS_MI_ADMIN",
  "INGRESOS_AUXILIAR",
  "INGRESOS",
];

export const ReportesTabSelector: React.FC<ReportesTabSelectorProps> = ({
  reportes,
  reporteSeleccionado,
  onReporteClick,
}) => {
  // Ordenar reportes según el orden definido
  const reportesOrdenados = [...reportes].sort((a, b) => {
    return ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo);
  });

  // Calcular progreso
  const reportesConDatos = reportes.filter(
    (r) => r.datos && r.datos.length > 0
  ).length;
  const totalReportes = reportes.length;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          📊 Reportes Mensuales
        </h3>
        <span
          className={`text-sm font-semibold ${
            reportesConDatos === totalReportes
              ? "text-green-600"
              : reportesConDatos > 0
              ? "text-yellow-600"
              : "text-gray-600"
          }`}
        >
          {reportesConDatos}/{totalReportes} reportes
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {reportesOrdenados.map((reporte) => {
          const estado = getEstadoVisual(reporte);
          const isSelected = reporte.id === reporteSeleccionado;
          const icono = getIconoReporte(reporte.tipo);
          const nombre = TIPOS_REPORTE_NOMBRES[reporte.tipo];

          return (
            <button
              key={reporte.id}
              onClick={() => onReporteClick(reporte)}
              className={`
                relative px-4 py-3 rounded-lg text-sm font-semibold
                transition-all duration-200 border-2
                ${estado.bgColor} ${estado.textColor}
                ${
                  isSelected
                    ? `${estado.borderColor} ring-2 ring-offset-1 ring-blue-500 scale-105`
                    : "border-transparent hover:scale-105 hover:shadow-md"
                }
              `}
              title={`${nombre} - ${reporte.estado.replace("_", " ")}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{icono}</span>
                <span className="text-xs font-medium text-center leading-tight">
                  {nombre}
                </span>
                <span className="text-lg">{estado.icon}</span>
              </div>

              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-bold">✓</span>
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-600 font-bold">⏳</span>
          <span>En proceso</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold">○</span>
          <span>Sin importar</span>
        </div>
      </div>
    </div>
  );
};
