import React, { useMemo } from 'react'
import { EstadoAprobacion, Trabajo } from '../../types/trabajo'
import { useTrabajosFilters } from '../../features/trabajos/filters/useTrabajosFilters'
import { TrabajosListFilters } from './TrabajosListFilters'

interface TrabajosListProps {
    trabajos: Trabajo[]
    onSelectTrabajo: (trabajo: Trabajo) => void
    onCreateTrabajo: () => void
    canCreate: boolean
}

export const TrabajosList: React.FC<TrabajosListProps> = ({
    trabajos,
    onSelectTrabajo,
    onCreateTrabajo,
    canCreate,
}) => {
    const { filters, updateFilters, resetFilters } = useTrabajosFilters()

    const formatLabel = (value: string) =>
        value
            .toLowerCase()
            .split('_')
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ')

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'ACTIVO':
                return 'bg-green-100 text-green-800'
            case 'COMPLETADO':
                return 'bg-blue-100 text-blue-800'
            case 'INACTIVO':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getEstadoAprobacionColor = (estado: EstadoAprobacion) => {
        switch (estado) {
            case 'APROBADO':
                return 'bg-emerald-100 text-emerald-800'
            case 'EN_REVISION':
                return 'bg-amber-100 text-amber-800'
            case 'REABIERTO':
                return 'bg-rose-100 text-rose-800'
            default:
                return 'bg-blue-100 text-blue-800'
        }
    }

    const clienteOptions = useMemo(() => {
        // Build counts once so the selector stays deterministic across renders.
        const clienteCounts = new Map<string, { label: string; count: number }>()

        trabajos.forEach((trabajo) => {
            if (!trabajo.clienteId) {
                return
            }

            const label = trabajo.clienteNombre ?? trabajo.cliente?.nombre ?? 'Sin nombre'
            const current = clienteCounts.get(trabajo.clienteId)
            if (current) {
                clienteCounts.set(trabajo.clienteId, {
                    label: current.label,
                    count: current.count + 1,
                })
            } else {
                clienteCounts.set(trabajo.clienteId, {
                    label,
                    count: 1,
                })
            }
        })

        return Array.from(clienteCounts.entries())
            .map(([value, data]) => ({
                value,
                label: data.label,
                count: data.count,
            }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [trabajos])

    const filteredTrabajos = useMemo(() => {
        return trabajos.filter((trabajo) => {
            const matchesSearch = filters.search
                ? [
                      trabajo.clienteNombre ?? '',
                      trabajo.clienteRfc ?? '',
                      trabajo.miembroAsignado?.nombre ?? trabajo.miembroAsignado?.name ?? '',
                      trabajo.gestorResponsable?.nombre ?? trabajo.gestorResponsable?.name ?? '',
                  ]
                      .join(' ')
                      .toLowerCase()
                      .includes(filters.search.toLowerCase())
                : true

            const matchesYear = filters.year ? trabajo.anio === filters.year : true

            const matchesEstado = filters.estado
                ? trabajo.estadoAprobacion === filters.estado
                : true

            const matchesCliente = filters.clienteId
                ? trabajo.clienteId === filters.clienteId
                : true

            return matchesSearch && matchesYear && matchesEstado && matchesCliente
        })
    }, [trabajos, filters])

    const totalTrabajos = filteredTrabajos.length

    const estadoCounts = useMemo(() => {
        return trabajos.reduce<Record<EstadoAprobacion, number>>(
            (acc, trabajo) => {
                acc[trabajo.estadoAprobacion] = (acc[trabajo.estadoAprobacion] ?? 0) + 1
                return acc
            },
            {
                EN_PROGRESO: 0,
                EN_REVISION: 0,
                APROBADO: 0,
                REABIERTO: 0,
            }
        )
    }, [trabajos])

    return (
        <div className="container mx-auto p-6">
            <TrabajosListFilters
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
                clienteOptions={clienteOptions}
                estadoCounts={estadoCounts}
            />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Mis Trabajos</h1>
                {canCreate && (
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
                )}
            </div>

            {totalTrabajos === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        No hay trabajos que coincidan con los filtros
                    </p>
                    {canCreate && (
                        <button
                            onClick={onCreateTrabajo}
                            className="mt-4 text-blue-600 hover:text-blue-800 underline"
                        >
                            Crear el primer trabajo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrabajos.map((trabajo) => {
                        const estadoAprobacionLabel = formatLabel(trabajo.estadoAprobacion)
                        const miembroAsignadoNombre =
                            trabajo.miembroAsignado?.nombre ?? trabajo.miembroAsignado?.name ?? ''
                        const gestorResponsableNombre =
                            trabajo.gestorResponsable?.nombre ??
                            trabajo.gestorResponsable?.name ??
                            ''

                        return (
                            <div
                                key={trabajo.id}
                                onClick={() => onSelectTrabajo(trabajo)}
                                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200"
                            >
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    {trabajo.clienteNombre || 'Sin cliente'}
                                </h3>
                                {trabajo.clienteRfc && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        RFC: {trabajo.clienteRfc}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mb-4">Año: {trabajo.anio}</p>

                                {gestorResponsableNombre && (
                                    <p className="text-xs text-gray-500 mb-2">
                                        Gestor: {gestorResponsableNombre}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mb-4">
                                    {miembroAsignadoNombre
                                        ? `Asignado a: ${miembroAsignadoNombre}`
                                        : 'Sin miembro asignado'}
                                </p>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                                            trabajo.estado
                                        )}`}
                                    >
                                        {trabajo.estado}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoAprobacionColor(
                                            trabajo.estadoAprobacion
                                        )}`}
                                    >
                                        {estadoAprobacionLabel}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                        {trabajo.reporteBaseAnual?.mesesCompletados.length || 0}/12
                                        meses
                                    </span>
                                    {!trabajo.visibilidadEquipo && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                            Privado
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all"
                                        style={{
                                            width: `${
                                                ((trabajo.reporteBaseAnual?.mesesCompletados
                                                    .length || 0) /
                                                    12) *
                                                100
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
