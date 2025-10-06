import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';
import { TipoReporte, ConfiguracionReporte } from '../entities/reporte.entity';

export class CreateReporteDto {
    @IsEnum(TipoReporte)
    @IsNotEmpty()
    tipoReporte: TipoReporte;

    @IsString()
    @IsOptional()
    archivoOriginal?: string;

    @IsObject()
    @IsOptional()
    configuracion?: ConfiguracionReporte;
}

export class UpdateReporteDto {
    @IsEnum(TipoReporte)
    @IsOptional()
    tipoReporte?: TipoReporte;

    @IsString()
    @IsOptional()
    estado?: string;

    @IsObject()
    @IsOptional()
    configuracion?: ConfiguracionReporte;
}

export class ActualizarCeldaDto {
    @IsNotEmpty()
    valor?: any;

    @IsString()
    @IsOptional()
    formula?: string;
}

export class AgregarFilaDto {
    @IsArray()
    @IsNotEmpty()
    datos: any[];

    @IsOptional()
    posicion?: number; // después de qué fila
}

export class AgregarColumnaDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsEnum(['texto', 'numero', 'fecha', 'formula'])
    @IsNotEmpty()
    tipo: 'texto' | 'numero' | 'fecha' | 'formula';

    @IsString()
    @IsOptional()
    formula?: string;

    @IsOptional()
    posicion?: number;
}
