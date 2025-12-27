/**
 * FASE 7 - Sistema de Reporte Anual
 * Tipos TypeScript para Reporte Anual
 */

export enum MesEnum {
    ENERO = 1,
    FEBRERO = 2,
    MARZO = 3,
    ABRIL = 4,
    MAYO = 5,
    JUNIO = 6,
    JULIO = 7,
    AGOSTO = 8,
    SEPTIEMBRE = 9,
    OCTUBRE = 10,
    NOVIEMBRE = 11,
    DICIEMBRE = 12,
}

export const NOMBRES_MESES: Record<MesEnum, string> = {
    [MesEnum.ENERO]: 'Enero',
    [MesEnum.FEBRERO]: 'Febrero',
    [MesEnum.MARZO]: 'Marzo',
    [MesEnum.ABRIL]: 'Abril',
    [MesEnum.MAYO]: 'Mayo',
    [MesEnum.JUNIO]: 'Junio',
    [MesEnum.JULIO]: 'Julio',
    [MesEnum.AGOSTO]: 'Agosto',
    [MesEnum.SEPTIEMBRE]: 'Septiembre',
    [MesEnum.OCTUBRE]: 'Octubre',
    [MesEnum.NOVIEMBRE]: 'Noviembre',
    [MesEnum.DICIEMBRE]: 'Diciembre',
}

/**
 * Entity ReporteAnual - Representa un mes de ventas en el reporte anual
 */
export interface ReporteAnual {
    id: string
    trabajoId: string
    anio: number
    mes: number
    ventas: number | null
    ventasAuxiliar: number | null
    diferencia: number | null
    confirmado: boolean
    fechaCreacion: string
    fechaActualizacion: string
}

/**
 * DTO para actualizar ventas de un mes
 */
export interface ActualizarVentasDto {
    trabajoId: string
    anio: number
    mes: number
    ventas: number
    ventasAuxiliar: number
}

/**
 * Resumen anual con totales y estadísticas
 */
export interface ResumenAnual {
    anio: number
    totalVentas: number
    totalVentasAuxiliar: number
    totalDiferencia: number
    mesesConfirmados: number
    mesesPendientes: number
    reportes: ReporteAnual[]
}

/**
 * Request para crear/actualizar reporte
 */
export interface ActualizarVentasRequest {
    anio: number
    mes: number
    ventas: number
    ventasAuxiliar: number
}
