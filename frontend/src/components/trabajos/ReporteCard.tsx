import React, { useState, useRef, useEffect } from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";
import { reportesMensualesService } from "../../services";
import { ReporteViewer } from "./ReporteViewer";
import { AuxiliarIngresosTable } from "../../features/trabajos/reportes/auxiliar-ingresos";
import { MiAdminIngresosTable } from "../../features/trabajos/reportes/mi-admin-ingresos";
import { useAuxiliarIngresosData } from "../../features/trabajos/reportes/auxiliar-ingresos/hooks/useAuxiliarIngresosData";

interface ReporteCardProps {
  reporte: ReporteMensual;
  mesId: string;
  trabajoId: string;
  trabajoYear: number;
  mesNumber: number;
  /** ID del reporte Auxiliar del mismo mes (para integración en Mi Admin) */
  auxiliarReporteId?: string;
}

export const ReporteCard: React.FC<ReporteCardProps> = ({
  reporte,
  mesId,
  trabajoId,
  trabajoYear,
  mesNumber,
  auxiliarReporteId,
}) => {
  const [loading, setLoading] = useState(false);
  const [localReporte, setLocalReporte] = useState(reporte);
  const [verDatos, setVerDatos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localReporteVersion =
    localReporte.fechaImportacion ??
    localReporte.fechaProcesado ??
    localReporte.fechaCreacion;

  // **CRÍTICO**: Cuando mostramos Mi Admin, necesitamos cargar el Auxiliar del mismo mes
  // para poder hacer las integraciones (subtotalAUX, TC sugerido, comparación)
  // Cargar datos de Auxiliar si estamos en Mi Admin (para comparación e integración)
  const { data: auxiliarData } = useAuxiliarIngresosData({
    mesId: mesId,
    reporteId: auxiliarReporteId || "",
    enabled:
      (reporte.tipo === "INGRESOS_MI_ADMIN" || reporte.tipo === "INGRESOS") &&
      verDatos &&
      !!auxiliarReporteId,
  });

  // 🔥 DEBUG: Ver qué está pasando con auxiliarData
  useEffect(() => {
    if (
      verDatos &&
      (reporte.tipo === "INGRESOS_MI_ADMIN" || reporte.tipo === "INGRESOS")
    ) {
      console.log("🔍 ReporteCard DEBUG:", {
        reporteTipo: reporte.tipo,
        reporteId: reporte.id,
        auxiliarReporteId,
        auxiliarDataLength: auxiliarData?.length || 0,
        auxiliarDataSample: auxiliarData?.slice(0, 2),
      });
    }
  }, [verDatos, reporte.tipo, reporte.id, auxiliarReporteId, auxiliarData]);

  const tieneDatos =
    localReporte.datos && Object.keys(localReporte.datos).length > 0;

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Por favor selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    setLoading(true);
    try {
      const updated = await reportesMensualesService.importar({
        mesId,
        tipo: reporte.tipo,
        file,
      });
      setLocalReporte(updated);
      alert("Archivo importado correctamente");
    } catch (error: any) {
      console.error("Error al importar:", error);
      alert(error.response?.data?.message || "Error al importar el archivo");
    } finally {
      setLoading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getEstadoIcon = () => {
    switch (localReporte.estado) {
      case "PROCESADO":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "IMPORTADO":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "ERROR":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getEstadoColor = () => {
    switch (localReporte.estado) {
      case "PROCESADO":
        return "bg-green-100 text-green-800";
      case "IMPORTADO":
        return "bg-yellow-100 text-yellow-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {getEstadoIcon()}
            <h4 className="font-semibold text-gray-800">
              {TIPOS_REPORTE_NOMBRES[reporte.tipo]}
            </h4>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoColor()}`}
          >
            {localReporte.estado.replace("_", " ")}
          </span>
        </div>

        {localReporte.archivoOriginal && (
          <p className="text-xs text-gray-600 mb-3">
            📄 {localReporte.archivoOriginal}
          </p>
        )}

        {localReporte.fechaImportacion && (
          <p className="text-xs text-gray-500 mb-3">
            Importado:{" "}
            {new Date(localReporte.fechaImportacion).toLocaleString("es-ES")}
          </p>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            id={`file-input-${reporte.id}`}
            type="file"
            onChange={handleFileUpload}
            disabled={loading || localReporte.estado === "PROCESADO"}
          />
          <label htmlFor={`file-input-${reporte.id}`} className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || localReporte.estado === "PROCESADO"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
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
                  Importando...
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
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {localReporte.estado === "SIN_IMPORTAR"
                    ? "Importar"
                    : "Re-importar"}
                </>
              )}
            </button>
          </label>

          {tieneDatos && (
            <button
              onClick={() => setVerDatos(!verDatos)}
              className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
              {verDatos ? "Ocultar" : "Ver"}
            </button>
          )}
        </div>
      </div>

      {/* Visualización de datos */}
      {verDatos && tieneDatos && (
        <div className="border-t border-gray-200 p-4">
          {(() => {
            console.log("🔍 ReporteCard - Tipo de reporte:", reporte.tipo);
            console.log("🔍 ReporteCard - Comparación:", {
              tipo: reporte.tipo,
              esAuxiliar: reporte.tipo === "INGRESOS_AUXILIAR",
              esMiAdmin: reporte.tipo === "INGRESOS_MI_ADMIN",
            });
            return null;
          })()}
          {reporte.tipo === "INGRESOS_AUXILIAR" ? (
            <div className="h-[600px]">
              <AuxiliarIngresosTable
                mesId={mesId}
                reporteId={localReporte.id}
                reporteVersion={localReporteVersion}
              />
            </div>
          ) : reporte.tipo === "INGRESOS_MI_ADMIN" ||
            reporte.tipo === "INGRESOS" ? (
            <div className="h-[600px]">
              <MiAdminIngresosTable
                mesId={mesId}
                reporteId={localReporte.id}
                reporteVersion={localReporteVersion}
                auxiliarData={auxiliarData}
                trabajoId={trabajoId}
                anio={trabajoYear}
                mes={mesNumber}
              />
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2 text-sm">
                <strong>⚠️ DEBUG:</strong> Tipo de reporte "{reporte.tipo}" -
                Usando ReporteViewer genérico
              </div>
              <ReporteViewer
                hojas={[
                  {
                    nombre:
                      TIPOS_REPORTE_NOMBRES[
                        reporte.tipo as keyof typeof TIPOS_REPORTE_NOMBRES
                      ] || reporte.tipo,
                    datos: localReporte.datos as any[][],
                  },
                ]}
                titulo={`Datos de ${
                  TIPOS_REPORTE_NOMBRES[
                    reporte.tipo as keyof typeof TIPOS_REPORTE_NOMBRES
                  ] || reporte.tipo
                }`}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
