import React, { useEffect, useMemo, useState } from 'react'
import { Cliente, CreateClientePayload, UpdateClientePayload } from '../../../types'
import { clientesService } from '../../../services'

interface ClienteFormModalProps {
    open: boolean
    onClose: () => void
    onSaved: (cliente: Cliente) => void
    initialData?: Cliente | null
}

interface FormState {
    nombre: string
    rfc: string
    razonSocial: string
    direccionJson: string
    contactoJson: string
    metadataJson: string
}

const defaultFormState: FormState = {
    nombre: '',
    rfc: '',
    razonSocial: '',
    direccionJson: '',
    contactoJson: '',
    metadataJson: '',
}

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
    open,
    onClose,
    onSaved,
    initialData,
}) => {
    const [formState, setFormState] = useState<FormState>(defaultFormState)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isEditMode = Boolean(initialData)
    const title = isEditMode ? 'Editar cliente' : 'Nuevo cliente'
    const actionLabel = isEditMode ? 'Guardar cambios' : 'Crear cliente'

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormState({
                    nombre: initialData.nombre ?? '',
                    rfc: initialData.rfc ?? '',
                    razonSocial: initialData.razonSocial ?? '',
                    direccionJson: initialData.direccion
                        ? JSON.stringify(initialData.direccion, null, 2)
                        : '',
                    contactoJson: initialData.contactoPrincipal
                        ? JSON.stringify(initialData.contactoPrincipal, null, 2)
                        : '',
                    metadataJson: initialData.metadata
                        ? JSON.stringify(initialData.metadata, null, 2)
                        : '',
                })
            } else {
                setFormState(defaultFormState)
            }
            setError(null)
            setLoading(false)
        }
    }, [initialData, open])

    const handleChange = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }))
    }

    const parseJsonField = (label: string, value: string) => {
        if (!value.trim()) {
            return undefined
        }

        try {
            return JSON.parse(value)
        } catch (err) {
            throw new Error(`El campo "${label}" no tiene un JSON válido.`)
        }
    }

    const payload = useMemo(() => {
        const base: CreateClientePayload = {
            nombre: formState.nombre.trim(),
            rfc: formState.rfc.trim().toUpperCase(),
        }

        if (formState.razonSocial.trim()) {
            base.razonSocial = formState.razonSocial.trim()
        }

        return base
    }, [formState.nombre, formState.rfc, formState.razonSocial])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!formState.nombre.trim()) {
            setError('El nombre del cliente es obligatorio')
            return
        }

        if (!formState.rfc.trim()) {
            setError('El RFC del cliente es obligatorio')
            return
        }

        let direccion
        let contactoPrincipal
        let metadata

        try {
            direccion = parseJsonField('Dirección', formState.direccionJson)
            contactoPrincipal = parseJsonField('Contacto principal', formState.contactoJson)
            metadata = parseJsonField('Metadata', formState.metadataJson)
        } catch (jsonError: any) {
            setError(jsonError.message || 'Error al procesar los campos JSON')
            return
        }

        setLoading(true)
        setError(null)

        try {
            if (isEditMode && initialData) {
                const updatePayload: UpdateClientePayload = {
                    ...payload,
                    direccion,
                    contactoPrincipal,
                    metadata,
                }
                const updated = await clientesService.update(initialData.id, updatePayload)
                onSaved(updated)
            } else {
                const createPayload: CreateClientePayload = {
                    ...payload,
                    direccion,
                    contactoPrincipal,
                    metadata,
                }
                const created = await clientesService.create(createPayload)
                onSaved(created)
            }
        } catch (err: any) {
            console.error('Error al guardar cliente:', err)
            setError(err?.response?.data?.message || err?.message || 'Error al guardar el cliente')
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <span className="sr-only">Cerrar</span>×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formState.nombre}
                                onChange={(event) => handleChange('nombre', event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                RFC *
                            </label>
                            <input
                                type="text"
                                value={formState.rfc}
                                onChange={(event) => handleChange('rfc', event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                required
                                maxLength={13}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Razón social
                            </label>
                            <input
                                type="text"
                                value={formState.razonSocial}
                                onChange={(event) =>
                                    handleChange('razonSocial', event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-1">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Dirección (JSON opcional)
                            </label>
                            <textarea
                                value={formState.direccionJson}
                                onChange={(event) =>
                                    handleChange('direccionJson', event.target.value)
                                }
                                placeholder='{"calle": "..."}'
                                className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Contacto principal (JSON opcional)
                            </label>
                            <textarea
                                value={formState.contactoJson}
                                onChange={(event) =>
                                    handleChange('contactoJson', event.target.value)
                                }
                                placeholder='{"nombre": "...", "email": "..."}'
                                className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Metadata (JSON opcional)
                            </label>
                            <textarea
                                value={formState.metadataJson}
                                onChange={(event) =>
                                    handleChange('metadataJson', event.target.value)
                                }
                                placeholder='{"segmento": "PyME"}'
                                className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : actionLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
