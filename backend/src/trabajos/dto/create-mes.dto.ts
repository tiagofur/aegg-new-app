import { IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';

export class CreateMesDto {
    @IsString()
    @IsNotEmpty()
    trabajoId: string;

    @IsInt()
    @Min(1)
    @Max(12)
    mes: number;
}
