/**
 * Funciones de cálculo y transformación para el reporte Auxiliar de Ingresos
 */

import {
    AuxiliarIngresosRow,
    AuxiliarIngresosTotales,
    AUXILIAR_INGRESOS_CONFIG,
    EstadoSat,
} from '../types';

/**
 * Parsea datos de Excel (array bidimensional) a formato tipado
 * @param excelData - Datos del Excel (fila 0 = headers, resto = datos)
 * @returns Array de filas tipadas
 */
export const parseExcelToAuxiliarIngresos = (
    excelData: any[][]
): AuxiliarIngresosRow[] => {
    if (!excelData || excelData.length < 2) {
        return [];
    }

    // Primera fila son los headers
    const headers = excelData[0].map((h: any) =>
        h?.toString().toLowerCase().trim() || ''
    );

    // Encontrar índices de columnas clave
    const getColumnIndex = (keywords: string[]): number => {
        return headers.findIndex((h: string) =>
            keywords.some((keyword) => h.includes(keyword))
        );
    };

    const uuidIndex = getColumnIndex(['uuid', 'folio fiscal']);
    const fechaIndex = getColumnIndex(['fecha']);
    const rfcIndex = getColumnIndex(['rfc', 'receptor']);
    const razonSocialIndex = getColumnIndex(['razon social', 'razón social', 'receptor']);
    const subtotalIndex = getColumnIndex(['subtotal']);
    const monedaIndex = getColumnIndex(['moneda']);
    const tipoCambioIndex = getColumnIndex(['tipo de cambio', 'tipo cambio', 'tc']);
    const estadoIndex = getColumnIndex(['estado', 'estado sat']);

    // Parsear filas de datos (desde índice 1 en adelante)
    return excelData.slice(1).map((row, index) => {
        // Extraer valores
        const uuid = row[uuidIndex]?.toString() || `row-${index}`;
        const subtotalAUX = parseFloat(row[subtotalIndex]) || 0;
        const moneda = row[monedaIndex]?.toString().toUpperCase() || AUXILIAR_INGRESOS_CONFIG.BASE_CURRENCY;
        const tipoCambioRaw = row[tipoCambioIndex];
        const estadoRaw = row[estadoIndex]?.toString().toLowerCase() || '';

        // Determinar tipo de cambio
        let tipoCambio: number | null = null;
        if (moneda === AUXILIAR_INGRESOS_CONFIG.BASE_CURRENCY) {
            tipoCambio = AUXILIAR_INGRESOS_CONFIG.DEFAULT_MXN_EXCHANGE_RATE;
        } else if (tipoCambioRaw !== null && tipoCambioRaw !== undefined) {
            tipoCambio = parseFloat(tipoCambioRaw) || null;
        }

        // Determinar estado SAT
        const estadoSat: EstadoSat = estadoRaw.includes('cancelad') ? 'Cancelada' : 'Vigente';

        // Calcular subtotal en MXN
        const subtotalMXN = calculateSubtotalMXN(subtotalAUX, moneda, tipoCambio);

        // Construir objeto
        return {
            id: uuid,
            fecha: row[fechaIndex]?.toString() || null,
            rfc: row[rfcIndex]?.toString() || null,
            razonSocial: row[razonSocialIndex]?.toString() || null,
            subtotalAUX,
            moneda,
            tipoCambio,
            subtotalMXN,
            estadoSat,
        };
    });
};

/**
 * Calcula el subtotal en MXN basado en moneda y tipo de cambio
 * @param subtotalAUX - Subtotal en moneda original
 * @param moneda - Código de moneda
 * @param tipoCambio - Tipo de cambio (puede ser null)
 * @returns Subtotal en MXN
 */
export const calculateSubtotalMXN = (
    subtotalAUX: number,
    moneda: string,
    tipoCambio: number | null
): number => {
    if (moneda === AUXILIAR_INGRESOS_CONFIG.BASE_CURRENCY) {
        return subtotalAUX;
    }

    if (tipoCambio === null || tipoCambio <= 0) {
        return 0; // Sin tipo de cambio válido
    }

    return subtotalAUX * tipoCambio;
};

/**
 * Calcula los totales del reporte (excluyendo facturas canceladas)
 * @param data - Array de filas del reporte
 * @returns Objeto con totales calculados
 */
export const calculateTotales = (
    data: AuxiliarIngresosRow[]
): AuxiliarIngresosTotales => {
    // Filtrar solo vigentes
    const vigentes = data.filter((row) => row.estadoSat === 'Vigente');
    const canceladas = data.filter((row) => row.estadoSat === 'Cancelada');

    // Sumar subtotales
    const totalSubtotalAUX = vigentes.reduce(
        (sum, row) => sum + row.subtotalAUX,
        0
    );

    const totalSubtotalMXN = vigentes.reduce(
        (sum, row) => sum + row.subtotalMXN,
        0
    );

    return {
        totalSubtotalAUX,
        totalSubtotalMXN,
        cantidadVigentes: vigentes.length,
        cantidadCanceladas: canceladas.length,
        totalViable: canceladas.length === 0,
    };
};

/**
 * Formatea un número como moneda (con símbolo de pesos)
 * @param value - Valor numérico
 * @param includeSymbol - Si debe incluir el símbolo $
 * @returns String formateado
 */
export const formatCurrency = (
    value: number,
    includeSymbol: boolean = true
): string => {
    const formatted = value.toFixed(AUXILIAR_INGRESOS_CONFIG.CURRENCY_DECIMALS);
    return includeSymbol ? `$${formatted}` : formatted;
};

/**
 * Formatea una fecha a formato legible
 * @param dateString - String de fecha
 * @returns Fecha formateada o guion si es null
 */
export const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return dateString;
    }
};

/**
 * Valida un valor de tipo de cambio
 * @param value - Valor a validar
 * @returns true si es válido (número positivo)
 */
export const isValidTipoCambio = (value: any): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
};

/**
 * Recalcula el subtotal MXN de una fila después de editar tipo de cambio
 * @param row - Fila original
 * @param newTipoCambio - Nuevo tipo de cambio
 * @returns Fila actualizada
 */
export const recalculateRowAfterTipoCambioChange = (
    row: AuxiliarIngresosRow,
    newTipoCambio: number
): AuxiliarIngresosRow => {
    return {
        ...row,
        tipoCambio: newTipoCambio,
        subtotalMXN: calculateSubtotalMXN(row.subtotalAUX, row.moneda, newTipoCambio),
    };
};

/**
 * Actualiza el estado SAT de una fila
 * @param row - Fila original
 * @param newEstadoSat - Nuevo estado
 * @returns Fila actualizada
 */
export const updateRowEstadoSat = (
    row: AuxiliarIngresosRow,
    newEstadoSat: EstadoSat
): AuxiliarIngresosRow => {
    return {
        ...row,
        estadoSat: newEstadoSat,
    };
};
