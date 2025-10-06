import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  trabajosApi,
  reportesApi,
  Trabajo,
  Reporte,
  CreateReporteDto,
} from "../services/api";
import {
  ArrowLeft,
  Plus,
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
  Upload,
  Calendar,
} from "lucide-react";
import { ImportExcel } from "../components/ImportExcel";

export const TrabajoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const [trabajoData, reportesData] = await Promise.all([
        trabajosApi.getById(id),
        reportesApi.getAll(id),
      ]);
      setTrabajo(trabajoData);
      setReportes(reportesData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReporte = async (data: CreateReporteDto) => {
    if (!id) return;

    try {
      const newReporte = await reportesApi.create(id, data);
      setReportes([newReporte, ...reportes]);
      setShowCreateModal(false);
      // Auto-seleccionar el reporte recién creado para importar
      setSelectedReporte(newReporte);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al crear el reporte");
    }
  };

  const handleDeleteReporte = async (reporteId: string) => {
    if (!id) return;
    if (!confirm("¿Estás seguro de eliminar este reporte?")) return;

    try {
      await reportesApi.delete(id, reporteId);
      setReportes(reportes.filter((r) => r.id !== reporteId));
      if (selectedReporte?.id === reporteId) {
        setSelectedReporte(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar el reporte");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTipoLabel = (tipo: Reporte["tipo"]) => {
    const labels: Record<Reporte["tipo"], string> = {
      mensual: "Reporte Mensual",
      balance: "Balance",
      ingresos: "Ingresos",
      gastos: "Gastos",
      flujo: "Flujo de Caja",
      proyecciones: "Proyecciones",
      comparativo: "Comparativo",
      consolidado: "Consolidado",
      personalizado: "Personalizado",
    };
    return labels[tipo];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error || "Trabajo no encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/trabajos")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver a Trabajos
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {trabajo.nombre}
        </h1>
        {trabajo.descripcion && (
          <p className="text-gray-600 mb-4">{trabajo.descripcion}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Creado: {formatDate(trabajo.fechaCreacion)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{reportes.length} reporte(s)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Reportes */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reportes</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>

          {reportes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                No hay reportes en este trabajo
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Crear Reporte
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reportes.map((reporte) => (
                <div
                  key={reporte.id}
                  className={`bg-white rounded-lg shadow border-2 transition-all cursor-pointer ${
                    selectedReporte?.id === reporte.id
                      ? "border-blue-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedReporte(reporte)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {reporte.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getTipoLabel(reporte.tipo)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReporte(reporte.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {reporte.descripcion && (
                      <p className="text-sm text-gray-600 mb-2">
                        {reporte.descripcion}
                      </p>
                    )}

                    {reporte.nombreArchivoOriginal && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <Upload className="h-3 w-3" />
                        {reporte.nombreArchivoOriginal}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Importación */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Importar Excel
          </h2>

          {selectedReporte ? (
            <ImportExcel
              trabajoId={id!}
              reporteId={selectedReporte.id}
              reporteTipo={selectedReporte.tipo}
              onSuccess={() => {
                loadData(); // Recargar datos después de importar
              }}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Selecciona un reporte para importar datos desde Excel
              </p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateReporteModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateReporte}
        />
      )}
    </div>
  );
};

interface CreateReporteModalProps {
  onClose: () => void;
  onCreate: (data: CreateReporteDto) => void;
}

const CreateReporteModal: React.FC<CreateReporteModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<Reporte["tipo"]>("mensual");

  const tiposReporte: { value: Reporte["tipo"]; label: string }[] = [
    { value: "mensual", label: "Reporte Mensual (Multi-hoja)" },
    { value: "balance", label: "Balance" },
    { value: "ingresos", label: "Ingresos" },
    { value: "gastos", label: "Gastos" },
    { value: "flujo", label: "Flujo de Caja" },
    { value: "proyecciones", label: "Proyecciones" },
    { value: "comparativo", label: "Comparativo" },
    { value: "consolidado", label: "Consolidado" },
    { value: "personalizado", label: "Personalizado" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onCreate({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Crear Nuevo Reporte
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Reporte Enero 2024"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Reporte["tipo"])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tiposReporte.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {tipo === "mensual" && (
              <p className="mt-1 text-xs text-blue-600">
                ℹ️ Este tipo soporta múltiples hojas en el Excel
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción opcional..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!nombre.trim()}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
