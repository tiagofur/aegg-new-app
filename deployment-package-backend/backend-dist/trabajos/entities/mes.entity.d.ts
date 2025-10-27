import { Trabajo } from './trabajo.entity';
import { ReporteMensual } from './reporte-mensual.entity';
import { User } from '../../auth/entities/user.entity';
export declare enum EstadoMes {
    PENDIENTE = "PENDIENTE",
    EN_PROCESO = "EN_PROCESO",
    COMPLETADO = "COMPLETADO"
}
export declare enum EstadoRevisionMes {
    EN_EDICION = "EN_EDICION",
    ENVIADO = "ENVIADO",
    APROBADO = "APROBADO",
    CAMBIOS_SOLICITADOS = "CAMBIOS_SOLICITADOS"
}
export declare class Mes {
    id: string;
    trabajoId: string;
    mes: number;
    estado: EstadoMes;
    estadoRevision: EstadoRevisionMes;
    enviadoRevisionPorId?: string | null;
    fechaEnvioRevision?: Date | null;
    aprobadoPorId?: string | null;
    fechaAprobacion?: Date | null;
    comentarioRevision?: string | null;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    trabajo: Trabajo;
    reportes: ReporteMensual[];
    enviadoRevisionPor?: User | null;
    aprobadoPor?: User | null;
}
