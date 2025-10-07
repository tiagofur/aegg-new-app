import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trabajosApi, Trabajo, CreateTrabajoDto } from "../services/api";
import {
  Plus,
  FolderOpen,
  Loader2,
  AlertCircle,
  Calendar,
  FileText,
  Copy,
  Trash2,
} from "lucide-react";

export const Trabajos: React.FC = () => {
  const navigate = useNavigate();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTrabajos();
  }, []);

  const loadTrabajos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trabajosApi.getAll();
      setTrabajos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar los trabajos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrabajo = async (data: CreateTrabajoDto) => {
    try {
      setCreating(true);
      console.log("Sending trabajo data:", data);
      const newTrabajo = await trabajosApi.create(data);
      setTrabajos([newTrabajo, ...trabajos]);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error("Error creating trabajo:", err.response?.data);
      alert(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Error al crear el trabajo"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!confirm("¿Deseas duplicar este trabajo?")) return;

    try {
      const duplicated = await trabajosApi.duplicate(id);
      setTrabajos([duplicated, ...trabajos]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al duplicar el trabajo");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este trabajo? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await trabajosApi.delete(id);
      setTrabajos(trabajos.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar el trabajo");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      activo: "bg-blue-100 text-blue-800",
      completado: "bg-green-100 text-green-800",
      archivado: "bg-yellow-100 text-yellow-800",
    };

    const labels: Record<string, string> = {
      activo: "Activo",
      completado: "Completado",
      archivado: "Archivado",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[estado] || styles.activo
        }`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Trabajos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus proyectos y reportes contables
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Trabajo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {trabajos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay trabajos
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primer trabajo
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Crear Trabajo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajos.map((trabajo) => (
            <div
              key={trabajo.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div
                onClick={() => navigate(`/trabajos/${trabajo.id}`)}
                className="p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {trabajo.nombre}
                  </h3>
                  {getEstadoBadge(trabajo.estado)}
                </div>

                {trabajo.descripcion && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {trabajo.descripcion}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Creado: {formatDate(trabajo.createdAt)}</span>
                  </div>
                  {trabajo.reportes && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{trabajo.reportes.length} reporte(s)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(trabajo.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Duplicar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(trabajo.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTrabajoModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTrabajo}
          creating={creating}
        />
      )}
    </div>
  );
};

interface CreateTrabajoModalProps {
  onClose: () => void;
  onCreate: (data: CreateTrabajoDto) => void;
  creating: boolean;
}

const CreateTrabajoModal: React.FC<CreateTrabajoModalProps> = ({
  onClose,
  onCreate,
  creating,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onCreate({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Crear Nuevo Trabajo
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Proyecto Q1 2024"
              required
              disabled={creating}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción opcional..."
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={creating || !nombre.trim()}
            >
              {creating ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
