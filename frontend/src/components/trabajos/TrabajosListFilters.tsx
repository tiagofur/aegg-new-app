import React, { useMemo } from "react";
import { EstadoAprobacion } from "../../types";
import { TrabajosFilters } from "../../features/trabajos/filters/useTrabajosFilters";

interface ClienteOption {
  value: string;
  label: string;
  count: number;
}

interface TrabajosListFiltersProps {
  filters: TrabajosFilters;
  onChange: (filters: Partial<TrabajosFilters>) => void;
  onReset: () => void;
  clienteOptions: ClienteOption[];
  estadoCounts: Record<EstadoAprobacion, number>;
}

const ESTADO_LABELS: Record<EstadoAprobacion, string> = {
  EN_PROGRESO: "En progreso",
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  REABIERTO: "Reabierto",
};

export const TrabajosListFilters: React.FC<TrabajosListFiltersProps> = ({
  filters,
  onChange,
  onReset,
  clienteOptions,
  estadoCounts,
}) => {
  const estadoOptions = useMemo(
    () =>
      (Object.keys(ESTADO_LABELS) as EstadoAprobacion[]).map((estado) => ({
        value: estado,
        label: ESTADO_LABELS[estado],
        count: estadoCounts[estado] ?? 0,
      })),
    [estadoCounts]
  );

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Filtros rápidos
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Limpiar filtros
        </button>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Buscar
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Cliente, RFC, asignado"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Año
          <input
            type="number"
            value={filters.year ?? ""}
            onChange={(event) =>
              onChange({
                year: event.target.value
                  ? Number.parseInt(event.target.value, 10)
                  : undefined,
              })
            }
            placeholder="Todos"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Cliente
          <select
            value={filters.clienteId ?? ""}
            onChange={(event) =>
              onChange({ clienteId: event.target.value || undefined })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Todos</option>
            {clienteOptions.map((cliente) => (
              <option key={cliente.value} value={cliente.value}>
                {cliente.label} {cliente.count ? `(${cliente.count})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Estado de aprobación
          <select
            value={filters.estado ?? ""}
            onChange={(event) =>
              onChange({
                estado: event.target.value
                  ? (event.target.value as EstadoAprobacion)
                  : undefined,
              })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Todos</option>
            {estadoOptions.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label} {estado.count ? `(${estado.count})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
