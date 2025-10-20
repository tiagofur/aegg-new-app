import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../auth/entities/user.entity';
import { Equipo } from '../auth/entities/equipo.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { resolveRoleForUser } from '../auth/utils/role.helpers';

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    equipoId: string | null;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Equipo)
        private readonly equipoRepository: Repository<Equipo>,
    ) { }

    async findAll(): Promise<UserResponse[]> {
        const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });

        const usersToUpdate: User[] = [];
        for (const user of users) {
            const resolvedRole = resolveRoleForUser(user.email, user.role);
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

    async create(dto: CreateUserDto): Promise<UserResponse> {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.userRepository.findOne({ where: { email } });
        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const targetRole = resolveRoleForUser(email, dto.role ?? undefined);

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
            const nextRole = resolveRoleForUser(user.email, dto.role);
            if (id === currentUserId && nextRole !== user.role) {
                throw new UnprocessableEntityException('No puedes cambiar tu propio rol mientras estás conectado');
            }
            user.role = nextRole;
        }

        if (dto.equipoId !== undefined) {
            if (dto.equipoId === null) {
                user.equipoId = null;
            } else {
                const equipo = await this.findEquipoOrFail(dto.equipoId);
                user.equipoId = equipo.id;
            }
        }

        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }

        const ensuredRole = resolveRoleForUser(user.email, user.role);
        if (ensuredRole !== user.role) {
            user.role = ensuredRole;
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
        const role = resolveRoleForUser(user.email, user.role);

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

    private async findEquipoOrFail(equipoId: string): Promise<Equipo> {
        const equipo = await this.equipoRepository.findOne({ where: { id: equipoId, activo: true } });
        if (!equipo) {
            throw new NotFoundException('Equipo no encontrado o inactivo');
        }

        return equipo;
    }
}
