import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trabajo } from '../entities/trabajo.entity';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto/trabajo.dto';

@Injectable()
export class TrabajoService {
    constructor(
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
    ) { }

    /**
     * Crear un nuevo trabajo
     */
    async create(
        createTrabajoDto: CreateTrabajoDto,
        usuarioId: string,
    ): Promise<Trabajo> {
        const trabajo = this.trabajoRepository.create({
            ...createTrabajoDto,
            usuarioId,
        });

        return await this.trabajoRepository.save(trabajo);
    }

    /**
     * Obtener todos los trabajos de un usuario
     */
    async findAllByUser(usuarioId: string): Promise<Trabajo[]> {
        return await this.trabajoRepository.find({
            where: { usuarioId },
            relations: ['reportes'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Obtener un trabajo por ID
     */
    async findOne(id: string, usuarioId: string): Promise<Trabajo> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id },
            relations: ['reportes'],
        });

        if (!trabajo) {
            throw new NotFoundException(
                `Trabajo con ID ${id} no encontrado`,
            );
        }

        // Verificar que el trabajo pertenezca al usuario
        if (trabajo.usuarioId !== usuarioId) {
            throw new ForbiddenException(
                'No tienes permiso para acceder a este trabajo',
            );
        }

        return trabajo;
    }

    /**
     * Actualizar un trabajo
     */
    async update(
        id: string,
        updateTrabajoDto: UpdateTrabajoDto,
        usuarioId: string,
    ): Promise<Trabajo> {
        const trabajo = await this.findOne(id, usuarioId);

        Object.assign(trabajo, updateTrabajoDto);

        return await this.trabajoRepository.save(trabajo);
    }

    /**
     * Eliminar un trabajo
     */
    async remove(id: string, usuarioId: string): Promise<void> {
        const trabajo = await this.findOne(id, usuarioId);
        await this.trabajoRepository.remove(trabajo);
    }

    /**
     * Obtener estadísticas de trabajos del usuario
     */
    async getEstadisticas(usuarioId: string) {
        const trabajos = await this.trabajoRepository.find({
            where: { usuarioId },
            relations: ['reportes'],
        });

        return {
            total: trabajos.length,
            activos: trabajos.filter((t) => t.estado === 'activo').length,
            completados: trabajos.filter((t) => t.estado === 'completado')
                .length,
            archivados: trabajos.filter((t) => t.estado === 'archivado')
                .length,
            total_reportes: trabajos.reduce(
                (acc, t) => acc + (t.reportes?.length || 0),
                0,
            ),
        };
    }

    /**
     * Duplicar un trabajo (útil para crear plantillas)
     */
    async duplicate(id: string, usuarioId: string): Promise<Trabajo> {
        const trabajoOriginal = await this.findOne(id, usuarioId);

        const trabajoDuplicado = this.trabajoRepository.create({
            nombre: `${trabajoOriginal.nombre} (Copia)`,
            mes: trabajoOriginal.mes,
            descripcion: trabajoOriginal.descripcion,
            usuarioId,
            estado: 'activo',
        });

        return await this.trabajoRepository.save(trabajoDuplicado);
    }
}
