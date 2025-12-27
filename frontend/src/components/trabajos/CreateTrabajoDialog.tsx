import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Cliente, CreateTrabajoDto, EstadoAprobacion, AppUser } from '../../types'
import { trabajosService } from '../../services'
import { usersApi } from '../../services/users'
import { ClienteSelector, ClienteSelectorHandle, ClienteFormModal } from '../../features/clientes'

interface CreateTrabajoDialogProps {
    open: boolean
    onClose: () => void
    onCreated: () => void
    currentUserId: string
}

const APROBACION_LABELS: Record<EstadoAprobacion, string> = {
    EN_PROGRESO: 'En progreso',
    EN_REVISION: 'En revisión',
    APROBADO: 'Aprobado',
    REABIERTO: 'Reabierto',
}

const CURRENT_YEAR = new Date().getFullYear()

export const CreateTrabajoDialog: React.FC<CreateTrabajoDialogProps> = ({
    open,
    onClose,
    onCreated,
    currentUserId,
}) => {
    const [loading, setLoading] = useState(false)
    const [selectedClienteId, setSelectedClienteId] = useState<string>('')
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [selectorError, setSelectorError] = useState<string | null>(null)
    const [clienteModalOpen, setClienteModalOpen] = useState(false)
    const [clienteModalData, setClienteModalData] = useState<Cliente | null>(null)
    const [anio, setAnio] = useState<number>(CURRENT_YEAR)
    const [estadoAprobacion, setEstadoAprobacion] = useState<EstadoAprobacion>('EN_PROGRESO')
    const [visibilidadEquipo, setVisibilidadEquipo] = useState<boolean>(true)
    const selectorRef = useRef<ClienteSelectorHandle | null>(null)
    const [usuarios, setUsuarios] = useState<AppUser[]>([])
    const [usuariosLoading, setUsuariosLoading] = useState(false)
    const [gestorResponsableId, setGestorResponsableId] = useState<string>(currentUserId)
    const [miembroAsignadoId, setMiembroAsignadoId] = useState<string>('')

    const resetForm = () => {
        setSelectedClienteId('')
        setSelectedCliente(null)
        setSelectorError(null)
        setClienteModalOpen(false)
        setClienteModalData(null)
        setAnio(CURRENT_YEAR)
        setEstadoAprobacion('EN_PROGRESO')
        setVisibilidadEquipo(true)
        setGestorResponsableId(currentUserId)
        setMiembroAsignadoId('')
    }

    useEffect(() => {
        if (open) {
            resetForm()
            void loadUsuarios()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const loadUsuarios = async () => {
        setUsuariosLoading(true)
        try {
            const data = await usersApi.getAll()
            setUsuarios(data)
        } catch (error) {
            console.error('Error al cargar usuarios:', error)
        } finally {
            setUsuariosLoading(false)
        }
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleOpenCreateCliente = () => {
        setClienteModalData(null)
        setClienteModalOpen(true)
    }

    const handleOpenEditCliente = () => {
        if (!selectedCliente) {
            return
        }
        setClienteModalData(selectedCliente)
        setClienteModalOpen(true)
    }

    const handleClienteSaved = (cliente: Cliente) => {
        setSelectedClienteId(cliente.id)
        setSelectedCliente(cliente)
        setSelectorError(null)
        setClienteModalOpen(false)
        setClienteModalData(null)
        selectorRef.current?.refresh()
    }

    const gestoresDisponibles = useMemo(() => {
        const getLabel = (usuario: AppUser) => usuario.name || usuario.email
        return usuarios
            .filter((usuario) => usuario.role === 'Gestor' || usuario.role === 'Admin')
            .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
    }, [usuarios])

    const miembrosDisponibles = useMemo(() => {
        const getLabel = (usuario: AppUser) => usuario.name || usuario.email
        return usuarios
            .filter((usuario) => usuario.role === 'Miembro')
            .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
    }, [usuarios])

    useEffect(() => {
        if (gestoresDisponibles.length > 0) {
            const gestorEncontrado = gestoresDisponibles.find((g) => g.id === gestorResponsableId)
            if (!gestorEncontrado) {
                setGestorResponsableId(gestoresDisponibles[0].id)
            }
        }

        if (miembroAsignadoId) {
            const miembroExiste = miembrosDisponibles.some((m) => m.id === miembroAsignadoId)
            if (!miembroExiste) {
                setMiembroAsignadoId('')
            }
        }
    }, [gestoresDisponibles, miembrosDisponibles, gestorResponsableId, miembroAsignadoId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClienteId) {
            setSelectorError('Selecciona un cliente antes de crear el trabajo')
            alert('Selecciona un cliente antes de crear el trabajo')
            return
        }

        setLoading(true)
        try {
            const payload: CreateTrabajoDto = {
                clienteId: selectedClienteId,
                anio,
                miembroAsignadoId: miembroAsignadoId ? miembroAsignadoId : null,
                usuarioAsignadoId: miembroAsignadoId ? miembroAsignadoId : null,
                gestorResponsableId: gestorResponsableId || currentUserId,
                estadoAprobacion,
                visibilidadEquipo,
                clienteNombre: selectedCliente?.nombre,
                clienteRfc: selectedCliente?.rfc,
            }

            await trabajosService.create(payload)
            alert('Trabajo creado correctamente')
            onCreated()
            handleClose()
        } catch (error: any) {
            console.error('Error al crear trabajo:', error)
            alert(error.response?.data?.message || 'Error al crear el trabajo')
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Nuevo Trabajo</h2>
                        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Cliente
                            </h3>
                            <ClienteSelector
                                ref={selectorRef}
                                value={selectedClienteId}
                                onChange={(clienteId, cliente) => {
                                    setSelectedClienteId(clienteId ?? '')
                                    setSelectedCliente(cliente)
                                    setSelectorError(null)
                                }}
                                required
                                error={selectorError}
                                onClienteLoaded={(cliente) => {
                                    setSelectedCliente(cliente)
                                }}
                            />

                            <button
                                type="button"
                                onClick={handleOpenCreateCliente}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Crear nuevo cliente
                            </button>

                            {selectedCliente && (
                                <button
                                    type="button"
                                    onClick={handleOpenEditCliente}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Editar cliente seleccionado
                                </button>
                            )}
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Año fiscal *
                                </label>
                                <input
                                    type="number"
                                    value={anio}
                                    onChange={(e) =>
                                        setAnio(parseInt(e.target.value, 10) || CURRENT_YEAR)
                                    }
                                    min={2020}
                                    max={2100}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estado de aprobación inicial
                                </label>
                                <select
                                    value={estadoAprobacion}
                                    onChange={(e) =>
                                        setEstadoAprobacion(e.target.value as EstadoAprobacion)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {Object.entries(APROBACION_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Gestor responsable
                                </label>
                                <select
                                    value={gestorResponsableId}
                                    onChange={(e) => setGestorResponsableId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {gestoresDisponibles.length === 0 ? (
                                        <option value="">Sin gestores disponibles</option>
                                    ) : (
                                        gestoresDisponibles.map((usuario) => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {usuario.name || usuario.email}
                                                {usuario.role === 'Admin' ? ' (Admin)' : ''}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {usuariosLoading && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cargando usuarios...
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Miembro ejecutor
                                </label>
                                <select
                                    value={miembroAsignadoId}
                                    onChange={(e) => setMiembroAsignadoId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sin asignar</option>
                                    {miembrosDisponibles.map((usuario) => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.name || usuario.email}
                                        </option>
                                    ))}
                                </select>
                                {usuariosLoading && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cargando usuarios...
                                    </p>
                                )}
                            </div>
                        </section>

                        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <input
                                id="visibilidad-equipo"
                                type="checkbox"
                                checked={visibilidadEquipo}
                                onChange={(e) => setVisibilidadEquipo(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="visibilidad-equipo" className="text-sm text-slate-700">
                                Compartir con todo el equipo
                                <span className="block text-xs text-slate-500">
                                    Cuando está activo, todos los miembros pueden ver este trabajo.
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear trabajo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ClienteFormModal
                open={clienteModalOpen}
                onClose={() => {
                    setClienteModalOpen(false)
                    setClienteModalData(null)
                }}
                onSaved={handleClienteSaved}
                initialData={clienteModalData}
            />
        </div>
    )
}
