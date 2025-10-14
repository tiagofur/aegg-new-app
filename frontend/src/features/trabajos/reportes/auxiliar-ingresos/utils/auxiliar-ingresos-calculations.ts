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
 * VERSIÓN DINÁMICA: Importa TODAS las columnas del Excel
 * 
 * @param excelData - Datos del Excel (busca header dinámicamente)
 * @returns Array de filas tipadas con TODAS las columnas del Excel
 */
export const parseExcelToAuxiliarIngresos = (
    excelData: any[][]
): AuxiliarIngresosRow[] => {
    if (!excelData || excelData.length < 2) {
        return [];
    }

    console.log('📊 Parseando Auxiliar de Ingresos (VERSIÓN DINÁMICA)...');

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

    const headers = Array.isArray(excelData[headerRowIndex])
        ? [...excelData[headerRowIndex]]
        : [...(excelData[headerRowIndex] ?? [])];
    const dataStartRow = headerRowIndex + 1;

    console.log(`📋 Headers encontrados en fila ${headerRowIndex + 1}:`, headers);

    // ✅ Definir columnas obligatorias (solo las esenciales)
    const requiredColumns = {
        'Folio': COLUMN_KEYWORDS.FOLIO, // FOLIO es el campo clave
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
    }

    // ✅ Obtener índices de columnas obligatorias
    const folioIndex = found['Folio']; // FOLIO es obligatorio ahora
    const subtotalIndex = found['Subtotal'];
    const monedaIndex = found['Moneda'];
    const tipoCambioIndex = found['Tipo Cambio'];

    // ✅ Obtener índices de columnas opcionales conocidas
    const uuidIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.UUID); // UUID ahora es opcional
    const fechaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FECHA);
    const rfcIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RFC);
    const razonSocialIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RAZON_SOCIAL);
    const serieIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.SERIE);
    let estadoIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.ESTADO_SAT);

    if (estadoIndex === -1) {
        console.warn('⚠️ Columna "Estado SAT" no encontrada en Auxiliar. Se agregará automáticamente.');
        headers.push('Estado SAT');
        estadoIndex = headers.length - 1;
        excelData[headerRowIndex] = headers;
    }

    console.log('✅ Columnas detectadas:', {
        Folio: folioIndex, // Campo clave
        UUID: uuidIndex, // Opcional
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
        const rawRow = excelData[i];
        const row = Array.isArray(rawRow) ? [...rawRow] : [];
        if (!row || row.length === 0) continue;

        const firstCell = row[0]?.toString().toLowerCase() || '';
        if (firstCell === 'total' || firstCell === 'totales') {
            continue;
        }

        // FOLIO es el campo obligatorio ahora
        const rawSerie = serieIndex !== -1 ? row[serieIndex]?.toString().trim() || '' : '';
        const rawFolio = row[folioIndex]?.toString().trim() || '';
        const combinedFolio = rawSerie && rawFolio
            ? `${rawSerie}${rawFolio.startsWith(rawSerie) ? '' : '-'}${rawFolio}`
            : rawFolio || rawSerie;

        const folio = combinedFolio || `row-${i}`;
        if (!combinedFolio) {
            console.warn(`⚠️ Fila ${i + 1} sin FOLIO, se omitirá`);
            continue;
        }

        // UUID es opcional
        const uuid = uuidIndex !== -1 ? row[uuidIndex]?.toString().trim() || folio : folio;

        // Parsear valores usando funciones especializadas
        const moneda = parseMoneda(row[monedaIndex]);
        const tipoCambio = parseTipoCambio(row[tipoCambioIndex], moneda);
        const subtotal = parseAmount(row[subtotalIndex]); // Ya viene en MXN

        // Valores opcionales
        const fecha = fechaIndex !== -1 ? parseFecha(row[fechaIndex]) : null;
        const rfc = rfcIndex !== -1 ? row[rfcIndex]?.toString().trim() || null : null;
        const razonSocial = razonSocialIndex !== -1 ? row[razonSocialIndex]?.toString().trim() || null : null;

        // Estado SAT
        if (estadoIndex >= 0 && row.length <= estadoIndex) {
            row.length = estadoIndex + 1;
        }

        const estadoRaw = estadoIndex !== -1 ? row[estadoIndex]?.toString().toLowerCase() || '' : '';
        const estadoSat: EstadoSat = estadoRaw.includes('cancelad') ? 'Cancelada' : 'Vigente';

        if (!estadoRaw && estadoIndex !== -1) {
            row[estadoIndex] = 'Vigente';
            excelData[i] = row;
        }

        console.log(`🔍 Row ${i}: FOLIO = "${folio}", Estado SAT = "${estadoSat}" (raw: "${estadoRaw}")`);

        // --- IMPORTAR TODAS LAS COLUMNAS DINÁMICAMENTE ---
        const dynamicFields: Record<string, any> = {};
        headers.forEach((header, index) => {
            if (index !== folioIndex &&
                index !== uuidIndex &&
                index !== subtotalIndex &&
                index !== monedaIndex &&
                index !== tipoCambioIndex &&
                index !== fechaIndex &&
                index !== rfcIndex &&
                index !== razonSocialIndex &&
                index !== estadoIndex) {
                // Esta es una columna extra que no procesamos explícitamente
                const headerName = String(header || `col_${index}`);
                dynamicFields[headerName] = row[index];
            }
        });

        rows.push({
            id: uuid, // Mantener UUID como id para compatibilidad
            folio: folio, // FOLIO es el campo clave
            fecha,
            rfc,
            razonSocial,
            subtotal, // Ya está en MXN, no necesita conversión
            moneda, // Solo informativo
            tipoCambio, // Solo informativo
            estadoSat,
            ...dynamicFields, // Agregar todos los campos dinámicos del Excel
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

    const cantidadTotal = data.length;
    const porcentajeVigentes = cantidadTotal > 0
        ? (vigentes.length / cantidadTotal) * 100
        : 0;
    const porcentajeCanceladas = cantidadTotal > 0
        ? (canceladas.length / cantidadTotal) * 100
        : 0;
    const promedioSubtotalVigentes = vigentes.length > 0
        ? totalSubtotal / vigentes.length
        : 0;

    return {
        totalSubtotal,
        cantidadVigentes: vigentes.length,
        cantidadCanceladas: canceladas.length,
        cantidadTotal,
        porcentajeVigentes,
        porcentajeCanceladas,
        promedioSubtotalVigentes,
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
 * Formatear tipo de cambio con 4 decimales
 * @param value - Valor del tipo de cambio
 * @returns String formateado
 */
export const formatTipoCambio = (value: number | null): string => {
    if (value === null || value === undefined) {
        return '-';
    }
    return value.toFixed(AUXILIAR_INGRESOS_CONFIG.TC_DECIMALS);
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
