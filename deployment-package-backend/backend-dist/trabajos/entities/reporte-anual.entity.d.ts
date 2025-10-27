import { Trabajo } from './trabajo.entity';
export declare enum MesEnum {
    ENERO = 1,
    FEBRERO = 2,
    MARZO = 3,
    ABRIL = 4,
    MAYO = 5,
    JUNIO = 6,
    JULIO = 7,
    AGOSTO = 8,
    SEPTIEMBRE = 9,
    OCTUBRE = 10,
    NOVIEMBRE = 11,
    DICIEMBRE = 12
}
export declare class ReporteAnual {
    id: string;
    trabajoId: string;
    trabajo: Trabajo;
    anio: number;
    mes: number;
    ventas: number | null;
    ventasAuxiliar: number | null;
    diferencia: number | null;
    confirmado: boolean;
    fechaCreacion: Date;
    fechaActualizacion: Date;
}
