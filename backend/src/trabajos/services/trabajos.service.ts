import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajo, ReporteBaseAnual } from '../entities';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';

@Injectable()
export class TrabajosService {
    constructor(
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        @InjectRepository(ReporteBaseAnual)
        private reporteBaseRepository: Repository<ReporteBaseAnual>,
    ) { }

    async create(createTrabajoDto: CreateTrabajoDto): Promise<Trabajo> {
        // Verificar que no exista un trabajo para ese cliente y año
        const existe = await this.trabajoRepository.findOne({
            where: {
                clienteNombre: createTrabajoDto.clienteNombre,
                anio: createTrabajoDto.anio,
            },
        });

        if (existe) {
            throw new ConflictException(
                `Ya existe un trabajo para el cliente ${createTrabajoDto.clienteNombre} en el año ${createTrabajoDto.anio}`,
            );
        }

        // Crear trabajo
        const trabajo = this.trabajoRepository.create(createTrabajoDto);
        const trabajoGuardado = await this.trabajoRepository.save(trabajo);

        // Crear reporte base anual inicial
        const reporteBase = this.reporteBaseRepository.create({
            trabajoId: trabajoGuardado.id,
            mesesCompletados: [],
            hojas: this.getHojasIniciales(),
        });
        await this.reporteBaseRepository.save(reporteBase);

        // Retornar trabajo con reporte base
        return this.findOne(trabajoGuardado.id);
    }

    async findAll(usuarioId?: string): Promise<Trabajo[]> {
        const whereCondition = usuarioId
            ? { usuarioAsignadoId: usuarioId }
            : {};

        return this.trabajoRepository.find({
            where: whereCondition,
            relations: ['reporteBaseAnual', 'meses', 'meses.reportes', 'usuarioAsignado'],
            order: {
                fechaCreacion: 'DESC',
            },
        });
    }

    async findOne(id: string): Promise<Trabajo> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id },
            relations: ['reporteBaseAnual', 'meses', 'meses.reportes', 'usuarioAsignado'],
        });

        if (!trabajo) {
            throw new NotFoundException(`Trabajo con id ${id} no encontrado`);
        }

        return trabajo;
    }

    async update(id: string, updateTrabajoDto: UpdateTrabajoDto): Promise<Trabajo> {
        const trabajo = await this.findOne(id);

        Object.assign(trabajo, updateTrabajoDto);
        await this.trabajoRepository.save(trabajo);

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const trabajo = await this.findOne(id);
        await this.trabajoRepository.remove(trabajo);
    }

    private getHojasIniciales(): any[] {
        return [
            {
                nombre: 'Resumen Anual',
                datos: [],
            },
            {
                nombre: 'Ingresos Consolidados',
                datos: [],
            },
            {
                nombre: 'Comparativas',
                datos: [],
            },
        ];
    }
}
