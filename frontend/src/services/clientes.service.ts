import api from './api';
import {
    Cliente,
    ClientesPaginatedResult,
    CreateClientePayload,
    UpdateClientePayload,
} from '../types';

export interface ListClientesParams {
    search?: string;
    rfc?: string;
    page?: number;
    limit?: number;
}

export const clientesService = {
    async list(params: ListClientesParams = {}): Promise<ClientesPaginatedResult> {
        const { data } = await api.get<ClientesPaginatedResult>('/clientes', {
            params,
        });
        return data;
    },

    async getOne(id: string): Promise<Cliente> {
        const { data } = await api.get<Cliente>(`/clientes/${id}`);
        return data;
    },

    async create(payload: CreateClientePayload): Promise<Cliente> {
        const { data } = await api.post<Cliente>('/clientes', payload);
        return data;
    },

    async update(id: string, payload: UpdateClientePayload): Promise<Cliente> {
        const { data } = await api.put<Cliente>(`/clientes/${id}`, payload);
        return data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`/clientes/${id}`);
    },
};
