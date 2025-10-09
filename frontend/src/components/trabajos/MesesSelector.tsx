import React from "react";
import { Mes } from "../../types/trabajo";
import { MESES_NOMBRES_CORTOS } from "../../types/trabajo";

interface MesesSelectorProps {
  meses: Mes[];
  mesSeleccionado?: string; // ID del mes seleccionado
  onMesClick: (mes: Mes) => void;
  progreso?: string; // Ej: "3/12 ✓"
}

const getEstadoVisual = (
  mes: Mes
): {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} => {
  switch (mes.estado) {
    case "COMPLETADO":
      return {
        icon: "✓",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-400",
      };
    case "EN_PROCESO":
      return {
        icon: "⏳",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-400",
      };
    default:
      return {
        icon: "○",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        borderColor: "border-gray-300",
      };
  }
};

export const MesesSelector: React.FC<MesesSelectorProps> = ({
  meses,
  mesSeleccionado,
  onMesClick,
  progreso,
}) => {
  // Ordenar meses y asegurar que tenemos los 12
  const mesesOrdenados = [...meses].sort((a, b) => a.mes - b.mes);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          📅 Seleccionar Mes
        </h3>
        {progreso && (
          <span className="text-sm font-semibold text-gray-600">
            {progreso}
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {mesesOrdenados.map((mes) => {
          const estado = getEstadoVisual(mes);
          const isSelected = mes.id === mesSeleccionado;
          const mesNombre = MESES_NOMBRES_CORTOS[mes.mes - 1];

          return (
            <button
              key={mes.id}
              onClick={() => onMesClick(mes)}
              className={`
                relative px-3 py-2 rounded-lg text-sm font-semibold
                transition-all duration-200 border-2
                ${estado.bgColor} ${estado.textColor}
                ${
                  isSelected
                    ? `${estado.borderColor} ring-2 ring-offset-1 ring-blue-500 scale-105`
                    : "border-transparent hover:scale-105 hover:shadow-md"
                }
              `}
              title={`${mesNombre} - ${mes.estado.replace("_", " ")}`}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs">{mesNombre}</span>
                <span className="text-lg">{estado.icon}</span>
              </div>

              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-bold">✓</span>
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-600 font-bold">⏳</span>
          <span>En proceso</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-bold">○</span>
          <span>Pendiente</span>
        </div>
      </div>
    </div>
  );
};
