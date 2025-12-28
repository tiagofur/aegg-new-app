import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cliente } from '../../types'
import type { ReactNode } from 'react'

const mockCliente: Cliente = {
    id: 'cliente-page-mock',
    nombre: 'Cliente Página',
    rfc: 'RFC000111',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
}

function clientesModuleFactory() {
    const ClientesTable = ({
        onRequestCreate,
        onRequestEdit,
        refreshToken,
    }: {
        onRequestCreate: () => void
        onRequestEdit: (cliente: Cliente) => void
        refreshToken: number
    }) => (
        <div data-testid="clientes-table">
            <div data-testid="refresh-token">{refreshToken}</div>
            <button type="button" onClick={() => onRequestCreate()}>
                Abrir modal crear
            </button>
            <button type="button" onClick={() => onRequestEdit(mockCliente)}>
                Abrir modal editar
            </button>
        </div>
    )

    const ClienteFormModal = ({
        open,
        onClose,
        onSaved,
        initialData,
    }: {
        open: boolean
        onClose: () => void
        onSaved: (cliente: Cliente) => void
        initialData?: Cliente | null
    }) => {
        if (!open) return null
        return (
            <div data-testid="cliente-form-modal">
                <span data-testid="modal-mode">{initialData ? 'edit' : 'create'}</span>
                <button type="button" onClick={() => onSaved(mockCliente)}>
                    Guardar cliente mock
                </button>
                <button type="button" onClick={onClose}>
                    Cerrar modal mock
                </button>
            </div>
        )
    }

    return {
        ClientesTable,
        ClienteFormModal,
    }
}

vi.mock('../../components/layout/AppShell', () => ({
    AppShell: ({ children }: { children: ReactNode }) => (
        <div data-testid="app-shell">{children}</div>
    ),
    default: ({ children }: { children: ReactNode }) => (
        <div data-testid="app-shell">{children}</div>
    ),
}))

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'tester',
            role: 'Gestor',
        },
    }),
}))

vi.mock('../../features/clientes', clientesModuleFactory)
vi.mock('@/features/clientes', clientesModuleFactory)

let ClientesPage: typeof import('../ClientesPage').ClientesPage

beforeAll(async () => {
    ;({ ClientesPage } = await import('../ClientesPage'))
})

describe('ClientesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('abre el modal en modo creación y refresca la tabla al guardar', async () => {
        const user = userEvent.setup()

        render(<ClientesPage />)

        expect(screen.getByTestId('refresh-token')).toHaveTextContent('0')

        await user.click(screen.getByRole('button', { name: /abrir modal crear/i }))
        expect(await screen.findByTestId('cliente-form-modal')).toBeInTheDocument()
        expect(screen.getByTestId('modal-mode')).toHaveTextContent('create')

        await user.click(screen.getByRole('button', { name: /guardar cliente mock/i }))

        await waitFor(() =>
            expect(screen.queryByTestId('cliente-form-modal')).not.toBeInTheDocument()
        )
        await waitFor(() => expect(screen.getByTestId('refresh-token')).toHaveTextContent('1'))
    })

    it('abre el modal en modo edición cuando se elige un cliente existente', async () => {
        const user = userEvent.setup()

        render(<ClientesPage />)

        await user.click(screen.getByRole('button', { name: /abrir modal editar/i }))
        const modal = await screen.findByTestId('cliente-form-modal')
        expect(modal).toBeInTheDocument()
        expect(screen.getByTestId('modal-mode')).toHaveTextContent('edit')
    })
})
