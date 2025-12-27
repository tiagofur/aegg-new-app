import { EstadoAprobacion, EstadoRevisionMes, TrabajoUserSummary } from './trabajo'

export interface AprobacionTrabajoResumen {
    id: string
    trabajoId: string
    clienteNombre: string
    anio: number
    mesNumero?: number
    mesNombre?: string
    estadoAprobacion: EstadoAprobacion
    estadoRevision: EstadoRevisionMes
    fechaActualizacion: string
    fechaEnvioRevision?: string | null
    fechaAprobacion?: string | null
    comentarioRevision?: string | null
    miembroAsignado?: TrabajoUserSummary | null
    aprobadoPor?: TrabajoUserSummary | null
    enviadoPor?: TrabajoUserSummary | null
    comentariosPendientes?: number
    totalMeses?: number
    mesesCompletados?: number
}

export interface AprobacionActividad {
    trabajoId: string
    mesId?: string
    titulo: string
    descripcion: string
    fecha: string
    estadoAprobacion: EstadoAprobacion
    estadoRevision: EstadoRevisionMes
}

export interface AprobacionesDashboardData {
    resumenEstados: Record<EstadoAprobacion, number>
    pendientes: AprobacionTrabajoResumen[]
    recientes: AprobacionActividad[]
}

export interface AprobacionesFilters {
    estado?: EstadoAprobacion
    search?: string
    equipoId?: string
}
