import React from 'react'
import { Mes } from '../../types/trabajo'
import { MESES_NOMBRES_CORTOS } from '../../types/trabajo'

interface MesesSelectorProps {
    meses: Mes[]
    mesSeleccionado?: string // ID del mes seleccionado
    onMesClick: (mes: Mes) => void
    progreso?: string // Ej: "3/12 ✓"
}

const getEstadoVisual = (
    mes: Mes
): {
    icon: string
    bgColor: string
    textColor: string
    borderColor: string
} => {
    switch (mes.estadoRevision) {
        case 'ENVIADO':
            return {
                icon: '🔒',
                bgColor: 'bg-amber-100',
                textColor: 'text-amber-800',
                borderColor: 'border-amber-400',
            }
        case 'APROBADO':
            return {
                icon: '✅',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                borderColor: 'border-green-400',
            }
        case 'CAMBIOS_SOLICITADOS':
            return {
                icon: '✏️',
                bgColor: 'bg-rose-100',
                textColor: 'text-rose-800',
                borderColor: 'border-rose-400',
            }
        default:
            break
    }

    switch (mes.estado) {
        case 'COMPLETADO':
            return {
                icon: '✓',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                borderColor: 'border-green-400',
            }
        case 'EN_PROCESO':
            return {
                icon: '⏳',
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-800',
                borderColor: 'border-yellow-400',
            }
        default:
            return {
                icon: '○',
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-600',
                borderColor: 'border-gray-300',
            }
    }
}

export const MesesSelector: React.FC<MesesSelectorProps> = ({
    meses,
    mesSeleccionado,
    onMesClick,
    progreso,
}) => {
    // Ordenar meses y asegurar que tenemos los 12
    const mesesOrdenados = [...meses].sort((a, b) => a.mes - b.mes)

    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">📅 Seleccionar Mes:</h3>
                    {progreso && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {progreso}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 flex-1 justify-end">
                    {mesesOrdenados.map((mes) => {
                        const estado = getEstadoVisual(mes)
                        const isSelected = mes.id === mesSeleccionado
                        const mesNombre = MESES_NOMBRES_CORTOS[mes.mes - 1]

                        return (
                            <button
                                key={mes.id}
                                onClick={() => onMesClick(mes)}
                                className={`
                  relative px-2 py-1.5 rounded-lg text-xs font-semibold
                  transition-all duration-200 border-2
                  ${estado.bgColor} ${estado.textColor}
                  ${
                      isSelected
                          ? `${estado.borderColor} ring-2 ring-offset-1 ring-blue-500`
                          : 'border-transparent hover:shadow-md'
                  }
                  flex flex-col items-center min-w-[40px]
                `}
                                title={`${mesNombre} - ${mes.estado.replace('_', ' ')}`}
                            >
                                <span className="text-xs leading-none">{mesNombre}</span>
                                <span className="text-sm">{estado.icon}</span>

                                {/* Indicador de selección */}
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
