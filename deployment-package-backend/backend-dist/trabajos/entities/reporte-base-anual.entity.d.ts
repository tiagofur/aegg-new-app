import { Trabajo } from './trabajo.entity';
export interface HojaReporteBase {
    nombre: string;
    datos: any[];
}
export declare class ReporteBaseAnual {
    id: string;
    trabajoId: string;
    archivoUrl: string;
    mesesCompletados: number[];
    hojas: HojaReporteBase[];
    fechaCreacion: Date;
    ultimaActualizacion: Date;
    trabajo: Trabajo;
}
