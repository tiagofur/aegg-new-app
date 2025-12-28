/**
 * Tabla principal de Mi Admin Ingresos
 * Integra todos los hooks y componentes del feature con columnas específicas
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table'

import { useMiAdminIngresosData } from '../hooks/useMiAdminIngresosData'

import { useAuxiliarIngresosData } from '../../auxiliar-ingresos/hooks/useAuxiliarIngresosData'

import { useMiAdminIngresosEdit } from '../hooks/useMiAdminIngresosEdit'

import { useMiAdminIngresosCalculations } from '../hooks/useMiAdminIngresosCalculations'

import { useMiAdminIngresosComparison } from '../hooks/useMiAdminIngresosComparison'

import { MiAdminIngresosToolbar } from './MiAdminIngresosToolbar'

import { MiAdminIngresosFooter } from './MiAdminIngresosFooter'

import { getRowBackgroundColor, createMiAdminDynamicColumns } from '../utils'

import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos'
import type { MiAdminIngresosTotales } from '../types'

interface MiAdminIngresosTableProps {
    /** ID del mes */

    mesId: string | undefined

    /** ID del reporte */

    reporteId: string | undefined

    /** Marca de tiempo del reporte para invalidar cache */
    reporteVersion?: string | number | null

    /** Datos de Auxiliar Ingresos para integración */

    auxiliarData: AuxiliarIngresosRow[] | undefined

    /** ID del reporte Auxiliar (para cargar datos si no se proporcionan) */
    auxiliarReporteId?: string

    /** Versión del reporte Auxiliar (fecha importación/actualización) */
    auxiliarReporteVersion?: string | number | null

    /** ID del trabajo (para Guardar en Base) */

    trabajoId?: string

    /** Año del trabajo (para Guardar en Base) */

    anio?: number

    /** Mes del trabajo (para Guardar en Base) */

    mes?: number

    /** Permite portalizar el botón de guardar fuera del toolbar */
    onSaveContextChange?: (
        context: {
            save: () => Promise<void>
            isDirty: boolean
            isSaving: boolean
        } | null
    ) => void

    /** Controla si se muestra el botón de guardar en la barra interna */
    showSaveButtonInToolbar?: boolean
    /** Controla si se muestra el botón de sincronización en el toolbar */
    showComparisonButtonInToolbar?: boolean
    /** Controla si se muestran los badges de estado en el toolbar */
    showStatusBadgesInToolbar?: boolean
    /** Permite portalizar el botón Guardar en Base fuera del toolbar */
    onGuardarEnBaseContextChange?: (
        context: {
            trabajoId: string
            anio: number
            mes: number
            totalMiAdmin: number
            totalAuxiliar: number | null
            hasAuxiliarData: boolean
            isDirty: boolean
        } | null
    ) => void
    /** Estado controlado de la comparación */
    comparisonActive?: boolean
    /** Callback cuando cambia el estado de comparación */
    onComparisonActiveChange?: (active: boolean) => void
    /** Notifica al contenedor los totales para mostrarlos en el resumen */
    onTotalesResumenChange?: (totales: MiAdminIngresosTotales | null) => void
    /** Expone las acciones masivas disponibles en la tabla */
    onAutomationActionsChange?: (
        actions: {
            aplicarTCSugeridoATodos: () => void
            cancelarFoliosUnicos: () => void
            isSaving: boolean
            isComparisonActive: boolean
            hasAuxiliarData: boolean
        } | null
    ) => void
    /** Si es true, deshabilita la edición de celdas */
    isReadOnly?: boolean
}

/**

 * Componente principal de tabla de Mi Admin Ingresos

 */

export const MiAdminIngresosTable: React.FC<MiAdminIngresosTableProps> = ({
    mesId,

    reporteId,

    reporteVersion,

    auxiliarData: providedAuxiliarData,

    auxiliarReporteId,

    auxiliarReporteVersion,

    trabajoId,

    anio,

    mes,

    onSaveContextChange,

    showSaveButtonInToolbar = true,
    showComparisonButtonInToolbar = true,
    showStatusBadgesInToolbar = true,
    onGuardarEnBaseContextChange,
    comparisonActive,
    onComparisonActiveChange,
    onTotalesResumenChange,
    onAutomationActionsChange,
    isReadOnly = false,
}) => {
    // 🔥 Si no se proporciona auxiliarData, buscar el reporte Auxiliar del mismo mes

    const { data: loadedAuxiliarData } = useAuxiliarIngresosData({
        mesId: mesId || '',

        reporteId: auxiliarReporteId || '',

        version: auxiliarReporteVersion,

        enabled: !providedAuxiliarData && !!mesId && !!auxiliarReporteId,
    })

    // Usar los datos proporcionados o los cargados

    const auxiliarData = providedAuxiliarData || loadedAuxiliarData

    // Hooks de datos y lógica

    const { data, isLoading, error, handleSave, isSaving } = useMiAdminIngresosData({
        mesId,

        reporteId,

        auxiliarData,

        version: reporteVersion,
    })

    const {
        editedData,

        hasUnsavedChanges,

        updateTipoCambio,

        updateEstadoSat,

        aplicarTCSugerido,

        aplicarTCSugeridoATodos,

        cancelarFoliosUnicos,

        resetChanges,
    } = useMiAdminIngresosEdit({
        data,

        auxiliarData,
    })

    const { totales, dataWithTotals } = useMiAdminIngresosCalculations({
        data: editedData,
    })

    const {
        comparisonMap,

        totalesComparison,

        isComparisonActive,

        toggleComparison,
    } = useMiAdminIngresosComparison({
        miAdminData: editedData,

        auxiliarData,
        comparisonActive,
        onComparisonActiveChange,
    })

    const hasAuxiliarData = Boolean(auxiliarData && auxiliarData.length > 0)
    const totalAuxiliar = useMemo(() => {
        if (!hasAuxiliarData || !auxiliarData) {
            return null
        }

        return auxiliarData
            .filter((row) => row.estadoSat === 'Vigente')
            .reduce((sum, row) => sum + Number(row.subtotal ?? 0), 0)
    }, [auxiliarData, hasAuxiliarData])

    useEffect(() => {
        if (!onGuardarEnBaseContextChange) {
            return
        }

        if (!trabajoId || !anio || !mes || !hasAuxiliarData) {
            onGuardarEnBaseContextChange(null)
            return
        }

        onGuardarEnBaseContextChange({
            trabajoId,
            anio,
            mes,
            totalMiAdmin: totales.totalSubtotalMXN,
            totalAuxiliar,
            hasAuxiliarData,
            isDirty: hasUnsavedChanges,
        })

        return () => {
            onGuardarEnBaseContextChange(null)
        }
    }, [
        onGuardarEnBaseContextChange,
        trabajoId,
        anio,
        mes,
        hasAuxiliarData,
        totales.totalSubtotalMXN,
        totalAuxiliar,
        hasUnsavedChanges,
    ])

    useEffect(() => {
        if (!hasUnsavedChanges || isSaving || !mesId || !reporteId) {
            return
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                await handleSave(editedData)

                resetChanges()
            } catch (autoSaveError) {
                console.error(
                    '❌ Error auto-guardando Mi Admin Ingresos:',

                    autoSaveError
                )
            }
        }, 2000)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [editedData, handleSave, hasUnsavedChanges, isSaving, mesId, reporteId, resetChanges])

    // State local para sorting y filtering

    const [sorting, setSorting] = useState<SortingState>([])

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    // 🔥 DEFINICIÓN DE COLUMNAS 100% DINÁMICA USANDO LA FÁBRICA

    const columns = useMemo(() => {
        // Empaquetar todos los callbacks para pasarlos a la fábrica

        const callbacks = {
            updateTipoCambio,

            updateEstadoSat,

            aplicarTCSugerido,
        }

        return createMiAdminDynamicColumns(dataWithTotals, callbacks, {
            isComparisonActive,
            isReadOnly,
        })
    }, [
        dataWithTotals,
        updateTipoCambio,
        updateEstadoSat,
        aplicarTCSugerido,
        isComparisonActive,
        isReadOnly,
    ])

    // Configuración de TanStack Table
    const table = useReactTable({
        data: dataWithTotals || [],
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const latestEditedDataRef = useRef(editedData)
    useEffect(() => {
        latestEditedDataRef.current = editedData
    }, [editedData])

    const saveHandlerRef = useRef<() => Promise<void>>(async () => {})

    useEffect(() => {
        saveHandlerRef.current = async () => {
            await handleSave(latestEditedDataRef.current)
            resetChanges()
        }
    }, [handleSave, resetChanges])

    // Handler para guardar
    const handleSaveClick = useCallback(async () => {
        await saveHandlerRef.current()
    }, [])

    useEffect(() => {
        if (onSaveContextChange) {
            onSaveContextChange({
                save: handleSaveClick,
                isDirty: hasUnsavedChanges,
                isSaving,
            })
        }
    }, [onSaveContextChange, handleSaveClick, hasUnsavedChanges, isSaving])

    useEffect(() => {
        return () => {
            onSaveContextChange?.(null)
        }
    }, [onSaveContextChange])

    useEffect(() => {
        if (!onAutomationActionsChange) {
            return
        }

        onAutomationActionsChange({
            aplicarTCSugeridoATodos,
            cancelarFoliosUnicos,
            isSaving,
            isComparisonActive,
            hasAuxiliarData,
        })
    }, [
        onAutomationActionsChange,
        aplicarTCSugeridoATodos,
        cancelarFoliosUnicos,
        isSaving,
        isComparisonActive,
        hasAuxiliarData,
    ])

    useEffect(() => {
        return () => {
            onAutomationActionsChange?.(null)
        }
    }, [onAutomationActionsChange])

    useEffect(() => {
        if (!onTotalesResumenChange) {
            return
        }
        onTotalesResumenChange(totales)
    }, [onTotalesResumenChange, totales])

    useEffect(() => {
        return () => {
            onTotalesResumenChange?.(null)
        }
    }, [onTotalesResumenChange])

    // Estados de carga y error
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando reporte Mi Admin Ingresos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
                <h3 className="text-red-800 font-semibold mb-2">Error al cargar reporte</h3>
                <p className="text-red-600">{(error as Error).message}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <MiAdminIngresosToolbar
                isDirty={hasUnsavedChanges}
                onSave={handleSaveClick}
                isSaving={isSaving}
                isComparisonActive={isComparisonActive}
                onToggleComparison={toggleComparison}
                totales={totales}
                totalesComparison={totalesComparison}
                hasAuxiliarData={hasAuxiliarData}
                showSaveButton={showSaveButtonInToolbar}
                showComparisonButton={showComparisonButtonInToolbar}
                showStatusBadges={showStatusBadgesInToolbar}
            />

            {/* Table container */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2 border-gray-300"
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={
                                                    header.column.getCanSort()
                                                        ? 'cursor-pointer select-none flex items-center gap-2'
                                                        : ''
                                                }
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.map((row) => {
                            const comparison = comparisonMap.get(row.original.folio)
                            const bgClass = getRowBackgroundColor(
                                row.original,
                                comparison,
                                isComparisonActive
                            )

                            return (
                                <tr key={row.id} className={bgClass}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-2 border-b border-gray-200"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer con totales */}
            <MiAdminIngresosFooter
                totales={totales}
                totalesComparison={totalesComparison}
                isComparisonActive={isComparisonActive}
            />
        </div>
    )
}
