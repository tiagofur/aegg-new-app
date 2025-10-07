import React from "react";
import { Trabajo } from "../../types/trabajo";

interface TrabajosListProps {
  trabajos: Trabajo[];
  onSelectTrabajo: (trabajo: Trabajo) => void;
  onCreateTrabajo: () => void;
}

export const TrabajosList: React.FC<TrabajosListProps> = ({
  trabajos,
  onSelectTrabajo,
  onCreateTrabajo,
}) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return "bg-green-100 text-green-800";
      case "COMPLETADO":
        return "bg-blue-100 text-blue-800";
      case "INACTIVO":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mis Trabajos</h1>
        <button
          onClick={onCreateTrabajo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nuevo Trabajo
        </button>
      </div>

      {trabajos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay trabajos creados aún</p>
          <button
            onClick={onCreateTrabajo}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            Crear el primer trabajo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajos.map((trabajo) => (
            <div
              key={trabajo.id}
              onClick={() => onSelectTrabajo(trabajo)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {trabajo.clienteNombre}
              </h3>
              {trabajo.clienteRfc && (
                <p className="text-sm text-gray-600 mb-1">
                  RFC: {trabajo.clienteRfc}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-4">Año: {trabajo.anio}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                    trabajo.estado
                  )}`}
                >
                  {trabajo.estado}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  {trabajo.reporteBaseAnual?.mesesCompletados.length || 0}/12
                  meses
                </span>
              </div>

              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      ((trabajo.reporteBaseAnual?.mesesCompletados.length ||
                        0) /
                        12) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
