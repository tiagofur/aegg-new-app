import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateTrabajoDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsDateString()
    @IsOptional()
    mes?: string; // formato: "2024-10-01"

    @IsString()
    @IsOptional()
    descripcion?: string;
}

export class UpdateTrabajoDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsDateString()
    @IsOptional()
    mes?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsEnum(['activo', 'archivado', 'completado'])
    @IsOptional()
    estado?: string;
}
