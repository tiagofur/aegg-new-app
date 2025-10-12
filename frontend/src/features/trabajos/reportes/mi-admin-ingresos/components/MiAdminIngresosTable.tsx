/**
 * Tabla principal de Mi Admin Ingresos
 * Integra todos los hooks y componentes del feature con columnas específicas
 */

import { useEffect, useMemo, useState } from "react";
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

import { useMiAdminIngresosData } from "../hooks/useMiAdminIngresosData";
import { useAuxiliarIngresosData } from "../../auxiliar-ingresos/hooks/useAuxiliarIngresosData";
import { useMiAdminIngresosEdit } from "../hooks/useMiAdminIngresosEdit";
import { useMiAdminIngresosCalculations } from "../hooks/useMiAdminIngresosCalculations";
import { useMiAdminIngresosComparison } from "../hooks/useMiAdminIngresosComparison";

import { MiAdminIngresosToolbar } from "./MiAdminIngresosToolbar";
import { MiAdminIngresosFooter } from "./MiAdminIngresosFooter";
import {
  TCSugeridoCell,
  EditableTipoCambioCell,
  EditableEstadoSatCell,
} from "./cells";

import { formatCurrency, getRowBackgroundColor } from "../utils";
import {
  formatCellValue,
  inferColumnType,
} from "../../shared/utils/dynamic-columns";
import type { MiAdminIngresosRow } from "../types";
import type { AuxiliarIngresosRow } from "../../auxiliar-ingresos";

interface MiAdminIngresosTableProps {
  /** ID del mes */
  mesId: string | undefined;
  /** ID del reporte */
  reporteId: string | undefined;
  /** Datos de Auxiliar Ingresos para integración */
  auxiliarData: AuxiliarIngresosRow[] | undefined;
  /** ID del trabajo (para Guardar en Base) */
  trabajoId?: string;
  /** Año del trabajo (para Guardar en Base) */
  anio?: number;
  /** Mes del trabajo (para Guardar en Base) */
  mes?: number;
}

const columnHelper = createColumnHelper<MiAdminIngresosRow>();

/**
 * Componente principal de tabla de Mi Admin Ingresos
 */
export const MiAdminIngresosTable: React.FC<MiAdminIngresosTableProps> = ({
  mesId,
  reporteId,
  auxiliarData: providedAuxiliarData,
  trabajoId,
  anio,
  mes,
}) => {
  // 🔥 Si no se proporciona auxiliarData, buscar el reporte Auxiliar del mismo mes
  const { data: loadedAuxiliarData } = useAuxiliarIngresosData({
    mesId: mesId || "", // Proporcionar string vacío si mesId es undefined
    reporteId: "", // Buscaremos el ID del reporte Auxiliar automáticamente
    enabled: !providedAuxiliarData && !!mesId,
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

  // 🔥 DEFINICIÓN DE COLUMNAS DINÁMICAS
  const columns = useMemo(() => {
    if (!dataWithTotals || dataWithTotals.length === 0) return [];

    // Campos que NO deben mostrarse como columnas normales
    const excludedFields = new Set([
      "id",
      "isSummary",
      "subtotalAUX", // Tiene columna especial al final
      "subtotalMXN", // Tiene columna especial al final
      "tcSugerido", // Tiene columna especial al final
      "estadoSat", // Tiene columna especial editable
      "tipoCambio", // Tiene columna especial editable
    ]);

    // 1️⃣ Detectar TODAS las columnas del Excel que están en los datos
    const allKeys = new Set<string>();
    dataWithTotals.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!excludedFields.has(key)) {
          allKeys.add(key);
        }
      });
    });

    const dynamicColumns: any[] = [];

    // 2️⃣ Crear columnas dinámicas para TODAS las columnas del Excel
    Array.from(allKeys).forEach((columnName) => {
      // Obtener valores de muestra para inferir tipo
      const sampleValues = dataWithTotals
        .slice(0, 20)
        .map((row) => row[columnName])
        .filter((v) => v != null);

      const columnType = inferColumnType(columnName, sampleValues);

      dynamicColumns.push(
        columnHelper.accessor(columnName as any, {
          header: columnName,
          cell: (info) => {
            const row = info.row.original;
            if (row.isSummary) {
              // Para totales, solo mostrar en columnas de moneda
              if (columnType === "currency") {
                return (
                  <span className="font-semibold text-blue-700">
                    {formatCellValue(info.getValue(), columnType)}
                  </span>
                );
              }
              return <span className="text-xs text-gray-500">-</span>;
            }

            const value = info.getValue();
            const formattedValue = formatCellValue(value, columnType);

            // Aplicar estilos según el tipo
            let className = "text-sm";
            if (columnType === "currency" || columnType === "number") {
              className += " text-right font-mono";
            }
            if (columnName === "folio") {
              className += " font-semibold";
            }

            return <span className={className}>{formattedValue}</span>;
          },
          size:
            columnType === "date" ? 100 : columnType === "currency" ? 120 : 150,
        })
      );
    });

    // 3️⃣ Agregar columnas EDITABLES (Tipo Cambio y Estado SAT)
    dynamicColumns.push(
      columnHelper.accessor("tipoCambio", {
        header: "Tipo Cambio",
        cell: (info) => {
          const row = info.row.original;
          if (row.isSummary) {
            return (
              <span className="text-center block text-sm font-semibold text-blue-700">
                -
              </span>
            );
          }
          return (
            <EditableTipoCambioCell
              value={info.getValue()}
              moneda={row.moneda}
              onChange={(newValue) => updateTipoCambio(row.folio, newValue)}
              disabled={row.moneda === "MXN"}
            />
          );
        },
        size: 120,
      })
    );

    dynamicColumns.push(
      columnHelper.accessor("estadoSat", {
        header: "Estado SAT",
        cell: (info) => {
          const row = info.row.original;
          if (row.isSummary) {
            return (
              <span className="text-center block text-sm font-semibold text-blue-700">
                -
              </span>
            );
          }
          return (
            <EditableEstadoSatCell
              value={info.getValue()}
              onChange={(newValue) => updateEstadoSat(row.folio, newValue)}
            />
          );
        },
        size: 120,
      })
    );

    // 4️⃣ Agregar columnas CALCULADAS al final
    dynamicColumns.push(
      columnHelper.accessor("subtotalAUX", {
        header: "Subtotal AUX",
        cell: (info) => {
          const value = info.getValue();
          const row = info.row.original;

          if (row.isSummary) {
            return (
              <span className="font-semibold text-blue-700">
                {formatCurrency(value ?? 0)}
              </span>
            );
          }

          return value !== null ? (
            formatCurrency(value)
          ) : (
            <span className="text-gray-400 text-sm">N/A</span>
          );
        },
        size: 120,
      })
    );

    dynamicColumns.push(
      columnHelper.accessor("subtotalMXN", {
        header: "Subtotal MXN",
        cell: (info) => {
          const row = info.row.original;
          const value = info.getValue();
          return (
            <span
              className={
                row.isSummary ? "font-semibold text-blue-700" : undefined
              }
            >
              {formatCurrency(value)}
            </span>
          );
        },
        size: 120,
      })
    );

    dynamicColumns.push(
      columnHelper.accessor("tcSugerido", {
        header: "TC Sugerido",
        cell: (info) => {
          const row = info.row.original;
          if (row.isSummary) {
            return (
              <span className="text-center block text-sm font-semibold text-blue-700">
                -
              </span>
            );
          }
          return (
            <TCSugeridoCell
              tcSugerido={info.getValue()}
              tipoCambioActual={row.tipoCambio}
              estadoSat={row.estadoSat}
              onAplicar={() => aplicarTCSugerido(row.folio)}
            />
          );
        },
        size: 150,
      })
    );

    return dynamicColumns;
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

  // Handler para guardar
  const handleSaveClick = async () => {
    await handleSave(editedData);
    resetChanges();
  };

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
