import { useCallback, useEffect, useRef, useState } from 'react'
import { EstadoAprobacion } from '../../../types'

export interface TrabajosFilters {
    search: string
    year?: number
    clienteId?: string
    estado?: EstadoAprobacion
}

const DEFAULT_FILTERS: TrabajosFilters = {
    search: '',
    year: undefined,
    clienteId: undefined,
    estado: undefined,
}

const STORAGE_PREFIX = 'trabajos-filters'

const parseFilters = (raw: string | null): TrabajosFilters => {
    if (!raw) {
        return DEFAULT_FILTERS
    }

    try {
        const parsed = JSON.parse(raw) as TrabajosFilters
        const year = typeof parsed.year === 'number' ? parsed.year : undefined
        const clienteId = typeof parsed.clienteId === 'string' ? parsed.clienteId : undefined
        const search = typeof parsed.search === 'string' ? parsed.search : ''
        const estado =
            typeof parsed.estado === 'string' ? (parsed.estado as EstadoAprobacion) : undefined
        return {
            year,
            clienteId,
            search,
            estado,
        }
    } catch (error) {
        console.warn('No fue posible leer los filtros almacenados', error)
        return DEFAULT_FILTERS
    }
}

export const useTrabajosFilters = (storageKey?: string) => {
    const [filters, setFilters] = useState<TrabajosFilters>(DEFAULT_FILTERS)
    const initialized = useRef(false)
    const finalKey = storageKey ? `${STORAGE_PREFIX}:${storageKey}` : STORAGE_PREFIX

    useEffect(() => {
        const stored = window.localStorage.getItem(finalKey)
        const parsed = parseFilters(stored)
        setFilters(parsed)
        initialized.current = true
    }, [finalKey])

    useEffect(() => {
        if (!initialized.current) {
            return
        }

        window.localStorage.setItem(finalKey, JSON.stringify(filters))
    }, [filters, finalKey])

    const updateFilters = useCallback((partial: Partial<TrabajosFilters>) => {
        setFilters((prev) => ({ ...prev, ...partial }))
    }, [])

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS)
    }, [])

    return {
        filters,
        updateFilters,
        resetFilters,
    }
}
