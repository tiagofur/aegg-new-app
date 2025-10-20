import { EstadoAprobacion, EstadoRevisionMes } from '../entities';

export interface TrabajoUserSummaryDto {
    id: string;
    email: string;
    name?: string;
}

export interface AprobacionTrabajoResumenDto {
    id: string;
    trabajoId: string;
    clienteNombre: string;
    anio: number;
    mesNumero?: number;
    mesNombre?: string;
    estadoAprobacion: EstadoAprobacion;
    estadoRevision: EstadoRevisionMes;
    fechaActualizacion: string;
    fechaEnvioRevision?: string | null;
    fechaAprobacion?: string | null;
    comentarioRevision?: string | null;
    miembroAsignado?: TrabajoUserSummaryDto | null;
    aprobadoPor?: TrabajoUserSummaryDto | null;
    enviadoPor?: TrabajoUserSummaryDto | null;
    comentariosPendientes?: number;
    totalMeses?: number;
    mesesCompletados?: number;
}

export interface AprobacionActividadDto {
    trabajoId: string;
    mesId?: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    estadoAprobacion: EstadoAprobacion;
    estadoRevision: EstadoRevisionMes;
}

export interface AprobacionesDashboardResponseDto {
    resumenEstados: Record<EstadoAprobacion, number>;
    pendientes: AprobacionTrabajoResumenDto[];
    recientes: AprobacionActividadDto[];
}
