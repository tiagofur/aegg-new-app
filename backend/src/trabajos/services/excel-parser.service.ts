import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

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

@Injectable()
export class ExcelParserService {
    /**
     * Parsea un archivo Excel y retorna los datos estructurados
     * @param buffer - Buffer del archivo Excel
     * @param opciones - Opciones de parseo
     * @returns Datos parseados del Excel
     */
    parsearExcel(
        buffer: Buffer,
        opciones: {
            nombreArchivo?: string;
            todasLasHojas?: boolean; // true para multi-hoja, false solo primera
            maxFilas?: number;
            maxColumnas?: number;
        } = {},
    ): ResultadoParser {
        try {
            // Configuración por defecto
            const {
                nombreArchivo = 'archivo.xlsx',
                todasLasHojas = false,
                maxFilas = 10000,
                maxColumnas = 100,
            } = opciones;

            // Leer el workbook
            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                cellDates: true,
                cellNF: false,
                cellText: false,
            });

            // Validar que tenga hojas
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new BadRequestException('El archivo Excel no contiene hojas');
            }

            const hojasProcesadas: DatosHoja[] = [];

            // Determinar qué hojas procesar
            const hojasAProcesar = todasLasHojas
                ? workbook.SheetNames
                : [workbook.SheetNames[0]];

            // Procesar cada hoja
            for (const nombreHoja of hojasAProcesar) {
                const worksheet = workbook.Sheets[nombreHoja];

                if (!worksheet) {
                    continue;
                }

                // Obtener el rango de la hoja
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

                // Validar límites
                const totalFilas = range.e.r - range.s.r + 1;
                const totalColumnas = range.e.c - range.s.c + 1;

                if (totalFilas > maxFilas) {
                    throw new BadRequestException(
                        `La hoja "${nombreHoja}" excede el límite de ${maxFilas} filas`,
                    );
                }

                if (totalColumnas > maxColumnas) {
                    throw new BadRequestException(
                        `La hoja "${nombreHoja}" excede el límite de ${maxColumnas} columnas`,
                    );
                }

                // Convertir a array de arrays (matriz)
                const datosCompletos: any[][] = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    raw: false,
                    defval: null,
                    blankrows: true,
                });

                // Si está vacía, continuar
                if (datosCompletos.length === 0) {
                    continue;
                }

                // Primera fila son los headers
                const headers = this.limpiarHeaders(datosCompletos[0] || []);

                // Resto son las filas de datos
                const filas = datosCompletos.slice(1).map(fila =>
                    this.limpiarFila(fila, headers.length),
                );

                hojasProcesadas.push({
                    nombre: nombreHoja,
                    headers,
                    filas,
                    metadata: {
                        totalFilas: filas.length,
                        totalColumnas: headers.length,
                        rangoOriginal: worksheet['!ref'] || 'A1',
                    },
                });
            }

            // Validar que se procesó al menos una hoja
            if (hojasProcesadas.length === 0) {
                throw new BadRequestException('No se pudo procesar ninguna hoja del archivo');
            }

            return {
                nombreArchivo,
                hojas: hojasProcesadas,
                metadata: {
                    totalHojas: hojasProcesadas.length,
                    fechaParseo: new Date(),
                    tamanoArchivo: buffer.length,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error al parsear el archivo Excel: ${error.message}`,
            );
        }
    }

    /**
     * Limpia y normaliza los headers
     */
    private limpiarHeaders(headers: any[]): string[] {
        return headers.map((header, index) => {
            if (header === null || header === undefined || header === '') {
                return `Columna_${index + 1}`;
            }
            return String(header).trim();
        });
    }

    /**
     * Limpia y normaliza una fila de datos
     */
    private limpiarFila(fila: any[], longitudEsperada: number): any[] {
        // Asegurar que la fila tenga la longitud correcta
        const filaLimpia = [...fila];

        // Rellenar con null si es más corta
        while (filaLimpia.length < longitudEsperada) {
            filaLimpia.push(null);
        }

        // Truncar si es más larga
        if (filaLimpia.length > longitudEsperada) {
            filaLimpia.length = longitudEsperada;
        }

        // Limpiar cada celda
        return filaLimpia.map(celda => this.limpiarCelda(celda));
    }

    /**
     * Limpia y normaliza una celda individual
     */
    private limpiarCelda(celda: any): any {
        // null y undefined se quedan como null
        if (celda === null || celda === undefined) {
            return null;
        }

        // Si es string, limpiar espacios
        if (typeof celda === 'string') {
            const limpio = celda.trim();
            return limpio === '' ? null : limpio;
        }

        // Números y booleanos se quedan como están
        if (typeof celda === 'number' || typeof celda === 'boolean') {
            return celda;
        }

        // Fechas las convertimos a ISO string
        if (celda instanceof Date) {
            return celda.toISOString();
        }

        // Cualquier otro tipo lo convertimos a string
        return String(celda);
    }

    /**
     * Valida si un buffer es un archivo Excel válido
     */
    validarArchivoExcel(buffer: Buffer, nombreArchivo: string): void {
        // Validar extensión
        const extensionesValidas = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
        const extension = nombreArchivo.toLowerCase().substring(nombreArchivo.lastIndexOf('.'));

        if (!extensionesValidas.includes(extension)) {
            throw new BadRequestException(
                `Formato de archivo no válido. Extensiones permitidas: ${extensionesValidas.join(', ')}`,
            );
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (buffer.length > maxSize) {
            throw new BadRequestException(
                `El archivo excede el tamaño máximo permitido de ${maxSize / 1024 / 1024}MB`,
            );
        }

        // Intentar leer el header para validar que es un Excel válido
        try {
            const signature = buffer.slice(0, 4).toString('hex');
            // Archivos ZIP (xlsx, xlsm, xlsb) comienzan con 504b0304
            // Archivos XLS comienzan con d0cf11e0
            if (signature !== '504b0304' && signature.slice(0, 8) !== 'd0cf11e0') {
                throw new BadRequestException('El archivo no parece ser un Excel válido');
            }
        } catch (error) {
            throw new BadRequestException('Error al validar el archivo Excel');
        }
    }

    /**
     * Obtiene información básica del Excel sin parsearlo completamente
     */
    async obtenerInfoExcel(buffer: Buffer): Promise<{
        nombreHojas: string[];
        totalHojas: number;
        tamanoArchivo: number;
    }> {
        try {
            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                bookSheets: true, // Solo leer nombres de hojas
            });

            return {
                nombreHojas: workbook.SheetNames,
                totalHojas: workbook.SheetNames.length,
                tamanoArchivo: buffer.length,
            };
        } catch (error) {
            throw new BadRequestException('Error al leer información del archivo Excel');
        }
    }

    /**
     * Extrae solo una hoja específica por nombre
     */
    parsearHojaEspecifica(buffer: Buffer, nombreHoja: string): DatosHoja {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            if (!workbook.SheetNames.includes(nombreHoja)) {
                throw new BadRequestException(`La hoja "${nombreHoja}" no existe en el archivo`);
            }

            const worksheet = workbook.Sheets[nombreHoja];
            const datosCompletos: any[][] = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false,
                defval: null,
            });

            const headers = this.limpiarHeaders(datosCompletos[0] || []);
            const filas = datosCompletos.slice(1).map(fila =>
                this.limpiarFila(fila, headers.length),
            );

            return {
                nombre: nombreHoja,
                headers,
                filas,
                metadata: {
                    totalFilas: filas.length,
                    totalColumnas: headers.length,
                    rangoOriginal: worksheet['!ref'] || 'A1',
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al parsear la hoja "${nombreHoja}"`);
        }
    }
}
