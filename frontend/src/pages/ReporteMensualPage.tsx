import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
    MESES_NOMBRES,
    ReporteMensual,
    TIPOS_REPORTE_NOMBRES,
    EstadoRevisionMes,
} from '../types/trabajo'
import { reportesMensualesService, trabajosService } from '../services'
import { ReporteMensualViewer } from '../components/trabajos/ReporteMensualViewer'
import { ImportReporteMensualDialog } from '../components/trabajos/ImportReporteMensualDialog'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'

type ReporteMensualLocationState = {
    reporte?: ReporteMensual
    reportes?: ReporteMensual[]
    mesNombre?: string
    mesId?: string
    trabajoId?: string
    trabajoYear?: number
    mesNumber?: number
    trabajoNombre?: string
}

export const ReporteMensualPage: React.FC = () => {
    const { trabajoId, mesId, reporteId, tipo } = useParams<{
        trabajoId: string
        mesId: string
        reporteId: string
        tipo: string
    }>()
    const navigate = useNavigate()
    const location = useLocation()
    const locationState = (location.state as ReporteMensualLocationState | undefined) ?? undefined
    const { user } = useAuth()
    // Los Miembros pueden gestionar reportes mensuales (importar, editar, enviar)
    const canManageReportes =
        user?.role === 'Miembro' || user?.role === 'Gestor' || user?.role === 'Admin'

    const [reportes, setReportes] = useState<ReporteMensual[]>(() => locationState?.reportes ?? [])
    const [reporteActual, setReporteActual] = useState<ReporteMensual | null>(
        () => locationState?.reporte ?? null
    )
    const [mesNombre, setMesNombre] = useState<string>(() => locationState?.mesNombre ?? '')
    const [trabajoYear, setTrabajoYear] = useState<number | null>(
        () => locationState?.trabajoYear ?? null
    )
    const [mesNumber, setMesNumber] = useState<number | null>(
        () => locationState?.mesNumber ?? null
    )
    const [mesEstadoRevision, setMesEstadoRevision] = useState<EstadoRevisionMes>('EN_EDICION')
    const [trabajoNombre, setTrabajoNombre] = useState<string | null>(
        () => locationState?.trabajoNombre ?? null
    )
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [mostrarImportDialog, setMostrarImportDialog] = useState(false)

    const hasPrefetchedData = Boolean(locationState?.reporte)
    const prefetchedMatchesRoute =
        hasPrefetchedData &&
        locationState?.reporte?.id === reporteId &&
        locationState?.mesId === mesId &&
        locationState?.trabajoId === trabajoId

    const cargarDetalle = useCallback(async () => {
        if (!trabajoId || !mesId || !reporteId) {
            setError('Parámetros inválidos para mostrar el reporte')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const trabajo = await trabajosService.getOne(trabajoId)
            const mes =
                trabajo.meses.find((m) => m.id === mesId) ??
                trabajo.meses.find((m) => m.reportes?.some((reporte) => reporte.id === reporteId))

            if (!mes) {
                setError('No se encontró el mes solicitado.')
                setReportes([])
                setReporteActual(null)
                return
            }

            const reporteEncontrado = mes.reportes.find((r) => r.id === reporteId) ?? null

            if (!reporteEncontrado) {
                setError('No se encontró el reporte solicitado.')
                setReportes([])
                setReporteActual(null)
                return
            }

            let reporteConDatos = reporteEncontrado

            if (!reporteConDatos.datos || reporteConDatos.datos.length === 0) {
                try {
                    const datosResponse = await reportesMensualesService.obtenerDatos(
                        mes.id,
                        reporteConDatos.id
                    )
                    reporteConDatos = {
                        ...reporteConDatos,
                        datos: datosResponse.datos,
                    }
                } catch (datosError: any) {
                    console.error('Error al cargar datos del reporte:', datosError)
                    setError(
                        datosError.response?.data?.message ||
                            'No fue posible cargar los datos del reporte.'
                    )
                    setReportes([])
                    setReporteActual(null)
                    return
                }
            }

            const reportesActualizados = mes.reportes.map((r) =>
                r.id === reporteConDatos.id ? reporteConDatos : r
            )

            setReportes(reportesActualizados)
            setReporteActual(reporteConDatos)
            setMesNombre(MESES_NOMBRES[mes.mes - 1] ?? '')
            setMesNumber(mes.mes)
            setMesEstadoRevision(mes.estadoRevision || 'EN_EDICION')
            setTrabajoYear(trabajo.anio)
            setTrabajoNombre(trabajo.clienteNombre || null)
        } catch (err: any) {
            console.error('Error al cargar el reporte mensual:', err)
            setError(
                err.response?.data?.message ||
                    'Ocurrió un error al cargar la información del reporte.'
            )
            setReportes([])
            setReporteActual(null)
        } finally {
            setLoading(false)
        }
    }, [mesId, reporteId, trabajoId])

    useEffect(() => {
        if (!prefetchedMatchesRoute) {
            cargarDetalle()
        }
    }, [cargarDetalle, prefetchedMatchesRoute])

    const handleAbrirImportDialog = () => {
        if (!canManageReportes) {
            return
        }
        setMostrarImportDialog(true)
    }

    const handleLimpiarDatos = async () => {
        if (!canManageReportes || !mesId || !reporteId) return

        try {
            await reportesMensualesService.limpiarDatos(mesId, reporteId)
            await cargarDetalle()
        } catch (err: any) {
            console.error('Error al limpiar datos del reporte:', err)
            alert(err.response?.data?.message || 'No se pudieron eliminar los datos del reporte.')
        }
    }

    const handleMesUpdated = useCallback(() => {
        cargarDetalle()
    }, [cargarDetalle])

    if (!trabajoId || !mesId || !reporteId || !tipo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-800 font-semibold text-xl mb-2">
                        ⚠️ Parámetros inválidos
                    </h2>
                    <p className="text-red-600 mb-4">
                        No se especificaron todos los parámetros necesarios.
                    </p>
                    <button
                        onClick={() => navigate('/trabajos')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Volver a Trabajos
                    </button>
                </div>
            </div>
        )
    }

    const safeTrabajoId = trabajoId as string
    const safeMesId = mesId as string
    const safeTipo = tipo as string
    const nombreTipo =
        (reporteActual && TIPOS_REPORTE_NOMBRES[reporteActual.tipo]) ||
        TIPOS_REPORTE_NOMBRES[safeTipo as keyof typeof TIPOS_REPORTE_NOMBRES] ||
        safeTipo

    return (
        <AppShell
            title={nombreTipo}
            breadcrumbs={[
                { label: 'Inicio', to: '/dashboard' },
                { label: 'Trabajos', to: '/trabajos' },
                { label: 'Proyecto', to: `/trabajos/${safeTrabajoId}` },
                { label: nombreTipo },
            ]}
            fullWidth
            contentClassName="max-w-6xl"
        >
            <div className="space-y-4">
                {trabajoNombre && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {trabajoNombre}
                    </div>
                )}

                {loading && reporteActual && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden
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
                        Actualizando información…
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <h2 className="text-lg font-semibold text-red-800">
                            ⚠️ Error al cargar reporte
                        </h2>
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                        <button
                            onClick={() => navigate(`/trabajos/${safeTrabajoId}`)}
                            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                            Volver al Proyecto
                        </button>
                    </div>
                )}

                {!error && reporteActual && trabajoYear && mesNumber ? (
                    <ReporteMensualViewer
                        reporte={reporteActual}
                        reportes={reportes}
                        mesNombre={mesNombre || MESES_NOMBRES[mesNumber - 1] || ''}
                        mesId={safeMesId}
                        trabajoId={safeTrabajoId}
                        trabajoYear={trabajoYear}
                        mesNumber={mesNumber}
                        onImportarReporte={handleAbrirImportDialog}
                        onReimportarReporte={handleAbrirImportDialog}
                        onLimpiarDatos={handleLimpiarDatos}
                        canManage={canManageReportes}
                        mesEstadoRevision={mesEstadoRevision}
                        onMesUpdated={handleMesUpdated}
                    />
                ) : null}

                {!error && !loading && (!reporteActual || !trabajoYear || !mesNumber) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        No hay datos para mostrar.
                    </div>
                )}
            </div>

            {reporteActual && canManageReportes && (
                <ImportReporteMensualDialog
                    isOpen={mostrarImportDialog}
                    onClose={() => setMostrarImportDialog(false)}
                    onSuccess={async () => {
                        setMostrarImportDialog(false)
                        await cargarDetalle()
                    }}
                    mesId={safeMesId}
                    tipo={reporteActual.tipo}
                    mesNombre={mesNombre || MESES_NOMBRES[(mesNumber || 1) - 1] || ''}
                />
            )}
        </AppShell>
    )
}
