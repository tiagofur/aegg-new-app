import { useEffect, useState } from 'react'
import { AppUser, DashboardRole } from '../../../types'

export interface UserFormValues {
    name: string
    email: string
    role: DashboardRole
    password?: string
}

interface UserFormDialogProps {
    open: boolean
    mode: 'create' | 'edit'
    initialData?: AppUser
    loading?: boolean
    onClose: () => void
    onSubmit: (values: UserFormValues) => void
}

const roles: DashboardRole[] = ['Admin', 'Gestor', 'Miembro']

export const UserFormDialog = ({
    open,
    mode,
    initialData,
    loading,
    onClose,
    onSubmit,
}: UserFormDialogProps) => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<DashboardRole>('Gestor')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setName(initialData?.name ?? '')
            setEmail(initialData?.email ?? '')
            setRole(initialData?.role ?? 'Gestor')
            setPassword('')
            setConfirmPassword('')
            setError(null)
        }
    }, [open, initialData])

    if (!open) return null

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const trimmedName = name.trim()
        const trimmedEmail = email.trim()

        if (!trimmedName) {
            setError('El nombre es obligatorio')
            return
        }

        if (!trimmedEmail) {
            setError('El correo es obligatorio')
            return
        }

        if (mode === 'create' && password.trim().length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        if (password && password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setError(null)

        onSubmit({
            name: trimmedName,
            email: trimmedEmail,
            role,
            password: password ? password.trim() : undefined,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {mode === 'create' ? 'Crear usuario' : 'Editar usuario'}
                    </h2>
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
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Nombre completo
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Ingresa el nombre"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Correo
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="usuario@empresa.com"
                            />
                        </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Rol
                            <select
                                value={role}
                                onChange={(event) => setRole(event.target.value as DashboardRole)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                {roles.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Contraseña{' '}
                            {mode === 'edit' && (
                                <span className="text-xs font-normal text-slate-500">
                                    (opcional)
                                </span>
                            )}
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                minLength={mode === 'create' ? 6 : 0}
                                required={mode === 'create'}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder={
                                    mode === 'create'
                                        ? 'Define una contraseña inicial'
                                        : 'Dejar vacío para mantener actual'
                                }
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                            Confirmar contraseña
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                minLength={mode === 'create' ? 6 : 0}
                                required={mode === 'create'}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Repite la contraseña"
                            />
                        </label>
                        <div className="hidden sm:block" />
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? 'Guardando...'
                                : mode === 'create'
                                  ? 'Crear'
                                  : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
