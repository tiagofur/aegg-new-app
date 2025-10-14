/**
 * Tabla principal de Auxiliar de Ingresos
 * Integra todos los hooks y componentes del feature
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import { useAuxiliarIngresosData } from "../hooks/useAuxiliarIngresosData";
import { useAuxiliarIngresosEdit } from "../hooks/useAuxiliarIngresosEdit";
import { useAuxiliarIngresosCalculations } from "../hooks/useAuxiliarIngresosCalculations";
import { useAuxiliarIngresosComparison } from "../hooks/useAuxiliarIngresosComparison";
import { useMiAdminIngresosData } from "../../mi-admin-ingresos/hooks/useMiAdminIngresosData";

import { AuxiliarIngresosToolbar } from "./AuxiliarIngresosToolbar";
import { AuxiliarIngresosFooter } from "./AuxiliarIngresosFooter";

import { getRowBackgroundColor, createDynamicColumns } from "../utils";
import type { AuxiliarIngresosRow, MiAdminIngresosRow } from "../types";

interface AuxiliarIngresosTableProps {
  /** ID del mes */
  mesId: string;
  /** ID del reporte */
  reporteId: string;
  /** ID del reporte Mi Admin (para comparación) */
  miAdminReporteId?: string;
  /** Datos de Mi Admin precargados (opcional) */
  miAdminData?: MiAdminIngresosRow[];
  /** Permite portalizar el botón de guardar fuera del toolbar */
  onSaveContextChange?: (
    context:
      | {
          save: () => Promise<void>;
          isDirty: boolean;
          isSaving: boolean;
        }
      | null
  ) => void;
  /** Controla si se muestra el botón de guardar en la barra interna */
  showSaveButtonInToolbar?: boolean;
}

const columnHelper = createColumnHelper<AuxiliarIngresosRow>();

/**
 * Componente principal de tabla de Auxiliar de Ingresos
 */
export const AuxiliarIngresosTable: React.FC<AuxiliarIngresosTableProps> = ({
  mesId,
  reporteId,
  miAdminReporteId,
  miAdminData: providedMiAdminData,
  onSaveContextChange,
  showSaveButtonInToolbar = true,
}) => {
  // Hooks de datos y lógica
  const { data, isLoading, error, saveChanges, isSaving } =
    useAuxiliarIngresosData({
      mesId,
      reporteId,
      enabled: true,
    });

  const { data: fetchedMiAdminData } = useMiAdminIngresosData({
    mesId,
    reporteId: miAdminReporteId,
    auxiliarData: undefined,
    enabled: !providedMiAdminData && !!miAdminReporteId,
  });

  const miAdminData = useMemo(
    () => providedMiAdminData ?? fetchedMiAdminData,
    [providedMiAdminData, fetchedMiAdminData]
  );

  const {
    data: editedData,
    updateTipoCambio,
    updateEstadoSat,
    isDirty,
    cancelarFoliosUnicos,
    resetEdits,
  } = useAuxiliarIngresosEdit({ initialData: data, miAdminData });

  const { totales, dataWithTotals } = useAuxiliarIngresosCalculations({
    data: editedData,
  });

  const {
    isActive: isComparisonActive,
    toggle: toggleComparison,
    comparisonMap,
    totalesComparison,
  } = useAuxiliarIngresosComparison({
    auxiliarData: editedData,
    miadminData: miAdminData,
  });

  const hasMiAdminData = !!miAdminData && miAdminData.length > 0;

  const latestEditedDataRef = useRef(editedData);
  useEffect(() => {
    latestEditedDataRef.current = editedData;
  }, [editedData]);

  const handleSaveClick = useCallback(async () => {
    await saveChanges(latestEditedDataRef.current);
    resetEdits();
  }, [saveChanges, resetEdits]);

  useEffect(() => {
    if (onSaveContextChange) {
      onSaveContextChange({
        save: handleSaveClick,
        isDirty,
        isSaving,
      });
    }
  }, [handleSaveClick, isDirty, isSaving, onSaveContextChange]);

  useEffect(() => {
    return () => {
      onSaveContextChange?.(null);
    };
  }, [onSaveContextChange]);

  useEffect(() => {
    if (!isDirty || isSaving || !mesId || !reporteId) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveChanges(editedData);
        resetEdits();
      } catch (autoSaveError) {
        console.error(
          "❌ Error auto-guardando Auxiliar Ingresos:",
          autoSaveError
        );
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    editedData,
    isDirty,
    isSaving,
    mesId,
    reporteId,
    resetEdits,
    saveChanges,
  ]);

  // State local para sorting y filtering
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Definición de columnas - AHORA DINÁMICA
  const columns = useMemo(() => {
    // Prevenimos error si los datos aún no llegan
    if (dataWithTotals.length === 0) {
      return [];
    }

    const baseColumns = createDynamicColumns(
      dataWithTotals,
      updateTipoCambio,
      updateEstadoSat
    );

    if (import.meta.env.DEV) {
      console.log("[AuxiliarIngresosTable] filas", dataWithTotals.length);
      console.log(
        "[AuxiliarIngresosTable] columnas base",
        baseColumns.map((col) => {
          if ("id" in col && typeof col.id === "string") {
            return col.id;
          }
          if ("accessorKey" in col && typeof col.accessorKey === "string") {
            return col.accessorKey;
          }
          return "(sin id)";
        })
      );
      console.log("[AuxiliarIngresosTable] sample row", dataWithTotals[0]);
    }

    // Añadir la columna de comparación condicionalmente
    if (isComparisonActive) {
      return [
        ...baseColumns,
        columnHelper.display({
          id: "comparison",
          header: "Comparación",
          cell: (info) => {
            const row = info.row.original;
            if (row.isSummary) {
              return null;
            }
            const comparison = comparisonMap.get(row.id);

            if (!comparison) return null;

            const icon =
              comparison.status === "match"
                ? "✅"
                : comparison.status === "mismatch"
                ? "❌"
                : comparison.status === "only-auxiliar"
                ? "🔵"
                : "🟣";

            const tooltip =
              comparison.status === "match"
                ? `Coincide (Dif: $${Math.abs(
                    comparison.difference || 0
                  ).toFixed(2)})`
                : comparison.status === "mismatch"
                ? `Discrepancia: $${Math.abs(
                    comparison.difference || 0
                  ).toFixed(2)}`
                : comparison.status === "only-auxiliar"
                ? "Solo en Auxiliar"
                : "Solo en Mi Admin";

            return (
              <div className="flex items-center justify-center" title={tooltip}>
                <span className="text-lg">{icon}</span>
              </div>
            );
          },
          size: 100,
        }),
      ];
    }

    return baseColumns;
  }, [
    dataWithTotals,
    updateTipoCambio,
    updateEstadoSat,
    isComparisonActive,
    comparisonMap,
  ]);

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

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte...</p>
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
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <AuxiliarIngresosToolbar
        isDirty={isDirty}
        onSave={handleSaveClick}
        isSaving={isSaving}
        isComparisonActive={isComparisonActive}
        onToggleComparison={toggleComparison}
        onCancelarFoliosUnicos={cancelarFoliosUnicos}
        totales={totales}
        totalesComparison={totalesComparison}
        hasMiAdminData={hasMiAdminData}
        showSaveButton={showSaveButtonInToolbar}
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
              const comparison = comparisonMap.get(row.original.id);
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
      <AuxiliarIngresosFooter
        totales={totales}
        totalesComparison={totalesComparison}
        isComparisonActive={isComparisonActive}
      />
    </div>
  );
};
