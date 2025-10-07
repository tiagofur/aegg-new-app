import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoReporteMensual } from '../entities';

export class ImportReporteMensualDto {
    @IsString()
    @IsNotEmpty()
    mesId: string;

    @IsEnum(TipoReporteMensual)
    tipo: TipoReporteMensual;
}
