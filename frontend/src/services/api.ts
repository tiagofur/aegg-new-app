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
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Solo limpiar el token si es un 401 real del servidor (no error de conexión)
        if (error.response?.status === 401) {
            console.warn('Token inválido o expirado, limpiando autenticación');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir al login si no estamos ya ahí
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
            // Error de conexión - no limpiar el token
            console.warn('Error de conexión con el servidor, manteniendo autenticación');
        }
        return Promise.reject(error);
    }
);

export interface RegisterData {
    email: string;
    password: string;
    name: string;
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

// Interfaces para Trabajos
export interface Trabajo {
    id: string;
    nombre: string;
    mes?: string;
    descripcion?: string;
    estado: string; // 'activo', 'archivado', 'completado'
    createdAt: string;
    updatedAt: string;
    usuarioId: string;
    reportes?: Reporte[];
}

export interface CreateTrabajoDto {
    nombre: string;
    descripcion?: string;
    mes?: string; // formato: "2024-10-01"
}

export interface UpdateTrabajoDto {
    nombre?: string;
    descripcion?: string;
    mes?: string;
    estado?: string; // 'activo', 'archivado', 'completado'
}

// Interfaces para Reportes
export interface Reporte {
    id: string;
    trabajoId: string;
    tipoReporte: string;
    archivoOriginal?: string;
    metadata?: any;
    datosOriginales: any;
    datosModificados?: any;
    configuracion?: any;
    estado?: string;
    fechaImportacion: string;
    updatedAt: string;
}

export interface CreateReporteDto {
    tipoReporte: string;
    archivoOriginal?: string;
}

export interface UpdateReporteDto {
    datosModificados?: any;
    configuracion?: any;
    estado?: string;
}

export interface ImportExcelResponse {
    id: string;
    mensaje: string;
    detalles: {
        tipo: string;
        nombreArchivo: string;
        hojas?: string[];
        totalFilas?: number;
        totalColumnas?: number;
    };
}

// API de Trabajos
export const trabajosApi = {
    getAll: async (): Promise<Trabajo[]> => {
        const response = await api.get<Trabajo[]>('/trabajos');
        return response.data;
    },

    getById: async (id: string): Promise<Trabajo> => {
        const response = await api.get<Trabajo>(`/trabajos/${id}`);
        return response.data;
    },

    create: async (data: CreateTrabajoDto): Promise<Trabajo> => {
        const response = await api.post<Trabajo>('/trabajos', data);
        return response.data;
    },

    update: async (id: string, data: UpdateTrabajoDto): Promise<Trabajo> => {
        const response = await api.patch<Trabajo>(`/trabajos/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/trabajos/${id}`);
    },

    duplicate: async (id: string): Promise<Trabajo> => {
        const response = await api.post<Trabajo>(`/trabajos/${id}/duplicar`);
        return response.data;
    },
};

// API de Reportes
export const reportesApi = {
    getAll: async (trabajoId: string): Promise<Reporte[]> => {
        const response = await api.get<Reporte[]>(`/trabajos/${trabajoId}/reportes`);
        return response.data;
    },

    getById: async (trabajoId: string, reporteId: string): Promise<Reporte> => {
        const response = await api.get<Reporte>(`/trabajos/${trabajoId}/reportes/${reporteId}`);
        return response.data;
    },

    create: async (trabajoId: string, data: CreateReporteDto): Promise<Reporte> => {
        const response = await api.post<Reporte>(`/trabajos/${trabajoId}/reportes`, data);
        return response.data;
    },

    update: async (trabajoId: string, reporteId: string, data: UpdateReporteDto): Promise<Reporte> => {
        const response = await api.patch<Reporte>(`/trabajos/${trabajoId}/reportes/${reporteId}`, data);
        return response.data;
    },

    delete: async (trabajoId: string, reporteId: string): Promise<void> => {
        await api.delete(`/trabajos/${trabajoId}/reportes/${reporteId}`);
    },

    importExcel: async (trabajoId: string, reporteId: string, file: File): Promise<ImportExcelResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<ImportExcelResponse>(
            `/trabajos/${trabajoId}/reportes/${reporteId}/importar-excel`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    getDatos: async (trabajoId: string, reporteId: string, params?: {
        hoja?: string;
        pagina?: number;
        limite?: number;
    }) => {
        const response = await api.get(`/trabajos/${trabajoId}/reportes/${reporteId}/datos`, { params });
        return response.data;
    },

    getHojas: async (trabajoId: string, reporteId: string) => {
        const response = await api.get(`/trabajos/${trabajoId}/reportes/${reporteId}/hojas`);
        return response.data;
    },

    getEstadisticas: async (trabajoId: string, reporteId: string, hoja?: string) => {
        const response = await api.get(`/trabajos/${trabajoId}/reportes/${reporteId}/estadisticas`, {
            params: { hoja }
        });
        return response.data;
    },
};

export default api;
