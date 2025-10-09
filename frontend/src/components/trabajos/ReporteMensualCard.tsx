import React from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";

interface ReporteMensualCardProps {
  reporte: ReporteMensual;
  onVerReporte: () => void;
  onEditarReporte: () => void;
  onImportarReporte: () => void;
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

const getEstadoInfo = (
  reporte: ReporteMensual
): {
  label: string;
  color: string;
  icon: string;
  progreso: number;
} => {
  const tieneDatos = reporte.datos && reporte.datos.length > 0;

  switch (reporte.estado) {
    case "PROCESADO":
      return {
        label: "Completado",
        color: "text-green-600",
        icon: "✓",
        progreso: 100,
      };
    case "IMPORTADO":
      return {
        label: "Importado",
        color: "text-blue-600",
        icon: "✓",
        progreso: 80,
      };
    case "ERROR":
      return {
        label: "Error",
        color: "text-red-600",
        icon: "⚠️",
        progreso: 0,
      };
    default:
      return {
        label: tieneDatos ? "En proceso" : "Sin importar",
        color: tieneDatos ? "text-yellow-600" : "text-gray-500",
        icon: tieneDatos ? "⏳" : "○",
        progreso: tieneDatos ? 50 : 0,
      };
  }
};

const formatFecha = (fecha?: string): string => {
  if (!fecha) return "No disponible";
  const date = new Date(fecha);
  const ahora = new Date();
  const diff = ahora.getTime() - date.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;
  if (dias < 7) return `Hace ${dias} día${dias !== 1 ? "s" : ""}`;

  return date.toLocaleDateString("es-MX");
};

export const ReporteMensualCard: React.FC<ReporteMensualCardProps> = ({
  reporte,
  onVerReporte,
  onEditarReporte,
  onImportarReporte,
}) => {
  const estado = getEstadoInfo(reporte);
  const icono = getIconoReporte(reporte.tipo);
  const nombre = TIPOS_REPORTE_NOMBRES[reporte.tipo];
  const tieneDatos = reporte.datos && reporte.datos.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Info del reporte */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icono}</span>
            <h3 className="text-lg font-semibold text-gray-800">{nombre}</h3>
          </div>

          {/* Estado y última actualización */}
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`flex items-center gap-1 font-semibold ${estado.color}`}
            >
              {estado.icon} {estado.label}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">
              {formatFecha(reporte.fechaImportacion || reporte.fechaCreacion)}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all ${
                  estado.progreso === 100
                    ? "bg-green-600"
                    : estado.progreso > 0
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
                style={{ width: `${estado.progreso}%` }}
              />
            </div>
          </div>

          {/* Información adicional */}
          {tieneDatos && (
            <p className="text-xs text-gray-600 mt-1">
              📊 {reporte.datos.length} registro
              {reporte.datos.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 ml-4">
          {tieneDatos ? (
            <>
              <button
                onClick={onVerReporte}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                title="Ver reporte"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                Ver
              </button>
              <button
                onClick={onEditarReporte}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                title="Editar reporte"
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
            </>
          ) : (
            <button
              onClick={onImportarReporte}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
              title="Importar reporte"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Importar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
