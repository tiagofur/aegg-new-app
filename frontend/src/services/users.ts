import api from "./api";
import {
    AppUser,
    CreateUserPayload,
    UpdateUserPayload,
} from "../types";

export const usersApi = {
    async getAll(): Promise<AppUser[]> {
        const response = await api.get<AppUser[]>("/users");
        return response.data;
    },

    async create(payload: CreateUserPayload): Promise<AppUser> {
        const response = await api.post<AppUser>("/users", payload);
        return response.data;
    },

    async update(id: string, payload: UpdateUserPayload): Promise<AppUser> {
        const response = await api.patch<AppUser>(`/users/${id}`, payload);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};
