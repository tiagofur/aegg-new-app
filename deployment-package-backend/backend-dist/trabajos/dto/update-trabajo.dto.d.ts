import { CreateTrabajoDto } from './create-trabajo.dto';
import { EstadoTrabajo } from '../entities';
declare const UpdateTrabajoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTrabajoDto>>;
export declare class UpdateTrabajoDto extends UpdateTrabajoDto_base {
    estado?: EstadoTrabajo;
    aprobadoPorId?: string;
}
export {};
