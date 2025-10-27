import { User } from '../../auth/entities/user.entity';
import { Cliente } from '../../clientes/entities';
import { ReporteBaseAnual } from './reporte-base-anual.entity';
import { Mes } from './mes.entity';
import { ReporteAnual } from './reporte-anual.entity';
export declare enum EstadoTrabajo {
    ACTIVO = "ACTIVO",
    INACTIVO = "INACTIVO",
    COMPLETADO = "COMPLETADO"
}
export declare enum EstadoAprobacion {
    EN_PROGRESO = "EN_PROGRESO",
    EN_REVISION = "EN_REVISION",
    APROBADO = "APROBADO",
    REABIERTO = "REABIERTO"
}
export declare class Trabajo {
    id: string;
    clienteNombre: string;
    clienteRfc: string;
    anio: number;
    clienteId: string | null;
    miembroAsignadoId: string | null;
    gestorResponsableId: string | null;
    estado: EstadoTrabajo;
    estadoAprobacion: EstadoAprobacion;
    fechaAprobacion?: Date | null;
    aprobadoPorId?: string | null;
    visibilidadEquipo: boolean;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    cliente?: Cliente | null;
    miembroAsignado?: User | null;
    gestorResponsable?: User | null;
    aprobadoPor?: User | null;
    reporteBaseAnual: ReporteBaseAnual;
    meses: Mes[];
    reportesAnuales: ReporteAnual[];
}
