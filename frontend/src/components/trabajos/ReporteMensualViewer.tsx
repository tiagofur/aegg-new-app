import React, { useState } from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";

interface ReporteMensualViewerProps {
  reporte: ReporteMensual;
  mesNombre: string;
  onVerReporte: () => void;
  onEditarReporte: () => void;
  onImportarReporte: () => void;
  onReimportarReporte: () => void;
  onLimpiarDatos?: () => void;
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
        progreso: 0,
      };
    default:
      return {
        label: tieneDatos ? "En proceso" : "Sin importar",
        color: tieneDatos ? "text-yellow-600" : "text-gray-500",
        bgColor: tieneDatos ? "bg-yellow-50" : "bg-gray-50",
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

  if (minutos < 1) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;
  if (dias < 7) return `Hace ${dias} día${dias !== 1 ? "s" : ""}`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const ReporteMensualViewer: React.FC<ReporteMensualViewerProps> = ({
  reporte,
  mesNombre,
  onVerReporte,
  onEditarReporte,
  onImportarReporte,
  onReimportarReporte,
  onLimpiarDatos,
}) => {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const estado = getEstadoInfo(reporte);
  const icono = getIconoReporte(reporte.tipo);
  const nombre = TIPOS_REPORTE_NOMBRES[reporte.tipo];
  const tieneDatos = reporte.datos && reporte.datos.length > 0;

  const handleLimpiarDatos = () => {
    setMostrarConfirmacion(false);
    onLimpiarDatos?.();
  };

  return (
    <div
      className={`mt-4 bg-white rounded-lg border-2 border-gray-200 overflow-hidden`}
    >
      {/* Header del reporte */}
      <div className={`${estado.bgColor} border-b border-gray-200 px-6 py-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{icono}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {mesNombre} - {estado.label}
                </p>
              </div>
            </div>
          </div>

          {/* Estado visual */}
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-lg ${
                estado.color
              } bg-white border-2 ${estado.color.replace("text-", "border-")}`}
            >
              <span className="text-2xl">{estado.icon}</span>
              {estado.label}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
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
      </div>

      {/* Contenido del reporte */}
      <div className="px-6 py-5">
        {tieneDatos ? (
          <>
            {/* Información del reporte importado */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">
                  Registros importados
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {reporte.datos.length.toLocaleString("es-MX")}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">
                  Última actualización
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatFecha(
                    reporte.fechaImportacion || reporte.fechaCreacion
                  )}
                </p>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex gap-3">
              <button
                onClick={onVerReporte}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
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
                Ver Reporte
              </button>

              <button
                onClick={onReimportarReporte}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                title="Reimportar archivo Excel"
              >
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
                Reimportar
              </button>
            </div>

            {/* Acciones secundarias */}
            <div className="mt-3 pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={onEditarReporte}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Editar datos manualmente
              </button>

              {onLimpiarDatos && (
                <button
                  onClick={() => setMostrarConfirmacion(true)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2 transition-colors"
                  title="Eliminar todos los datos del reporte"
                >
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
                  Limpiar Datos
                </button>
              )}
            </div>

            {/* Diálogo de confirmación */}
            {mostrarConfirmacion && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¿Eliminar datos del reporte?
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Esta acción eliminará todos los datos importados del
                        reporte <strong>{nombre}</strong>. El reporte volverá al
                        estado "Sin importar" y deberás volver a importar el
                        archivo Excel.
                      </p>
                      <p className="text-sm text-red-600 font-medium">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setMostrarConfirmacion(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLimpiarDatos}
                      className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                      Sí, eliminar datos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Mensaje cuando no hay datos */}
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {reporte.estado === "ERROR"
                  ? "Error al importar el reporte"
                  : "Reporte sin importar"}
              </h3>
              <p className="text-gray-600 mb-6">
                {reporte.estado === "ERROR"
                  ? "Hubo un error al procesar el archivo. Intenta importarlo nuevamente."
                  : "Importa un archivo Excel para comenzar a trabajar con este reporte"}
              </p>

              <button
                onClick={onImportarReporte}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm hover:shadow-md mx-auto"
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
                Importar Reporte
              </button>
            </div>

            {/* Información adicional */}
            {reporte.estado === "ERROR" && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> Hubo un problema al procesar el
                  archivo
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
