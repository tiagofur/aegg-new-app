/**
 * Funciones de cálculo y transformación para el reporte Auxiliar de Ingresos
 * FASE 8: Sistema de parsing flexible con validación robusta
 */

import {
    AuxiliarIngresosRow,
    AuxiliarIngresosTotales,
    AUXILIAR_INGRESOS_CONFIG,
    EstadoSat,
} from '../types';
import {
    normalizeHeader,
    findColumnIndex,
    findHeaderRow,
    COLUMN_KEYWORDS,
    validateRequiredColumns,
    parseTipoCambio,
    parseFecha,
    parseAmount,
    parseMoneda,
} from '../../shared/utils/column-parser';

/**
 * Parsea datos de Excel (array bidimensional) a formato tipado
 * FASE 8: Implementación con parsing flexible y validación robusta
 * 
 * @param excelData - Datos del Excel (busca header dinámicamente)
 * @returns Array de filas tipadas
 */
export const parseExcelToAuxiliarIngresos = (
    excelData: any[][]
): AuxiliarIngresosRow[] => {
    if (!excelData || excelData.length < 2) {
        return [];
    }

    console.log('📊 Parseando Auxiliar de Ingresos...');

    // 🔍 Buscar fila del header dinámicamente (primera fila con 8+ columnas)
    const headerRowIndex = findHeaderRow(excelData, 8);
    if (headerRowIndex === -1) {
        console.error('❌ No se encontró la fila de headers en el Excel');
        throw new Error(
            'No se pudo encontrar la fila de headers en el archivo Excel.\n' +
            'El header debe tener al menos 8 columnas con datos.\n' +
            'Por favor, verifica que el archivo tenga el formato correcto.'
        );
    }

    const headers = excelData[headerRowIndex];
    const dataStartRow = headerRowIndex + 1;

    console.log(`📋 Headers encontrados en fila ${headerRowIndex + 1}:`, headers);

    // ✅ Definir columnas obligatorias
    const requiredColumns = {
        'UUID/Folio Fiscal': COLUMN_KEYWORDS.UUID,
        'Subtotal': COLUMN_KEYWORDS.SUBTOTAL,
        'Moneda': COLUMN_KEYWORDS.MONEDA,
        'Tipo Cambio': COLUMN_KEYWORDS.TIPO_CAMBIO,
    };

    // ✅ Validar columnas obligatorias
    const { missing, found, normalized } = validateRequiredColumns(
        headers,
        requiredColumns
    );

    if (missing.length > 0) {
        console.error('❌ Columnas obligatorias faltantes:', missing);
        console.warn('📋 Headers detectados:', headers);
        throw new Error(
            `No se encontraron las siguientes columnas obligatorias:\n` +
            `${missing.map((col) => `  • ${col}`).join('\n')}\n\n` +
            `Headers detectados en el Excel:\n` +
            `${headers.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}\n\n` +
            `Por favor, verifica que tu archivo Excel contenga todas las columnas necesarias.`
        );
    }    // ✅ Obtener índices de columnas obligatorias
    const uuidIndex = found['UUID/Folio Fiscal'];
    const subtotalIndex = found['Subtotal'];
    const monedaIndex = found['Moneda'];
    const tipoCambioIndex = found['Tipo Cambio'];

    // ✅ Obtener índices de columnas opcionales
    const folioIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FOLIO);
    const fechaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FECHA);
    const rfcIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RFC);
    const razonSocialIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RAZON_SOCIAL);
    const estadoIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.ESTADO_SAT);

    console.log('✅ Columnas detectadas:', {
        UUID: uuidIndex,
        Folio: folioIndex,
        Fecha: fechaIndex,
        RFC: rfcIndex,
        'Razón Social': razonSocialIndex,
        Subtotal: subtotalIndex,
        Moneda: monedaIndex,
        'Tipo Cambio': tipoCambioIndex,
        'Estado SAT': estadoIndex,
    });

    // ✅ Parsear filas de datos (desde la fila siguiente al header)
    const rows: AuxiliarIngresosRow[] = [];

    for (let i = dataStartRow; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || row.length === 0) continue;

        const uuid = row[uuidIndex]?.toString().trim() || `row-${i}`;
        if (!uuid || uuid === `row-${i}`) {
            console.warn(`⚠️ Fila ${i + 1} sin UUID, se omitirá`);
            continue;
        }

        // Parsear valores usando funciones especializadas
        const moneda = parseMoneda(row[monedaIndex]);
        const tipoCambio = parseTipoCambio(row[tipoCambioIndex], moneda);
        const subtotal = parseAmount(row[subtotalIndex]); // Ya viene en MXN

        // Valores opcionales
        const folio = folioIndex !== -1 ? row[folioIndex]?.toString().trim() || null : null;
        const fecha = fechaIndex !== -1 ? parseFecha(row[fechaIndex]) : null;
        const rfc = rfcIndex !== -1 ? row[rfcIndex]?.toString().trim() || null : null;
        const razonSocial = razonSocialIndex !== -1 ? row[razonSocialIndex]?.toString().trim() || null : null;

        // Estado SAT
        const estadoRaw = estadoIndex !== -1 ? row[estadoIndex]?.toString().toLowerCase() || '' : '';
        const estadoSat: EstadoSat = estadoRaw.includes('cancelad') ? 'Cancelada' : 'Vigente';

        rows.push({
            id: uuid,
            folio,
            fecha,
            rfc,
            razonSocial,
            subtotal, // Ya está en MXN, no necesita conversión
            moneda, // Solo informativo
            tipoCambio, // Solo informativo
            estadoSat,
        });
    }

    console.log(`✅ ${rows.length} registros parseados de Auxiliar de Ingresos`);

    return rows;
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

    // Sumar subtotales (ya están en MXN)
    const totalSubtotal = vigentes.reduce(
        (sum, row) => sum + row.subtotal,
        0
    );

    return {
        totalSubtotal,
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
 * Actualiza el estado SAT de una fila
 * @param row - Fila original
 * @param newEstadoSat - Nuevo estado
 * @returns Fila actualizada
 * 
 * NOTA: En Auxiliar de Ingresos, el Tipo de Cambio es solo informativo,
 * no se puede editar porque el Subtotal ya viene calculado en MXN desde el SAT.
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
