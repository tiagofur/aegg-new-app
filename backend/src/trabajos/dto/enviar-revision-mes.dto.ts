import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EnviarRevisionMesDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    comentario?: string;
}
