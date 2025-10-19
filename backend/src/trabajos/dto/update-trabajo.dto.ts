import { PartialType } from '@nestjs/mapped-types';
import { CreateTrabajoDto } from './create-trabajo.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EstadoTrabajo } from '../entities';

export class UpdateTrabajoDto extends PartialType(CreateTrabajoDto) {
    @IsEnum(EstadoTrabajo)
    @IsOptional()
    estado?: EstadoTrabajo;


    @IsUUID('4')
    @IsOptional()
    aprobadoPorId?: string;
}
