import { IsString, IsInt, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';

export class CreateTrabajoDto {
    @IsString()
    @IsNotEmpty()
    clienteNombre: string;

    @IsString()
    @IsOptional()
    clienteRfc?: string;

    @IsInt()
    @Min(2020)
    @Max(2100)
    anio: number;

    @IsString()
    @IsNotEmpty()
    usuarioAsignadoId: string;
}
