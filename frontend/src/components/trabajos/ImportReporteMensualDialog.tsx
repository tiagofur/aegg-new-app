import React, { useState } from "react";
import { ReporteMensual, TIPOS_REPORTE_NOMBRES } from "../../types/trabajo";
import { reportesMensualesService } from "../../services";

interface ImportReporteMensualDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mesId: string;
  tipo: ReporteMensual["tipo"];
  mesNombre: string;
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

const getNombreArchivoEsperado = (tipo: ReporteMensual["tipo"]): string => {
  switch (tipo) {
    case "INGRESOS":
      return "ingresos.xlsx";
    case "INGRESOS_AUXILIAR":
      return "auxiliar-ingresos.xls";
    case "INGRESOS_MI_ADMIN":
      return "mi-admin-ingresos.xlsx";
    default:
      return "reporte.xlsx";
  }
};

export const ImportReporteMensualDialog: React.FC<
  ImportReporteMensualDialogProps
> = ({ isOpen, onClose, onSuccess, mesId, tipo, mesNombre }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nombreReporte = TIPOS_REPORTE_NOMBRES[tipo];
  const icono = getIconoReporte(tipo);
  const archivoEsperado = getNombreArchivoEsperado(tipo);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setError("Por favor selecciona un archivo Excel (.xlsx o .xls)");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await reportesMensualesService.importar({
        mesId,
        tipo,
        file,
      });

      alert(`✅ Reporte "${nombreReporte}" importado correctamente`);
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error al importar reporte:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error al importar el reporte";
      setError(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icono}</span>
              <div>
                <h2 className="text-2xl font-bold">Importar Reporte</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {nombreReporte} - {mesNombre}
                </p>
              </div>
            </div>
            {!importing && (
              <button
                onClick={handleClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Instrucciones
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-7">
              <li>• Selecciona el archivo Excel del reporte mensual</li>
              <li>• Archivo esperado: <code className="bg-blue-100 px-1 rounded">{archivoEsperado}</code></li>
              <li>• Formatos soportados: .xlsx, .xls</li>
              <li>• El sistema procesará automáticamente los datos</li>
            </ul>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Archivo Excel
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={importing}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${
                  importing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-700">
                        📄 {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      {!importing && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            setError(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-800 mt-2"
                        >
                          Cambiar archivo
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        Haz clic para seleccionar un archivo
                      </p>
                      <p className="text-xs text-gray-500">
                        o arrastra y suelta aquí
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={importing}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
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
                  Importar Reporte
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
