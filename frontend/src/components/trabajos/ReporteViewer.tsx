import React, { useState } from "react";

interface Hoja {
  nombre: string;
  datos: any[][];
}

interface ReporteViewerProps {
  hojas: Hoja[];
  titulo: string;
}

export const ReporteViewer: React.FC<ReporteViewerProps> = ({
  hojas,
  titulo,
}) => {
  const [hojaActiva, setHojaActiva] = useState(0);

  if (!hojas || hojas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
        <p className="text-gray-500 text-center py-8">
          No hay datos para mostrar
        </p>
      </div>
    );
  }

  const hojaSeleccionada = hojas[hojaActiva];
  const datos = hojaSeleccionada?.datos || [];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con título */}
      <div className="p-2 border-b">
        <h3 className="text-lg font-semibold">{titulo}</h3>
      </div>

      {/* Tabs de hojas */}
      {hojas.length > 1 && (
        <div className="border-b bg-gray-50">
          <div className="flex overflow-x-auto">
            {hojas.map((hoja, index) => (
              <button
                key={index}
                onClick={() => setHojaActiva(index)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  hojaActiva === index
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {hoja.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido de la hoja */}
      <div className="p-2">
        {datos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Esta hoja está vacía</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody className="bg-white divide-y divide-gray-200">
                {datos.map((fila, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex === 0 ? "bg-gray-50 font-semibold" : ""}
                  >
                    {Array.isArray(fila) &&
                      fila.map((celda, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-2 py-1 whitespace-nowrap text-gray-900 border-r last:border-r-0"
                        >
                          {celda !== null && celda !== undefined
                            ? String(celda)
                            : ""}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con info */}
      <div className="px-2 py-2 bg-gray-50 border-t text-sm text-gray-600">
        {hojaSeleccionada && (
          <span>
            {datos.length} fila{datos.length !== 1 ? "s" : ""} •{" "}
            {datos[0]?.length || 0} columna{datos[0]?.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
};
