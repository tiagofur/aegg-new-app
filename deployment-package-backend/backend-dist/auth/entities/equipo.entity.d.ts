import { User } from './user.entity';
export declare class Equipo {
    id: string;
    nombre: string;
    activo: boolean;
    gestorId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    miembros: User[];
}
