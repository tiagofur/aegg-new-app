import { EstadoAprobacion } from '../entities';
export declare class CreateTrabajoDto {
    clienteId?: string;
    clienteNombre?: string;
    clienteRfc?: string;
    anio: number;
    miembroAsignadoId?: string;
    usuarioAsignadoId?: string;
    gestorResponsableId?: string;
    estadoAprobacion?: EstadoAprobacion;
    visibilidadEquipo?: boolean;
}
