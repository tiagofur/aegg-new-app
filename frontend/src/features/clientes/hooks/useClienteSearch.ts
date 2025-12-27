import { useCallback, useEffect, useRef, useState } from 'react'
import { clientesService } from '../../../services'
import { Cliente } from '../../../types'

export interface UseClienteSearchOptions {
    initialSearch?: string
    limit?: number
    debounceMs?: number
}

export interface UseClienteSearchResult {
    search: string
    setSearch: (value: string) => void
    clientes: Cliente[]
    total: number
    loading: boolean
    error: string | null
    refresh: () => void
}

export const useClienteSearch = (options: UseClienteSearchOptions = {}): UseClienteSearchResult => {
    const { initialSearch = '', limit = 20, debounceMs = 300 } = options
    const [search, setSearch] = useState(initialSearch)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const latestRequest = useRef(0)
    const firstRun = useRef(true)

    const fetchClientes = useCallback(
        async (term: string) => {
            const requestId = ++latestRequest.current
            setLoading(true)
            setError(null)

            try {
                const result = await clientesService.list({
                    search: term.trim() || undefined,
                    limit,
                })

                if (latestRequest.current !== requestId) {
                    return
                }

                setClientes(result.data)
                setTotal(result.total)
            } catch (err: any) {
                if (latestRequest.current !== requestId) {
                    return
                }

                const message =
                    err?.response?.data?.message || err?.message || 'Error al buscar clientes'
                setClientes([])
                setTotal(0)
                setError(message)
            } finally {
                if (latestRequest.current === requestId) {
                    setLoading(false)
                }
            }
        },
        [limit]
    )

    const refresh = useCallback(() => {
        void fetchClientes(search)
    }, [fetchClientes, search])

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false
            void fetchClientes(search)
            return
        }

        const handler = setTimeout(() => {
            void fetchClientes(search)
        }, debounceMs)

        return () => clearTimeout(handler)
    }, [debounceMs, fetchClientes, search])

    return {
        search,
        setSearch,
        clientes,
        total,
        loading,
        error,
        refresh,
    }
}
