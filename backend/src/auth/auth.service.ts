import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Equipo } from './entities/equipo.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { resolveRoleForUser } from './utils/role.helpers';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Equipo)
        private equipoRepository: Repository<Equipo>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name, role, equipoId } = registerDto;
        const normalizedEmail = email.trim().toLowerCase();

        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const resolvedRole = resolveRoleForUser(normalizedEmail, role);

        let targetEquipoId: string | null = null;
        if (equipoId) {
            const equipo = await this.equipoRepository.findOne({ where: { id: equipoId, activo: true } });
            if (!equipo) {
                throw new BadRequestException('El equipo especificado no existe o está inactivo');
            }
            targetEquipoId = equipo.id;
        }

        // Crear usuario
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

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const normalizedEmail = email.trim().toLowerCase();

        // Buscar usuario
        const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        const resolvedRole = resolveRoleForUser(user.email, user.role);
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

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            equipoId: user.equipoId ?? null,
        };
        return this.jwtService.sign(payload);
    }

    private buildAuthUser(user: User) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            equipoId: user.equipoId ?? null,
        };
    }

    async validateUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return null;
        }

        const resolvedRole = resolveRoleForUser(user.email, user.role);
        if (resolvedRole !== user.role) {
            user.role = resolvedRole;
            return this.userRepository.save(user);
        }

        return user;
    }
}
