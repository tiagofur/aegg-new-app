/**
 * Tabla principal de Auxiliar de Ingresos
 * Integra todos los hooks y componentes del feature
 */

import { useMemo } from "react";
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
import { useState } from "react";

import { useAuxiliarIngresosData } from "../hooks/useAuxiliarIngresosData";
import { useAuxiliarIngresosEdit } from "../hooks/useAuxiliarIngresosEdit";
import { useAuxiliarIngresosCalculations } from "../hooks/useAuxiliarIngresosCalculations";
import { useAuxiliarIngresosComparison } from "../hooks/useAuxiliarIngresosComparison";

import { AuxiliarIngresosToolbar } from "./AuxiliarIngresosToolbar";
import { AuxiliarIngresosFooter } from "./AuxiliarIngresosFooter";
import { EditableTipoCambioCell } from "./cells/EditableTipoCambioCell";
import { EditableEstadoSatCell } from "./cells/EditableEstadoSatCell";

import { formatCurrency, formatDate, getRowBackgroundColor } from "../utils";
import type { AuxiliarIngresosRow } from "../types";

interface AuxiliarIngresosTableProps {
  /** ID del mes */
  mesId: string;
  /** ID del reporte */
  reporteId: string;
  /** Año del reporte */
  year: number;
  /** Mes del reporte (1-12) */
  month: number;
  /** Nombre del archivo Excel (opcional) */
  fileName?: string;
}

const columnHelper = createColumnHelper<AuxiliarIngresosRow>();

/**
 * Componente principal de tabla de Auxiliar de Ingresos
 */
export const AuxiliarIngresosTable: React.FC<AuxiliarIngresosTableProps> = ({
  mesId,
  reporteId,
  year,
  month,
  fileName,
}) => {
  // Hooks de datos y lógica
  const { data, isLoading, error, saveChanges, isSaving } =
    useAuxiliarIngresosData({
      mesId,
      reporteId,
      enabled: true,
    });

  const {
    data: editedData,
    editedRows,
    updateEstadoSat,
    isDirty,
    resetEdits,
  } = useAuxiliarIngresosEdit({ initialData: data });

  const {
    totales: baseTotales,
    porcentajeVigentes,
    porcentajeCanceladas,
    promedioSubtotalVigentes,
  } = useAuxiliarIngresosCalculations({ data: editedData });

  // Merge calculated values into totales object
  const totales = {
    ...baseTotales,
    porcentajeVigentes,
    porcentajeCanceladas,
    promedioSubtotalVigentes,
  };

  const {
    isActive: isComparisonActive,
    toggle: toggleComparison,
    comparisonMap,
    totalesComparison,
  } = useAuxiliarIngresosComparison({
    auxiliarData: editedData,
    miadminData: undefined, // TODO: Load Mi Admin data when needed
  });

  // State local para sorting y filtering
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Definición de columnas
  const columns = useMemo(
    () => [
      columnHelper.accessor("folio", {
        header: "Folio",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue() || "-"}</span>
        ),
        size: 100,
      }),
      columnHelper.accessor("fecha", {
        header: "Fecha",
        cell: (info) => formatDate(info.getValue()),
        size: 100,
      }),
      columnHelper.accessor("rfc", {
        header: "RFC",
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
        size: 140,
      }),
      columnHelper.accessor("subtotal", {
        header: "Subtotal MXN",
        cell: (info) => formatCurrency(info.getValue()),
        size: 130,
      }),
      columnHelper.accessor("moneda", {
        header: "Moneda",
        cell: (info) => (
          <span className="text-center block font-semibold text-xs">
            {info.getValue()}
          </span>
        ),
        size: 70,
      }),
      columnHelper.accessor("tipoCambio", {
        header: "TC Aplicado",
        cell: (info) => {
          const tc = info.getValue();
          return (
            <span className="text-center block text-sm text-gray-600">
              {tc ? tc.toFixed(4) : "-"}
            </span>
          );
        },
        size: 90,
      }),
      columnHelper.accessor("estadoSat", {
        header: "Estado SAT",
        cell: (info) => {
          const row = info.row.original;
          return (
            <EditableEstadoSatCell
              value={info.getValue()}
              onChange={(newValue) => updateEstadoSat(row.id, newValue)}
            />
          );
        },
        size: 120,
      }),
      // Columna de comparación (solo si está activa)
      ...(isComparisonActive
        ? [
            columnHelper.display({
              id: "comparison",
              header: "Comparación",
              cell: (info) => {
                const row = info.row.original;
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
                  <div
                    className="flex items-center justify-center"
                    title={tooltip}
                  >
                    <span className="text-lg">{icon}</span>
                  </div>
                );
              },
              size: 100,
            }),
          ]
        : []),
    ],
    [isComparisonActive, comparisonMap, updateEstadoSat]
  );

  // Configuración de TanStack Table
  const table = useReactTable({
    data: editedData,
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
  const handleSave = async () => {
    try {
      await saveChanges(editedData);
      resetEdits();
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

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
        onSave={handleSave}
        isSaving={isSaving}
        isComparisonActive={isComparisonActive}
        onToggleComparison={toggleComparison}
        totales={totales}
        totalesComparison={totalesComparison}
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
