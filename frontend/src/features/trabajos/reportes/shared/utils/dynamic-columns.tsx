/**
 * Utilidades para crear columnas dinámicas en TanStack Table
 * basadas en los datos del Excel
 */

import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { formatCurrency, formatDate } from './formatters'

// Campos que NUNCA deben mostrarse como columnas normales
// (ya tienen columnas especiales o son internos)
const EXCLUDED_FIELDS = new Set([
    'id',
    'isSummary',
    'subtotalAUX', // Tiene columna especial
    'subtotalMXN', // Tiene columna especial
    'tcSugerido', // Tiene columna especial
])

// Campos conocidos con formato especial
const CURRENCY_FIELDS = new Set(['subtotal', 'iva', 'total', 'subtotalAUX', 'subtotalMXN'])

const DATE_FIELDS = new Set(['fecha', 'fechaEmision', 'fechaTimbrado', 'fechaCertificacion'])

const NUMERIC_FIELDS = new Set(['tipoCambio', 'tcSugerido', 'cantidad'])

/**
 * Detecta todas las columnas únicas presentes en los datos
 */
export function detectColumns<T extends Record<string, any>>(data: T[]): string[] {
    if (!data || data.length === 0) return []

    const columnSet = new Set<string>()

    // Recopilar todas las claves únicas de todos los registros
    data.forEach((row) => {
        Object.keys(row).forEach((key) => {
            if (!EXCLUDED_FIELDS.has(key)) {
                columnSet.add(key)
            }
        })
    })

    return Array.from(columnSet)
}

/**
 * Determina el tipo de dato de una columna basándose en su nombre y valores
 */
export function inferColumnType(
    columnName: string,
    sampleValues: any[]
): 'currency' | 'date' | 'number' | 'text' {
    const normalizedName = columnName.toLowerCase()

    // Verificar por nombre
    if (
        CURRENCY_FIELDS.has(columnName) ||
        normalizedName.includes('subtotal') ||
        normalizedName.includes('total') ||
        normalizedName.includes('iva')
    ) {
        return 'currency'
    }
    if (DATE_FIELDS.has(columnName) || normalizedName.includes('fecha')) {
        return 'date'
    }
    if (
        NUMERIC_FIELDS.has(columnName) ||
        normalizedName.includes('tipo') ||
        normalizedName.includes('cambio')
    ) {
        return 'number'
    }

    // Verificar por valores (primeros 10 no nulos)
    const validValues = sampleValues.filter((v) => v != null).slice(0, 10)
    if (validValues.length > 0) {
        const allNumbers = validValues.every((v) => typeof v === 'number' || !isNaN(Number(v)))
        if (allNumbers) {
            // Si tiene decimales, probablemente es currency o number
            const hasDecimals = validValues.some((v) => Number(v) % 1 !== 0)
            return hasDecimals ? 'currency' : 'number'
        }

        // Verificar si son fechas (strings con formato ISO o dd/mm/yyyy)
        const allDates = validValues.every((v) => {
            if (typeof v !== 'string') return false
            return /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{2}\/\d{2}\/\d{4}/.test(v)
        })
        if (allDates) return 'date'
    }

    return 'text'
}

/**
 * Formatea un valor según su tipo
 */
export function formatCellValue(value: any, type: 'currency' | 'date' | 'number' | 'text'): string {
    if (value == null || value === '') {
        return '-'
    }

    switch (type) {
        case 'currency':
            return formatCurrency(Number(value))
        case 'date':
            return formatDate(value)
        case 'number': {
            const num = Number(value)
            return isNaN(num) ? String(value) : num.toFixed(4)
        }
        case 'text':
        default:
            return String(value)
    }
}

/**
 * Crea definiciones de columnas dinámicas basadas en los datos
 */
export function createDynamicColumns<T extends Record<string, any>>(
    data: T[],
    columnHelper: ReturnType<typeof createColumnHelper<T>>
): ColumnDef<T, any>[] {
    if (!data || data.length === 0) return []

    const columnNames = detectColumns(data)
    const columns: ColumnDef<T, any>[] = []

    columnNames.forEach((columnName) => {
        // Obtener valores de muestra para inferir tipo
        const sampleValues = data
            .slice(0, 20)
            .map((row) => row[columnName])
            .filter((v) => v != null)

        const columnType = inferColumnType(columnName, sampleValues)

        // Crear columna dinámica
        columns.push(
            columnHelper.accessor(columnName as any, {
                header: columnName,
                cell: (info) => {
                    const row = info.row.original
                    if (row.isSummary) {
                        // Para fila de totales, solo mostrar valores en columnas de moneda
                        if (columnType === 'currency') {
                            return (
                                <span className="font-semibold text-blue-700">
                                    {formatCellValue(info.getValue(), columnType)}
                                </span>
                            )
                        }
                        return <span className="text-xs text-gray-500">-</span>
                    }

                    const value = info.getValue()
                    const formattedValue = formatCellValue(value, columnType)

                    // Aplicar estilos según el tipo
                    let className = 'text-sm'
                    if (columnType === 'currency' || columnType === 'number') {
                        className += ' text-right font-mono'
                    }

                    return <span className={className}>{formattedValue}</span>
                },
                size: columnType === 'date' ? 100 : columnType === 'currency' ? 120 : 150,
            })
        )
    })

    return columns
}

/**
 * Formatea el nombre de una columna para mostrar
 * (convierte snake_case, camelCase a Title Case)
 */
export function formatColumnName(name: string): string {
    return (
        name
            // Separar por guiones bajos o mayúsculas
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            // Capitalizar primera letra de cada palabra
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim()
    )
}
