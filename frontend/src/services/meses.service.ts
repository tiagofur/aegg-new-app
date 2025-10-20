import api from './api';
import { Mes, CreateMesDto } from '../types/trabajo';

export const mesesService = {
    async create(mesDto: CreateMesDto): Promise<Mes> {
        const { data } = await api.post('/meses', mesDto);
        return data;
    },

    async getByTrabajo(trabajoId: string): Promise<Mes[]> {
        const { data } = await api.get(`/meses/trabajo/${trabajoId}`);
        return data;
    },

    async getOne(id: string): Promise<Mes> {
        const { data } = await api.get(`/meses/${id}`);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/meses/${id}`);
    },

    async reabrir(id: string): Promise<Mes> {
        const { data } = await api.patch(`/meses/${id}/reabrir`);
        return data;
    },

    async enviarRevision(id: string, comentario?: string): Promise<Mes> {
        const { data } = await api.patch(`/meses/${id}/enviar-revision`, {
            comentario: comentario?.trim() || undefined,
        });
        return data;
    },

    async enviarRevisionManual(id: string): Promise<Mes> {
        const { data } = await api.patch(`/meses/${id}/enviar-manual`);
        return data;
    },

    async aprobar(id: string): Promise<Mes> {
        const { data } = await api.patch(`/meses/${id}/aprobar`);
        return data;
    },

    async solicitarCambios(id: string, comentario: string): Promise<Mes> {
        const { data } = await api.patch(`/meses/${id}/solicitar-cambios`, {
            comentario,
        });
        return data;
    },
};
