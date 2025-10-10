/**
 * Utilidades de cálculo para Mi Admin Ingresos
 * FASE 8: Implementación con parsing flexible y corrección de bug TC
 */

import type {
    MiAdminIngresosRow,
    MiAdminIngresosTotales,
} from '../types';
import { MI_ADMIN_INGRESOS_CONFIG } from '../types';

// Importar utilities de FASE 8
import {
    COLUMN_KEYWORDS,
    normalizeHeader,
    findColumnIndex,
    findHeaderRow,
    validateRequiredColumns,
    parseTipoCambio,
    parseFecha,
    parseAmount,
    parseMoneda,
} from '../../shared/utils/column-parser';

// Tipo para datos de Auxiliar Ingresos (para TC lookup y comparación)
interface AuxiliarIngresosRow {
    id: string; // UUID/Folio Fiscal
    estadoSat: 'Vigente' | 'Cancelada';
    subtotal: number; // Ya está en MXN
    tipoCambio: number | null;
    moneda: string;
    [key: string]: any;
}

/**
 * Parsear datos de Excel y agregar datos de Auxiliar Ingresos
 * FASE 8: Implementación con validación robusta y corrección de bug TC=1.0 para USD
 * 
 * BUG CRÍTICO RESUELTO:
 * Mi Admin muestra TC=1.0 para facturas en USD cuando debería ser ~20.0 MXN/USD
 * SOLUCIÓN: Si detectamos TC sospechoso (1.0 o 0) y moneda != MXN,
 *           intentamos obtener el TC correcto desde auxiliarData por UUID
 * 
 * @param excelData - Array bidimensional del Excel
 * @param auxiliarData - Datos de Auxiliar Ingresos para corrección de TC
 * @returns Array de filas tipadas
 */
export const parseExcelToMiAdminIngresos = (
    excelData: any[][],
    auxiliarData: AuxiliarIngresosRow[] | undefined
): MiAdminIngresosRow[] => {
    if (!excelData || excelData.length < 2) {
        return [];
    }

    console.log('📊 Parseando Mi Admin Ingresos...');

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
    const uuidIndex = found['UUID/Folio Fiscal'];
    const subtotalIndex = found['Subtotal'];
    const monedaIndex = found['Moneda'];

    // ✅ Obtener índices de columnas opcionales
    const folioIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FOLIO);
    const tipoCambioIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.TIPO_CAMBIO);
    const fechaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FECHA);
    const rfcIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RFC);
    const razonSocialIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RAZON_SOCIAL);
    const ivaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.IVA);
    const totalIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.TOTAL);
    const estadoIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.ESTADO_SAT);

    console.log('✅ Columnas detectadas:', {
        UUID: uuidIndex,
        Folio: folioIndex,
        Fecha: fechaIndex,
        RFC: rfcIndex,
        'Razón Social': razonSocialIndex,
        Subtotal: subtotalIndex,
        IVA: ivaIndex,
        Total: totalIndex,
        Moneda: monedaIndex,
        'Tipo Cambio': tipoCambioIndex,
        'Estado SAT': estadoIndex,
    });

    // ✅ Crear lookup de Auxiliar por UUID (solo vigentes)
    const auxiliarLookup = new Map<string, AuxiliarIngresosRow>();
    if (auxiliarData) {
        auxiliarData
            .filter((row) => row.estadoSat === 'Vigente')
            .forEach((row) => {
                auxiliarLookup.set(row.id, row);
            });
        console.log(`📚 ${auxiliarLookup.size} registros de Auxiliar disponibles para lookup`);
    }

    // ✅ Parsear filas de datos (desde la fila siguiente al header)
    const rows: MiAdminIngresosRow[] = [];
    let tcCorregidosCount = 0;

    for (let i = dataStartRow; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || row.length === 0) continue;

        const uuid = row[uuidIndex]?.toString().trim() || `row-${i}`;
        if (!uuid || uuid === `row-${i}`) {
            console.warn(`⚠️ Fila ${i + 1} sin UUID, se omitirá`);
            continue;
        }

        // Parsear folio separadamente (puede ser diferente al UUID)
        const folio = folioIndex !== -1
            ? row[folioIndex]?.toString().trim() || uuid
            : uuid;

        // Parsear valores básicos
        const moneda = parseMoneda(row[monedaIndex]);
        const subtotal = parseAmount(row[subtotalIndex]);
        const iva = ivaIndex !== -1 ? parseAmount(row[ivaIndex]) : 0;
        const total = totalIndex !== -1 ? parseAmount(row[totalIndex]) : subtotal + iva;

        // 🔥 CORRECCIÓN CRÍTICA DE BUG TC
        let tipoCambio: number | null = null;
        if (tipoCambioIndex !== -1) {
            tipoCambio = parseTipoCambio(row[tipoCambioIndex], moneda);
        }

        // Si TC es sospechoso (1.0 o null) y moneda no es MXN, buscar en Auxiliar
        if (moneda !== 'MXN' && (!tipoCambio || tipoCambio === 1.0)) {
            const auxiliarRow = auxiliarLookup.get(uuid);
            if (auxiliarRow && auxiliarRow.tipoCambio && auxiliarRow.tipoCambio > 1.0) {
                console.warn(
                    `🔧 Corrigiendo TC para ${uuid}: TC Mi Admin=${tipoCambio || 'null'} → TC Auxiliar=${auxiliarRow.tipoCambio}`
                );
                tipoCambio = auxiliarRow.tipoCambio;
                tcCorregidosCount++;
            } else {
                console.warn(
                    `⚠️ ${uuid}: TC sospechoso (${tipoCambio}) para ${moneda}, pero no se encontró en Auxiliar`
                );
            }
        }

        // Valores opcionales
        const fecha = fechaIndex !== -1 ? parseFecha(row[fechaIndex]) : null;
        const rfc = rfcIndex !== -1 ? row[rfcIndex]?.toString().trim() || null : null;
        const razonSocial = razonSocialIndex !== -1 ? row[razonSocialIndex]?.toString().trim() || null : null;

        // Estado SAT
        const estadoRaw = estadoIndex !== -1 ? row[estadoIndex]?.toString().toLowerCase() || '' : '';
        const estadoSat: 'Vigente' | 'Cancelada' = estadoRaw.includes('cancelad') ? 'Cancelada' : 'Vigente';

        console.log(`🔍 Mi Admin Row ${i}: Estado SAT = "${estadoSat}" (raw: "${estadoRaw}", index: ${estadoIndex})`);

        // Buscar subtotalAUX desde Auxiliar (ya viene en MXN)
        const auxiliarRow = auxiliarLookup.get(uuid);
        const subtotalAUX = auxiliarRow?.subtotal || null;

        // Calcular subtotal MXN
        const subtotalMXN = calculateSubtotalMXN(subtotal, moneda, tipoCambio);

        // Calcular TC Sugerido
        const tcSugerido = calculateTCSugerido(subtotalAUX, subtotal);

        rows.push({
            id: uuid,
            folio: folio,
            fecha,
            rfc,
            razonSocial,
            subtotal,
            iva,
            total,
            moneda,
            tipoCambio,
            estadoSat,
            subtotalAUX,
            subtotalMXN,
            tcSugerido,
        });
    }

    console.log(`✅ ${rows.length} registros parseados de Mi Admin Ingresos`);
    if (tcCorregidosCount > 0) {
        console.log(`🔧 ${tcCorregidosCount} tipos de cambio corregidos usando datos de Auxiliar`);
    }

    return rows;
};

/**
 * Calcular Subtotal MXN
 * @param subtotal - Subtotal en moneda original
 * @param moneda - Moneda de la factura
 * @param tipoCambio - Tipo de cambio
 * @returns Subtotal en MXN
 */
export const calculateSubtotalMXN = (
    subtotal: number,
    moneda: string,
    tipoCambio: number | null
): number => {
    if (moneda === 'MXN') {
        return subtotal;
    }
    return subtotal * (tipoCambio || 1);
};

/**
 * Calcular TC Sugerido
 * @param subtotalAUX - Subtotal de Auxiliar Ingresos
 * @param subtotal - Subtotal de Mi Admin
 * @returns TC Sugerido o null
 */
export const calculateTCSugerido = (
    subtotalAUX: number | null,
    subtotal: number
): number | null => {
    if (!subtotalAUX || subtotal === 0) {
        return null;
    }
    return subtotalAUX / subtotal;
};

/**
 * Calcular totales del reporte (excluye canceladas)
 * @param data - Array de filas
 * @returns Totales calculados
 */
export const calculateTotales = (
    data: MiAdminIngresosRow[]
): MiAdminIngresosTotales => {
    const vigentes = data.filter(row => row.estadoSat === 'Vigente');
    const canceladas = data.filter(row => row.estadoSat === 'Cancelada');

    const totalSubtotal = vigentes.reduce((sum, row) => sum + row.subtotal, 0);
    const totalSubtotalAUX = vigentes.reduce((sum, row) => sum + (row.subtotalAUX || 0), 0);
    const totalSubtotalMXN = vigentes.reduce((sum, row) => sum + row.subtotalMXN, 0);

    const cantidadTotal = data.length;
    const cantidadVigentes = vigentes.length;
    const cantidadCanceladas = canceladas.length;

    return {
        totalSubtotal,
        totalSubtotalAUX,
        totalSubtotalMXN,
        cantidadVigentes,
        cantidadCanceladas,
        cantidadTotal,
        porcentajeVigentes: cantidadTotal > 0 ? (cantidadVigentes / cantidadTotal) * 100 : 0,
        porcentajeCanceladas: cantidadTotal > 0 ? (cantidadCanceladas / cantidadTotal) * 100 : 0,
    };
};

/**
 * Recalcular fila después de cambiar Tipo de Cambio
 * @param row - Fila original
 * @param nuevoTipoCambio - Nuevo tipo de cambio
 * @returns Fila con valores recalculados
 */
export const recalculateRowAfterTipoCambioChange = (
    row: MiAdminIngresosRow,
    nuevoTipoCambio: number
): Partial<MiAdminIngresosRow> => {
    const subtotalMXN = calculateSubtotalMXN(row.subtotal, row.moneda, nuevoTipoCambio);

    return {
        tipoCambio: nuevoTipoCambio,
        subtotalMXN,
    };
};

/**
 * Actualizar Estado SAT de una fila
 * @param row - Fila original
 * @param nuevoEstado - Nuevo estado SAT
 * @returns Partial con cambios
 */
export const updateRowEstadoSat = (
    row: MiAdminIngresosRow,
    nuevoEstado: 'Vigente' | 'Cancelada'
): Partial<MiAdminIngresosRow> => {
    return {
        estadoSat: nuevoEstado,
    };
};

/**
 * Formatear valor como moneda
 * @param value - Valor numérico
 * @returns String formateado
 */
export const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) {
        return '-';
    }
    return `$${value.toFixed(MI_ADMIN_INGRESOS_CONFIG.CURRENCY_DECIMALS).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formatear tipo de cambio
 * @param value - Valor del tipo de cambio
 * @returns String formateado
 */
export const formatTipoCambio = (value: number | null): string => {
    if (value === null || value === undefined) {
        return '-';
    }
    return value.toFixed(MI_ADMIN_INGRESOS_CONFIG.TC_DECIMALS);
};

/**
 * Formatear fecha
 * @param date - String de fecha
 * @returns Fecha formateada
 */
export const formatDate = (date: string | null): string => {
    if (!date) return '-';

    try {
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return date;
    }
};

/**
 * Validar que un tipo de cambio sea válido
 * @param value - Valor a validar
 * @returns true si es válido
 */
export const isValidTipoCambio = (value: number): boolean => {
    return value > 0 && !isNaN(value) && isFinite(value);
};

/**
 * Convertir array de filas tipadas a formato Excel para guardar
 * @param data - Array de filas tipadas
 * @returns Array bidimensional para Excel
 */
export const convertToExcelFormat = (data: MiAdminIngresosRow[]): any[][] => {
    const headers = [
        'Folio',
        'Fecha',
        'RFC',
        'Razón Social',
        'Subtotal',
        'IVA',
        'Total',
        'Moneda',
        'Tipo de Cambio',
        'Estado SAT',
        'Subtotal AUX',
        'Subtotal MXN',
        'TC Sugerido',
    ];

    const rows = data.map(row => [
        row.folio,
        row.fecha,
        row.rfc,
        row.razonSocial,
        row.subtotal,
        row.iva,
        row.total,
        row.moneda,
        row.tipoCambio,
        row.estadoSat,
        row.subtotalAUX,
        row.subtotalMXN,
        row.tcSugerido,
    ]);

    return [headers, ...rows];
};
