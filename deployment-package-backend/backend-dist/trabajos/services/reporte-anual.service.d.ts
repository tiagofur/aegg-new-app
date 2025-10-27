import { Repository } from 'typeorm';
import { ReporteAnual } from '../entities/reporte-anual.entity';
import { Trabajo } from '../entities/trabajo.entity';
export interface ActualizarVentasDto {
    trabajoId: string;
    anio: number;
    mes: number;
    ventas: number;
    ventasAuxiliar: number;
}
export interface ResumenAnual {
    anio: number;
    totalVentas: number;
    totalVentasAuxiliar: number;
    totalDiferencia: number;
    mesesConfirmados: number;
    mesesPendientes: number;
    reportes: ReporteAnual[];
}
export declare class ReporteAnualService {
    private readonly reporteAnualRepository;
    private readonly trabajoRepository;
    constructor(reporteAnualRepository: Repository<ReporteAnual>, trabajoRepository: Repository<Trabajo>);
    obtenerOCrearReporteAnual(trabajoId: string, anio: number): Promise<ReporteAnual[]>;
    actualizarVentas(dto: ActualizarVentasDto): Promise<ReporteAnual>;
    obtenerResumenAnual(trabajoId: string, anio: number): Promise<ResumenAnual>;
    obtenerReporteMensual(trabajoId: string, anio: number, mes: number): Promise<ReporteAnual>;
    eliminarReportesAnio(trabajoId: string, anio: number): Promise<void>;
}
