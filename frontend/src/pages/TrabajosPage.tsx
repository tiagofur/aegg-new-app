import React, { useState, useEffect } from "react";
import {
  TrabajosList,
  TrabajoDetail,
  CreateTrabajoDialog,
  CreateMesDialog,
} from "../components/trabajos";
import { trabajosService } from "../services";
import { Trabajo } from "../types/trabajo";
import { useAuth } from "../context/AuthContext";

export const TrabajosPage: React.FC = () => {
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [createTrabajoOpen, setCreateTrabajoOpen] = useState(false);
  const [createMesOpen, setCreateMesOpen] = useState(false);

  useEffect(() => {
    loadTrabajos();
  }, []);

  const loadTrabajos = async () => {
    try {
      setLoading(true);
      const data = await trabajosService.getAll();
      setTrabajos(data);
    } catch (error) {
      console.error("Error al cargar trabajos:", error);
      alert("Error al cargar los trabajos");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrabajo = async (trabajo: Trabajo) => {
    try {
      const detailed = await trabajosService.getOne(trabajo.id);
      setSelectedTrabajo(detailed);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      alert("Error al cargar el detalle del trabajo");
    }
  };

  const handleBackToList = () => {
    setSelectedTrabajo(null);
    loadTrabajos();
  };

  const handleReloadTrabajo = async () => {
    if (selectedTrabajo) {
      try {
        const detailed = await trabajosService.getOne(selectedTrabajo.id);
        setSelectedTrabajo(detailed);
      } catch (error) {
        console.error("Error al recargar detalle:", error);
        alert("Error al recargar el detalle del trabajo");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedTrabajo ? (
        <TrabajoDetail
          trabajo={selectedTrabajo}
          onAddMes={() => setCreateMesOpen(true)}
          onBack={handleBackToList}
          onReload={handleReloadTrabajo}
        />
      ) : (
        <TrabajosList
          trabajos={trabajos}
          onSelectTrabajo={handleSelectTrabajo}
          onCreateTrabajo={() => setCreateTrabajoOpen(true)}
        />
      )}

      {user && (
        <CreateTrabajoDialog
          open={createTrabajoOpen}
          onClose={() => setCreateTrabajoOpen(false)}
          onCreated={loadTrabajos}
          currentUserId={user.id}
        />
      )}

      {selectedTrabajo && (
        <CreateMesDialog
          open={createMesOpen}
          trabajoId={selectedTrabajo.id}
          onClose={() => setCreateMesOpen(false)}
          onCreated={() => handleSelectTrabajo(selectedTrabajo)}
          existingMeses={selectedTrabajo.meses.map((m) => m.mes)}
        />
      )}
    </>
  );
};
