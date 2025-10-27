import { Equipo } from './equipo.entity';
export declare enum UserRole {
    ADMIN = "Admin",
    GESTOR = "Gestor",
    MIEMBRO = "Miembro"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    equipoId?: string | null;
    equipo?: Equipo | null;
    createdAt: Date;
    updatedAt: Date;
}
