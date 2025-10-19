import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities';
import { CreateClienteDto, UpdateClienteDto } from '../dto';
import { Trabajo } from '../../trabajos/entities';

export interface ListClientesOptions {
    search?: string;
    rfc?: string;
    page?: number;
    limit?: number;
}

export interface ClientesPaginatedResult {
    data: Cliente[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private readonly clienteRepository: Repository<Cliente>,
        @InjectRepository(Trabajo)
        private readonly trabajoRepository: Repository<Trabajo>,
    ) { }

    async create(dto: CreateClienteDto, userId: string): Promise<Cliente> {
        if (!userId) {
            throw new BadRequestException('Usuario creador no identificado');
        }

        const rfcNormalizado = dto.rfc.trim().toUpperCase();
        const existente = await this.clienteRepository.findOne({
            where: { rfc: rfcNormalizado },
        });

        if (existente) {
            throw new ConflictException('Ya existe un cliente con ese RFC');
        }

        const cliente = this.clienteRepository.create({
            ...dto,
            rfc: rfcNormalizado,
            createdBy: userId,
        });

        return this.clienteRepository.save(cliente);
    }

    async findAll(options: ListClientesOptions = {}): Promise<ClientesPaginatedResult> {
        const page = options.page && options.page > 0 ? options.page : 1;
        const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 50) : 20;

        const qb = this.clienteRepository.createQueryBuilder('cliente');

        if (options.search) {
            const term = `%${options.search.trim()}%`;
            qb.andWhere(
                '(cliente.nombre ILIKE :term OR cliente.rfc ILIKE :term OR cliente.razon_social ILIKE :term)',
                { term },
            );
        }

        if (options.rfc) {
            qb.andWhere('cliente.rfc = :rfc', {
                rfc: options.rfc.trim().toUpperCase(),
            });
        }

        const total = await qb.getCount();
        const data = await qb
            .orderBy('cliente.nombre', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<Cliente> {
        const cliente = await this.clienteRepository.findOne({ where: { id } });

        if (!cliente) {
            throw new NotFoundException(`Cliente con id ${id} no encontrado`);
        }

        return cliente;
    }

    async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
        const cliente = await this.findOne(id);

        const payload: UpdateClienteDto = { ...dto };

        if (payload.rfc) {
            const rfcNormalizado = payload.rfc.trim().toUpperCase();
            const repetido = await this.clienteRepository.findOne({
                where: { rfc: rfcNormalizado },
            });

            if (repetido && repetido.id !== id) {
                throw new ConflictException('Ya existe un cliente con ese RFC');
            }

            payload.rfc = rfcNormalizado;
        }

        Object.assign(cliente, payload);

        return this.clienteRepository.save(cliente);
    }

    async remove(id: string): Promise<void> {
        const cliente = await this.findOne(id);

        const trabajosAsociados = await this.trabajoRepository.count({
            where: { clienteId: id },
        });

        if (trabajosAsociados > 0) {
            throw new ConflictException(
                'No se puede eliminar el cliente porque tiene trabajos asociados',
            );
        }

        await this.clienteRepository.remove(cliente);
    }
}
