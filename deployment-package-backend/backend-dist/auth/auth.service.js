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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
const equipo_entity_1 = require("./entities/equipo.entity");
const role_helpers_1 = require("./utils/role.helpers");
let AuthService = class AuthService {
    constructor(userRepository, equipoRepository, jwtService) {
        this.userRepository = userRepository;
        this.equipoRepository = equipoRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { email, password, name, role, equipoId } = registerDto;
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const resolvedRole = (0, role_helpers_1.resolveRoleForUser)(normalizedEmail, role);
        let targetEquipoId = null;
        if (equipoId) {
            const equipo = await this.equipoRepository.findOne({ where: { id: equipoId, activo: true } });
            if (!equipo) {
                throw new common_1.BadRequestException('El equipo especificado no existe o está inactivo');
            }
            targetEquipoId = equipo.id;
        }
        const user = this.userRepository.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: name.trim(),
            role: resolvedRole,
            equipoId: targetEquipoId,
        });
        await this.userRepository.save(user);
        const refreshedUser = await this.userRepository.findOne({ where: { id: user.id } });
        const safeUser = refreshedUser ?? user;
        const token = this.generateToken(safeUser);
        return {
            user: this.buildAuthUser(safeUser),
            token,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas');
        }
        const resolvedRole = (0, role_helpers_1.resolveRoleForUser)(user.email, user.role);
        if (resolvedRole !== user.role) {
            user.role = resolvedRole;
            await this.userRepository.save(user);
        }
        const token = this.generateToken(user);
        return {
            user: this.buildAuthUser(user),
            token,
        };
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            equipoId: user.equipoId ?? null,
        };
        return this.jwtService.sign(payload);
    }
    buildAuthUser(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            equipoId: user.equipoId ?? null,
        };
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return null;
        }
        const resolvedRole = (0, role_helpers_1.resolveRoleForUser)(user.email, user.role);
        if (resolvedRole !== user.role) {
            user.role = resolvedRole;
            return this.userRepository.save(user);
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(equipo_entity_1.Equipo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map