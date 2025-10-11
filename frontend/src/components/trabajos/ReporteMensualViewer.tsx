import React, { useState } from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";

interface ReporteMensualViewerProps {
  reporte: ReporteMensual;
  mesNombre: string;
  onVerReporte: () => void;
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
      className={`mt-3 bg-white rounded-lg border-2 border-gray-200 overflow-hidden`}
    >
      {/* Header del reporte - Más compacto */}
      <div className={`${estado.bgColor} border-b border-gray-200 px-4 py-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icono}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{nombre}</h2>
              <p className="text-xs text-gray-600">{mesNombre}</p>
            </div>
          </div>

          {/* Estado y botón Reimportar en línea */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${
                estado.color
              } bg-white border-2 ${estado.color.replace("text-", "border-")}`}
            >
              <span className="text-lg">{estado.icon}</span>
              {estado.label}
            </span>

            {tieneDatos && (
              <button
                onClick={onReimportarReporte}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-colors shadow-sm hover:shadow-md"
                title="Reimportar archivo Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
            )}
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="px-4 py-3">
        {tieneDatos ? (
          <>
            {/* Información del reporte importado - Más compacta */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Registros:</span>
                  <span className="text-lg font-bold text-gray-800">
                    {reporte.datos.length.toLocaleString("es-MX")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Actualizado:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatFecha(
                      reporte.fechaImportacion || reporte.fechaCreacion
                    )}
                  </span>
                </div>
              </div>

              {/* Acciones secundarias */}
              <div className="flex items-center gap-3">
                {onLimpiarDatos && (
                  <button
                    onClick={() => setMostrarConfirmacion(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1.5 transition-colors"
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
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Tabla completa de datos - Siempre visible */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: "600px" }}>
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {reporte.datos[0] &&
                        Object.keys(reporte.datos[0]).map((key, idx) => (
                          <th
                            key={idx}
                            className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r last:border-r-0 bg-gray-100"
                          >
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reporte.datos.map((fila: any, rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {Object.values(fila).map(
                          (valor: any, colIdx: number) => (
                            <td
                              key={colIdx}
                              className="px-3 py-2 whitespace-nowrap text-gray-900 border-r last:border-r-0"
                            >
                              {valor !== null && valor !== undefined
                                ? String(valor)
                                : "-"}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-600 flex items-center justify-between">
                <span>
                  Total: {reporte.datos.length.toLocaleString("es-MX")} registro
                  {reporte.datos.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={onVerReporte}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver en página completa →
                </button>
              </div>
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
            {/* Mensaje cuando no hay datos - Más compacto */}
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {reporte.estado === "ERROR"
                  ? "Error al importar el reporte"
                  : "Reporte sin importar"}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {reporte.estado === "ERROR"
                  ? "Hubo un error al procesar el archivo. Intenta importarlo nuevamente."
                  : "Importa un archivo Excel para comenzar a trabajar con este reporte"}
              </p>

              <button
                onClick={onImportarReporte}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm hover:shadow-md mx-auto"
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
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
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
