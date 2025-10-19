import { EstadoAprobacion, TrabajoUserSummary } from "./trabajo";

export interface AprobacionTrabajoResumen {
    id: string;
    clienteNombre: string;
    anio: number;
    estadoAprobacion: EstadoAprobacion;
    fechaActualizacion: string;
    miembroAsignado?: TrabajoUserSummary | null;
    aprobadoPor?: TrabajoUserSummary | null;
    comentariosPendientes?: number;
    totalMeses?: number;
    mesesCompletados?: number;
}

export interface AprobacionActividad {
    trabajoId: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    estadoAprobacion: EstadoAprobacion;
}

export interface AprobacionesDashboardData {
    resumenEstados: Record<EstadoAprobacion, number>;
    pendientes: AprobacionTrabajoResumen[];
    recientes: AprobacionActividad[];
}

export interface AprobacionesFilters {
    estado?: EstadoAprobacion;
    search?: string;
    equipoId?: string;
}
