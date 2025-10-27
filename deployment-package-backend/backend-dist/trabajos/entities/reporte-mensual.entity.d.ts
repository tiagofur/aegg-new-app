import { Mes } from './mes.entity';
export declare enum TipoReporteMensual {
    INGRESOS = "INGRESOS",
    INGRESOS_AUXILIAR = "INGRESOS_AUXILIAR",
    INGRESOS_MI_ADMIN = "INGRESOS_MI_ADMIN"
}
export declare enum EstadoReporte {
    SIN_IMPORTAR = "SIN_IMPORTAR",
    IMPORTADO = "IMPORTADO",
    PROCESADO = "PROCESADO",
    ERROR = "ERROR"
}
export declare class ReporteMensual {
    id: string;
    mesId: string;
    tipo: TipoReporteMensual;
    archivoOriginal: string;
    datos: any[];
    estado: EstadoReporte;
    fechaImportacion: Date;
    fechaProcesado: Date;
    fechaCreacion: Date;
    mes: Mes;
}
