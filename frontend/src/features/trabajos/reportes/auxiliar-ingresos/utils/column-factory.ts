/**
 * Fábrica de Columnas Dinámicas para TanStack Table
 * Genera definiciones de columna basadas en los datos y una configuración predefinida.
 */

import { createColumnHelper } from "@tanstack/react-table";
import {
  AuxiliarIngresosRow,
  EstadoSat,
} from "../types";
import {
  EditableTipoCambioCell,
  EditableEstadoSatCell,
} from "../components";
import { formatCurrency, formatDate } from "./auxiliar-ingresos-calculations";

// Helper para crear columnas con el tipo de fila correcto
const columnHelper = createColumnHelper<AuxiliarIngresosRow>();

/**
 * Define el comportamiento y renderizado de columnas "especiales" que no
 * son solo texto plano.
 */
const getSpecialColumnConfig = (
  updateTipoCambio: (id: string, value: number) => void,
  updateEstadoSat: (id: string, value: EstadoSat) => void
) => ({
  folio: {
    header: "Folio",
    cell: (info) => {
      const row = info.row.original;
      if (row.isSummary) {
        return (
          <span className="font-mono text-xs font-bold uppercase text-blue-700">
            Totales
          </span>
        );
      }
      return (
        <span className="font-mono text-xs">{info.getValue() || "-"}</span>
      );
    },
    size: 100,
  },
  fecha: {
    header: "Fecha",
    cell: (info) => {
      const row = info.row.original;
      if (row.isSummary) {
        return <span className="text-xs text-gray-500">-</span>;
      }
      return formatDate(info.getValue());
    },
    size: 100,
  },
  rfc: {
    header: "RFC",
    cell: (info) => {
      const row = info.row.original;
      if (row.isSummary) {
        return <span className="text-xs text-gray-500">-</span>;
      }
      return <span className="font-mono text-sm">{info.getValue()}</span>;
    },
    size: 140,
  },
  subtotal: {
    header: "Subtotal", // Corregido: de "Subtotal MXN" a "Subtotal"
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
    size: 130,
  },
  moneda: {
    header: "Moneda",
    cell: (info) => {
      const row = info.row.original;
      if (row.isSummary) {
        return (
          <span className="text-center block font-semibold text-xs text-blue-700">
            MXN
          </span>
        );
      }
      return (
        <span className="text-center block font-semibold text-xs">
          {info.getValue()}
        </span>
      );
    },
    size: 70,
  },
  tipoCambio: {
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
          onChange={(newValue) => updateTipoCambio(row.id, newValue)}
          disabled={row.moneda === "MXN"}
          moneda={row.moneda}
        />
      );
    },
    size: 110,
  },
  estadoSat: {
    header: "Estado SAT",
    cell: (info) => {
      const row = info.row.original;
      const value = info.getValue();
      if (row.isSummary) {
        return (
          <span className="text-center block text-sm font-semibold text-blue-700">
            --
          </span>
        );
      }
      return (
        <EditableEstadoSatCell
          value={value || "Vigente"}
          onChange={(newValue) => updateEstadoSat(row.id, newValue)}
        />
      );
    },
    size: 120,
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
  const specialKeys = Object.keys(specialColumnConfig);

  // Claves a ignorar (no son columnas visibles)
  const keysToIgnore = new Set(["id", "isSummary"]);

  // Obtener todas las claves de la primera fila de datos
  const allKeys = Object.keys(data[0]);

  // Filtrar y ordenar las claves
  const columnKeys = allKeys.filter((key) => !keysToIgnore.has(key));

  // Opcional: Mover las columnas especiales al principio en un orden definido
  columnKeys.sort((a, b) => {
    const aIsSpecial = specialKeys.indexOf(a);
    const bIsSpecial = specialKeys.indexOf(b);
    if (aIsSpecial > -1 && bIsSpecial > -1) return aIsSpecial - bIsSpecial;
    if (aIsSpecial > -1) return -1;
    if (bIsSpecial > -1) return 1;
    return 0; // Mantener orden original para las dinámicas
  });

  return columnKeys.map((key) => {
    // Si es una columna especial, usar su configuración avanzada
    if (specialColumnConfig[key]) {
      return columnHelper.accessor(key as keyof AuxiliarIngresosRow, specialColumnConfig[key]);
    }

    // Si es una columna genérica/dinámica del Excel, crear una celda simple
    return columnHelper.accessor(key as keyof AuxiliarIngresosRow, {
      header: () => key.charAt(0).toUpperCase() + key.slice(1), // Capitalizar header
      cell: (info) => {
        const value = info.getValue();
        // Renderizar booleano de forma legible, o el valor como string
        if (typeof value === 'boolean') {
          return value ? 'Sí' : 'No';
        }
        return value as string;
      },
      size: 150, // Tamaño por defecto para columnas dinámicas
    });
  });
}
