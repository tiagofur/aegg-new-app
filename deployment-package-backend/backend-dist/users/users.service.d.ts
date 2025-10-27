import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { Equipo } from '../auth/entities/equipo.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    equipoId: string | null;
}
export declare class UsersService {
    private readonly userRepository;
    private readonly equipoRepository;
    constructor(userRepository: Repository<User>, equipoRepository: Repository<Equipo>);
    findAll(): Promise<UserResponse[]>;
    create(dto: CreateUserDto): Promise<UserResponse>;
    update(id: string, dto: UpdateUserDto, currentUserId?: string): Promise<UserResponse>;
    remove(id: string, currentUserId?: string): Promise<void>;
    private toResponse;
    private findEquipoOrFail;
}
