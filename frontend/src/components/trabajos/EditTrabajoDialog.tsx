import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Cliente,
  EstadoAprobacion,
  EstadoTrabajo,
  Trabajo,
  UpdateTrabajoDto,
  AppUser,
} from "../../types";
import { trabajosService } from "../../services";
import { usersApi } from "../../services/users";
import {
  ClienteSelector,
  ClienteSelectorHandle,
  ClienteFormModal,
} from "../../features/clientes";

interface EditTrabajoDialogProps {
  trabajo: Trabajo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const APROBACION_LABELS: Record<EstadoAprobacion, string> = {
  EN_PROGRESO: "En progreso",
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  REABIERTO: "Reabierto",
};

const ESTADO_LABELS: Record<EstadoTrabajo, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  COMPLETADO: "Completado",
};

export const EditTrabajoDialog: React.FC<EditTrabajoDialogProps> = ({
  trabajo,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [estado, setEstado] = useState<EstadoTrabajo>(trabajo.estado);
  const [estadoAprobacion, setEstadoAprobacion] = useState<EstadoAprobacion>(
    trabajo.estadoAprobacion
  );
  const [visibilidadEquipo, setVisibilidadEquipo] = useState<boolean>(
    trabajo.visibilidadEquipo
  );
  const [miembroAsignadoId, setMiembroAsignadoId] = useState<string>(
    trabajo.miembroAsignadoId || ""
  );
  const [gestorResponsableId, setGestorResponsableId] = useState<string>(
    trabajo.gestorResponsableId || ""
  );
  const [aprobadoPorId, setAprobadoPorId] = useState<string>(
    trabajo.aprobadoPorId || ""
  );
  const [selectedClienteId, setSelectedClienteId] = useState<string>(
    trabajo.clienteId || ""
  );
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(
    trabajo.cliente ?? null
  );
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteModalData, setClienteModalData] = useState<Cliente | null>(
    null
  );
  const selectorRef = useRef<ClienteSelectorHandle | null>(null);

  useEffect(() => {
    if (isOpen) {
      const nextClienteId = trabajo.clienteId || "";
      setEstado(trabajo.estado);
      setEstadoAprobacion(trabajo.estadoAprobacion);
      setVisibilidadEquipo(trabajo.visibilidadEquipo);
      setMiembroAsignadoId(trabajo.miembroAsignadoId || "");
      setGestorResponsableId(trabajo.gestorResponsableId || "");
      setAprobadoPorId(trabajo.aprobadoPorId || "");
      setSelectedClienteId(nextClienteId);
      setSelectedCliente(trabajo.cliente ?? null);
      setSelectorError(null);
      setClienteModalOpen(false);
      setClienteModalData(null);
      if (nextClienteId) {
        void selectorRef.current?.loadCliente(nextClienteId);
      }
      void loadUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, trabajo]);

  const loadUsuarios = async () => {
    setUsuariosLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setUsuariosLoading(false);
    }
  };

  const gestoresDisponibles = useMemo(() => {
    const getLabel = (usuario: AppUser) => usuario.name || usuario.email;
    return usuarios
      .filter(
        (usuario) => usuario.role === "Gestor" || usuario.role === "Admin"
      )
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
  }, [usuarios]);

  const miembrosDisponibles = useMemo(() => {
    const getLabel = (usuario: AppUser) => usuario.name || usuario.email;
    return usuarios
      .filter((usuario) => usuario.role === "Miembro")
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
  }, [usuarios]);

  useEffect(() => {
    if (gestoresDisponibles.length > 0) {
      const gestorActual = gestoresDisponibles.find(
        (usuario) => usuario.id === gestorResponsableId
      );
      if (!gestorActual) {
        setGestorResponsableId(gestoresDisponibles[0].id);
      }
    }

    if (miembroAsignadoId) {
      const miembroActualExiste = miembrosDisponibles.some(
        (usuario) => usuario.id === miembroAsignadoId
      );
      if (!miembroActualExiste) {
        setMiembroAsignadoId("");
      }
    }
  }, [
    gestoresDisponibles,
    miembrosDisponibles,
    gestorResponsableId,
    miembroAsignadoId,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClienteId && !trabajo.clienteId) {
      setSelectorError("Selecciona un cliente para el trabajo");
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateTrabajoDto = {
        clienteId: selectedClienteId ? selectedClienteId : null,
        clienteNombre: selectedCliente?.nombre,
        clienteRfc: selectedCliente?.rfc,
        estado,
        estadoAprobacion,
        visibilidadEquipo,
        miembroAsignadoId: miembroAsignadoId ? miembroAsignadoId : null,
        usuarioAsignadoId: miembroAsignadoId ? miembroAsignadoId : null,
        gestorResponsableId: gestorResponsableId ? gestorResponsableId : null,
        aprobadoPorId: aprobadoPorId ? aprobadoPorId : null,
      };

      await trabajosService.update(trabajo.id, payload);
      alert("Trabajo actualizado correctamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error al actualizar trabajo:", err);
      setError(err.response?.data?.message || "Error al actualizar el trabajo");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateCliente = () => {
    setClienteModalData(null);
    setClienteModalOpen(true);
  };

  const handleOpenEditCliente = () => {
    if (!selectedCliente) {
      return;
    }
    setClienteModalData(selectedCliente);
    setClienteModalOpen(true);
  };

  const handleClienteSaved = (cliente: Cliente) => {
    setSelectedClienteId(cliente.id);
    setSelectedCliente(cliente);
    setSelectorError(null);
    setClienteModalOpen(false);
    setClienteModalData(null);
    selectorRef.current?.refresh();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Editar Trabajo
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Cliente
                </h3>
                <ClienteSelector
                  ref={selectorRef}
                  value={selectedClienteId}
                  allowEmptyOption
                  onChange={(clienteId, cliente) => {
                    setSelectedClienteId(clienteId ?? "");
                    setSelectedCliente(cliente);
                    setSelectorError(null);
                  }}
                  onClienteLoaded={(cliente) => {
                    setSelectedCliente(cliente);
                  }}
                  error={selectorError}
                  helperText="Selecciona otro cliente o deja vacío para mantenerlo sin asignar."
                />

                <button
                  type="button"
                  onClick={handleOpenCreateCliente}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Crear nuevo cliente
                </button>

                {selectedCliente && (
                  <button
                    type="button"
                    onClick={handleOpenEditCliente}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Editar cliente seleccionado
                  </button>
                )}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del trabajo
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoTrabajo)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado de aprobación
                  </label>
                  <select
                    value={estadoAprobacion}
                    onChange={(e) =>
                      setEstadoAprobacion(e.target.value as EstadoAprobacion)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(APROBACION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gestor responsable
                  </label>
                  <select
                    value={gestorResponsableId}
                    onChange={(e) => setGestorResponsableId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {gestoresDisponibles.length === 0 ? (
                      <option value="">Sin gestores disponibles</option>
                    ) : (
                      gestoresDisponibles.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.name || usuario.email}
                          {usuario.role === "Admin" ? " (Admin)" : ""}
                        </option>
                      ))
                    )}
                  </select>
                  {usuariosLoading && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cargando usuarios...
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miembro asignado
                  </label>
                  <select
                    value={miembroAsignadoId}
                    onChange={(e) => setMiembroAsignadoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin asignar</option>
                    {miembrosDisponibles.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.name || usuario.email}
                      </option>
                    ))}
                  </select>
                  {usuariosLoading && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cargando usuarios...
                    </p>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aprobado por
                  </label>
                  <select
                    value={aprobadoPorId}
                    onChange={(e) => setAprobadoPorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin aprobador</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.name || usuario.email}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                <p>
                  <strong>Año:</strong> {trabajo.anio} (no se puede modificar)
                </p>
                {trabajo.fechaAprobacion && (
                  <p>
                    <strong>Última aprobación:</strong>{" "}
                    {new Date(trabajo.fechaAprobacion).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <input
                  id="visibilidad-equipo-edit"
                  type="checkbox"
                  checked={visibilidadEquipo}
                  onChange={(e) => setVisibilidadEquipo(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="visibilidad-equipo-edit"
                  className="text-sm text-slate-700"
                >
                  Compartir con todo el equipo
                  <span className="block text-xs text-slate-500">
                    Cuando está activo, todos los miembros pueden ver este
                    trabajo.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
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
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ClienteFormModal
        open={clienteModalOpen}
        onClose={() => {
          setClienteModalOpen(false);
          setClienteModalData(null);
        }}
        onSaved={handleClienteSaved}
        initialData={clienteModalData}
      />
    </>
  );
};
