import React, { useMemo } from 'react'
import { Mes, MESES_NOMBRES } from '../../types/trabajo'
import { getMesEstadoVisual, MES_ESTADO_TONE_CLASSES } from './mesEstadoVisual'

interface MesSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    meses: Mes[]
    mesSeleccionado?: string
    onSelectMes: (mesId: string) => void
    onAddMesRequest?: () => void
}

export const MesSelectorModal: React.FC<MesSelectorModalProps> = ({
    isOpen,
    onClose,
    meses,
    mesSeleccionado,
    onSelectMes,
    onAddMesRequest,
}) => {
    const mesesOrdenados = useMemo(() => [...meses].sort((a, b) => a.mes - b.mes), [meses])

    const mesesCompletados = useMemo(
        () => meses.filter((mes) => mes.estado === 'COMPLETADO').length,
        [meses]
    )

    if (!isOpen) {
        return null
    }

    const handleCreateMes = () => {
        onClose()
        onAddMesRequest?.()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mes-selector-modal-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2
                            id="mes-selector-modal-title"
                            className="text-base font-semibold text-slate-900"
                        >
                            Selecciona un mes
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {mesesOrdenados.length > 0
                                ? `Meses completados: ${mesesCompletados}/12.`
                                : 'Aún no has creado meses para este trabajo.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        aria-label="Cerrar selector de meses"
                    >
                        X
                    </button>
                </div>

                {mesesOrdenados.length > 0 ? (
                    <div className="px-5 py-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {mesesOrdenados.map((mes) => {
                                const estadoVisual = getMesEstadoVisual(mes)
                                const toneClasses = MES_ESTADO_TONE_CLASSES[estadoVisual.tone]
                                const isSelected = mes.id === mesSeleccionado

                                return (
                                    <button
                                        key={mes.id}
                                        type="button"
                                        onClick={() => onSelectMes(mes.id)}
                                        className={`flex w-full flex-col gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                            isSelected
                                                ? 'border-blue-600 ring-2 ring-blue-100'
                                                : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
                                        }`}
                                        aria-pressed={isSelected}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {MESES_NOMBRES[mes.mes - 1]}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {estadoVisual.label}
                                                </p>
                                            </div>
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-full border ${toneClasses.badgeBorderClass} ${toneClasses.badgeBgClass}`}
                                                aria-hidden
                                            >
                                                <span
                                                    className={`text-sm font-semibold ${toneClasses.textClass}`}
                                                >
                                                    {estadoVisual.icon}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[11px] uppercase tracking-wide text-slate-400">
                                            {mes.reportes.length} reportes
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                        <p>No hay meses disponibles todavía.</p>
                        {onAddMesRequest && (
                            <button
                                type="button"
                                onClick={handleCreateMes}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                                Crear primer mes
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
                    <span>
                        Usa este panel para cambiar de mes sin perder el contexto del reporte.
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
