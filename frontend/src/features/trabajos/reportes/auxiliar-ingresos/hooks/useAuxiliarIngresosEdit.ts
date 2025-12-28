/**
 * Hook para gestionar ediciones en el reporte Auxiliar de Ingresos
 * Mantiene un mapa de cambios en memoria hasta que se guarden
 */

import { useState, useCallback, useMemo } from 'react'
import { AuxiliarIngresosRow, EstadoSat, MiAdminIngresosRow } from '../types'

interface UseAuxiliarIngresosEditProps {
    /** Datos originales del reporte */
    initialData: AuxiliarIngresosRow[]
    /** Datos del reporte Mi Admin para detección de folios únicos */
    miAdminData?: MiAdminIngresosRow[]
}

interface UseAuxiliarIngresosEditReturn {
    /** Datos combinados (originales + ediciones) */
    data: AuxiliarIngresosRow[]
    /** Mapa de ediciones por UUID */
    editedRows: Map<string, Partial<AuxiliarIngresosRow>>
    /** Si hay cambios sin guardar */
    isDirty: boolean
    /** Actualizar tipo de cambio de una fila */
    updateTipoCambio: (uuid: string, tipoCambio: number) => void
    /** Actualizar estado SAT de una fila */
    updateEstadoSat: (uuid: string, estadoSat: EstadoSat) => void
    /** Cancelar folios que no existen en Mi Admin */
    cancelarFoliosUnicos: () => void
    /** Resetear todas las ediciones */
    resetEdits: () => void
    /** Obtener ediciones de una fila específica */
    getRowEdits: (uuid: string) => Partial<AuxiliarIngresosRow> | undefined
}

/**
 * Hook para gestionar el estado de edición del reporte
 * Mantiene cambios en memoria sin mutar los datos originales
 */
export const useAuxiliarIngresosEdit = ({
    initialData,
    miAdminData,
}: UseAuxiliarIngresosEditProps): UseAuxiliarIngresosEditReturn => {
    // Estado: Mapa de ediciones por UUID
    const [editedRows, setEditedRows] = useState<Map<string, Partial<AuxiliarIngresosRow>>>(
        new Map()
    )

    /**
     * Actualiza el tipo de cambio de una fila
     */
    const updateTipoCambio = useCallback((uuid: string, tipoCambio: number) => {
        setEditedRows((prev) => {
            const newMap = new Map(prev)
            const edits = newMap.get(uuid) || {}

            newMap.set(uuid, {
                ...edits,
                tipoCambio,
            })

            return newMap
        })
    }, [])

    /**
     * Actualiza el estado SAT de una fila
     * NOTA: El Tipo de Cambio en Auxiliar de Ingresos es solo informativo,
     * no se puede editar porque el Subtotal ya viene calculado en MXN desde el SAT.
     */
    const updateEstadoSat = useCallback((uuid: string, estadoSat: EstadoSat) => {
        setEditedRows((prev) => {
            const newMap = new Map(prev)
            const edits = newMap.get(uuid) || {}

            newMap.set(uuid, {
                ...edits,
                estadoSat,
            })

            return newMap
        })
    }, [])

    /**
     * Resetea todas las ediciones
     */
    const resetEdits = useCallback(() => {
        setEditedRows(new Map())
    }, [])

    /**
     * Obtiene las ediciones de una fila específica
     */
    const getRowEdits = useCallback(
        (uuid: string): Partial<AuxiliarIngresosRow> | undefined => {
            return editedRows.get(uuid)
        },
        [editedRows]
    )

    /**
     * Combina datos originales con ediciones
     * Recalcula solo cuando cambian initialData o editedRows
     */
    const mergedData = useMemo(() => {
        if (editedRows.size === 0) {
            return initialData
        }

        return initialData.map((row) => {
            const edits = editedRows.get(row.id)

            if (!edits) {
                return row
            }

            // Combinar fila original con ediciones
            return {
                ...row,
                ...edits,
            }
        })
    }, [initialData, editedRows])

    /**
     * Cancela folios que solo existen en Auxiliar (no aparecen en Mi Admin)
     */
    const cancelarFoliosUnicos = useCallback(() => {
        if (!miAdminData || miAdminData.length === 0) {
            return
        }

        const miAdminFolios = new Set(
            miAdminData
                .filter((row) => !row.isSummary && row.estadoSat === 'Vigente')
                .map((row) => row.folio)
        )

        setEditedRows((prev) => {
            let hasChanges = false
            const newMap = new Map(prev)

            // Usar initialData en lugar de mergedData para evitar dependencia circular
            initialData.forEach((row) => {
                if (row.isSummary || row.estadoSat === 'Cancelada') {
                    return
                }

                // Aplicar ediciones previas si existen
                const edits = prev.get(row.id) || {}
                const currentEstadoSat = edits.estadoSat ?? row.estadoSat

                if (currentEstadoSat === 'Cancelada') {
                    return // Ya está cancelada
                }

                if (!miAdminFolios.has(row.folio)) {
                    newMap.set(row.id, {
                        ...edits,
                        estadoSat: 'Cancelada',
                    })
                    hasChanges = true
                }
            })

            return hasChanges ? newMap : prev
        })
    }, [miAdminData, initialData])

    /**
     * Determina si hay cambios sin guardar
     */
    const isDirty = useMemo(() => {
        return editedRows.size > 0
    }, [editedRows])

    return {
        data: mergedData,
        editedRows,
        isDirty,
        updateTipoCambio,
        updateEstadoSat,
        cancelarFoliosUnicos,
        resetEdits,
        getRowEdits,
    }
}
