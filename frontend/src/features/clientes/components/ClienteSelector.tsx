import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { clientesService } from "../../../services";
import { Cliente } from "../../../types";
import { useClienteSearch } from "../hooks/useClienteSearch";

export interface ClienteSelectorHandle {
  refresh: () => void;
  loadCliente: (id: string) => Promise<Cliente | null>;
}

export interface ClienteSelectorProps {
  value?: string;
  onChange: (clienteId: string | null, cliente: Cliente | null) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  allowEmptyOption?: boolean;
  emptyOptionLabel?: string;
  placeholderOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  error?: string | null;
  className?: string;
  limit?: number;
  debounceMs?: number;
  onClienteLoaded?: (cliente: Cliente | null) => void;
}

const DEFAULT_EMPTY_OPTION = "Sin cliente asignado";

export const ClienteSelector = forwardRef<
  ClienteSelectorHandle,
  ClienteSelectorProps
>((props, ref) => {
  const {
    value,
    onChange,
    label,
    helperText,
    placeholder = "Buscar por nombre o RFC",
    allowEmptyOption = false,
    emptyOptionLabel = DEFAULT_EMPTY_OPTION,
    placeholderOptionLabel = "Selecciona un cliente",
    disabled = false,
    required = false,
    autoFocus = false,
    error = null,
    className,
    limit = 20,
    debounceMs,
    onClienteLoaded,
  } = props;

  const {
    clientes,
    error: searchError,
    loading,
    search,
    setSearch,
    refresh,
  } = useClienteSearch({ initialSearch: "", limit, debounceMs });

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [ensureLoading, setEnsureLoading] = useState(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);
  const resolvedCache = useRef<Map<string, Cliente>>(new Map());

  const effectiveError = error || ensureError || searchError;

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value;
    if (!nextId) {
      setSelectedCliente(null);
      onChange(null, null);
      onClienteLoaded?.(null);
      return;
    }

    const cliente = clientes.find((item) => item.id === nextId);
    if (cliente) {
      resolvedCache.current.set(cliente.id, cliente);
      setSelectedCliente(cliente);
      onChange(cliente.id, cliente);
      onClienteLoaded?.(cliente);
      return;
    }

    setEnsureLoading(true);
    setEnsureError(null);
    void clientesService
      .getOne(nextId)
      .then((found) => {
        resolvedCache.current.set(found.id, found);
        setSelectedCliente(found);
        onChange(found.id, found);
        onClienteLoaded?.(found);
      })
      .catch((err: any) => {
        console.error("Error al cargar cliente seleccionado:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Error al cargar el cliente seleccionado";
        setEnsureError(message);
        setSelectedCliente(null);
        onChange(nextId, null);
        onClienteLoaded?.(null);
      })
      .finally(() => {
        setEnsureLoading(false);
      });
  };

  useEffect(() => {
    if (!value) {
      setSelectedCliente(null);
      onClienteLoaded?.(null);
      return;
    }

    if (selectedCliente && selectedCliente.id === value) {
      return;
    }

    const cached = resolvedCache.current.get(value);
    if (cached) {
      setSelectedCliente(cached);
      onClienteLoaded?.(cached);
      return;
    }

    const match = clientes.find((cliente) => cliente.id === value);
    if (match) {
      resolvedCache.current.set(match.id, match);
      setSelectedCliente(match);
      onClienteLoaded?.(match);
      return;
    }

    setEnsureLoading(true);
    setEnsureError(null);

    let active = true;
    void clientesService
      .getOne(value)
      .then((found) => {
        if (!active) return;
        resolvedCache.current.set(found.id, found);
        setSelectedCliente(found);
        onClienteLoaded?.(found);
      })
      .catch((err: any) => {
        if (!active) return;
        console.error("Error al obtener cliente:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar el cliente seleccionado";
        setEnsureError(message);
        setSelectedCliente(null);
        onClienteLoaded?.(null);
      })
      .finally(() => {
        if (active) {
          setEnsureLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clientes, onClienteLoaded, selectedCliente, value]);

  useImperativeHandle(
    ref,
    () => ({
      refresh,
      loadCliente: async (id: string) => {
        if (!id) {
          return null;
        }

        const cached = resolvedCache.current.get(id);
        if (cached) {
          return cached;
        }

        try {
          const cliente = await clientesService.getOne(id);
          resolvedCache.current.set(cliente.id, cliente);
          return cliente;
        } catch (err) {
          console.error("Error al cargar cliente:", err);
          return null;
        }
      },
    }),
    [refresh]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const options = useMemo(
    () =>
      clientes.map((cliente) => (
        <option key={cliente.id} value={cliente.id}>
          {cliente.nombre} ({cliente.rfc})
        </option>
      )),
    [clientes]
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => refresh()}
          disabled={disabled || loading}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      <select
        value={value ?? ""}
        onChange={handleSelectChange}
        disabled={disabled}
        required={required && !allowEmptyOption}
        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {!allowEmptyOption && (
          <option value="" disabled>
            {placeholderOptionLabel}
          </option>
        )}
        {allowEmptyOption && <option value="">{emptyOptionLabel}</option>}
        {options}
      </select>

      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}

      {effectiveError && (
        <p className="mt-2 text-sm text-red-600">{effectiveError}</p>
      )}

      {ensureLoading && (
        <p className="mt-2 text-xs text-gray-500">
          Cargando cliente seleccionado...
        </p>
      )}

      {selectedCliente && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
          <p className="font-semibold">{selectedCliente.nombre}</p>
          <p>RFC: {selectedCliente.rfc}</p>
          {selectedCliente.razonSocial && (
            <p>Razón social: {selectedCliente.razonSocial}</p>
          )}
        </div>
      )}
    </div>
  );
});

ClienteSelector.displayName = "ClienteSelector";
