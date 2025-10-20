import axios, { AxiosHeaders } from 'axios';
import { AppUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (!config.headers) {
                config.headers = new AxiosHeaders();
            }

            if (typeof (config.headers as AxiosHeaders).set === 'function') {
                (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
            } else {
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Token inválido o expirado, limpiando autenticación');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
            console.warn('Error de conexión con el servidor, manteniendo autenticación');
        }
        return Promise.reject(error);
    }
);

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    equipoId?: string | null;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: AppUser;
    token: string;
}

export const authApi = {
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },
};

export default api;
