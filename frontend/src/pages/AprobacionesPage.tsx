import { RefreshCcw } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import {
  AprobacionesDashboard,
  useAprobacionesDashboard,
} from "../features/trabajos/aprobaciones";

export const AprobacionesPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error, filters, updateFilters, refetch } =
    useAprobacionesDashboard();

  return (
    <AppShell
      title="Aprobaciones"
      breadcrumbs={[
        { label: "Inicio", to: "/dashboard" },
        { label: "Trabajos", to: "/trabajos" },
        { label: "Aprobaciones" },
      ]}
      actions={
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Actualizar
        </button>
      }
      contentClassName="max-w-6xl"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          {user?.role === "Gestor"
            ? "Monitorea el estado de aprobación de tus trabajos, detecta cuellos de botella y prioriza las revisiones pendientes."
            : "Visualiza el estado de aprobación de los trabajos y coordina con los gestores responsables."}
        </div>
        <AprobacionesDashboard
          data={data}
          loading={loading}
          error={error}
          filters={filters}
          onChangeFilters={updateFilters}
          onRetry={refetch}
        />
      </div>
    </AppShell>
  );
};
