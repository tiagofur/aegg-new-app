import React, { useState, useEffect } from "react";
import { Trabajo, UpdateTrabajoDto } from "../../types/trabajo";
import { trabajosService } from "../../services";

interface EditTrabajoDialogProps {
  trabajo: Trabajo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTrabajoDialog: React.FC<EditTrabajoDialogProps> = ({
  trabajo,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UpdateTrabajoDto>({
    clienteNombre: trabajo.clienteNombre,
    clienteRfc: trabajo.clienteRfc || "",
    estado: trabajo.estado,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar form cuando cambie el trabajo
  useEffect(() => {
    setFormData({
      clienteNombre: trabajo.clienteNombre,
      clienteRfc: trabajo.clienteRfc || "",
      estado: trabajo.estado,
    });
  }, [trabajo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.clienteNombre?.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }

    setLoading(true);
    try {
      await trabajosService.update(trabajo.id, formData);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Editar Trabajo</h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="clienteNombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Cliente *
              </label>
              <input
                type="text"
                id="clienteNombre"
                name="clienteNombre"
                value={formData.clienteNombre}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="clienteRfc"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                RFC del Cliente
              </label>
              <input
                type="text"
                id="clienteRfc"
                name="clienteRfc"
                value={formData.clienteRfc}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={13}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Estado del Trabajo
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="COMPLETADO">COMPLETADO</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.estado === "ACTIVO" && "El proyecto está en curso"}
                {formData.estado === "INACTIVO" && "El proyecto está pausado"}
                {formData.estado === "COMPLETADO" &&
                  "El proyecto está finalizado"}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Año:</strong> {trabajo.anio} (no se puede modificar)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
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
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
