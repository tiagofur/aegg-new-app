import { Cliente } from './cliente';

export type EstadoTrabajo = 'ACTIVO' | 'INACTIVO' | 'COMPLETADO';
export type EstadoAprobacion = 'EN_PROGRESO' | 'EN_REVISION' | 'APROBADO' | 'REABIERTO';
export type EstadoRevisionMes =
    | 'EN_EDICION'
    | 'ENVIADO'
    | 'APROBADO'
    | 'CAMBIOS_SOLICITADOS';

export interface TrabajoUserSummary {
    id: string;
    email: string;
    name?: string;
    nombre?: string;
}

export interface Trabajo {
    id: string;
    clienteId: string | null;
    clienteNombre?: string | null;
    clienteRfc?: string | null;
    anio: number;
    estado: EstadoTrabajo;
    estadoAprobacion: EstadoAprobacion;
    fechaAprobacion?: string | null;
    aprobadoPorId?: string | null;
    visibilidadEquipo: boolean;
    miembroAsignadoId?: string | null;
    fechaCreacion: string;
    fechaActualizacion: string;
    cliente?: Cliente | null;
    miembroAsignado?: TrabajoUserSummary | null;
    aprobadoPor?: TrabajoUserSummary | null;
    reporteBaseAnual?: ReporteBaseAnual;
    meses: Mes[];
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
    estadoRevision: EstadoRevisionMes;
    fechaCreacion: string;
    fechaActualizacion: string;
    fechaEnvioRevision?: string | null;
    fechaAprobacion?: string | null;
    comentarioRevision?: string | null;
    enviadoRevisionPorId?: string | null;
    aprobadoPorId?: string | null;
    enviadoRevisionPor?: TrabajoUserSummary | null;
    aprobadoPor?: TrabajoUserSummary | null;
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
    clienteId: string;
    anio: number;
    miembroAsignadoId?: string | null;
    usuarioAsignadoId?: string | null;
    estadoAprobacion?: EstadoAprobacion;
    visibilidadEquipo?: boolean;
    clienteNombre?: string;
    clienteRfc?: string;
}

export interface UpdateTrabajoDto {
    clienteId?: string | null;
    clienteNombre?: string;
    clienteRfc?: string;
    anio?: number;
    miembroAsignadoId?: string | null;
    usuarioAsignadoId?: string | null;
    estado?: EstadoTrabajo;
    estadoAprobacion?: EstadoAprobacion;
    visibilidadEquipo?: boolean;
    aprobadoPorId?: string | null;
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
