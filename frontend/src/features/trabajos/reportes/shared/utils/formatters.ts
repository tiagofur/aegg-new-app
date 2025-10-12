/**
 * Utilidades de formateo comunes para reportes
 */

/**
 * Formatea un número como moneda en MXN
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '-';

    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formatea un número como tipo de cambio (4 decimales)
 */
export function formatTipoCambio(value: number | null | undefined): string {
    if (value == null) return '-';

    return value.toFixed(4);
}

/**
 * Formatea una fecha (string ISO o Date) a formato dd/mm/yyyy
 */
export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '-';

    try {
        const date = typeof value === 'string' ? new Date(value) : value;

        if (isNaN(date.getTime())) return '-';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch {
        return '-';
    }
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number | null | undefined): string {
    if (value == null) return '-';

    return `${value.toFixed(2)}%`;
}
