/**
 * Fábrica de Columnas Dinámicas para TanStack Table
 * Genera definiciones de columna basadas en los datos y una configuración predefinida.
 */

import React from "react";
import { createColumnHelper, type CellContext } from "@tanstack/react-table";
import { AuxiliarIngresosRow, EstadoSat } from "../types";
import { EditableTipoCambioCell, EditableEstadoSatCell } from "../components";
import { formatCurrency, formatDate } from "./auxiliar-ingresos-calculations";
import {
  detectColumns as detectDynamicColumns,
  inferColumnType,
  formatCellValue,
  formatColumnName,
} from "../../shared/utils/dynamic-columns";

// Helper para crear columnas con el tipo de fila correcto
const columnHelper = createColumnHelper<AuxiliarIngresosRow>();

const SPECIAL_COLUMN_ORDER: Array<keyof AuxiliarIngresosRow> = [
  "folio",
  "fecha",
  "rfc",
  "razonSocial",
  "subtotal",
  "moneda",
  "tipoCambio",
  "estadoSat",
];

/**
 * Define el comportamiento y renderizado de columnas "especiales" que no
 * son solo texto plano.
 */
type SpecialCellContext = CellContext<AuxiliarIngresosRow, unknown>;

type SpecialColumnConfig = Record<
  string,
  {
    header: string;
    cell: (info: SpecialCellContext) => React.ReactNode;
    size: number;
  }
>;

const getSpecialColumnConfig = (
  updateTipoCambio: (id: string, value: number) => void,
  updateEstadoSat: (id: string, value: EstadoSat) => void
): SpecialColumnConfig => ({
  folio: {
    header: "Folio",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      if (row.isSummary) {
        return (
          <span className="font-mono text-xs font-bold uppercase text-blue-700">
            Totales
          </span>
        );
      }
      const value = info.getValue() as string | null;
      return (
        <span className="font-mono text-xs">
          {value && value.length > 0 ? value : "-"}
        </span>
      );
    },
    size: 100,
  },
  fecha: {
    header: "Fecha",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      if (row.isSummary) {
        return <span className="text-xs text-gray-500">-</span>;
      }
      const value = info.getValue() as string | null;
      return formatDate(value);
    },
    size: 100,
  },
  rfc: {
    header: "RFC",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      if (row.isSummary) {
        return <span className="text-xs text-gray-500">-</span>;
      }
      const value = info.getValue() as string | null;
      return (
        <span className="font-mono text-sm">
          {value && value.length > 0 ? value : "-"}
        </span>
      );
    },
    size: 140,
  },
  subtotal: {
    header: "Subtotal", // Corregido: de "Subtotal MXN" a "Subtotal"
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      const rawValue = info.getValue();
      const value =
        typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
      return (
        <span
          className={row.isSummary ? "font-semibold text-blue-700" : undefined}
        >
          {formatCurrency(value)}
        </span>
      );
    },
    size: 130,
  },
  moneda: {
    header: "Moneda",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      if (row.isSummary) {
        return (
          <span className="text-center block font-semibold text-xs text-blue-700">
            MXN
          </span>
        );
      }
      const value = info.getValue() as string | null;
      return (
        <span className="text-center block font-semibold text-xs">
          {value && value.length > 0 ? value : "-"}
        </span>
      );
    },
    size: 70,
  },
  tipoCambio: {
    header: "Tipo Cambio",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      if (row.isSummary) {
        return (
          <span className="text-center block text-sm font-semibold text-blue-700">
            -
          </span>
        );
      }
      const value = info.getValue() as number | null;
      return (
        <EditableTipoCambioCell
          value={value}
          onChange={(newValue) => updateTipoCambio(row.id, newValue)}
          disabled={row.moneda === "MXN"}
          moneda={row.moneda}
        />
      );
    },
    size: 140,
  },
  estadoSat: {
    header: "Estado SAT",
    cell: (info: SpecialCellContext) => {
      const row = info.row.original;
      const value = (info.getValue() as EstadoSat | null) ?? "Vigente";
      if (row.isSummary) {
        return (
          <span className="text-center block text-sm font-semibold text-blue-700">
            --
          </span>
        );
      }
      return (
        <EditableEstadoSatCell
          value={value}
          onChange={(newValue) => updateEstadoSat(row.id, newValue)}
        />
      );
    },
    size: 140,
  },
});

/**
 * Crea dinámicamente las columnas para la tabla.
 * @param data - Los datos del reporte, que se usan para extraer las claves de las columnas.
 * @param updateTipoCambio - Callback para actualizar el tipo de cambio.
 * @param updateEstadoSat - Callback para actualizar el estado SAT.
 * @returns Un array de definiciones de columna para TanStack Table.
 */
export function createDynamicColumns(
  data: AuxiliarIngresosRow[],
  updateTipoCambio: (id: string, value: number) => void,
  updateEstadoSat: (id: string, value: EstadoSat) => void
) {
  if (!data || data.length === 0) return [];

  const specialColumnConfig = getSpecialColumnConfig(
    updateTipoCambio,
    updateEstadoSat
  );

  const detectedKeys = detectDynamicColumns(data);

  const availableSpecialKeys = SPECIAL_COLUMN_ORDER.filter((key) =>
    data.some((row) => key in row)
  ).map(String);

  const orderedKeys: string[] = [
    ...availableSpecialKeys,
    ...detectedKeys.filter((key) => !availableSpecialKeys.includes(key)),
  ];

  return orderedKeys.map((columnKey) => {
    const specialConfigEntry = specialColumnConfig[columnKey];
    if (specialConfigEntry) {
      return columnHelper.accessor(columnKey as any, specialConfigEntry);
    }

    const sampleValues = data
      .slice(0, 20)
      .map((row) => row[columnKey])
      .filter((value) => value !== undefined && value !== null);

    const columnType = inferColumnType(columnKey, sampleValues);

    return columnHelper.accessor(
      (row) => row[columnKey as keyof AuxiliarIngresosRow] as unknown,
      {
        id: columnKey,
        header: () => formatColumnName(columnKey),
        cell: (info) => {
          const row = info.row.original;
          if (row.isSummary) {
            if (columnType === "currency") {
              return (
                <span className="font-semibold text-blue-700">
                  {formatCellValue(info.getValue(), columnType)}
                </span>
              );
            }
            return <span className="text-xs text-gray-500">-</span>;
          }

          const formattedValue = formatCellValue(info.getValue(), columnType);
          let className = "text-sm";
          if (columnType === "currency" || columnType === "number") {
            className += " text-right font-mono";
          }
          return <span className={className}>{formattedValue}</span>;
        },
        size:
          columnType === "date"
            ? 110
            : columnType === "currency"
            ? 130
            : columnType === "number"
            ? 110
            : 160,
      }
    );
  });
}
