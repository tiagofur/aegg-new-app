import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reporte, DatosOriginales, DatosModificados } from '../entities/reporte.entity';
import { Trabajo } from '../entities/trabajo.entity';
import {
    CreateReporteDto,
    UpdateReporteDto,
    ActualizarCeldaDto,
    AgregarFilaDto,
    AgregarColumnaDto,
} from '../dto/reporte.dto';
import { FormulaService } from './formula.service';
import { ExcelParserService } from './excel-parser.service';

@Injectable()
export class ReporteService {
    constructor(
        @InjectRepository(Reporte)
        private reporteRepository: Repository<Reporte>,
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        private formulaService: FormulaService,
        private excelParserService: ExcelParserService,
    ) { }

    /**
     * Crear un nuevo reporte dentro de un trabajo
     */
    async create(
        trabajoId: string,
        createReporteDto: CreateReporteDto,
        usuarioId: string,
    ): Promise<Reporte> {
        // Verificar que el trabajo existe y pertenece al usuario
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });

        if (!trabajo) {
            throw new NotFoundException('Trabajo no encontrado');
        }

        if (trabajo.usuarioId !== usuarioId) {
            throw new ForbiddenException(
                'No tienes permiso para modificar este trabajo',
            );
        }

        const reporte = this.reporteRepository.create({
            ...createReporteDto,
            trabajoId,
            estado: 'pendiente',
        });

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Obtener un reporte por ID
     */
    async findOne(id: string, usuarioId: string): Promise<Reporte> {
        const reporte = await this.reporteRepository.findOne({
            where: { id },
            relations: ['trabajo'],
        });

        if (!reporte) {
            throw new NotFoundException('Reporte no encontrado');
        }

        if (reporte.trabajo.usuarioId !== usuarioId) {
            throw new ForbiddenException(
                'No tienes permiso para acceder a este reporte',
            );
        }

        return reporte;
    }

    /**
     * Obtener todos los reportes de un trabajo
     */
    async findAllByTrabajo(
        trabajoId: string,
        usuarioId: string,
    ): Promise<Reporte[]> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });

        if (!trabajo) {
            throw new NotFoundException('Trabajo no encontrado');
        }

        if (trabajo.usuarioId !== usuarioId) {
            throw new ForbiddenException(
                'No tienes permiso para acceder a este trabajo',
            );
        }

        return await this.reporteRepository.find({
            where: { trabajoId },
            order: { fechaImportacion: 'ASC' },
        });
    }

    /**
     * Actualizar metadatos del reporte
     */
    async update(
        id: string,
        updateReporteDto: UpdateReporteDto,
        usuarioId: string,
    ): Promise<Reporte> {
        const reporte = await this.findOne(id, usuarioId);

        Object.assign(reporte, updateReporteDto);

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Importar datos desde Excel (simulado por ahora)
     */
    async importarDatos(
        id: string,
        datosOriginales: DatosOriginales,
        usuarioId: string,
    ): Promise<Reporte> {
        const reporte = await this.findOne(id, usuarioId);

        reporte.datosOriginales = datosOriginales;
        reporte.estado = 'importado';

        // Inicializar datos modificados si no existe
        if (!reporte.datosModificados) {
            reporte.datosModificados = {
                celdas: {},
                filas_nuevas: [],
                columnas_nuevas: [],
                formulas: {},
                filas_eliminadas: [],
                columnas_eliminadas: [],
            };
        }

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Actualizar una celda específica
     */
    async actualizarCelda(
        reporteId: string,
        fila: number,
        columna: number,
        dto: ActualizarCeldaDto,
        usuarioId: string,
    ): Promise<any> {
        const reporte = await this.findOne(reporteId, usuarioId);

        if (!reporte.datosModificados) {
            reporte.datosModificados = {
                celdas: {},
                formulas: {},
            };
        }

        const key = `${fila},${columna}`;
        const valorOriginal = reporte.datosOriginales?.filas[fila]?.[columna];

        // Si es una fórmula
        if (dto.formula) {
            const resultado = this.formulaService.evaluar(
                dto.formula,
                reporte.datosOriginales?.filas || [],
                fila,
            );

            reporte.datosModificados.formulas = {
                ...reporte.datosModificados.formulas,
                [key]: {
                    expresion: dto.formula,
                    resultado,
                    dependencias: this.formulaService.extraerDependencias(
                        dto.formula,
                    ),
                    ultima_evaluacion: new Date().toISOString(),
                },
            };

            // También guardar en celdas modificadas
            reporte.datosModificados.celdas = {
                ...reporte.datosModificados.celdas,
                [key]: {
                    valor_original: valorOriginal,
                    valor_nuevo: resultado,
                    tipo_modificacion: 'formula',
                    fecha_modificacion: new Date().toISOString(),
                },
            };
        } else {
            // Edición simple de valor
            reporte.datosModificados.celdas = {
                ...reporte.datosModificados.celdas,
                [key]: {
                    valor_original: valorOriginal,
                    valor_nuevo: dto.valor,
                    tipo_modificacion: 'edicion',
                    fecha_modificacion: new Date().toISOString(),
                },
            };
        }

        // Recalcular fórmulas dependientes
        if (reporte.datosModificados.formulas) {
            const celdasReferencia = `${this.formulaService.numeroAColumnaLetra(
                columna,
            )}${fila + 1}`;

            reporte.datosModificados.formulas =
                await this.formulaService.recalcularFormulas(
                    reporte.datosModificados.formulas,
                    this.obtenerDatosCompletos(reporte),
                    celdasReferencia,
                );
        }

        await this.reporteRepository.save(reporte);

        return {
            fila,
            columna,
            valor: dto.valor,
            formula: dto.formula,
            resultado: reporte.datosModificados.formulas?.[key]?.resultado,
        };
    }

    /**
     * Agregar una nueva fila
     */
    async agregarFila(
        reporteId: string,
        dto: AgregarFilaDto,
        usuarioId: string,
    ): Promise<Reporte> {
        const reporte = await this.findOne(reporteId, usuarioId);

        if (!reporte.datosModificados) {
            reporte.datosModificados = { filas_nuevas: [] };
        }

        if (!reporte.datosModificados.filas_nuevas) {
            reporte.datosModificados.filas_nuevas = [];
        }

        const nuevaFila = {
            index:
                (reporte.datosOriginales?.filas.length || 0) +
                reporte.datosModificados.filas_nuevas.length,
            datos: dto.datos,
            tipo: 'manual' as const,
            fecha_creacion: new Date().toISOString(),
        };

        reporte.datosModificados.filas_nuevas.push(nuevaFila);

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Agregar una nueva columna
     */
    async agregarColumna(
        reporteId: string,
        dto: AgregarColumnaDto,
        usuarioId: string,
    ): Promise<Reporte> {
        const reporte = await this.findOne(reporteId, usuarioId);

        if (!reporte.datosModificados) {
            reporte.datosModificados = { columnas_nuevas: [] };
        }

        if (!reporte.datosModificados.columnas_nuevas) {
            reporte.datosModificados.columnas_nuevas = [];
        }

        const nuevaColumna = {
            index:
                (reporte.datosOriginales?.headers.length || 0) +
                reporte.datosModificados.columnas_nuevas.length,
            nombre: dto.nombre,
            tipo: dto.tipo,
            formula: dto.formula,
            valores: {},
            fecha_creacion: new Date().toISOString(),
        };

        reporte.datosModificados.columnas_nuevas.push(nuevaColumna);

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Obtener los datos completos del reporte (original + modificaciones)
     */
    obtenerDatosCompletos(reporte: Reporte): any[][] {
        const datosBase = reporte.datosOriginales?.filas || [];
        const modificaciones = reporte.datosModificados;

        // Clonar datos originales
        const datosCompletos = datosBase.map((fila) => [...fila]);

        // Aplicar modificaciones de celdas
        if (modificaciones?.celdas) {
            Object.entries(modificaciones.celdas).forEach(([key, celda]) => {
                const [fila, columna] = key.split(',').map(Number);
                if (datosCompletos[fila]) {
                    datosCompletos[fila][columna] = celda.valor_nuevo;
                }
            });
        }

        // Agregar filas nuevas
        if (modificaciones?.filas_nuevas) {
            modificaciones.filas_nuevas.forEach((filaNueva) => {
                datosCompletos.push(filaNueva.datos);
            });
        }

        return datosCompletos;
    }

    /**
     * Eliminar un reporte
     */
    async remove(id: string, usuarioId: string): Promise<void> {
        const reporte = await this.findOne(id, usuarioId);
        await this.reporteRepository.remove(reporte);
    }

    /**
     * Obtener vista previa de los datos (primeras 10 filas)
     */
    async getVistaPrevia(id: string, usuarioId: string) {
        const reporte = await this.findOne(id, usuarioId);
        const datosCompletos = this.obtenerDatosCompletos(reporte);

        return {
            headers: reporte.datosOriginales?.headers || [],
            filas: datosCompletos.slice(0, 10),
            total_filas: datosCompletos.length,
            tiene_mas: datosCompletos.length > 10,
        };
    }

    /**
     * Importar datos desde un archivo Excel
     * - Para tipo "mensual": importa todas las hojas
     * - Para otros tipos: solo la primera hoja
     */
    async importarDesdeExcel(
        id: string,
        trabajoId: string,
        buffer: Buffer,
        nombreArchivo: string,
        usuarioId: string,
    ): Promise<Reporte> {
        // Verificar que el reporte existe y pertenece al usuario
        const reporte = await this.findOne(id, usuarioId);

        // Validar el archivo
        this.excelParserService.validarArchivoExcel(buffer, nombreArchivo);

        // Determinar si debe parsear todas las hojas o solo la primera
        const esMultiHoja = reporte.tipoReporte === 'mensual';

        // Parsear el Excel
        const resultado = this.excelParserService.parsearExcel(buffer, {
            nombreArchivo,
            todasLasHojas: esMultiHoja,
            maxFilas: 10000,
            maxColumnas: 100,
        });

        // Construir datosOriginales
        // Si es multi-hoja, guardamos todas las hojas
        // Si es una sola hoja, solo guardamos la primera
        const datosOriginales: DatosOriginales = esMultiHoja
            ? {
                // Multi-hoja: guardar todas
                hojas: resultado.hojas.map(hoja => ({
                    nombre: hoja.nombre,
                    headers: hoja.headers,
                    filas: hoja.filas,
                })),
                metadata: {
                    totalHojas: resultado.hojas.length,
                    fechaImportacion: resultado.metadata.fechaParseo.toISOString(),
                    nombreArchivo: resultado.nombreArchivo,
                    tamanoArchivo: resultado.metadata.tamanoArchivo,
                },
            }
            : {
                // Una sola hoja
                headers: resultado.hojas[0].headers,
                filas: resultado.hojas[0].filas,
                metadata: {
                    totalFilas: resultado.hojas[0].metadata.totalFilas,
                    totalColumnas: resultado.hojas[0].metadata.totalColumnas,
                    fechaImportacion: resultado.metadata.fechaParseo.toISOString(),
                    nombreArchivo: resultado.nombreArchivo,
                    tamanoArchivo: resultado.metadata.tamanoArchivo,
                },
            };

        // Construir metadata del reporte
        const metadata = esMultiHoja
            ? {
                // Metadata para multi-hoja
                hojas: resultado.hojas.map(hoja => ({
                    nombre: hoja.nombre,
                    filas: hoja.metadata.totalFilas,
                    columnas: hoja.metadata.totalColumnas,
                    areas_editables: [], // Se pueden configurar después
                })),
                totalHojas: resultado.hojas.length,
            }
            : {
                // Metadata para una sola hoja
                filas: resultado.hojas[0].metadata.totalFilas,
                columnas: resultado.hojas[0].metadata.totalColumnas,
                headers: resultado.hojas[0].headers,
                areas_editables: [], // Se pueden configurar después
            };

        // Actualizar el reporte
        reporte.datosOriginales = datosOriginales;
        reporte.metadata = metadata;
        reporte.archivoOriginal = nombreArchivo;
        reporte.estado = 'importado';
        reporte.datosModificados = {}; // Resetear modificaciones

        return await this.reporteRepository.save(reporte);
    }

    /**
     * Obtener información del Excel sin importarlo completamente
     */
    async obtenerInfoExcel(buffer: Buffer): Promise<{
        nombreHojas: string[];
        totalHojas: number;
        tamanoArchivo: number;
    }> {
        return await this.excelParserService.obtenerInfoExcel(buffer);
    }

    /**
     * FASE 2: MÉTODOS DE VISUALIZACIÓN
     */

    /**
     * Obtener datos completos del reporte con paginación
     */
    async obtenerDatosVisualizacion(
        id: string,
        usuarioId: string,
        opciones: {
            hoja?: string; // Nombre de la hoja (para multi-hoja)
            pagina?: number;
            porPagina?: number;
            incluirModificaciones?: boolean;
        } = {},
    ) {
        const reporte = await this.findOne(id, usuarioId);

        if (!reporte.datosOriginales) {
            throw new BadRequestException('El reporte no tiene datos importados');
        }

        const {
            hoja = null,
            pagina = 1,
            porPagina = 100,
            incluirModificaciones = true,
        } = opciones;

        // Determinar si es multi-hoja o una sola hoja
        const esMultiHoja = Boolean(reporte.datosOriginales.hojas);

        if (esMultiHoja) {
            // Multi-hoja: obtener datos de una hoja específica
            return this.obtenerDatosHojaEspecifica(
                reporte,
                hoja,
                pagina,
                porPagina,
                incluirModificaciones,
            );
        } else {
            // Una sola hoja: obtener datos directos
            return this.obtenerDatosHojaUnica(
                reporte,
                pagina,
                porPagina,
                incluirModificaciones,
            );
        }
    }

    /**
     * Obtener datos de una hoja específica (para multi-hoja)
     */
    private obtenerDatosHojaEspecifica(
        reporte: Reporte,
        nombreHoja: string,
        pagina: number,
        porPagina: number,
        incluirModificaciones: boolean,
    ) {
        const hojas = reporte.datosOriginales.hojas;

        if (!hojas || hojas.length === 0) {
            throw new BadRequestException('No hay hojas disponibles');
        }

        // Si no se especifica hoja, usar la primera
        const hojaSeleccionada = nombreHoja
            ? hojas.find((h) => h.nombre === nombreHoja)
            : hojas[0];

        if (!hojaSeleccionada) {
            throw new BadRequestException(
                `La hoja "${nombreHoja}" no existe. Hojas disponibles: ${hojas.map((h) => h.nombre).join(', ')}`,
            );
        }

        // Obtener filas paginadas
        const inicio = (pagina - 1) * porPagina;
        const fin = inicio + porPagina;
        const filasPaginadas = hojaSeleccionada.filas.slice(inicio, fin);

        // Aplicar modificaciones si es necesario
        const filasFinales = incluirModificaciones
            ? this.aplicarModificacionesAFilas(
                filasPaginadas,
                reporte.datosModificados,
                inicio,
            )
            : filasPaginadas;

        return {
            tipo: 'multi-hoja',
            hojaActual: hojaSeleccionada.nombre,
            hojasDisponibles: hojas.map((h) => ({
                nombre: h.nombre,
                totalFilas: h.filas.length,
                totalColumnas: h.headers.length,
            })),
            headers: hojaSeleccionada.headers,
            filas: filasFinales,
            paginacion: {
                pagina,
                porPagina,
                totalFilas: hojaSeleccionada.filas.length,
                totalPaginas: Math.ceil(hojaSeleccionada.filas.length / porPagina),
                inicio: inicio + 1,
                fin: Math.min(fin, hojaSeleccionada.filas.length),
            },
            metadata: {
                tieneModificaciones: this.tieneModificaciones(reporte.datosModificados),
                totalHojas: hojas.length,
                estadoReporte: reporte.estado,
            },
        };
    }

    /**
     * Obtener datos de una sola hoja
     */
    private obtenerDatosHojaUnica(
        reporte: Reporte,
        pagina: number,
        porPagina: number,
        incluirModificaciones: boolean,
    ) {
        const headers = reporte.datosOriginales.headers;
        const filas = reporte.datosOriginales.filas;

        if (!headers || !filas) {
            throw new BadRequestException('Datos originales incompletos');
        }

        // Obtener filas paginadas
        const inicio = (pagina - 1) * porPagina;
        const fin = inicio + porPagina;
        const filasPaginadas = filas.slice(inicio, fin);

        // Aplicar modificaciones si es necesario
        const filasFinales = incluirModificaciones
            ? this.aplicarModificacionesAFilas(
                filasPaginadas,
                reporte.datosModificados,
                inicio,
            )
            : filasPaginadas;

        return {
            tipo: 'hoja-unica',
            headers,
            filas: filasFinales,
            paginacion: {
                pagina,
                porPagina,
                totalFilas: filas.length,
                totalPaginas: Math.ceil(filas.length / porPagina),
                inicio: inicio + 1,
                fin: Math.min(fin, filas.length),
            },
            metadata: {
                tieneModificaciones: this.tieneModificaciones(reporte.datosModificados),
                estadoReporte: reporte.estado,
            },
        };
    }

    /**
     * Aplicar modificaciones a las filas obtenidas
     */
    private aplicarModificacionesAFilas(
        filas: any[][],
        modificaciones: DatosModificados,
        offsetInicio: number,
    ): any[][] {
        if (!modificaciones || !modificaciones.celdas) {
            return filas;
        }

        // Clonar las filas para no mutar el original
        const filasModificadas = filas.map((fila) => [...fila]);

        // Aplicar modificaciones de celdas
        Object.entries(modificaciones.celdas).forEach(([key, modificacion]) => {
            const [filaStr, columnaStr] = key.split(',');
            const filaIndex = parseInt(filaStr) - offsetInicio;
            const columnaIndex = parseInt(columnaStr);

            // Verificar si la celda está en el rango actual
            if (
                filaIndex >= 0 &&
                filaIndex < filasModificadas.length &&
                columnaIndex >= 0 &&
                columnaIndex < filasModificadas[filaIndex].length
            ) {
                filasModificadas[filaIndex][columnaIndex] = modificacion.valor_nuevo;
            }
        });

        return filasModificadas;
    }

    /**
     * Verificar si hay modificaciones en el reporte
     */
    private tieneModificaciones(modificaciones: DatosModificados): boolean {
        if (!modificaciones) return false;

        return (
            (modificaciones.celdas && Object.keys(modificaciones.celdas).length > 0) ||
            (modificaciones.filas_nuevas && modificaciones.filas_nuevas.length > 0) ||
            (modificaciones.columnas_nuevas && modificaciones.columnas_nuevas.length > 0) ||
            (modificaciones.formulas && Object.keys(modificaciones.formulas).length > 0)
        );
    }

    /**
     * Obtener lista de hojas disponibles (para multi-hoja)
     */
    async obtenerHojasDisponibles(id: string, usuarioId: string) {
        const reporte = await this.findOne(id, usuarioId);

        if (!reporte.datosOriginales) {
            throw new BadRequestException('El reporte no tiene datos importados');
        }

        const hojas = reporte.datosOriginales.hojas;

        if (!hojas) {
            // Es una hoja única
            return {
                tipo: 'hoja-unica',
                hojas: [
                    {
                        nombre: 'Hoja Principal',
                        totalFilas: reporte.datosOriginales.filas?.length || 0,
                        totalColumnas: reporte.datosOriginales.headers?.length || 0,
                    },
                ],
            };
        }

        return {
            tipo: 'multi-hoja',
            hojas: hojas.map((hoja) => ({
                nombre: hoja.nombre,
                totalFilas: hoja.filas.length,
                totalColumnas: hoja.headers.length,
            })),
        };
    }

    /**
     * Obtener estadísticas de un reporte
     */
    async obtenerEstadisticas(id: string, usuarioId: string) {
        const reporte = await this.findOne(id, usuarioId);

        if (!reporte.datosOriginales) {
            return {
                estado: 'sin_datos',
                mensaje: 'El reporte no tiene datos importados',
            };
        }

        const esMultiHoja = Boolean(reporte.datosOriginales.hojas);

        if (esMultiHoja) {
            const hojas = reporte.datosOriginales.hojas;
            const totalFilas = hojas.reduce((sum, hoja) => sum + hoja.filas.length, 0);
            const totalColumnas = Math.max(...hojas.map((hoja) => hoja.headers.length));

            return {
                estado: reporte.estado,
                tipo: 'multi-hoja',
                totalHojas: hojas.length,
                totalFilas,
                totalColumnas,
                hojas: hojas.map((hoja) => ({
                    nombre: hoja.nombre,
                    filas: hoja.filas.length,
                    columnas: hoja.headers.length,
                })),
                modificaciones: this.contarModificaciones(reporte.datosModificados),
                fechaImportacion: reporte.datosOriginales.metadata.fechaImportacion,
                nombreArchivo: reporte.datosOriginales.metadata.nombreArchivo,
            };
        } else {
            return {
                estado: reporte.estado,
                tipo: 'hoja-unica',
                totalFilas: reporte.datosOriginales.filas?.length || 0,
                totalColumnas: reporte.datosOriginales.headers?.length || 0,
                modificaciones: this.contarModificaciones(reporte.datosModificados),
                fechaImportacion: reporte.datosOriginales.metadata.fechaImportacion,
                nombreArchivo: reporte.datosOriginales.metadata.nombreArchivo,
            };
        }
    }

    /**
     * Contar modificaciones realizadas
     */
    private contarModificaciones(modificaciones: DatosModificados): {
        celdasModificadas: number;
        filasAgregadas: number;
        columnasAgregadas: number;
        formulas: number;
    } {
        if (!modificaciones) {
            return {
                celdasModificadas: 0,
                filasAgregadas: 0,
                columnasAgregadas: 0,
                formulas: 0,
            };
        }

        return {
            celdasModificadas: modificaciones.celdas
                ? Object.keys(modificaciones.celdas).length
                : 0,
            filasAgregadas: modificaciones.filas_nuevas?.length || 0,
            columnasAgregadas: modificaciones.columnas_nuevas?.length || 0,
            formulas: modificaciones.formulas
                ? Object.keys(modificaciones.formulas).length
                : 0,
        };
    }

    /**
     * Obtener rango de datos específico (para scrolling virtual)
     */
    async obtenerRangoDatos(
        id: string,
        usuarioId: string,
        opciones: {
            hoja?: string;
            filaInicio: number;
            filaFin: number;
            incluirHeaders?: boolean;
        },
    ) {
        const reporte = await this.findOne(id, usuarioId);

        if (!reporte.datosOriginales) {
            throw new BadRequestException('El reporte no tiene datos importados');
        }

        const { hoja, filaInicio, filaFin, incluirHeaders = false } = opciones;
        const esMultiHoja = Boolean(reporte.datosOriginales.hojas);

        let headers: string[];
        let filasCompletas: any[][];

        if (esMultiHoja) {
            const hojas = reporte.datosOriginales.hojas;
            const hojaSeleccionada = hoja
                ? hojas.find((h) => h.nombre === hoja)
                : hojas[0];

            if (!hojaSeleccionada) {
                throw new BadRequestException(`La hoja "${hoja}" no existe`);
            }

            headers = hojaSeleccionada.headers;
            filasCompletas = hojaSeleccionada.filas;
        } else {
            headers = reporte.datosOriginales.headers;
            filasCompletas = reporte.datosOriginales.filas;
        }

        // Validar rango
        const inicio = Math.max(0, filaInicio);
        const fin = Math.min(filasCompletas.length, filaFin);

        const filasRango = filasCompletas.slice(inicio, fin);

        // Aplicar modificaciones
        const filasConModificaciones = this.aplicarModificacionesAFilas(
            filasRango,
            reporte.datosModificados,
            inicio,
        );

        return {
            headers: incluirHeaders ? headers : undefined,
            filas: filasConModificaciones,
            rango: {
                inicio,
                fin,
                total: filasCompletas.length,
            },
        };
    }
}

