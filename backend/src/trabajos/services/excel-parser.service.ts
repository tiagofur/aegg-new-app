import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as sanitizeHtml from 'sanitize-html';

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
    async parsearExcel(
        buffer: Buffer,
        opciones: {
            nombreArchivo?: string;
            todasLasHojas?: boolean; // true para multi-hoja, false solo primera
            maxFilas?: number;
            maxColumnas?: number;
        } = {},
    ): Promise<ResultadoParser> {
        try {
            // Configuración por defecto
            const {
                nombreArchivo = 'archivo.xlsx',
                todasLasHojas = false,
                maxFilas = 10000,
                maxColumnas = 100,
            } = opciones;

            // Leer el workbook con ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);

            // Validar que tenga hojas
            if (!workbook.worksheets || workbook.worksheets.length === 0) {
                throw new BadRequestException('El archivo Excel no contiene hojas');
            }

            const hojasProcesadas: DatosHoja[] = [];

            // Determinar qué hojas procesar
            const hojasAProcesar = todasLasHojas
                ? workbook.worksheets
                : [workbook.worksheets[0]];

            // Procesar cada hoja
            for (const worksheet of hojasAProcesar) {
                if (!worksheet) {
                    continue;
                }

                const nombreHoja = worksheet.name;

                // Validar límites
                const totalFilas = worksheet.rowCount;
                const totalColumnas = worksheet.columnCount;

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
                const datosCompletos: any[][] = [];
                worksheet.eachRow({ includeEmpty: true }, (row) => {
                    const rowValues: any[] = [];
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        // Obtener el valor de la celda
                        let value = cell.value;

                        // Si es una fórmula, obtener el resultado
                        if (cell.type === ExcelJS.ValueType.Formula && cell.result !== undefined) {
                            value = cell.result;
                        }

                        // Si es fecha, convertir a Date
                        if (cell.type === ExcelJS.ValueType.Date) {
                            value = cell.value as Date;
                        }

                        rowValues.push(value);
                    });
                    datosCompletos.push(rowValues);
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
                        rangoOriginal: worksheet.dimensions
                            ? `${worksheet.dimensions.tl}:${worksheet.dimensions.br}`
                            : 'A1',
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(
                `Error al parsear el archivo Excel: ${errorMessage}`,
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
     * Aplica sanitización para prevenir inyección de scripts y fórmulas maliciosas
     */
    private limpiarCelda(celda: any): any {
        // null y undefined se quedan como null
        if (celda === null || celda === undefined) {
            return null;
        }

        // Si es string, limpiar espacios y sanitizar HTML
        if (typeof celda === 'string') {
            const limpio = celda.trim();

            // Si está vacío después de limpiar, retornar null
            if (limpio === '') {
                return null;
            }

            // Sanitizar HTML/scripts potencialmente peligrosos
            const sanitizado = sanitizeHtml(limpio, {
                allowedTags: [], // No permitir ningún tag HTML
                allowedAttributes: {}, // No permitir ningún atributo
                disallowedTagsMode: 'recursiveEscape', // Escapar tags no permitidos
            });

            // Prevenir fórmulas de Excel potencialmente maliciosas
            // Las fórmulas comienzan con =, +, -, @
            if (sanitizado.length > 0 && /^[=+\-@]/.test(sanitizado)) {
                // Agregar comilla simple al inicio para desactivar la fórmula
                return `'${sanitizado}`;
            }

            return sanitizado;
        }

        // Números y booleanos se quedan como están
        if (typeof celda === 'number' || typeof celda === 'boolean') {
            return celda;
        }

        // Fechas las convertimos a ISO string
        if (celda instanceof Date) {
            return celda.toISOString();
        }

        // Cualquier otro tipo lo convertimos a string y sanitizamos
        const stringValue = String(celda);
        const sanitizado = sanitizeHtml(stringValue, {
            allowedTags: [],
            allowedAttributes: {},
            disallowedTagsMode: 'recursiveEscape',
        });

        return sanitizado;
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
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);

            const nombreHojas = workbook.worksheets.map(ws => ws.name);

            return {
                nombreHojas,
                totalHojas: workbook.worksheets.length,
                tamanoArchivo: buffer.length,
            };
        } catch (error) {
            throw new BadRequestException('Error al leer información del archivo Excel');
        }
    }

    /**
     * Extrae solo una hoja específica por nombre
     */
    async parsearHojaEspecifica(buffer: Buffer, nombreHoja: string): Promise<DatosHoja> {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);

            const worksheet = workbook.getWorksheet(nombreHoja);

            if (!worksheet) {
                throw new BadRequestException(`La hoja "${nombreHoja}" no existe en el archivo`);
            }

            // Convertir a array de arrays
            const datosCompletos: any[][] = [];
            worksheet.eachRow({ includeEmpty: true }, (row) => {
                const rowValues: any[] = [];
                row.eachCell({ includeEmpty: true }, (cell) => {
                    let value = cell.value;

                    // Si es una fórmula, obtener el resultado
                    if (cell.type === ExcelJS.ValueType.Formula && cell.result !== undefined) {
                        value = cell.result;
                    }

                    // Si es fecha, convertir a Date
                    if (cell.type === ExcelJS.ValueType.Date) {
                        value = cell.value as Date;
                    }

                    rowValues.push(value);
                });
                datosCompletos.push(rowValues);
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
                    rangoOriginal: worksheet.dimensions
                        ? `${worksheet.dimensions.tl}:${worksheet.dimensions.br}`
                        : 'A1',
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
