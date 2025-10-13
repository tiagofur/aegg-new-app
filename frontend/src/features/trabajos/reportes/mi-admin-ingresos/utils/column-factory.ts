/**
 * Fábrica de Columnas Dinámicas para el reporte Mi Admin Ingresos.
 * Genera definiciones de columna de forma declarativa, controlando el orden,
 * renderizado y comportamiento de columnas especiales, calculadas y dinámicas.
 */

import { createColumnHelper } from "@tanstack/react-table";
import {
  TCSugeridoCell,
  EditableTipoCambioCell,
  EditableEstadoSatCell,
} from "../components/cells";
import { formatCurrency, formatTipoCambio } from "./mi-admin-ingresos-calculations";
import {
  formatCellValue,
  inferColumnType,
} from "../../shared/utils/dynamic-columns";
import type { MiAdminIngresosRow, EstadoSat } from "../types";

// Helper para crear columnas con el tipo de fila correcto
const columnHelper = createColumnHelper<MiAdminIngresosRow>();

// Define el orden explícito de las columnas más importantes.
// Las columnas no listadas aquí aparecerán después, en orden alfabético.
const COLUMN_ORDER = [
  "folio",
  "fecha",
  "rfc",
  "razonSocial",
  "subtotal",
  "moneda",
  "tipoCambio",
  "subtotalMXN",
  "subtotalAUX",
  "tcSugerido",
  "estadoSat",
  "iva",
  "total",
];

// Objeto de callbacks para las celdas interactivas
interface ColumnCallbacks {
  updateTipoCambio: (folio: string, value: number | null) => void;
  updateEstadoSat: (folio: string, value: EstadoSat) => void;
  aplicarTCSugerido: (folio: string) => void;
}

/**
 * Configuración declarativa para todas las columnas que requieren un tratamiento especial.
 * Esto incluye formato, componentes de celda editables, y celdas de acción.
 */
const getSpecialColumnConfig = (callbacks: ColumnCallbacks) => ({
  folio: {
    header: "Folio",
    cell: (info) => (
      <span className="font-mono text-sm font-semibold">
        {info.getValue() || "-"}
      </span>
    ),
    size: 160,
  },
  fecha: {
    header: "Fecha",
    cell: (info) => formatCellValue(info.getValue(), "date"),
    size: 100,
  },
  subtotal: {
    header: "Subtotal",
    cell: (info) => (
      <span className="font-mono text-right block">
        {formatCurrency(info.getValue())}
      </span>
    ),
    size: 120,
  },
  tipoCambio: {
    header: "Tipo Cambio",
    cell: (info) => {
      const row = info.row.original;
      return (
        <EditableTipoCambioCell
          value={info.getValue()}
          moneda={row.moneda}
          onChange={(newValue) => callbacks.updateTipoCambio(row.folio, newValue)}
          disabled={row.moneda === "MXN"}
        />
      );
    },
    size: 120,
  },
  estadoSat: {
    header: "Estado SAT",
    cell: (info) => {
      const row = info.row.original;
      return (
        <EditableEstadoSatCell
          value={info.getValue()}
          onChange={(newValue) => callbacks.updateEstadoSat(row.folio, newValue)}
        />
      );
    },
    size: 120,
  },
  subtotalAUX: {
    header: "Subtotal AUX",
    cell: (info) => {
      const value = info.getValue();
      return value !== null ? (
        <span className="font-mono text-right block text-gray-600">
          {formatCurrency(value)}
        </span>
      ) : (
        <span className="text-gray-400 text-sm text-center block">N/A</span>
      );
    },
    size: 120,
  },
  subtotalMXN: {
    header: "Subtotal MXN",
    cell: (info) => (
      <span className="font-mono text-right block font-bold text-blue-700">
        {formatCurrency(info.getValue())}
      </span>
    ),
    size: 130,
  },
  tcSugerido: {
    header: "TC Sugerido",
    cell: (info) => {
      const row = info.row.original;
      return (
        <TCSugeridoCell
          tcSugerido={info.getValue()}
          tipoCambioActual={row.tipoCambio}
          estadoSat={row.estadoSat}
          onAplicar={() => callbacks.aplicarTCSugerido(row.folio)}
        />
      );
    },
    size: 150,
  },
  iva: {
    header: "IVA",
    cell: (info) => (
      <span className="font-mono text-right block">
        {formatCurrency(info.getValue())}
      </span>
    ),
    size: 110,
  },
  total: {
    header: "Total",
    cell: (info) => (
      <span className="font-mono text-right block font-semibold">
        {formatCurrency(info.getValue())}
      </span>
    ),
    size: 130,
  },
});

/**
 * Crea dinámicamente las columnas para la tabla de Mi Admin Ingresos.
 * @param data - Los datos del reporte (se usa para inferir columnas y tipos).
 * @param callbacks - Un objeto que contiene las funciones para las celdas interactivas.
 * @returns Un array de definiciones de columna para TanStack Table.
 */
export function createMiAdminDynamicColumns(
  data: MiAdminIngresosRow[],
  callbacks: ColumnCallbacks
) {
  if (!data || data.length === 0) return [];

  const specialColumnConfig = getSpecialColumnConfig(callbacks);
  const specialKeys = new Set(Object.keys(specialColumnConfig));

  // Claves internas que nunca deben ser mostradas como columnas
  const keysToIgnore = new Set(["id", "isSummary"]);

  // Obtener todas las claves únicas de todos los objetos de datos
  const allKeys = new Set<string>();
  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!keysToIgnore.has(key)) {
        allKeys.add(key);
      }
    });
  });

  const columnKeys = Array.from(allKeys);

  // Ordenar las claves: primero las del COLUMN_ORDER, luego el resto alfabéticamente.
  columnKeys.sort((a, b) => {
    const indexA = COLUMN_ORDER.indexOf(a);
    const indexB = COLUMN_ORDER.indexOf(b);

    if (indexA > -1 && indexB > -1) return indexA - indexB; // Ambas en la lista de orden
    if (indexA > -1) return -1; // Solo 'a' está en la lista
    if (indexB > -1) return 1;  // Solo 'b' está en la lista
    return a.localeCompare(b); // Ninguna está en la lista, orden alfabético
  });

  return columnKeys.map((key) => {
    // Si es una columna especial, usar su configuración avanzada
    if (specialKeys.has(key)) {
      return columnHelper.accessor(
        key as keyof MiAdminIngresosRow,
        specialColumnConfig[key]
      );
    }

    // --- Para todas las demás columnas (dinámicas del Excel) ---
    const sampleValues = data
      .slice(0, 20)
      .map((row) => row[key])
      .filter((v) => v != null);
    const columnType = inferColumnType(key, sampleValues);

    return columnHelper.accessor(key as keyof MiAdminIngresosRow, {
      header: () => key.charAt(0).toUpperCase() + key.slice(1),
      cell: (info) => {
        const value = info.getValue();
        const formattedValue = formatCellValue(value, columnType);
        
        let className = "text-sm";
        if (columnType === "currency" || columnType === "number") {
          className += " text-right font-mono";
        }
        return <span className={className}>{formattedValue}</span>;
      },
      size: columnType === "date" ? 100 : columnType === "currency" ? 120 : 150,
    });
  });
}
