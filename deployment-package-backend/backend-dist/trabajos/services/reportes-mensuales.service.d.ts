import { Repository } from 'typeorm';
import { ReporteMensual, Mes, ReporteBaseAnual, TipoReporteMensual } from '../entities';
export declare class ReportesMensualesService {
    private reporteMensualRepository;
    private mesRepository;
    private reporteBaseRepository;
    constructor(reporteMensualRepository: Repository<ReporteMensual>, mesRepository: Repository<Mes>, reporteBaseRepository: Repository<ReporteBaseAnual>);
    importarReporte(mesId: string, tipo: TipoReporteMensual, file: Express.Multer.File): Promise<ReporteMensual>;
    procesarYGuardar(mesId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private procesarExcel;
    private limpiarFilasInnecesarias;
    private llenarEstadoSat;
    private limpiarFilasVacias;
    private consolidarReportes;
    private calcularTotalesReporte;
    private actualizarReporteBaseAnual;
    private inicializarHojasVacias;
    private actualizarHojaResumen;
    private actualizarHojaIngresos;
    private actualizarHojaComparativas;
    private getMesNumero;
    private getNombreMes;
    private assertMesEditable;
    obtenerDatos(mesId: string, reporteId: string): Promise<{
        datos: any[][];
    }>;
    actualizarDatos(mesId: string, reporteId: string, datos: any[][]): Promise<ReporteMensual>;
    limpiarDatosReporte(mesId: string, reporteId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    reprocesarEstadoSat(mesId: string, reporteId: string): Promise<{
        success: boolean;
        message: string;
        celdasModificadas: number;
    }>;
}
