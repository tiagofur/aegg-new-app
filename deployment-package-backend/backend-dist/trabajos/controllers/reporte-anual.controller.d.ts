import { ReporteAnualService, ActualizarVentasDto, ResumenAnual } from '../services/reporte-anual.service';
import { ReporteAnual } from '../entities/reporte-anual.entity';
export declare class ReporteAnualController {
    private readonly reporteAnualService;
    constructor(reporteAnualService: ReporteAnualService);
    obtenerReporteAnual(trabajoId: string, anio: number): Promise<ReporteAnual[]>;
    obtenerResumenAnual(trabajoId: string, anio: number): Promise<ResumenAnual>;
    obtenerReporteMensual(trabajoId: string, anio: number, mes: number): Promise<ReporteAnual>;
    actualizarVentas(trabajoId: string, body: Omit<ActualizarVentasDto, 'trabajoId'>): Promise<ReporteAnual>;
}
