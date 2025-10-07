// API Service para comunicación con el backend
export interface ApiConfig {
    baseUrl: string;
    timeout?: number;
}

export interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    message?: string;
    success: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
    details?: Record<string, unknown>;
}

class ApiService {
    private config: ApiConfig;

    constructor(config: ApiConfig) {
        this.config = {
            timeout: 10000,
            ...config,
        };
    }

    private getAuthToken(): string {
        return localStorage.getItem('authToken') || '';
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                ...options.headers,
            },
            ...options,
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const apiError: ApiError = {
                    message: errorData?.message || `HTTP ${response.status}`,
                    statusCode: response.status,
                    code: errorData?.code,
                    details: errorData?.details,
                };
                throw apiError;
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    private async makePaginatedRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<PaginatedResponse<T>> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                ...options.headers,
            },
            ...options,
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const apiError: ApiError = {
                    message: errorData?.message || `HTTP ${response.status}`,
                    statusCode: response.status,
                    code: errorData?.code,
                    details: errorData?.details,
                };
                throw apiError;
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Métodos HTTP básicos
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, { method: 'DELETE' });
    }

    // Métodos específicos para la aplicación

    // --- WORKS / TRABAJOS ---
    async getWorks(params?: {
        page?: number;
        limit?: number;
        status?: string;
        userId?: string;
    }): Promise<PaginatedResponse<Work>> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.status) searchParams.set('status', params.status);
        if (params?.userId) searchParams.set('userId', params.userId);

        const query = searchParams.toString();
        return this.makePaginatedRequest<Work>(`/works${query ? `?${query}` : ''}`, { method: 'GET' });
    }

    async getWork(id: string): Promise<ApiResponse<Work>> {
        return this.get<Work>(`/works/${id}`);
    }

    async createWork(work: Partial<Work>): Promise<ApiResponse<Work>> {
        return this.post<Work>('/works', work);
    }

    async updateWork(id: string, work: Partial<Work>): Promise<ApiResponse<Work>> {
        return this.put<Work>(`/works/${id}`, work);
    }

    async deleteWork(id: string): Promise<ApiResponse<void>> {
        return this.delete<void>(`/works/${id}`);
    }

    // --- REPORTS / REPORTES ---
    async getReports(workId?: string): Promise<PaginatedResponse<Report>> {
        const endpoint = workId ? `/works/${workId}/reports` : '/reports';
        return this.makePaginatedRequest<Report>(endpoint, { method: 'GET' });
    }

    async getReport(id: string): Promise<ApiResponse<Report>> {
        return this.get<Report>(`/reports/${id}`);
    }

    async createReport(workId: string, report: Partial<Report>): Promise<ApiResponse<Report>> {
        return this.post<Report>(`/works/${workId}/reports`, report);
    }

    async updateReport(id: string, report: Partial<Report>): Promise<ApiResponse<Report>> {
        return this.put<Report>(`/reports/${id}`, report);
    }

    async deleteReport(id: string): Promise<ApiResponse<void>> {
        return this.delete<void>(`/reports/${id}`);
    }

    // --- VERSIONS / VERSIONES ---
    async getWorkVersions(workId: string): Promise<ApiResponse<WorkVersion[]>> {
        return this.get<WorkVersion[]>(`/works/${workId}/versions`);
    }

    async createWorkSnapshot(workId: string, description?: string): Promise<ApiResponse<WorkVersion>> {
        return this.post<WorkVersion>(`/works/${workId}/snapshot`, { description });
    }

    async restoreWorkVersion(workId: string, versionId: string): Promise<ApiResponse<Work>> {
        return this.post<Work>(`/works/${workId}/restore/${versionId}`);
    }

    // --- SYNC / SINCRONIZACIÓN ---
    async getSyncStatus(): Promise<ApiResponse<{ pending: number; lastSync: string }>> {
        return this.get<{ pending: number; lastSync: string }>('/sync/status');
    }
}

// Tipos para las entidades
export interface Work {
    id: string;
    userId: string;
    name: string;
    description?: string;
    status: 'draft' | 'in-progress' | 'completed' | 'archived';
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
    version: number;
}

export interface Report {
    id: string;
    workId: string;
    type: 'monthly' | 'weekly' | 'daily' | 'custom';
    name: string;
    description?: string;
    status: 'draft' | 'generated' | 'exported';
    data: Record<string, unknown>;
    calculatedColumns?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    exportedAt?: Date;
}

export interface WorkVersion {
    id: string;
    workId: string;
    version: number;
    description?: string;
    snapshot: {
        work: Work;
        reports: Report[];
    };
    createdAt: Date;
}

// Singleton instance
const apiService = new ApiService({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

export { apiService };
export default apiService;