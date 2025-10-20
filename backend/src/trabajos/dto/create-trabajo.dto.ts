import {
    IsString,
    IsInt,
    Min,
    Max,
    IsOptional,
    IsUUID,
    IsEnum,
    IsBoolean,
} from 'class-validator';
import { EstadoAprobacion } from '../entities';

export class CreateTrabajoDto {
    @IsUUID('4')
    @IsOptional()
    clienteId?: string;

    @IsString()
    @IsOptional()
    clienteNombre?: string;

    @IsString()
    @IsOptional()
    clienteRfc?: string;

    @IsInt()
    @Min(2020)
    @Max(2100)
    anio: number;

    @IsUUID('4')
    @IsOptional()
    miembroAsignadoId?: string;

    @IsUUID('4')
    @IsOptional()
    usuarioAsignadoId?: string;

    @IsUUID('4')
    @IsOptional()
    gestorResponsableId?: string;

    @IsEnum(EstadoAprobacion)
    @IsOptional()
    estadoAprobacion?: EstadoAprobacion;

    @IsBoolean()
    @IsOptional()
    visibilidadEquipo?: boolean;
}
