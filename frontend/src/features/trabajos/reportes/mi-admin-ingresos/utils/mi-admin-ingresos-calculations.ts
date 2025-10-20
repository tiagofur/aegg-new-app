/**
 * Utilidades de cálculo para Mi Admin Ingresos    console.log('🔥🔥🔥 ============================================');
    console.log('🔥🔥🔥 INICIO parseExcelToMiAdminIngresos (VERSIÓN DINÁMICA)');
    console.log('🔥🔥🔥 auxiliarData recibido:', {
        esUndefined: auxiliarData === undefined,
        esNull: auxiliarData === null,
        esArray: Array.isArray(auxiliarData),
        length: auxiliarData?.length,
        primerosRegistros: auxiliarData?.slice(0, 3).map(row => ({
            folio: row.folio,
            subtotal: row.subtotal,
            moneda: row.moneda,
            tipoCambio: row.tipoCambio
        }))
    });
    console.log('🔥🔥🔥 ============================================');lementación con parsing flexible y corrección de bug TC
 */

import type {
    MiAdminIngresosRow,
    MiAdminIngresosTotales,
} from '../types';
import { MI_ADMIN_INGRESOS_CONFIG } from '../types';

// Importar utilities de FASE 8
import {
    COLUMN_KEYWORDS,
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
    folio: string; // FOLIO - Campo clave para comparación
    estadoSat: 'Vigente' | 'Cancelada';
    subtotal: number; // Ya está en MXN (Subtotal AUX)
    tipoCambio: number | null;
    moneda: string;
    [key: string]: any; // Todos los demás campos del Excel
}

/**
 * Parsear datos de Excel y agregar datos de Auxiliar Ingresos
 * VERSIÓN DINÁMICA: Importa TODAS las columnas del Excel
 * 
 * COMPARACIÓN POR FOLIO:
 * - Usa FOLIO como campo de comparación (no UUID)
 * - Compara Subtotal de Auxiliar con Subtotal MXN de Mi Admin
 * 
 * @param excelData - Array bidimensional del Excel
 * @param auxiliarData - Datos de Auxiliar Ingresos para comparación por FOLIO
 * @returns Array de filas tipadas con TODAS las columnas del Excel
 */
export const parseExcelToMiAdminIngresos = (
    excelData: any[][],
    auxiliarData: AuxiliarIngresosRow[] | undefined
): MiAdminIngresosRow[] => {
    if (!excelData || excelData.length < 2) {
        return [];
    }

    console.log('�🔥🔥 ============================================');
    console.log('🔥🔥🔥 INICIO parseExcelToMiAdminIngresos');
    console.log('🔥🔥🔥 auxiliarData recibido:', {
        esUndefined: auxiliarData === undefined,
        esNull: auxiliarData === null,
        esArray: Array.isArray(auxiliarData),
        length: auxiliarData?.length,
        primerosRegistros: auxiliarData?.slice(0, 3).map(row => ({
            id: row.id,
            subtotal: row.subtotal,
            moneda: row.moneda,
            tipoCambio: row.tipoCambio
        }))
    });
    console.log('🔥🔥🔥 ============================================');

    console.log('�📊 Parseando Mi Admin Ingresos...');

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

    // ✅ Definir columnas obligatorias (solo las esenciales para cálculos)
    const requiredColumns = {
        'Folio': COLUMN_KEYWORDS.FOLIO, // FOLIO es el campo clave
        'Subtotal': COLUMN_KEYWORDS.SUBTOTAL,
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
    const monedaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.MONEDA);
    if (monedaIndex === -1) {
        console.warn('⚠️ Columna "Moneda" no encontrada en Mi Admin. Se asumirá MXN por defecto.');
    }

    // ✅ Obtener índices de columnas opcionales conocidas
    const uuidIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.UUID); // UUID ahora es opcional
    const tipoCambioIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.TIPO_CAMBIO);
    const fechaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.FECHA);
    const rfcIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RFC);
    const razonSocialIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.RAZON_SOCIAL);
    const serieIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.SERIE);
    const ivaIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.IVA);
    const totalIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.TOTAL);
    const subtotalAuxIndex = findColumnIndex(normalized, ['subtotalaux', 'subtotal aux', 'subtotal auxiliar']);
    const subtotalMxnIndex = findColumnIndex(normalized, ['subtotalmxn', 'subtotal mxn']);
    const tcSugeridoIndex = findColumnIndex(normalized, ['tcsugerido', 'tc sugerido', 'tc_sugerido']);
    let estadoIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.ESTADO_SAT);

    if (estadoIndex === -1) {
        console.warn('⚠️ Columna "Estado SAT" no encontrada en Mi Admin. Se agregará automáticamente con valor "Vigente".');
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
        IVA: ivaIndex,
        Total: totalIndex,
        Moneda: monedaIndex === -1 ? '⚠️ no encontrada → MXN por defecto' : monedaIndex,
        'Tipo Cambio': tipoCambioIndex,
        'Estado SAT': estadoIndex,
    });

    // ✅ Crear lookup de Auxiliar por FOLIO (solo vigentes)
    const auxiliarLookup = new Map<string, AuxiliarIngresosRow>();
    if (auxiliarData) {
        auxiliarData
            .filter((row) => row.estadoSat === 'Vigente' && !row.isSummary)
            .forEach((row) => {
                auxiliarLookup.set(row.folio, row); // Lookup por FOLIO
            });
        console.log(`📚 ${auxiliarLookup.size} registros de Auxiliar disponibles para lookup por FOLIO`);
        console.log(`📚 Primeros FOLIOs en Auxiliar:`, Array.from(auxiliarLookup.keys()).slice(0, 5));
    }

    // ✅ Parsear filas de datos (desde la fila siguiente al header)
    const rows: MiAdminIngresosRow[] = [];
    let tcCorregidosCount = 0;

    for (let i = dataStartRow; i < excelData.length; i++) {
        const rawRow = excelData[i];
        const row = Array.isArray(rawRow) ? [...rawRow] : [];
        if (!row || row.length === 0) continue;

        const firstCell = row[0]?.toString().toLowerCase() || '';
        if (firstCell === 'total' || firstCell === 'totales') {
            continue;
        }

        // FOLIO es el campo obligatorio ahora (preferir Serie + Folio si existen ambas columnas)
        const rawSerie = serieIndex !== -1 ? row[serieIndex]?.toString().trim() || '' : '';
        const rawFolio = row[folioIndex]?.toString().trim() || '';
        const combinedFolio = rawSerie && rawFolio
            ? `${rawSerie}${rawFolio.startsWith(rawSerie) ? '' : '-'}${rawFolio}`
            : rawFolio || rawSerie;

        if (!combinedFolio) {
            console.warn(`⚠️ Fila ${i + 1} sin FOLIO, se omitirá`);
            continue;
        }

        const folio = combinedFolio;

        // UUID es opcional - pero siempre usamos el folio como ID único
        const uuid = uuidIndex !== -1 ? row[uuidIndex]?.toString().trim() || '' : '';

        // Parsear valores básicos
        const moneda = monedaIndex !== -1 ? parseMoneda(row[monedaIndex]) : 'MXN';
        const subtotal = parseAmount(row[subtotalIndex]);
        const iva = ivaIndex !== -1 ? parseAmount(row[ivaIndex]) : 0;
        const total = totalIndex !== -1 ? parseAmount(row[totalIndex]) : subtotal + iva;

        // 🔥 CORRECCIÓN CRÍTICA DE BUG TC
        let tipoCambio: number | null = null;
        if (tipoCambioIndex !== -1) {
            tipoCambio = parseTipoCambio(row[tipoCambioIndex], moneda);
        }

        // Si TC es sospechoso (1.0 o null) y moneda no es MXN, buscar en Auxiliar POR FOLIO
        if (moneda !== 'MXN' && (!tipoCambio || tipoCambio === 1.0)) {
            const auxiliarRow = auxiliarLookup.get(folio); // Buscar por FOLIO
            if (auxiliarRow && auxiliarRow.tipoCambio && auxiliarRow.tipoCambio > 1.0) {
                console.warn(
                    `🔧 Corrigiendo TC para FOLIO ${folio}: TC Mi Admin=${tipoCambio || 'null'} → TC Auxiliar=${auxiliarRow.tipoCambio}`
                );
                tipoCambio = auxiliarRow.tipoCambio;
                tcCorregidosCount++;
            } else {
                console.warn(
                    `⚠️ FOLIO ${folio}: TC sospechoso (${tipoCambio}) para ${moneda}, pero no se encontró en Auxiliar`
                );
            }
        }

        // Valores opcionales
        const fecha = fechaIndex !== -1 ? parseFecha(row[fechaIndex]) : null;
        const rfc = rfcIndex !== -1 ? row[rfcIndex]?.toString().trim() || null : null;
        const razonSocial = razonSocialIndex !== -1 ? row[razonSocialIndex]?.toString().trim() || null : null;

        // Estado SAT
        if (estadoIndex >= 0 && row.length <= estadoIndex) {
            row.length = estadoIndex + 1;
        }

        const estadoRaw = estadoIndex !== -1 ? row[estadoIndex]?.toString().toLowerCase() || '' : '';
        const estadoSat: 'Vigente' | 'Cancelada' = estadoRaw.includes('cancelad') ? 'Cancelada' : 'Vigente';

        if (!estadoRaw && estadoIndex !== -1) {
            row[estadoIndex] = 'Vigente';
            excelData[i] = row;
        }

        // Buscar subtotalAUX desde Auxiliar POR FOLIO (ya viene en MXN)
        const auxiliarRow = auxiliarLookup.get(folio); // Buscar por FOLIO
        let subtotalAUX = auxiliarRow?.subtotal ?? null;

        if ((subtotalAUX === null || subtotalAUX === undefined) && subtotalAuxIndex !== -1) {
            const rawSubtotalAux = row[subtotalAuxIndex];
            const hasStoredSubtotalAux =
                rawSubtotalAux !== null &&
                rawSubtotalAux !== undefined &&
                String(rawSubtotalAux).trim() !== '';

            if (hasStoredSubtotalAux) {
                const parsedSubtotalAux = parseAmount(rawSubtotalAux);
                if (!Number.isNaN(parsedSubtotalAux)) {
                    subtotalAUX = parsedSubtotalAux;
                }
            }
        }

        // Calcular subtotal MXN
        const subtotalMXN = calculateSubtotalMXN(subtotal, moneda, tipoCambio);

        // Calcular TC Sugerido
        const tcSugerido = calculateTCSugerido(subtotalAUX, subtotal);

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
                index !== ivaIndex &&
                index !== totalIndex &&
                index !== estadoIndex &&
                index !== subtotalAuxIndex &&
                index !== subtotalMxnIndex &&
                index !== tcSugeridoIndex) {
                // Esta es una columna extra que no procesamos explícitamente
                const headerName = String(header || `col_${index}`);
                dynamicFields[headerName] = row[index];
            }
        });

        // --- INICIO DE LOGS DE DEPURACIÓN ---
        if (i < dataStartRow + 5) { // Loguear solo las primeras 5 filas de datos
            console.log(`[DEBUG] Fila ${i + 1}`, {
                'Raw Row': row,
                'Parsed Folio': folio,
                'Parsed UUID': uuid,
                'Parsed Subtotal': subtotal,
                'Parsed Moneda': moneda,
                'Parsed Tipo Cambio': tipoCambio,
                'Parsed Estado SAT': estadoSat,
                'Auxiliar Row Found': auxiliarRow ? 'Sí' : 'No',
                'Calculated Subtotal AUX': subtotalAUX,
                'Calculated Subtotal MXN': subtotalMXN,
                'Calculated TC Sugerido': tcSugerido,
                'Dynamic Fields': Object.keys(dynamicFields).length + ' campos extras'
            });
        }
        // --- FIN DE LOGS DE DEPURACIÓN ---

        rows.push({
            id: folio, // ✅ CORREGIDO: Usar FOLIO como ID único (no UUID)
            folio: folio, // FOLIO es el campo clave
            uuid: uuid || undefined, // Guardar UUID como campo adicional si existe
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
            ...dynamicFields, // Agregar todos los campos dinámicos del Excel
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
    nuevoTipoCambio: number | null
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
    if (row.estadoSat === nuevoEstado) {
        return { estadoSat: nuevoEstado };
    }
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
 * VERSIÓN DINÁMICA: Exporta TODAS las columnas que existen en los datos
 * @param data - Array de filas tipadas
 * @returns Array bidimensional para Excel
 */
export const convertToExcelFormat = (data: MiAdminIngresosRow[]): any[][] => {
    if (!data || data.length === 0) {
        return [];
    }

    // Obtener todas las claves únicas de todas las filas (excluyendo campos internos)
    const keysToIgnore = new Set(['id', 'isSummary', 'uuid']); // uuid se guarda como columna separada si existe
    const allKeys = new Set<string>();

    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!keysToIgnore.has(key)) {
                allKeys.add(key);
            }
        });
    });

    // Definir orden de columnas principales
    const mainColumns = [
        'folio',
        'fecha',
        'rfc',
        'razonSocial',
        'subtotal',
        'iva',
        'total',
        'moneda',
        'tipoCambio',
        'estadoSat',
    ];

    // Columnas calculadas que siempre van al final
    const calculatedColumns = ['subtotalAUX', 'subtotalMXN', 'tcSugerido'];

    // Separar columnas dinámicas (las que no están en mainColumns ni calculatedColumns)
    const dynamicColumns = Array.from(allKeys).filter(
        key => !mainColumns.includes(key) && !calculatedColumns.includes(key)
    );

    // Orden final: principales + dinámicas + calculadas
    const orderedColumns = [
        ...mainColumns.filter(col => allKeys.has(col)),
        ...dynamicColumns.sort(),
        ...calculatedColumns.filter(col => allKeys.has(col)),
    ];

    // Crear headers con nombres formateados
    const headers = orderedColumns.map(key => {
        // Formatear nombres de columnas comunes
        const commonNames: Record<string, string> = {
            folio: 'Folio',
            fecha: 'Fecha',
            rfc: 'RFC',
            razonSocial: 'Razón Social',
            subtotal: 'Subtotal',
            iva: 'IVA',
            total: 'Total',
            moneda: 'Moneda',
            tipoCambio: 'Tipo de Cambio',
            estadoSat: 'Estado SAT',
            subtotalAUX: 'Subtotal AUX',
            subtotalMXN: 'Subtotal MXN',
            tcSugerido: 'TC Sugerido',
        };
        return commonNames[key] || key;
    });

    // Crear filas de datos
    const rows = data
        .filter(row => !row.isSummary) // Excluir filas de resumen
        .map(row => orderedColumns.map(key => row[key] ?? null));

    console.log(`📤 Exportando ${rows.length} filas con ${orderedColumns.length} columnas:`, orderedColumns);

    return [headers, ...rows];
};
