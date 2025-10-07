/**
 * Tabla principal de Mi Admin Ingresos
 * Integra todos los hooks y componentes del feature con columnas específicas
 */

import { useMemo, useState } from "react";
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

import {
  formatCurrency,
  formatDate,
  formatTipoCambio,
  getRowBackgroundColor,
} from "../utils";
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
  auxiliarData,
  trabajoId,
  anio,
  mes,
}) => {
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

  const { totales } = useMiAdminIngresosCalculations({
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

  // State local para sorting y filtering
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Definición de columnas
  const columns = useMemo(
    () => [
      columnHelper.accessor("folio", {
        header: "Folio",
        cell: (info) => (
          <span className="font-mono text-sm font-semibold">
            {info.getValue()}
          </span>
        ),
        size: 120,
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
      columnHelper.accessor("razonSocial", {
        header: "Razón Social",
        cell: (info) => (
          <span className="text-sm truncate max-w-xs" title={info.getValue()}>
            {info.getValue()}
          </span>
        ),
        size: 200,
      }),
      columnHelper.accessor("subtotal", {
        header: "Subtotal",
        cell: (info) => formatCurrency(info.getValue()),
        size: 120,
      }),
      columnHelper.accessor("moneda", {
        header: "Moneda",
        cell: (info) => (
          <span className="text-center block font-semibold">
            {info.getValue()}
          </span>
        ),
        size: 80,
      }),
      columnHelper.accessor("tipoCambio", {
        header: "Tipo Cambio",
        cell: (info) => {
          const row = info.row.original;
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
      }),
      columnHelper.accessor("subtotalAUX", {
        header: "Subtotal AUX",
        cell: (info) => {
          const value = info.getValue();
          return value !== null ? (
            formatCurrency(value)
          ) : (
            <span className="text-gray-400 text-sm">N/A</span>
          );
        },
        size: 120,
      }),
      columnHelper.accessor("subtotalMXN", {
        header: "Subtotal MXN",
        cell: (info) => formatCurrency(info.getValue()),
        size: 120,
      }),
      columnHelper.accessor("tcSugerido", {
        header: "TC Sugerido",
        cell: (info) => {
          const row = info.row.original;
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
      }),
      columnHelper.accessor("estadoSat", {
        header: "Estado SAT",
        cell: (info) => {
          const row = info.row.original;
          return (
            <EditableEstadoSatCell
              value={info.getValue()}
              onChange={(newValue) => updateEstadoSat(row.folio, newValue)}
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
                const comparison = comparisonMap.get(row.folio);

                if (!comparison) return null;

                const icon =
                  comparison.status === "match"
                    ? "✅"
                    : comparison.status === "mismatch"
                    ? "❌"
                    : comparison.status === "only-miadmin"
                    ? "🔵"
                    : "🟣";

                return (
                  <div
                    className="flex items-center justify-center"
                    title={comparison.tooltip}
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
    [
      isComparisonActive,
      comparisonMap,
      updateTipoCambio,
      updateEstadoSat,
      aplicarTCSugerido,
    ]
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
