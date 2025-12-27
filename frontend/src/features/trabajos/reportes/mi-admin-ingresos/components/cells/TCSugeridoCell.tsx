/**
 * Celda especial para TC Sugerido
 * Muestra el TC sugerido calculado con botón para aplicarlo
 */

import { ArrowDownCircle } from 'lucide-react'
import { formatTipoCambio } from '../../utils'

interface TCSugeridoCellProps {
    /** Valor del TC sugerido (puede ser null si no se puede calcular) */
    tcSugerido: number | null
    /** Tipo de cambio actual de la fila */
    tipoCambioActual: number | null
    /** Estado SAT de la fila */
    estadoSat: 'Vigente' | 'Cancelada'
    /** Callback al hacer click en "Aplicar" */
    onAplicar: () => void
    /** Si está deshabilitado (ej: no hay TC sugerido o está cancelada) */
    disabled?: boolean
}

/**
 * Celda que muestra el TC Sugerido con botón para aplicarlo
 */
export const TCSugeridoCell: React.FC<TCSugeridoCellProps> = ({
    tcSugerido,
    tipoCambioActual,
    estadoSat,
    onAplicar,
    disabled = false,
}) => {
    // Si no hay TC sugerido o está cancelada, mostrar N/A
    if (tcSugerido === null || estadoSat === 'Cancelada') {
        return <div className="flex items-center justify-center text-gray-400 text-sm">N/A</div>
    }

    // Verificar si el TC actual ya coincide con el sugerido (con tolerancia)
    const isAlreadyApplied =
        tipoCambioActual !== null && Math.abs(tipoCambioActual - tcSugerido) < 0.0001

    return (
        <div className="flex items-center gap-2 justify-between">
            <span
                className={`font-mono text-sm ${
                    isAlreadyApplied ? 'text-green-600 font-semibold' : 'text-blue-600'
                }`}
                title={`TC Sugerido: ${formatTipoCambio(tcSugerido)}`}
            >
                {formatTipoCambio(tcSugerido)}
            </span>

            {!isAlreadyApplied && (
                <button
                    onClick={onAplicar}
                    disabled={disabled}
                    className={`
            flex items-center gap-1 px-2 py-1 text-xs rounded
            transition-colors
            ${
                disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300'
            }
          `}
                    title="Aplicar TC Sugerido a esta fila"
                >
                    <ArrowDownCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Aplicar</span>
                </button>
            )}

            {isAlreadyApplied && (
                <span className="text-xs text-green-600 font-medium">✓ Aplicado</span>
            )}
        </div>
    )
}
