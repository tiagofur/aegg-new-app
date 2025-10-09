import React from "react";
import { Mes, MESES_NOMBRES } from "../../types/trabajo";
import { ReporteMensualCard } from "./ReporteMensualCard";

interface ReportesMensualesListProps {
  mes: Mes;
  onVerReporte: (reporteId: string, tipo: string) => void;
  onEditarReporte: (reporteId: string, tipo: string) => void;
  onImportarReporte: (mesId: string, tipo: string) => void;
}

export const ReportesMensualesList: React.FC<ReportesMensualesListProps> = ({
  mes,
  onVerReporte,
  onEditarReporte,
  onImportarReporte,
}) => {
  const mesNombre = MESES_NOMBRES[mes.mes - 1];
  const reportes = mes.reportes || [];

  // Calcular progreso: cuántos reportes tienen datos
  const reportesConDatos = reportes.filter(
    (r) => r.datos && r.datos.length > 0
  ).length;
  const progresoTotal = reportes.length > 0 ? reportesConDatos : 0;
  const totalReportes = reportes.length;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            📊 Reportes de {mesNombre}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona todos los reportes mensuales de este período
          </p>
        </div>

        {/* Indicador de progreso */}
        <div className="text-right">
          <span
            className={`text-2xl font-bold ${
              progresoTotal === totalReportes
                ? "text-green-600"
                : progresoTotal > 0
                ? "text-yellow-600"
                : "text-gray-500"
            }`}
          >
            {progresoTotal}/{totalReportes}
          </span>
          <p className="text-xs text-gray-600">Reportes completados</p>
        </div>
      </div>

      {/* Lista de reportes */}
      {reportes.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">
            No hay reportes disponibles para este mes
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Los reportes se crean automáticamente al seleccionar el mes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((reporte) => (
            <ReporteMensualCard
              key={reporte.id}
              reporte={reporte}
              onVerReporte={() => onVerReporte(reporte.id, reporte.tipo)}
              onEditarReporte={() => onEditarReporte(reporte.id, reporte.tipo)}
              onImportarReporte={() => onImportarReporte(mes.id, reporte.tipo)}
            />
          ))}
        </div>
      )}

      {/* Acciones rápidas del mes */}
      <div className="mt-4 pt-4 border-t border-gray-300 flex gap-2">
        <button
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => alert("Funcionalidad de copiar mes en desarrollo")}
          title="Copiar datos del mes anterior"
        >
          📋 Copiar del mes anterior
        </button>
        <button
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => alert("Funcionalidad de exportar mes en desarrollo")}
          title="Exportar todos los reportes del mes"
        >
          ⬇️ Exportar mes completo
        </button>
      </div>
    </div>
  );
};
