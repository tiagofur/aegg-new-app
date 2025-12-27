import { useState } from 'react'
import { AnnouncementCategory, CreateAnnouncementInput, DashboardRole } from '../../../types'

interface AnnouncementDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (input: CreateAnnouncementInput) => void
}

const roles: DashboardRole[] = ['Admin', 'Gestor', 'Miembro']
const categories: AnnouncementCategory[] = ['Urgente', 'Operativo', 'Actualización']

export const AnnouncementDialog = ({ open, onClose, onSubmit }: AnnouncementDialogProps) => {
    const [title, setTitle] = useState('')
    const [summary, setSummary] = useState('')
    const [category, setCategory] = useState<AnnouncementCategory>('Urgente')
    const [audience, setAudience] = useState<DashboardRole[]>(roles)
    const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(true)

    const handleToggleAudience = (role: DashboardRole) => {
        setAudience((prev) =>
            prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
        )
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!title.trim() || !summary.trim()) {
            return
        }
        onSubmit({
            title: title.trim(),
            summary: summary.trim(),
            category,
            audience,
            requiresAcknowledgement,
        })
        setTitle('')
        setSummary('')
        setAudience(roles)
        setCategory('Urgente')
        setRequiresAcknowledgement(true)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Nuevo comunicado</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Cerrar"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Título
                        </label>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Comunica el objetivo principal"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Resumen
                        </label>
                        <textarea
                            value={summary}
                            onChange={(event) => setSummary(event.target.value)}
                            required
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Incluye acciones, fechas y responsables"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Categoría
                            <select
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value as AnnouncementCategory)
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={requiresAcknowledgement}
                                onChange={(event) =>
                                    setRequiresAcknowledgement(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Requiere confirmación
                        </label>
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">Audiencia</p>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => {
                                const active = audience.includes(role)
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => handleToggleAudience(role)}
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                            active
                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Publicar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
