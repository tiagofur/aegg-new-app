export interface Trabajo {
    id: string;
    clienteNombre: string;
    clienteRfc?: string;
    anio: number;
    usuarioAsignadoId: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'COMPLETADO';
    fechaCreacion: string;
    fechaActualizacion: string;

    reporteBaseAnual?: ReporteBaseAnual;
    meses: Mes[];
    usuarioAsignado?: {
        id: string;
        email: string;
        nombre: string;
    };
}

export interface ReporteBaseAnual {
    id: string;
    trabajoId: string;
    archivoUrl?: string;
    mesesCompletados: number[];
    ultimaActualizacion: string;
    hojas: HojaReporteBase[];
}

export interface HojaReporteBase {
    nombre: string;
    datos: any[];
}

export interface Mes {
    id: string;
    trabajoId: string;
    mes: number;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
    fechaCreacion: string;
    fechaActualizacion: string;
    reportes: ReporteMensual[];
}

export interface ReporteMensual {
    id: string;
    mesId: string;
    tipo: 'INGRESOS' | 'INGRESOS_AUXILIAR' | 'INGRESOS_MI_ADMIN';
    archivoOriginal?: string;
    datos: any[];
    estado: 'SIN_IMPORTAR' | 'IMPORTADO' | 'PROCESADO' | 'ERROR';
    fechaImportacion?: string;
    fechaProcesado?: string;
    fechaCreacion: string;
}

export interface CreateTrabajoDto {
    clienteNombre: string;
    clienteRfc?: string;
    anio: number;
    usuarioAsignadoId: string;
}

export interface UpdateTrabajoDto {
    clienteNombre?: string;
    clienteRfc?: string;
    anio?: number;
    usuarioAsignadoId?: string;
    estado?: 'ACTIVO' | 'INACTIVO' | 'COMPLETADO';
}

export interface CreateMesDto {
    trabajoId: string;
    mes: number;
}

export interface ImportReporteMensualDto {
    mesId: string;
    tipo: 'INGRESOS' | 'INGRESOS_AUXILIAR' | 'INGRESOS_MI_ADMIN';
    file: File;
}

// Constantes útiles
export const MESES_NOMBRES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

export const MESES_NOMBRES_CORTOS = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
];

export const TIPOS_REPORTE_NOMBRES = {
    INGRESOS: 'Reporte Ingresos',
    INGRESOS_AUXILIAR: 'Reporte Ingresos Auxiliar',
    INGRESOS_MI_ADMIN: 'Reporte MI Admin',
};
