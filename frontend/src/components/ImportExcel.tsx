import React, { useState } from "react";
import { FileUpload } from "./FileUpload";
import { reportesApi, ImportExcelResponse } from "../services/api";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";

interface ImportExcelProps {
  trabajoId: string;
  reporteId: string;
  reporteTipo: string;
  onSuccess?: (response: ImportExcelResponse) => void;
  onError?: (error: Error) => void;
}

export const ImportExcel: React.FC<ImportExcelProps> = ({
  trabajoId,
  reporteId,
  reporteTipo,
  onSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportExcelResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const response = await reportesApi.importExcel(
        trabajoId,
        reporteId,
        selectedFile
      );
      setUploadResult(response);

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error al importar el archivo";
      setError(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
  };

  const isMultiSheet = reporteTipo === "mensual";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Importar Excel
        </h3>
        <p className="text-sm text-gray-600">
          {isMultiSheet
            ? "Este reporte soporta múltiples hojas. Todas las hojas del archivo serán importadas."
            : "Solo se importará la primera hoja del archivo Excel."}
        </p>
      </div>

      {!uploadResult && (
        <>
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".xlsx,.xls"
            maxSize={10}
            disabled={uploading}
          />

          {selectedFile && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Importar Archivo
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Error al importar
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </>
      )}

      {uploadResult && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {uploadResult.mensaje}
              </p>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">
                Detalles de la importación
              </h4>
            </div>

            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Tipo de reporte:</dt>
                <dd className="font-medium text-gray-900">
                  {uploadResult.detalles.tipo}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Archivo:</dt>
                <dd className="font-medium text-gray-900">
                  {uploadResult.detalles.nombreArchivo}
                </dd>
              </div>

              {uploadResult.detalles.hojas && (
                <div className="text-sm">
                  <dt className="text-gray-600 mb-1">Hojas importadas:</dt>
                  <dd className="flex flex-wrap gap-2">
                    {uploadResult.detalles.hojas.map((hoja, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                      >
                        {hoja}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {uploadResult.detalles.totalFilas !== undefined && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Total de filas:</dt>
                  <dd className="font-medium text-gray-900">
                    {uploadResult.detalles.totalFilas}
                  </dd>
                </div>
              )}

              {uploadResult.detalles.totalColumnas !== undefined && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Total de columnas:</dt>
                  <dd className="font-medium text-gray-900">
                    {uploadResult.detalles.totalColumnas}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
};
