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

@Injectable()
export class ReporteService {
    constructor(
        @InjectRepository(Reporte)
        private reporteRepository: Repository<Reporte>,
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        private formulaService: FormulaService,
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
}
