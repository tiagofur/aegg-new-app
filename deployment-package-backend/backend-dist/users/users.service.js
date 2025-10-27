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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../auth/entities/user.entity");
const equipo_entity_1 = require("../auth/entities/equipo.entity");
const role_helpers_1 = require("../auth/utils/role.helpers");
let UsersService = class UsersService {
    constructor(userRepository, equipoRepository) {
        this.userRepository = userRepository;
        this.equipoRepository = equipoRepository;
    }
    async findAll() {
        const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });
        const usersToUpdate = [];
        for (const user of users) {
            const resolvedRole = (0, role_helpers_1.resolveRoleForUser)(user.email, user.role);
            if (resolvedRole !== user.role) {
                user.role = resolvedRole;
                usersToUpdate.push(user);
            }
        }
        if (usersToUpdate.length > 0) {
            await this.userRepository.save(usersToUpdate);
        }
        return users.map((user) => this.toResponse(user));
    }
    async create(dto) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const targetRole = (0, role_helpers_1.resolveRoleForUser)(email, dto.role ?? undefined);
        const user = this.userRepository.create({
            name: dto.name.trim(),
            email,
            password: hashedPassword,
            role: targetRole,
        });
        if (dto.equipoId) {
            const equipo = await this.findEquipoOrFail(dto.equipoId);
            user.equipoId = equipo.id;
        }
        const saved = await this.userRepository.save(user);
        return this.toResponse(saved);
    }
    async update(id, dto, currentUserId) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
            user.email = normalizedEmail;
        }
        if (dto.name) {
            user.name = dto.name.trim();
        }
        if (dto.role) {
            const nextRole = (0, role_helpers_1.resolveRoleForUser)(user.email, dto.role);
            if (id === currentUserId && nextRole !== user.role) {
                throw new common_1.UnprocessableEntityException('No puedes cambiar tu propio rol mientras estás conectado');
            }
            user.role = nextRole;
        }
        if (dto.equipoId !== undefined) {
            if (dto.equipoId === null) {
                user.equipoId = null;
            }
            else {
                const equipo = await this.findEquipoOrFail(dto.equipoId);
                user.equipoId = equipo.id;
            }
        }
        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }
        const ensuredRole = (0, role_helpers_1.resolveRoleForUser)(user.email, user.role);
        if (ensuredRole !== user.role) {
            user.role = ensuredRole;
        }
        const updated = await this.userRepository.save(user);
        return this.toResponse(updated);
    }
    async remove(id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.UnprocessableEntityException('No puedes eliminar tu propio usuario activo');
        }
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
    }
    toResponse(user) {
        const role = (0, role_helpers_1.resolveRoleForUser)(user.email, user.role);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            equipoId: user.equipoId ?? null,
        };
    }
    async findEquipoOrFail(equipoId) {
        const equipo = await this.equipoRepository.findOne({ where: { id: equipoId, activo: true } });
        if (!equipo) {
            throw new common_1.NotFoundException('Equipo no encontrado o inactivo');
        }
        return equipo;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(equipo_entity_1.Equipo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map