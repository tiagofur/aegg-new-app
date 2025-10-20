import { EstadoAprobacion } from '../entities';

export interface TrabajoUserSummaryDto {
    id: string;
    email: string;
    name?: string;
}

export interface AprobacionTrabajoResumenDto {
    id: string;
    clienteNombre: string;
    anio: number;
    estadoAprobacion: EstadoAprobacion;
    fechaActualizacion: string;
    miembroAsignado?: TrabajoUserSummaryDto | null;
    aprobadoPor?: TrabajoUserSummaryDto | null;
    comentariosPendientes?: number;
    totalMeses?: number;
    mesesCompletados?: number;
}

export interface AprobacionActividadDto {
    trabajoId: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    estadoAprobacion: EstadoAprobacion;
}

export interface AprobacionesDashboardResponseDto {
    resumenEstados: Record<EstadoAprobacion, number>;
    pendientes: AprobacionTrabajoResumenDto[];
    recientes: AprobacionActividadDto[];
}
