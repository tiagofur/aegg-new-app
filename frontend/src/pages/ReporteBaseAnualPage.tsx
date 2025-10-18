/**
 * Página: Visualización del Reporte Base Anual
 *
 * Muestra el reporte base anual importado en pantalla completa
 * con todas sus hojas en modo de solo lectura.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ReporteViewer } from "../components/trabajos/ReporteViewer";
import { trabajosService } from "../services/trabajos.service";
import type { Trabajo } from "../types/trabajo";

export const ReporteBaseAnualPage: React.FC = () => {
  const { trabajoId } = useParams<{ trabajoId: string }>();
  const navigate = useNavigate();
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarTrabajo = async () => {
      if (!trabajoId) {
        setError("ID de trabajo no especificado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await trabajosService.getOne(trabajoId);
        setTrabajo(data);

        // Verificar si tiene reporte base anual importado
        if (
          !data.reporteBaseAnual ||
          !data.reporteBaseAnual.hojas ||
          data.reporteBaseAnual.hojas.length === 0
        ) {
          setError(
            "El reporte base anual aún no ha sido importado. Por favor, importa el reporte desde la pantalla del trabajo."
          );
        }
      } catch (err: any) {
        console.error("Error al cargar trabajo:", err);
        setError(err.response?.data?.message || "Error al cargar el trabajo");
      } finally {
        setLoading(false);
      }
    };

    cargarTrabajo();
  }, [trabajoId]);

  // Validar parámetros
  if (!trabajoId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-xl mb-2">
            ⚠️ Parámetros inválidos
          </h2>
          <p className="text-red-600 mb-4">
            No se especificó el ID del trabajo.
          </p>
          <button
            onClick={() => navigate("/trabajos")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Volver a Trabajos
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AppShell
        title="Reporte Base Anual"
        breadcrumbs={[
          { label: "Inicio", to: "/dashboard" },
          { label: "Trabajos", to: "/trabajos" },
          { label: "Proyecto", to: `/trabajos/${trabajoId}` },
          { label: "Reporte Base Anual" },
        ]}
        fullWidth
        contentClassName="max-w-7xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Cargando reporte base anual...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !trabajo) {
    return (
      <AppShell
        title="Reporte Base Anual"
        breadcrumbs={[
          { label: "Inicio", to: "/dashboard" },
          { label: "Trabajos", to: "/trabajos" },
          { label: "Proyecto", to: `/trabajos/${trabajoId}` },
          { label: "Reporte Base Anual" },
        ]}
        fullWidth
        contentClassName="max-w-7xl"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-yellow-800 font-semibold text-lg mb-2">
                No hay reporte para mostrar
              </h3>
              <p className="text-yellow-700 mb-4">{error}</p>
              <button
                onClick={() => navigate(`/trabajos/${trabajoId}`)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Volver al Proyecto
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const hojas = trabajo.reporteBaseAnual?.hojas || [];
  const titulo = `Reporte Base Anual - ${trabajo.clienteNombre} ${trabajo.anio}`;

  return (
    <AppShell
      title="Reporte Base Anual"
      breadcrumbs={[
        { label: "Inicio", to: "/dashboard" },
        { label: "Trabajos", to: "/trabajos" },
        { label: trabajo.clienteNombre, to: `/trabajos/${trabajoId}` },
        { label: "Reporte Base Anual" },
      ]}
      fullWidth
      contentClassName="max-w-7xl"
    >
      <div className="space-y-4">
        {/* Header con información del trabajo */}
        <div className="bg-white rounded-lg shadow-md px-4 py-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                📊 {trabajo.clienteNombre} - {trabajo.anio}
              </h2>
              {trabajo.clienteRfc && (
                <p className="text-sm text-gray-600 mt-1">
                  RFC: {trabajo.clienteRfc}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/trabajos/${trabajoId}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Volver al Proyecto
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-700 font-medium">
                Vista de solo lectura
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Este reporte base anual se importó desde Excel y se muestra en
                modo de solo lectura. Para modificarlo, reimporta el archivo
                desde la pantalla del proyecto.
              </p>
            </div>
          </div>
        </div>

        {/* Visualizador del reporte */}
        <ReporteViewer hojas={hojas} titulo={titulo} />
      </div>
    </AppShell>
  );
};
