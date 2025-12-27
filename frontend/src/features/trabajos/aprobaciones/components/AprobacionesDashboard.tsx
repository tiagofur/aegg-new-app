import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AlertTriangle,
    CalendarCheck,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react'
import {
    AprobacionesDashboardData,
    AprobacionesFilters,
    EstadoAprobacion,
    EstadoRevisionMes,
} from '../../../../types'

const ESTADO_LABELS: Record<EstadoAprobacion, string> = {
    EN_PROGRESO: 'En progreso',
    EN_REVISION: 'En revisión',
    APROBADO: 'Aprobado',
    REABIERTO: 'Reabierto',
}

const ESTADO_COLORS: Record<EstadoAprobacion, string> = {
    EN_PROGRESO: 'bg-blue-50 text-blue-700 border-blue-200',
    EN_REVISION: 'bg-amber-50 text-amber-700 border-amber-200',
    APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REABIERTO: 'bg-rose-50 text-rose-700 border-rose-200',
}

const REVISION_LABELS: Record<EstadoRevisionMes, string> = {
    EN_EDICION: 'En edición',
    ENVIADO: 'En revisión',
    APROBADO: 'Aprobado',
    CAMBIOS_SOLICITADOS: 'Cambios solicitados',
}

const REVISION_COLORS: Record<EstadoRevisionMes, string> = {
    EN_EDICION: 'bg-slate-50 text-slate-700 border-slate-200',
    ENVIADO: 'bg-amber-50 text-amber-700 border-amber-200',
    APROBADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CAMBIOS_SOLICITADOS: 'bg-rose-50 text-rose-700 border-rose-200',
}

const iconForRevision = (estado: EstadoRevisionMes) => {
    switch (estado) {
        case 'APROBADO':
            return CheckCircle2
        case 'CAMBIOS_SOLICITADOS':
            return AlertTriangle
        case 'ENVIADO':
            return ShieldCheck
        default:
            return Clock
    }
}

const ordenarEstados = (resumen: Record<EstadoAprobacion, number>) =>
    (Object.keys(resumen) as EstadoAprobacion[]).sort((a, b) => {
        const prioridad: Record<EstadoAprobacion, number> = {
            EN_REVISION: 0,
            REABIERTO: 1,
            EN_PROGRESO: 2,
            APROBADO: 3,
        }
        return prioridad[a] - prioridad[b]
    })

const formatRelative = (value: string) => {
    const diff = Date.now() - new Date(value).getTime()
    const minutes = Math.round(diff / 60000)
    if (Number.isNaN(minutes)) {
        return 'Fecha desconocida'
    }
    if (Math.abs(minutes) < 60) {
        return `${minutes} min ${minutes >= 0 ? 'atrás' : 'después'}`
    }
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) {
        return `${hours} h ${hours >= 0 ? 'atrás' : 'después'}`
    }
    const days = Math.round(hours / 24)
    return `${days} d ${days >= 0 ? 'atrás' : 'después'}`
}

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))

const calcularDiasEnRevision = (fechaEnvio?: string | null) => {
    if (!fechaEnvio) return null
    const dias = Math.floor((Date.now() - new Date(fechaEnvio).getTime()) / (1000 * 60 * 60 * 24))
    return dias
}

interface AprobacionesDashboardProps {
    data: AprobacionesDashboardData
    loading: boolean
    error: string | null
    filters: AprobacionesFilters
    onChangeFilters: (input: Partial<AprobacionesFilters>) => void
    onRetry: () => void
}

const emptyMessage =
    'Sin pendientes para este filtro, revisa otros estados o confirma con tu equipo.'

export const AprobacionesDashboard: FC<AprobacionesDashboardProps> = ({
    data,
    loading,
    error,
    filters,
    onChangeFilters,
    onRetry,
}) => {
    const navigate = useNavigate()

    const estadosOrdenados = useMemo(
        () => ordenarEstados(data.resumenEstados),
        [data.resumenEstados]
    )

    const pendientesFiltradas = useMemo(() => {
        if (!filters.estado) {
            return data.pendientes
        }
        return data.pendientes.filter((item) => item.estadoAprobacion === filters.estado)
    }, [data.pendientes, filters.estado])

    return (
        <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {estadosOrdenados.map((estado) => {
                    const count = data.resumenEstados[estado]
                    return (
                        <article
                            key={estado}
                            className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${ESTADO_COLORS[estado]}`}
                        >
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                                <span>{ESTADO_LABELS[estado]}</span>
                                <ShieldCheck className="h-4 w-4" aria-hidden />
                            </div>
                            <p className="text-3xl font-bold">{count}</p>
                            <p className="text-xs text-slate-600">
                                {estado === 'APROBADO'
                                    ? 'Proyectos cerrados en período'
                                    : 'Casos a supervisar'}
                            </p>
                        </article>
                    )
                })}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600">Bandeja de aprobación</p>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Pendientes por revisar
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                            <Search className="h-4 w-4" aria-hidden />
                            <span className="text-xs uppercase tracking-wide">Estado filtro</span>
                            <select
                                className="bg-transparent text-sm font-medium focus:outline-none"
                                value={filters.estado ?? ''}
                                onChange={(event) =>
                                    onChangeFilters({
                                        estado:
                                            event.target.value === ''
                                                ? undefined
                                                : (event.target.value as EstadoAprobacion),
                                    })
                                }
                            >
                                <option value="">Todos</option>
                                <option value="EN_REVISION">En revisión</option>
                                <option value="EN_PROGRESO">En progreso</option>
                                <option value="REABIERTO">Reabierto</option>
                                <option value="APROBADO">Aprobado</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                            <RefreshCcw className="h-4 w-4" aria-hidden />
                            Actualizar
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Actualizando aprobaciones…
                        </div>
                    </div>
                ) : error ? (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                        <AlertTriangle className="h-6 w-6" aria-hidden />
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : pendientesFiltradas.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                        <CalendarCheck className="h-8 w-8 text-slate-400" aria-hidden />
                        <p className="max-w-sm">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Cliente / Mes</th>
                                    <th className="px-4 py-3">Estado revisión</th>
                                    <th className="px-4 py-3">Asignado</th>
                                    <th className="px-4 py-3">Última actualización</th>
                                    <th className="px-4 py-3 text-right">Avance</th>
                                    <th className="px-4 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {pendientesFiltradas.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() =>
                                            navigate(`/trabajos/${item.trabajoId}?mes=${item.id}`)
                                        }
                                        className="transition hover:bg-blue-50 cursor-pointer group"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            <div className="flex flex-col">
                                                <span className="group-hover:text-blue-600 transition flex items-center gap-2">
                                                    {item.clienteNombre} · {item.anio}
                                                    <svg
                                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                        />
                                                    </svg>
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Mes:{' '}
                                                    {item.mesNombre || `#${item.mesNumero ?? '-'}`}
                                                </span>
                                                {item.comentarioRevision && (
                                                    <span className="text-xs text-rose-500">
                                                        Nota gestor: {item.comentarioRevision}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                                    REVISION_COLORS[item.estadoRevision]
                                                }`}
                                            >
                                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                                {REVISION_LABELS[item.estadoRevision]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-semibold">
                                                    {item.miembroAsignado?.nombre ||
                                                        item.miembroAsignado?.name ||
                                                        'Sin asignar'}
                                                </span>
                                                {item.aprobadoPor &&
                                                    item.estadoRevision === 'APROBADO' && (
                                                        <span className="text-slate-500">
                                                            Último aprobador:{' '}
                                                            {item.aprobadoPor.nombre ||
                                                                item.aprobadoPor.name}
                                                        </span>
                                                    )}
                                                {item.enviadoPor &&
                                                    item.estadoRevision === 'ENVIADO' && (
                                                        <span className="text-slate-500">
                                                            Enviado por:{' '}
                                                            {item.enviadoPor.nombre ||
                                                                item.enviadoPor.name}
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div className="flex flex-col text-xs">
                                                <span>
                                                    {formatRelative(item.fechaActualizacion)}
                                                </span>
                                                <span className="text-slate-400">
                                                    {formatDate(item.fechaActualizacion)}
                                                </span>
                                                {item.estadoRevision === 'ENVIADO' &&
                                                    item.fechaEnvioRevision && (
                                                        <span
                                                            className={`font-semibold mt-1 flex items-center gap-1 ${
                                                                calcularDiasEnRevision(
                                                                    item.fechaEnvioRevision
                                                                )! > 3
                                                                    ? 'text-rose-600'
                                                                    : 'text-amber-600'
                                                            }`}
                                                        >
                                                            <Clock
                                                                className="h-3 w-3"
                                                                aria-hidden
                                                            />
                                                            ⏱️{' '}
                                                            {calcularDiasEnRevision(
                                                                item.fechaEnvioRevision
                                                            )}{' '}
                                                            {calcularDiasEnRevision(
                                                                item.fechaEnvioRevision
                                                            ) === 1
                                                                ? 'día'
                                                                : 'días'}{' '}
                                                            en revisión
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                            <div className="flex items-center justify-end gap-2">
                                                <Users
                                                    className="h-4 w-4 text-slate-400"
                                                    aria-hidden
                                                />
                                                <span>
                                                    {item.mesesCompletados ?? 0}/
                                                    {item.totalMeses ?? 12} meses
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(
                                                        `/trabajos/${item.trabajoId}?mes=${item.id}`
                                                    )
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                                            >
                                                <svg
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                                Revisar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600">Línea de tiempo</p>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Movimientos más recientes
                        </h2>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-slate-400" aria-hidden />
                </header>
                {loading ? (
                    <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Actualizando línea de tiempo…
                    </div>
                ) : data.recientes.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        <CalendarCheck className="h-8 w-8 text-slate-400" aria-hidden />
                        <p>No se han registrado movimientos recientes.</p>
                    </div>
                ) : (
                    <ol className="mt-6 space-y-4">
                        {data.recientes.map((item) => (
                            <li
                                key={`${item.trabajoId}-${item.fecha}`}
                                className="flex items-start gap-4"
                            >
                                <span
                                    className={`mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${
                                        ESTADO_COLORS[item.estadoAprobacion]
                                    }`}
                                >
                                    <ShieldCheck className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-1 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            {(() => {
                                                const RevisionIcon = iconForRevision(
                                                    item.estadoRevision
                                                )
                                                return (
                                                    <span
                                                        className={`mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${
                                                            REVISION_COLORS[item.estadoRevision]
                                                        }`}
                                                    >
                                                        <RevisionIcon
                                                            className="h-4 w-4"
                                                            aria-hidden
                                                        />
                                                    </span>
                                                )
                                            })()}
                                            <span className="font-semibold text-slate-900">
                                                {item.titulo}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(item.fecha)}
                                            </span>
                                        </div>
                                        <p className="text-slate-600">{item.descripcion}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-500">
                                    {REVISION_LABELS[item.estadoRevision]}
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    )
}
