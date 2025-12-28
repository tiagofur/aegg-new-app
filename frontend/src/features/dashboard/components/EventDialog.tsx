import { useState } from 'react'
import { CalendarEventType, CreateEventInput } from '../../../types'

interface EventDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (input: CreateEventInput) => void
}

const eventTypes: CalendarEventType[] = ['Corte', 'Mantenimiento', 'Reunión', 'Recordatorio']

export const EventDialog = ({ open, onClose, onSubmit }: EventDialogProps) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
    const [type, setType] = useState<CalendarEventType>('Reunión')

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!title.trim() || !description.trim()) {
            return
        }
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            date,
            type,
        })
        setTitle('')
        setDescription('')
        setDate(new Date().toISOString().slice(0, 16))
        setType('Reunión')
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Nuevo evento</h2>
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
                            placeholder="Describe el evento"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            required
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder="Incluye lugar, participantes y objetivo"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Fecha y hora
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                required
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Tipo
                            <select
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value as CalendarEventType)
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                {eventTypes.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
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
                            Programar evento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
