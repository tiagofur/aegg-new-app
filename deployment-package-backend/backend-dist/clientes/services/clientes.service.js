"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const entities_2 = require("../../trabajos/entities");
let ClientesService = class ClientesService {
    constructor(clienteRepository, trabajoRepository) {
        this.clienteRepository = clienteRepository;
        this.trabajoRepository = trabajoRepository;
    }
    async create(dto, userId) {
        if (!userId) {
            throw new common_1.BadRequestException('Usuario creador no identificado');
        }
        const rfcNormalizado = dto.rfc.trim().toUpperCase();
        const existente = await this.clienteRepository.findOne({
            where: { rfc: rfcNormalizado },
        });
        if (existente) {
            throw new common_1.ConflictException('Ya existe un cliente con ese RFC');
        }
        const cliente = this.clienteRepository.create({
            ...dto,
            rfc: rfcNormalizado,
            createdBy: userId,
        });
        return this.clienteRepository.save(cliente);
    }
    async findAll(options = {}) {
        const page = options.page && options.page > 0 ? options.page : 1;
        const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 50) : 20;
        const qb = this.clienteRepository.createQueryBuilder('cliente');
        if (options.search) {
            const term = `%${options.search.trim()}%`;
            qb.andWhere('(cliente.nombre ILIKE :term OR cliente.rfc ILIKE :term OR cliente.razon_social ILIKE :term)', { term });
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
    async findOne(id) {
        const cliente = await this.clienteRepository.findOne({ where: { id } });
        if (!cliente) {
            throw new common_1.NotFoundException(`Cliente con id ${id} no encontrado`);
        }
        return cliente;
    }
    async update(id, dto) {
        const cliente = await this.findOne(id);
        const payload = { ...dto };
        if (payload.rfc) {
            const rfcNormalizado = payload.rfc.trim().toUpperCase();
            const repetido = await this.clienteRepository.findOne({
                where: { rfc: rfcNormalizado },
            });
            if (repetido && repetido.id !== id) {
                throw new common_1.ConflictException('Ya existe un cliente con ese RFC');
            }
            payload.rfc = rfcNormalizado;
        }
        Object.assign(cliente, payload);
        return this.clienteRepository.save(cliente);
    }
    async remove(id) {
        const cliente = await this.findOne(id);
        const trabajosAsociados = await this.trabajoRepository.count({
            where: { clienteId: id },
        });
        if (trabajosAsociados > 0) {
            throw new common_1.ConflictException('No se puede eliminar el cliente porque tiene trabajos asociados');
        }
        await this.clienteRepository.remove(cliente);
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Cliente)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_2.Trabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map