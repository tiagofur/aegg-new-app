import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoAprobacion } from '../entities';

export class AprobacionesDashboardQueryDto {
    @IsEnum(EstadoAprobacion)
    @IsOptional()
    estado?: EstadoAprobacion;

    @IsString()
    @IsOptional()
    search?: string;

    @IsUUID('4')
    @IsOptional()
    equipoId?: string;
}
