import { UserRole } from '../entities/user.entity';
export declare const normalizeRoleValue: (role?: string | null) => UserRole;
export declare const resolveRoleForUser: (email: string, role?: string | null) => UserRole;
