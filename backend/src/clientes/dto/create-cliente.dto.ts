import {
    IsString,
    IsNotEmpty,
    MaxLength,
    Matches,
    IsOptional,
    IsObject,
} from 'class-validator';

export class CreateClienteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(13)
    @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i, {
        message: 'RFC inválido',
    })
    rfc!: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    razonSocial?: string;

    @IsObject()
    @IsOptional()
    direccion?: Record<string, unknown>;

    @IsObject()
    @IsOptional()
    contactoPrincipal?: Record<string, unknown>;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>;
}
