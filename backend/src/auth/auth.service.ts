import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name, role } = registerDto;
        const normalizedEmail = email.trim().toLowerCase();

        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = this.userRepository.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: name.trim(),
            role: role ?? UserRole.GESTOR,
        });

        await this.userRepository.save(user);

        // Generar token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
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

        // Generar token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        };
    }

    private generateToken(user: User): string {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return this.jwtService.sign(payload);
    }

    async validateUser(userId: string): Promise<User> {
        return this.userRepository.findOne({ where: { id: userId } });
    }
}
