import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SolicitarCambiosMesDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    comentario: string;
}
