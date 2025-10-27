import { UserRole } from '../../auth/entities/user.entity';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    equipoId?: string | null;
}
