import { ClientesService } from '../services/clientes.service';
import { CreateClienteDto, UpdateClienteDto } from '../dto';
export declare class ClientesController {
    private readonly clientesService;
    constructor(clientesService: ClientesService);
    create(dto: CreateClienteDto, req: any): Promise<import("..").Cliente>;
    findAll(search?: string, rfc?: string, page?: string, limit?: string): Promise<import("../services/clientes.service").ClientesPaginatedResult>;
    findOne(id: string): Promise<import("..").Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<import("..").Cliente>;
    remove(id: string): Promise<void>;
}
