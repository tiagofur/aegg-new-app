import { act, renderHook } from '@testing-library/react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAprobacionesDashboard } from '../useAprobacionesDashboard'
import { trabajosService } from '../../../../services'
import type {
    AprobacionesDashboardData,
    AprobacionActividad,
    AprobacionTrabajoResumen,
} from '../../../../types'

const dashboardMock = vi.spyOn(trabajosService, 'getAprobacionesDashboard')

const createDashboardPayload = (
    overrides: Partial<AprobacionesDashboardData> = {}
): AprobacionesDashboardData => ({
    resumenEstados: {
        EN_PROGRESO: 1,
        EN_REVISION: 2,
        APROBADO: 3,
        REABIERTO: 0,
        ...overrides.resumenEstados,
    },
    pendientes: overrides.pendientes ?? [
        {
            id: 'trabajo-1',
            trabajoId: 'trabajo-1',
            clienteNombre: 'Cliente Demo',
            anio: 2025,
            estadoAprobacion: 'EN_REVISION',
            estadoRevision: 'ENVIADO',
            fechaActualizacion: new Date().toISOString(),
            comentariosPendientes: 2,
        } satisfies AprobacionTrabajoResumen,
    ],
    recientes: overrides.recientes ?? [
        {
            trabajoId: 'trabajo-1',
            titulo: 'Revisión cargada',
            descripcion: 'Se subió el reporte mensual',
            fecha: new Date().toISOString(),
            estadoAprobacion: 'EN_REVISION',
            estadoRevision: 'ENVIADO',
        } satisfies AprobacionActividad,
    ],
})

const flushPromises = async () => {
    await act(async () => {
        await Promise.resolve()
    })
}

describe('useAprobacionesDashboard', () => {
    beforeEach(() => {
        dashboardMock.mockReset()
    })

    afterAll(() => {
        dashboardMock.mockRestore()
    })

    it('carga el dashboard inicial al montar', async () => {
        const payload = createDashboardPayload()
        dashboardMock.mockResolvedValueOnce(payload)

        const { result } = renderHook(() => useAprobacionesDashboard())

        expect(result.current.loading).toBe(true)
        await flushPromises()

        expect(dashboardMock).toHaveBeenCalledTimes(1)
        expect(dashboardMock).toHaveBeenCalledWith({})
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toEqual(payload)
        expect(result.current.error).toBeNull()
    })

    it('permite actualizar filtros y vuelve a consultar el servicio', async () => {
        dashboardMock.mockResolvedValue(createDashboardPayload())

        const { result } = renderHook(() => useAprobacionesDashboard())
        await flushPromises()
        dashboardMock.mockClear()

        dashboardMock.mockResolvedValueOnce(createDashboardPayload())

        await act(async () => {
            result.current.updateFilters({ estado: 'EN_PROGRESO' })
        })

        await flushPromises()
        expect(dashboardMock).toHaveBeenCalledTimes(1)
        expect(dashboardMock).toHaveBeenLastCalledWith({ estado: 'EN_PROGRESO' })
    })

    it('expone errores cuando la carga falla', async () => {
        dashboardMock.mockRejectedValueOnce(new Error('fallo'))

        const { result } = renderHook(() => useAprobacionesDashboard())
        await flushPromises()

        expect(result.current.error).toBe('fallo')
        expect(result.current.data.resumenEstados.EN_PROGRESO).toBe(0)
    })

    it('permite refrescar manualmente', async () => {
        dashboardMock.mockResolvedValue(createDashboardPayload())

        const { result } = renderHook(() => useAprobacionesDashboard())
        await flushPromises()
        dashboardMock.mockClear()

        dashboardMock.mockResolvedValueOnce(createDashboardPayload())

        await act(async () => {
            result.current.refetch()
        })

        await flushPromises()
        expect(dashboardMock).toHaveBeenCalledTimes(1)
    })
})
