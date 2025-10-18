import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  TrabajosList,
  TrabajoDetail,
  CreateTrabajoDialog,
  CreateMesDialog,
} from "../components/trabajos";
import { trabajosService } from "../services";
import { Trabajo } from "../types/trabajo";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/layout/AppShell";

export const TrabajosPage: React.FC = () => {
  const { trabajoId } = useParams<{ trabajoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [createTrabajoOpen, setCreateTrabajoOpen] = useState(false);
  const [createMesOpen, setCreateMesOpen] = useState(false);

  console.log(
    "🟢 TrabajosPage montado - trabajoId:",
    trabajoId,
    "- path:",
    location.pathname
  );

  useEffect(() => {
    loadTrabajos();
  }, []);

  // Cargar el trabajo específico si viene trabajoId en la URL
  useEffect(() => {
    if (!trabajoId || trabajos.length === 0) {
      return;
    }

    const expectedPath = `/trabajos/${trabajoId}`;
    if (location.pathname !== expectedPath) {
      return;
    }

    const trabajo = trabajos.find((t) => t.id === trabajoId);
    if (!trabajo) {
      return;
    }

    const cargarDetalle = async () => {
      try {
        const detailed = await trabajosService.getOne(trabajo.id);
        setSelectedTrabajo(detailed);
      } catch (error) {
        console.error("Error al cargar detalle:", error);
        alert("Error al cargar el detalle del trabajo");
      }
    };

    cargarDetalle();
  }, [trabajoId, trabajos, location.pathname]);

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
      navigate(`/trabajos/${trabajo.id}`);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      alert("Error al cargar el detalle del trabajo");
    }
  };

  const handleBackToList = () => {
    setSelectedTrabajo(null);
    navigate("/trabajos");
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

  const breadcrumbs = [
    { label: "Inicio", to: "/dashboard" },
    { label: "Trabajos" },
  ];

  return (
    <AppShell
      title={selectedTrabajo ? "" : "Trabajos"}
      breadcrumbs={selectedTrabajo ? [] : breadcrumbs}
      fullWidth={!!selectedTrabajo}
      contentClassName={selectedTrabajo ? "max-w-6xl" : undefined}
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
      </div>

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
    </AppShell>
  );
};
