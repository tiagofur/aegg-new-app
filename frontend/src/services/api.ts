import axios from 'axios';

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
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
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
    user: {
        id: string;
        email: string;
        name: string;
    };
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
    descripcion?: string;
    estado: 'borrador' | 'en_progreso' | 'completado' | 'archivado';
    fechaCreacion: string;
    fechaActualizacion: string;
    userId: string;
    reportes?: Reporte[];
}

export interface CreateTrabajoDto {
    nombre: string;
    descripcion?: string;
}

export interface UpdateTrabajoDto {
    nombre?: string;
    descripcion?: string;
    estado?: 'borrador' | 'en_progreso' | 'completado' | 'archivado';
}

// Interfaces para Reportes
export interface Reporte {
    id: string;
    trabajoId: string;
    tipo: 'mensual' | 'balance' | 'ingresos' | 'gastos' | 'flujo' | 'proyecciones' | 'comparativo' | 'consolidado' | 'personalizado';
    nombre: string;
    descripcion?: string;
    nombreArchivoOriginal?: string;
    datosOriginales: any;
    datosModificados?: any;
    metadata?: any;
    configuracion?: any;
    fechaCreacion: string;
    fechaActualizacion: string;
}

export interface CreateReporteDto {
    tipo: Reporte['tipo'];
    nombre: string;
    descripcion?: string;
}

export interface UpdateReporteDto {
    nombre?: string;
    descripcion?: string;
    datosModificados?: any;
    configuracion?: any;
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
