/**
 * Tabla principal de Mi Admin Ingresos
 * Integra todos los hooks y componentes del feature con columnas específicas
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import { useMiAdminIngresosData } from "../hooks/useMiAdminIngresosData";

import { useAuxiliarIngresosData } from "../../auxiliar-ingresos/hooks/useAuxiliarIngresosData";

import { useMiAdminIngresosEdit } from "../hooks/useMiAdminIngresosEdit";

import { useMiAdminIngresosCalculations } from "../hooks/useMiAdminIngresosCalculations";

import { useMiAdminIngresosComparison } from "../hooks/useMiAdminIngresosComparison";

import { MiAdminIngresosToolbar } from "./MiAdminIngresosToolbar";

import { MiAdminIngresosFooter } from "./MiAdminIngresosFooter";

import {
  getRowBackgroundColor,
  createMiAdminDynamicColumns,
  formatCurrency,
} from "../utils";

import type { AuxiliarIngresosRow } from "../../auxiliar-ingresos";

interface MiAdminIngresosTableProps {
  /** ID del mes */

  mesId: string | undefined;

  /** ID del reporte */

  reporteId: string | undefined;

  /** Datos de Auxiliar Ingresos para integración */

  auxiliarData: AuxiliarIngresosRow[] | undefined;

  /** ID del reporte Auxiliar (para cargar datos si no se proporcionan) */
  auxiliarReporteId?: string;

  /** ID del trabajo (para Guardar en Base) */

  trabajoId?: string;

  /** Año del trabajo (para Guardar en Base) */

  anio?: number;

  /** Mes del trabajo (para Guardar en Base) */

  mes?: number;

  /** Permite portalizar el botón de guardar fuera del toolbar */
  onSaveContextChange?: (
    context: {
      save: () => Promise<void>;
      isDirty: boolean;
      isSaving: boolean;
    } | null
  ) => void;

  /** Controla si se muestra el botón de guardar en la barra interna */
  showSaveButtonInToolbar?: boolean;
  /** Controla si se muestra el botón de sincronización en el toolbar */
  showComparisonButtonInToolbar?: boolean;
  /** Estado controlado de la comparación */
  comparisonActive?: boolean;
  /** Callback cuando cambia el estado de comparación */
  onComparisonActiveChange?: (active: boolean) => void;
}

/**

 * Componente principal de tabla de Mi Admin Ingresos

 */

export const MiAdminIngresosTable: React.FC<MiAdminIngresosTableProps> = ({
  mesId,

  reporteId,

  auxiliarData: providedAuxiliarData,

  auxiliarReporteId,

  trabajoId,

  anio,

  mes,

  onSaveContextChange,

  showSaveButtonInToolbar = true,
  showComparisonButtonInToolbar = true,
  comparisonActive,
  onComparisonActiveChange,
}) => {
  // 🔥 Si no se proporciona auxiliarData, buscar el reporte Auxiliar del mismo mes

  const { data: loadedAuxiliarData } = useAuxiliarIngresosData({
    mesId: mesId || "",

    reporteId: auxiliarReporteId || "",

    enabled: !providedAuxiliarData && !!mesId && !!auxiliarReporteId,
  });

  // Usar los datos proporcionados o los cargados

  const auxiliarData = providedAuxiliarData || loadedAuxiliarData;

  // Hooks de datos y lógica

  const { data, isLoading, error, handleSave, isSaving } =
    useMiAdminIngresosData({
      mesId,

      reporteId,

      auxiliarData,
    });

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
  });

  const { totales, dataWithTotals } = useMiAdminIngresosCalculations({
    data: editedData,
  });

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
  });

  useEffect(() => {
    if (!hasUnsavedChanges || isSaving || !mesId || !reporteId) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await handleSave(editedData);

        resetChanges();
      } catch (autoSaveError) {
        console.error(
          "❌ Error auto-guardando Mi Admin Ingresos:",

          autoSaveError
        );
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    editedData,

    handleSave,

    hasUnsavedChanges,

    isSaving,

    mesId,

    reporteId,

    resetChanges,
  ]);

  // State local para sorting y filtering

  const [sorting, setSorting] = useState<SortingState>([]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // 🔥 DEFINICIÓN DE COLUMNAS 100% DINÁMICA USANDO LA FÁBRICA

  const columns = useMemo(() => {
    // Empaquetar todos los callbacks para pasarlos a la fábrica

    const callbacks = {
      updateTipoCambio,

      updateEstadoSat,

      aplicarTCSugerido,
    };

    return createMiAdminDynamicColumns(dataWithTotals, callbacks);
  }, [dataWithTotals, updateTipoCambio, updateEstadoSat, aplicarTCSugerido]);

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
  });

  const latestEditedDataRef = useRef(editedData);
  useEffect(() => {
    latestEditedDataRef.current = editedData;
  }, [editedData]);

  // Handler para guardar
  const handleSaveClick = useCallback(async () => {
    await handleSave(latestEditedDataRef.current);
    resetChanges();
  }, [handleSave, resetChanges]);

  useEffect(() => {
    if (onSaveContextChange) {
      onSaveContextChange({
        save: handleSaveClick,
        isDirty: hasUnsavedChanges,
        isSaving,
      });
    }
  }, [onSaveContextChange, handleSaveClick, hasUnsavedChanges, isSaving]);

  useEffect(() => {
    return () => {
      onSaveContextChange?.(null);
    };
  }, [onSaveContextChange]);

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte Mi Admin Ingresos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
        <h3 className="text-red-800 font-semibold mb-2">
          Error al cargar reporte
        </h3>
        <p className="text-red-600">{(error as Error).message}</p>
      </div>
    );
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
        onAplicarTCSugeridoATodos={aplicarTCSugeridoATodos}
        onCancelarFoliosUnicos={cancelarFoliosUnicos}
        totales={totales}
        totalesComparison={totalesComparison}
        hasAuxiliarData={!!auxiliarData && auxiliarData.length > 0}
        // Props para Guardar en Base
        trabajoId={trabajoId}
        anio={anio}
        mes={mes}
        showSaveButton={showSaveButtonInToolbar}
        showComparisonButton={showComparisonButtonInToolbar}
      />

      <div className="border-b border-gray-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>
            Facturas:{" "}
            <strong>{totales.cantidadTotal.toLocaleString("es-MX")}</strong>
          </span>
          <span>
            Vigentes:{" "}
            <strong>{totales.cantidadVigentes.toLocaleString("es-MX")}</strong>
          </span>
          <span>
            Canceladas:{" "}
            <strong>
              {totales.cantidadCanceladas.toLocaleString("es-MX")}
            </strong>
          </span>
          <span>
            Total MXN:{" "}
            <strong>{formatCurrency(totales.totalSubtotalMXN)}</strong>
          </span>
          {totalesComparison && (
            <span
              className={
                totalesComparison.match
                  ? "text-emerald-700"
                  : "text-red-600 font-semibold"
              }
            >
              Diferencia vs Auxiliar:{" "}
              {formatCurrency(totalesComparison.difference)}
            </span>
          )}
        </div>
      </div>

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
                            ? "cursor-pointer select-none flex items-center gap-2"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
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
              const comparison = comparisonMap.get(row.original.folio);
              const bgClass = getRowBackgroundColor(
                row.original,
                comparison,
                isComparisonActive
              );

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
              );
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
  );
};
