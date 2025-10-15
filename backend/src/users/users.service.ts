import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<UserResponse[]> {
        const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });
        return users.map((user) => this.toResponse(user));
    }

    async create(dto: CreateUserDto): Promise<UserResponse> {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({ where: { email } });
        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.userRepository.create({
            name: dto.name.trim(),
            email,
            password: hashedPassword,
            role: dto.role ?? UserRole.GESTOR,
        });

        const saved = await this.userRepository.save(user);
        return this.toResponse(saved);
    }

    async update(id: string, dto: UpdateUserDto, currentUserId?: string): Promise<UserResponse> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
            if (existing && existing.id !== id) {
                throw new ConflictException('El email ya está registrado');
            }
            user.email = normalizedEmail;
        }

        if (dto.name) {
            user.name = dto.name.trim();
        }

        if (dto.role) {
            if (id === currentUserId && dto.role !== user.role) {
                throw new UnprocessableEntityException('No puedes cambiar tu propio rol mientras estás conectado');
            }
            user.role = dto.role;
        }

        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }

        const updated = await this.userRepository.save(user);
        return this.toResponse(updated);
    }

    async remove(id: string, currentUserId?: string): Promise<void> {
        if (id === currentUserId) {
            throw new UnprocessableEntityException('No puedes eliminar tu propio usuario activo');
        }

        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Usuario no encontrado');
        }
    }

    private toResponse(user: User): UserResponse {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
