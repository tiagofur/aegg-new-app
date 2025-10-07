import React, { useState } from "react";
import { CreateTrabajoDto } from "../../types/trabajo";
import { trabajosService } from "../../services";

interface CreateTrabajoDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUserId: string;
}

export const CreateTrabajoDialog: React.FC<CreateTrabajoDialogProps> = ({
  open,
  onClose,
  onCreated,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTrabajoDto>({
    clienteNombre: "",
    clienteRfc: "",
    anio: new Date().getFullYear(),
    usuarioAsignadoId: currentUserId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await trabajosService.create(formData);
      alert("Trabajo creado correctamente");
      onCreated();
      onClose();
      // Resetear form
      setFormData({
        clienteNombre: "",
        clienteRfc: "",
        anio: new Date().getFullYear(),
        usuarioAsignadoId: currentUserId,
      });
    } catch (error: any) {
      console.error("Error al crear trabajo:", error);
      alert(error.response?.data?.message || "Error al crear el trabajo");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Nuevo Trabajo</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
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

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={formData.clienteNombre}
                onChange={(e) =>
                  setFormData({ ...formData, clienteNombre: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Empresa ABC"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RFC del Cliente (Opcional)
              </label>
              <input
                type="text"
                value={formData.clienteRfc}
                onChange={(e) =>
                  setFormData({ ...formData, clienteRfc: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: ABC123456XYZ"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={formData.anio}
                onChange={(e) =>
                  setFormData({ ...formData, anio: parseInt(e.target.value) })
                }
                required
                min="2020"
                max="2100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Creando..." : "Crear Trabajo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
