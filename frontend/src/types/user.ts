import { DashboardRole } from "./dashboard";

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: DashboardRole;
    createdAt?: string;
    updatedAt?: string;
    equipoId?: string | null;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: DashboardRole;
    equipoId?: string | null;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    password?: string;
    role?: DashboardRole;
    equipoId?: string | null;
}
