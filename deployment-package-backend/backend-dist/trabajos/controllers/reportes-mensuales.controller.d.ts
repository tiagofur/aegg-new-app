import { ReportesMensualesService } from '../services/reportes-mensuales.service';
import { ImportReporteMensualDto } from '../dto';
export declare class ReportesMensualesController {
    private readonly reportesService;
    constructor(reportesService: ReportesMensualesService);
    importar(importDto: ImportReporteMensualDto, file: Express.Multer.File): Promise<import("../entities").ReporteMensual>;
    procesarYGuardar(mesId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    obtenerDatos(mesId: string, reporteId: string): Promise<{
        datos: any[][];
    }>;
    actualizarDatos(mesId: string, reporteId: string, datos: any[][]): Promise<import("../entities").ReporteMensual>;
    limpiarDatos(mesId: string, reporteId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    reprocesarEstadoSat(mesId: string, reporteId: string): Promise<{
        success: boolean;
        message: string;
        celdasModificadas: number;
    }>;
}
