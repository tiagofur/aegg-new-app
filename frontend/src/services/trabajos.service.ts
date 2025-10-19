import api from './api';
import {
    Trabajo,
    CreateTrabajoDto,
    UpdateTrabajoDto,
    ReporteBaseAnual,
} from '../types/trabajo';

export const trabajosService = {
    async getAll(miembroId?: string): Promise<Trabajo[]> {
        const params = miembroId ? { miembroId } : undefined;
        const { data } = await api.get('/trabajos', { params });
        return data;
    },

    async getOne(id: string): Promise<Trabajo> {
        const { data } = await api.get(`/trabajos/${id}`);
        return data;
    },

    async create(payload: CreateTrabajoDto): Promise<Trabajo> {
        const { data } = await api.post('/trabajos', payload);
        return data;
    },

    async update(id: string, updates: UpdateTrabajoDto): Promise<Trabajo> {
        const { data } = await api.patch(`/trabajos/${id}`, updates);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/trabajos/${id}`);
    },

    async importarReporteBase(trabajoId: string, file: File): Promise<ReporteBaseAnual> {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post(`/trabajos/${trabajoId}/reporte-base/importar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
};
