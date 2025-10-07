/**
 * Utilidades de cálculo para Mi Admin Ingresos
 */

import type {
    MiAdminIngresosRow,
    MiAdminIngresosTotales,
} from '../types';
import { MI_ADMIN_INGRESOS_CONFIG } from '../types';

// Tipo para datos de Auxiliar Ingresos (importado)
interface AuxiliarIngresosRow {
    folio: string;
    estadoSat: 'Vigente' | 'Cancelada';
    subtotalMXN: number;
    [key: string]: any;
}

/**
 * Parsear datos de Excel y agregar datos de Auxiliar Ingresos
 * @param excelData - Array bidimensional del Excel
 * @param auxiliarData - Datos de Auxiliar Ingresos para comparación
 * @returns Array de filas tipadas
 */
export const parseExcelToMiAdminIngresos = (
    excelData: any[][],
    auxiliarData: AuxiliarIngresosRow[] | undefined
): MiAdminIngresosRow[] => {
    if (!excelData || excelData.length === 0) return [];

    const headers = excelData[0];

    // Encontrar índices de columnas (case-insensitive)
    const findColumnIndex = (keywords: string[]) => {
        return headers.findIndex((header: any) =>
            keywords.some(keyword =>
                header?.toString().toLowerCase().includes(keyword.toLowerCase())
            )
        );
    };

    const folioIndex = findColumnIndex(['folio', 'número', 'numero']);
    const fechaIndex = findColumnIndex(['fecha']);
    const rfcIndex = findColumnIndex(['rfc']);
    const razonSocialIndex = findColumnIndex(['razón', 'razon', 'social', 'nombre']);
    const subtotalIndex = findColumnIndex(['subtotal']);
    const ivaIndex = findColumnIndex(['iva']);
    const totalIndex = findColumnIndex(['total']);
    const monedaIndex = findColumnIndex(['moneda', 'currency']);
    const tipoCambioIndex = findColumnIndex(['tipo', 'cambio', 'tc', 'exchange']);
    const estadoIndex = findColumnIndex(['estado', 'status', 'sat']);

    // Crear lookup de Auxiliar por FOLIO (solo vigentes)
    const auxiliarLookup = new Map<string, number>();
    if (auxiliarData) {
        auxiliarData
            .filter(row => row.estadoSat === 'Vigente')
            .forEach(row => {
                auxiliarLookup.set(row.folio, row.subtotalMXN);
            });
    }

    // Parsear filas (saltear header)
    return excelData.slice(1).map((row, index) => {
        const folio = row[folioIndex]?.toString() || `row-${index}`;
        const subtotal = parseFloat(row[subtotalIndex]) || 0;
        const moneda = row[monedaIndex]?.toString() || 'MXN';
        const tipoCambioRaw = parseFloat(row[tipoCambioIndex]);
        const tipoCambio = moneda === 'MXN' ? null : (isNaN(tipoCambioRaw) ? 1 : tipoCambioRaw);

        // Estado SAT
        const estadoRaw = row[estadoIndex]?.toString().toLowerCase();
        const estadoSat: 'Vigente' | 'Cancelada' =
            estadoRaw?.includes('cancel') ? 'Cancelada' : 'Vigente';

        // Copiar SUBTOTAL AUX desde Auxiliar
        const subtotalAUX = auxiliarLookup.get(folio) || null;

        // Calcular SUBTOTAL MXN
        const subtotalMXN = calculateSubtotalMXN(subtotal, moneda, tipoCambio);

        // Calcular TC SUGERIDO
        const tcSugerido = calculateTCSugerido(subtotalAUX, subtotal);

        return {
            id: folio,
            folio,
            fecha: row[fechaIndex] || null,
            rfc: row[rfcIndex] || null,
            razonSocial: row[razonSocialIndex] || null,
            subtotal,
            iva: parseFloat(row[ivaIndex]) || 0,
            total: parseFloat(row[totalIndex]) || 0,
            moneda,
            tipoCambio,
            estadoSat,
            subtotalAUX,
            subtotalMXN,
            tcSugerido,
        };
    });
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
