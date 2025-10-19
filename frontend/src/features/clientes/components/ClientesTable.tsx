import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, RefreshCcw, Search, Trash2, UserPlus2 } from "lucide-react";
import { clientesService } from "../../../services";
import { Cliente } from "../../../types";

interface ClientesTableProps {
  onRequestCreate: () => void;
  onRequestEdit: (cliente: Cliente) => void;
  refreshToken: number;
}

const DEFAULT_LIMIT = 10;

export const ClientesTable: React.FC<ClientesTableProps> = ({
  onRequestCreate,
  onRequestEdit,
  refreshToken,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (total === 0) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientesService.list({
        search: query || undefined,
        page,
        limit,
      });
      setClientes(response.data);
      setTotal(response.total);
      if (response.limit) {
        setLimit(response.limit);
      }
      if (response.page && response.page !== page) {
        setPage(response.page);
      }
    } catch (err: any) {
      console.error("Error al cargar clientes:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al cargar los clientes"
      );
      setClientes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, page, query]);

  useEffect(() => {
    void loadClientes();
  }, [loadClientes, refreshToken]);

  const handleSearch = () => {
    setPage(1);
    setQuery(searchTerm.trim());
  };

  const handleDelete = async (cliente: Cliente) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar al cliente "${cliente.nombre}"?`
    );
    if (!confirmed) return;

    try {
      await clientesService.remove(cliente.id);
      await loadClientes();
    } catch (err: any) {
      console.error("Error al eliminar cliente:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Error al eliminar el cliente"
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setQuery("");
    setPage(1);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Clientes</h2>
          <p className="text-sm text-slate-500">
            Gestiona el catálogo de clientes para asociar trabajos y reportes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <RefreshCcw className="h-4 w-4" />
            Restablecer
          </button>
          <button
            type="button"
            onClick={onRequestCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <UserPlus2 className="h-4 w-4" />
            Nuevo cliente
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nombre o RFC"
                className="w-full rounded-lg border border-slate-300 px-9 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Buscar
            </button>
          </div>
          <div className="text-sm text-slate-500">
            {total} cliente{total === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            Cargando clientes...
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
            <p>No hay clientes registrados con los filtros actuales.</p>
            <button
              type="button"
              onClick={onRequestCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <UserPlus2 className="h-4 w-4" />
              Crear cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">RFC</th>
                  <th className="px-4 py-3">Razón social</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {cliente.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cliente.rfc}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {cliente.razonSocial || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {cliente.updatedAt
                        ? new Date(cliente.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onRequestEdit(cliente)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <Edit3 className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cliente)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {clientes.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
          <div>
            Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                canGoPrev && setPage((prev) => Math.max(1, prev - 1))
              }
              disabled={!canGoPrev}
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => canGoNext && setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
