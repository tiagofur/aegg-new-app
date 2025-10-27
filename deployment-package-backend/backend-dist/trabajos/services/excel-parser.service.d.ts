export interface DatosHoja {
    nombre: string;
    headers: string[];
    filas: any[][];
    metadata: {
        totalFilas: number;
        totalColumnas: number;
        rangoOriginal: string;
    };
}
export interface ResultadoParser {
    nombreArchivo: string;
    hojas: DatosHoja[];
    metadata: {
        totalHojas: number;
        fechaParseo: Date;
        tamanoArchivo?: number;
    };
}
export declare class ExcelParserService {
    parsearExcel(buffer: Buffer, opciones?: {
        nombreArchivo?: string;
        todasLasHojas?: boolean;
        maxFilas?: number;
        maxColumnas?: number;
    }): ResultadoParser;
    private limpiarHeaders;
    private limpiarFila;
    private limpiarCelda;
    validarArchivoExcel(buffer: Buffer, nombreArchivo: string): void;
    obtenerInfoExcel(buffer: Buffer): Promise<{
        nombreHojas: string[];
        totalHojas: number;
        tamanoArchivo: number;
    }>;
    parsearHojaEspecifica(buffer: Buffer, nombreHoja: string): DatosHoja;
}
