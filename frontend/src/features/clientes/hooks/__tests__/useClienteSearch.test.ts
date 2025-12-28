import { act, renderHook } from '@testing-library/react'
import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
import { useClienteSearch } from '../useClienteSearch'
import type { Cliente, ClientesPaginatedResult } from '../../../../types'
import { clientesService } from '../../../../services'

const listMock = vi.spyOn(clientesService, 'list')

const flushAsync = async () => {
    await act(async () => {
        await Promise.resolve()
    })
}

const createResult = (data: Cliente[]): ClientesPaginatedResult => ({
    data,
    total: data.length,
    page: 1,
    limit: 20,
})

describe('useClienteSearch', () => {
    beforeEach(() => {
        listMock.mockReset()
    })

    afterAll(() => {
        listMock.mockRestore()
    })

    it('realiza la búsqueda inicial al montar y actualiza el estado', async () => {
        const cliente: Cliente = {
            id: 'cliente-1',
            nombre: 'Cliente Demo',
            rfc: 'RFC123456',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {},
        }

        listMock.mockResolvedValueOnce(createResult([cliente]))

        const { result } = renderHook(() => useClienteSearch())

        await flushAsync()
        expect(listMock).toHaveBeenCalledTimes(1)
        expect(listMock).toHaveBeenCalledWith({ search: undefined, limit: 20 })
        await flushAsync()

        expect(result.current.clientes).toEqual([cliente])
        expect(result.current.total).toBe(1)
        expect(result.current.error).toBeNull()
    })

    it('aplica debounce antes de disparar nuevas búsquedas', async () => {
        vi.useFakeTimers()

        try {
            listMock.mockResolvedValue(createResult([]))

            const { result } = renderHook(() => useClienteSearch({ debounceMs: 200 }))

            await flushAsync()
            listMock.mockClear()

            act(() => {
                result.current.setSearch('ACME')
            })

            expect(listMock).not.toHaveBeenCalled()

            await act(async () => {
                await vi.advanceTimersByTimeAsync(199)
            })
            expect(listMock).not.toHaveBeenCalled()

            await act(async () => {
                await vi.advanceTimersByTimeAsync(1)
            })
            await flushAsync()
            expect(listMock).toHaveBeenCalledTimes(1)
            expect(listMock).toHaveBeenLastCalledWith({ search: 'ACME', limit: 20 })
        } finally {
            vi.useRealTimers()
        }
    })

    it('propaga errores cuando la búsqueda falla', async () => {
        vi.useFakeTimers()

        try {
            listMock
                .mockResolvedValueOnce(createResult([]))
                .mockRejectedValueOnce(new Error('fallo'))

            const { result } = renderHook(() => useClienteSearch())

            await flushAsync()

            act(() => {
                result.current.setSearch('XYZ')
            })

            await act(async () => {
                await vi.advanceTimersByTimeAsync(300)
            })
            await flushAsync()

            expect(result.current.error).toBe('fallo')
            expect(result.current.clientes).toEqual([])
            expect(result.current.total).toBe(0)
        } finally {
            vi.useRealTimers()
        }
    })

    it('permite refrescar manualmente los resultados', async () => {
        vi.useFakeTimers()

        try {
            listMock.mockResolvedValue(createResult([]))

            const { result } = renderHook(() => useClienteSearch())

            await flushAsync()
            listMock.mockClear()

            await act(async () => {
                result.current.refresh()
            })

            await flushAsync()
            expect(listMock).toHaveBeenCalledTimes(1)
        } finally {
            vi.useRealTimers()
        }
    })
})
