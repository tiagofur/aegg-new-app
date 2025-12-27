import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trabajo } from '../../../types/trabajo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

global.alert = vi.fn()

const navigateMock = vi.fn()
const updateMock = vi.fn()
const deleteMock = vi.fn()
const limpiarDatosMock = vi.fn()

const mockUser = { id: 'gestor-1', email: 'gestor@example.com', role: 'Admin' }

function servicesMock() {
    return {
        trabajosService: {
            delete: deleteMock,
            update: updateMock,
        },
        reportesMensualesService: {
            limpiarDatos: limpiarDatosMock,
            procesarYGuardar: vi.fn(),
        },
    }
}

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => navigateMock,
        useLocation: () => ({
            pathname: '/trabajos',
            search: '',
            hash: '',
            state: null,
            key: 'default',
        }),
    }
})

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        token: 'test-token',
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
    }),
}))

vi.mock('../../services', servicesMock)
vi.mock('@/services', servicesMock)

let TrabajoDetail: typeof import('../TrabajoDetail').TrabajoDetail

beforeAll(async () => {
    ;({ TrabajoDetail } = await import('../TrabajoDetail'))
})

const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{component}</MemoryRouter>
        </QueryClientProvider>
    )
}

describe('TrabajoDetail', () => {
    const baseTrabajo: Trabajo = {
        id: 'trabajo-aprobado',
        clienteId: 'cliente-1',
        clienteNombre: 'Cliente Demo',
        clienteRfc: 'RFC123456',
        anio: 2024,
        estado: 'ACTIVO',
        estadoAprobacion: 'APROBADO',
        visibilidadEquipo: true,
        miembroAsignadoId: 'user-1',
        gestorResponsableId: 'gestor-1',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        meses: [],
        miembroAsignado: { id: 'user-1', email: 'user@example.com' },
        aprobadoPor: { id: 'gestor-1', email: 'gestor@example.com' },
        gestorResponsable: {
            id: 'gestor-1',
            email: 'gestor@example.com',
        },
    }

    const defaultProps = {
        onAddMes: vi.fn(),
        onBack: vi.fn(),
        onReload: vi.fn(),
        canManage: true,
        canManageReportesMensuales: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('bloquea acciones de edición cuando el trabajo está aprobado', () => {
        renderWithProviders(<TrabajoDetail trabajo={baseTrabajo} {...defaultProps} />)

        expect(screen.queryByRole('button', { name: /editar/i })).toBeNull()
        expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull()

        const reopenButton = screen.getByRole('button', {
            name: /reabrir trabajo/i,
        })
        expect(reopenButton).toBeEnabled()

        const importButton = screen.getByRole('button', { name: /importar/i })
        expect(importButton).toBeDisabled()
    })

    it('reabre el trabajo aprobado cuando el Gestor lo confirma', async () => {
        const user = userEvent.setup()
        const onReload = vi.fn()
        const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)

        renderWithProviders(
            <TrabajoDetail trabajo={baseTrabajo} {...defaultProps} onReload={onReload} />
        )

        const reopenButton = screen.getByRole('button', {
            name: /reabrir trabajo/i,
        })

        await user.click(reopenButton)

        expect(updateMock).toHaveBeenCalledWith('trabajo-aprobado', {
            estadoAprobacion: 'REABIERTO',
            aprobadoPorId: null,
        })

        await waitFor(() => expect(onReload).toHaveBeenCalled())

        confirmSpy.mockRestore()
    })
})
