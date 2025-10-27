"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelParserService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = require("xlsx");
let ExcelParserService = class ExcelParserService {
    parsearExcel(buffer, opciones = {}) {
        try {
            const { nombreArchivo = 'archivo.xlsx', todasLasHojas = false, maxFilas = 10000, maxColumnas = 100, } = opciones;
            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                cellDates: true,
                cellNF: false,
                cellText: false,
            });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new common_1.BadRequestException('El archivo Excel no contiene hojas');
            }
            const hojasProcesadas = [];
            const hojasAProcesar = todasLasHojas
                ? workbook.SheetNames
                : [workbook.SheetNames[0]];
            for (const nombreHoja of hojasAProcesar) {
                const worksheet = workbook.Sheets[nombreHoja];
                if (!worksheet) {
                    continue;
                }
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                const totalFilas = range.e.r - range.s.r + 1;
                const totalColumnas = range.e.c - range.s.c + 1;
                if (totalFilas > maxFilas) {
                    throw new common_1.BadRequestException(`La hoja "${nombreHoja}" excede el límite de ${maxFilas} filas`);
                }
                if (totalColumnas > maxColumnas) {
                    throw new common_1.BadRequestException(`La hoja "${nombreHoja}" excede el límite de ${maxColumnas} columnas`);
                }
                const datosCompletos = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    raw: false,
                    defval: null,
                    blankrows: true,
                });
                if (datosCompletos.length === 0) {
                    continue;
                }
                const headers = this.limpiarHeaders(datosCompletos[0] || []);
                const filas = datosCompletos.slice(1).map(fila => this.limpiarFila(fila, headers.length));
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
            if (hojasProcesadas.length === 0) {
                throw new common_1.BadRequestException('No se pudo procesar ninguna hoja del archivo');
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error al parsear el archivo Excel: ${error.message}`);
        }
    }
    limpiarHeaders(headers) {
        return headers.map((header, index) => {
            if (header === null || header === undefined || header === '') {
                return `Columna_${index + 1}`;
            }
            return String(header).trim();
        });
    }
    limpiarFila(fila, longitudEsperada) {
        const filaLimpia = [...fila];
        while (filaLimpia.length < longitudEsperada) {
            filaLimpia.push(null);
        }
        if (filaLimpia.length > longitudEsperada) {
            filaLimpia.length = longitudEsperada;
        }
        return filaLimpia.map(celda => this.limpiarCelda(celda));
    }
    limpiarCelda(celda) {
        if (celda === null || celda === undefined) {
            return null;
        }
        if (typeof celda === 'string') {
            const limpio = celda.trim();
            return limpio === '' ? null : limpio;
        }
        if (typeof celda === 'number' || typeof celda === 'boolean') {
            return celda;
        }
        if (celda instanceof Date) {
            return celda.toISOString();
        }
        return String(celda);
    }
    validarArchivoExcel(buffer, nombreArchivo) {
        const extensionesValidas = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
        const extension = nombreArchivo.toLowerCase().substring(nombreArchivo.lastIndexOf('.'));
        if (!extensionesValidas.includes(extension)) {
            throw new common_1.BadRequestException(`Formato de archivo no válido. Extensiones permitidas: ${extensionesValidas.join(', ')}`);
        }
        const maxSize = 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
            throw new common_1.BadRequestException(`El archivo excede el tamaño máximo permitido de ${maxSize / 1024 / 1024}MB`);
        }
        try {
            const signature = buffer.slice(0, 4).toString('hex');
            if (signature !== '504b0304' && signature.slice(0, 8) !== 'd0cf11e0') {
                throw new common_1.BadRequestException('El archivo no parece ser un Excel válido');
            }
        }
        catch (error) {
            throw new common_1.BadRequestException('Error al validar el archivo Excel');
        }
    }
    async obtenerInfoExcel(buffer) {
        try {
            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                bookSheets: true,
            });
            return {
                nombreHojas: workbook.SheetNames,
                totalHojas: workbook.SheetNames.length,
                tamanoArchivo: buffer.length,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Error al leer información del archivo Excel');
        }
    }
    parsearHojaEspecifica(buffer, nombreHoja) {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            if (!workbook.SheetNames.includes(nombreHoja)) {
                throw new common_1.BadRequestException(`La hoja "${nombreHoja}" no existe en el archivo`);
            }
            const worksheet = workbook.Sheets[nombreHoja];
            const datosCompletos = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false,
                defval: null,
            });
            const headers = this.limpiarHeaders(datosCompletos[0] || []);
            const filas = datosCompletos.slice(1).map(fila => this.limpiarFila(fila, headers.length));
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error al parsear la hoja "${nombreHoja}"`);
        }
    }
};
exports.ExcelParserService = ExcelParserService;
exports.ExcelParserService = ExcelParserService = __decorate([
    (0, common_1.Injectable)()
], ExcelParserService);
//# sourceMappingURL=excel-parser.service.js.map