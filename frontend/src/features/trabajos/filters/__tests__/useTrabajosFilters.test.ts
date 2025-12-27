import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTrabajosFilters } from '../useTrabajosFilters'

const STORAGE_KEY = 'trabajos-filters'

describe('useTrabajosFilters', () => {
    beforeEach(() => {
        const store = new Map<string, string>()
        vi.stubGlobal('localStorage', {
            getItem(key: string) {
                return store.get(key) ?? null
            },
            setItem(key: string, value: string) {
                store.set(key, value)
            },
            removeItem(key: string) {
                store.delete(key)
            },
            clear() {
                store.clear()
            },
        })
    })

    afterEach(() => {
        ;(globalThis.localStorage as any)?.clear?.()
        vi.unstubAllGlobals()
    })

    it('lee los filtros desde localStorage al iniciar', () => {
        const stored = JSON.stringify({
            year: 2024,
            clienteId: 'cliente-1',
            search: 'demo',
            estado: 'EN_REVISION',
        })
        window.localStorage.setItem(STORAGE_KEY, stored)

        const { result } = renderHook(() => useTrabajosFilters())

        expect(result.current.filters).toEqual({
            year: 2024,
            clienteId: 'cliente-1',
            search: 'demo',
            estado: 'EN_REVISION',
        })
    })

    it('actualiza y persiste los filtros', async () => {
        const { result } = renderHook(() => useTrabajosFilters())

        await act(async () => {
            result.current.updateFilters({ search: 'cliente' })
            result.current.updateFilters({ year: 2025 })
            result.current.updateFilters({ estado: 'APROBADO' })
        })

        expect(result.current.filters.search).toBe('cliente')
        expect(result.current.filters.year).toBe(2025)
        expect(result.current.filters.estado).toBe('APROBADO')
        const storedValue = window.localStorage.getItem(STORAGE_KEY)
        expect(storedValue).toBeTruthy()
        expect(JSON.parse(storedValue as string)).toEqual({
            search: 'cliente',
            year: 2025,
            estado: 'APROBADO',
        })
    })

    it('restablece filtros a valores por defecto', async () => {
        const { result } = renderHook(() => useTrabajosFilters())

        await act(async () => {
            result.current.updateFilters({ search: 'abc' })
            result.current.resetFilters()
        })

        expect(result.current.filters).toEqual({
            year: undefined,
            clienteId: undefined,
            estado: undefined,
            search: '',
        })
    })

    it('soporta claves de almacenamiento personalizadas', async () => {
        const { result } = renderHook(() => useTrabajosFilters('tester'))

        await act(async () => {
            result.current.updateFilters({ year: 2023 })
        })

        const customStored = window.localStorage.getItem(`${STORAGE_KEY}:tester`)
        expect(customStored).toBeTruthy()
        expect(JSON.parse(customStored as string)).toEqual({
            year: 2023,
            search: '',
        })
    })
})
