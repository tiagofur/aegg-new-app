import { UserRole } from '../../auth/entities/user.entity';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    equipoId?: string;
}
