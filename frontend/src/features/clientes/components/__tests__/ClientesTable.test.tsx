import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ClientesTable } from '../ClientesTable'
import type { Cliente, ClientesPaginatedResult } from '../../../../types'

const listMock = vi.fn()
const removeMock = vi.fn()

vi.mock('../../../../services', () => ({
    clientesService: {
        list: (...args: unknown[]) => listMock(...args),
        remove: (...args: unknown[]) => removeMock(...args),
    },
}))

const makeCliente = (overrides: Partial<Cliente> = {}): Cliente => ({
    id: overrides.id ?? 'cliente-1',
    nombre: overrides.nombre ?? 'Cliente Demo',
    rfc: overrides.rfc ?? 'RFC123456',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    metadata: overrides.metadata ?? {},
    razonSocial: overrides.razonSocial,
    contactoPrincipal: overrides.contactoPrincipal,
    direccion: overrides.direccion,
})

const makeResult = (clientes: Cliente[]): ClientesPaginatedResult => ({
    data: clientes,
    total: clientes.length,
    page: 1,
    limit: 10,
})

describe('ClientesTable', () => {
    beforeEach(() => {
        listMock.mockReset()
        removeMock.mockReset()
    })

    it('oculta las acciones de gestión cuando el usuario no puede administrar', async () => {
        listMock.mockResolvedValue(makeResult([makeCliente()]))

        render(
            <ClientesTable
                onRequestCreate={vi.fn()}
                onRequestEdit={vi.fn()}
                refreshToken={0}
                canManage={false}
            />
        )

        await waitFor(() => expect(listMock).toHaveBeenCalled())

        expect(screen.queryByRole('button', { name: /nuevo cliente/i })).toBeNull()
        expect(screen.queryByRole('button', { name: /editar/i })).toBeNull()
        expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull()
    })

    it('muestra las acciones de gestión cuando el usuario puede administrar', async () => {
        listMock.mockResolvedValue(makeResult([makeCliente()]))

        const handleCreate = vi.fn()

        render(
            <ClientesTable
                onRequestCreate={handleCreate}
                onRequestEdit={vi.fn()}
                refreshToken={0}
                canManage={true}
            />
        )

        await waitFor(() => expect(listMock).toHaveBeenCalled())

        const createButton = await screen.findByRole('button', {
            name: /nuevo cliente/i,
        })
        expect(createButton).toBeInTheDocument()

        await userEvent.click(createButton)
        expect(handleCreate).toHaveBeenCalled()
    })
})
