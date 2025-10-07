import api from './api';
import { Trabajo, CreateTrabajoDto, UpdateTrabajoDto } from '../types/trabajo';

export const trabajosService = {
    async getAll(usuarioId?: string): Promise<Trabajo[]> {
        const params = usuarioId ? { usuarioId } : {};
        const { data } = await api.get('/trabajos', { params });
        return data;
    },

    async getOne(id: string): Promise<Trabajo> {
        const { data } = await api.get(`/trabajos/${id}`);
        return data;
    },

    async create(trabajo: CreateTrabajoDto): Promise<Trabajo> {
        const { data } = await api.post('/trabajos', trabajo);
        return data;
    },

    async update(id: string, updates: UpdateTrabajoDto): Promise<Trabajo> {
        const { data } = await api.patch(`/trabajos/${id}`, updates);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/trabajos/${id}`);
    },
};
