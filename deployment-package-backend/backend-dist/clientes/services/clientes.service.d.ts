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
export declare class ClientesService {
    private readonly clienteRepository;
    private readonly trabajoRepository;
    constructor(clienteRepository: Repository<Cliente>, trabajoRepository: Repository<Trabajo>);
    create(dto: CreateClienteDto, userId: string): Promise<Cliente>;
    findAll(options?: ListClientesOptions): Promise<ClientesPaginatedResult>;
    findOne(id: string): Promise<Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<Cliente>;
    remove(id: string): Promise<void>;
}
