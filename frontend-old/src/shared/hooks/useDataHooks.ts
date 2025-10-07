import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    UseMutationOptions
} from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../services/queryClient';
import { apiService, Work, Report, WorkVersion, ApiError } from '../services/apiService';
import { getSyncService } from '../services/syncService';
import { CachedWork, CachedReport } from '../services/dexieDb';

// Helper functions para convertir entre tipos API y tipos cached
const workToCache = (work: Partial<Work>): Partial<CachedWork> => ({
    ...work,
    status: work.status === 'in-progress' ? 'in_progress' : (work.status as 'draft' | 'completed' | 'archived' | undefined),
} as Partial<CachedWork>);

const reportToCache = (report: Partial<Report>): Partial<CachedReport> => ({
    ...report,
    // Mapear tipos de reporte si es necesario
    type: (() => {
        switch (report.type) {
            case 'monthly': return 'ingresos' as const;
            case 'weekly': return 'egresos' as const;
            case 'daily': return 'miAdmin' as const;
            case 'custom': return 'miAdminSimple' as const;
            default: return 'auxiliar' as const;
        }
    })(),
} as Partial<CachedReport>);

// --- WORK HOOKS ---

/**
 * Hook para obtener lista de trabajos con paginación y filtros
 */
export const useWorks = (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    enabled?: boolean;
}) => {
    return useQuery({
        queryKey: params?.userId
            ? queryKeys.worksByUser(params.userId)
            : params?.status
                ? queryKeys.worksByStatus(params.status)
                : queryKeys.works,
        queryFn: () => apiService.getWorks(params),
        ...queryOptions.user,
        enabled: params?.enabled ?? true,
    });
};

/**
 * Hook para obtener un trabajo específico por ID
 */
export const useWork = (
    id: string,
    options?: Omit<UseQueryOptions<Work, ApiError>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.work(id),
        queryFn: () => apiService.getWork(id).then(response => response.data),
        ...queryOptions.activeWork,
        ...options,
        enabled: !!id && (options?.enabled ?? true),
    });
};

/**
 * Hook para crear un nuevo trabajo
 */
export const useCreateWork = (
    options?: UseMutationOptions<Work, ApiError, Partial<Work>>
) => {
    const queryClient = useQueryClient();
    const syncService = getSyncService();

    return useMutation({
        mutationFn: async (workData: Partial<Work>) => {
            // Usar optimistic update guardando localmente primero
            const localId = await syncService.saveWorkLocal(workToCache(workData));

            try {
                // Intentar sincronizar inmediatamente si está online
                const result = await syncService.syncPendingChanges();
                if (result.success && result.synced > 0) {
                    // Si se sincronizó exitosamente, devolver los datos del servidor
                    const response = await apiService.getWork(localId);
                    return response.data;
                } else {
                    // Si no se pudo sincronizar, devolver los datos locales
                    return { ...workData, id: localId } as Work;
                }
            } catch (error) {
                // En caso de error, los datos quedan guardados localmente
                console.warn('Failed to sync work, saved locally:', error);
                return { ...workData, id: localId } as Work;
            }
        },
        onSuccess: (data) => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: queryKeys.works });
            queryClient.setQueryData(queryKeys.work(data.id), data);
        },
        ...options,
    });
};

/**
 * Hook para actualizar un trabajo existente
 */
export const useUpdateWork = (
    options?: UseMutationOptions<Work, ApiError, { id: string; data: Partial<Work> }>
) => {
    const queryClient = useQueryClient();
    const syncService = getSyncService();

    return useMutation({
        mutationFn: async ({ id, data: workData }) => {
            // Optimistic update: actualizar cache inmediatamente
            const previousData = queryClient.getQueryData<Work>(queryKeys.work(id));
            const optimisticData = { ...previousData, ...workData } as Work;

            queryClient.setQueryData(queryKeys.work(id), optimisticData);

            // Guardar localmente para sync
            await syncService.saveWorkLocal(workToCache({ id, ...workData }));

            try {
                const result = await syncService.syncPendingChanges();
                if (result.success && result.synced > 0) {
                    const response = await apiService.getWork(id);
                    return response.data;
                } else {
                    return optimisticData;
                }
            } catch (error) {
                console.warn('Failed to sync work update, saved locally:', error);
                return optimisticData;
            }
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.work(data.id), data);
            queryClient.invalidateQueries({ queryKey: queryKeys.works });
        },
        onError: (_, { id }) => {
            // Revertir optimistic update en caso de error crítico
            queryClient.invalidateQueries({ queryKey: queryKeys.work(id) });
        },
        ...options,
    });
};

/**
 * Hook para eliminar un trabajo
 */
export const useDeleteWork = (
    options?: UseMutationOptions<void, ApiError, string>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiService.deleteWork(id).then(response => response.data),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.work(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.works });
            // También eliminar reportes relacionados
            queryClient.removeQueries({ queryKey: queryKeys.reportsByWork(id) });
        },
        ...options,
    });
};

// --- REPORT HOOKS ---

/**
 * Hook para obtener reportes, opcionalmente filtrados por trabajo
 */
export const useReports = (
    workId?: string,
    options?: Omit<UseQueryOptions<Report[], ApiError>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: workId ? queryKeys.reportsByWork(workId) : queryKeys.reports,
        queryFn: () => apiService.getReports(workId).then(response => response.data),
        ...queryOptions.activeWork,
        ...options,
    });
};

/**
 * Hook para obtener un reporte específico
 */
export const useReport = (
    id: string,
    options?: Omit<UseQueryOptions<Report, ApiError>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.report(id),
        queryFn: () => apiService.getReport(id).then(response => response.data),
        ...queryOptions.activeWork,
        ...options,
        enabled: !!id && (options?.enabled ?? true),
    });
};

/**
 * Hook para crear un nuevo reporte
 */
export const useCreateReport = (
    options?: UseMutationOptions<Report, ApiError, { workId: string; data: Partial<Report> }>
) => {
    const queryClient = useQueryClient();
    const syncService = getSyncService();

    return useMutation({
        mutationFn: async ({ workId, data: reportData }) => {
            // Guardar localmente primero
            const localId = await syncService.saveReportLocal(reportToCache({ workId, ...reportData }));

            try {
                const result = await syncService.syncPendingChanges();
                if (result.success && result.synced > 0) {
                    const response = await apiService.getReport(localId);
                    return response.data;
                } else {
                    return { ...reportData, id: localId, workId } as Report;
                }
            } catch (error) {
                console.warn('Failed to sync report, saved locally:', error);
                return { ...reportData, id: localId, workId } as Report;
            }
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.report(data.id), data);
            queryClient.invalidateQueries({ queryKey: queryKeys.reportsByWork(data.workId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.reports });
        },
        ...options,
    });
};

/**
 * Hook para actualizar un reporte
 */
export const useUpdateReport = (
    options?: UseMutationOptions<Report, ApiError, { id: string; data: Partial<Report> }>
) => {
    const queryClient = useQueryClient();
    const syncService = getSyncService();

    return useMutation({
        mutationFn: async ({ id, data: reportData }) => {
            // Optimistic update
            const previousData = queryClient.getQueryData<Report>(queryKeys.report(id));
            const optimisticData = { ...previousData, ...reportData } as Report;

            queryClient.setQueryData(queryKeys.report(id), optimisticData);

            // Guardar localmente
            await syncService.saveReportLocal(reportToCache({ id, ...reportData }));

            try {
                const result = await syncService.syncPendingChanges();
                if (result.success && result.synced > 0) {
                    const response = await apiService.getReport(id);
                    return response.data;
                } else {
                    return optimisticData;
                }
            } catch (error) {
                console.warn('Failed to sync report update, saved locally:', error);
                return optimisticData;
            }
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.report(data.id), data);
            if (data.workId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.reportsByWork(data.workId) });
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.reports });
        },
        onError: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
        },
        ...options,
    });
};

/**
 * Hook para eliminar un reporte
 */
export const useDeleteReport = (
    options?: UseMutationOptions<void, ApiError, string>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiService.deleteReport(id).then(response => response.data),
        onSuccess: (_, id) => {
            // Obtener el reporte antes de eliminarlo para invalidar queries relacionadas
            const reportData = queryClient.getQueryData<Report>(queryKeys.report(id));

            queryClient.removeQueries({ queryKey: queryKeys.report(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.reports });

            if (reportData?.workId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.reportsByWork(reportData.workId) });
            }
        },
        ...options,
    });
};

// --- VERSION HOOKS ---

/**
 * Hook para obtener versiones de un trabajo
 */
export const useWorkVersions = (
    workId: string,
    options?: Omit<UseQueryOptions<WorkVersion[], ApiError>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.versionsByWork(workId),
        queryFn: () => apiService.getWorkVersions(workId).then(response => response.data),
        ...queryOptions.static,
        ...options,
        enabled: !!workId && (options?.enabled ?? true),
    });
};

/**
 * Hook para crear un snapshot/versión de un trabajo
 */
export const useCreateWorkSnapshot = (
    options?: UseMutationOptions<WorkVersion, ApiError, { workId: string; description?: string }>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ workId, description }) =>
            apiService.createWorkSnapshot(workId, description).then(response => response.data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.versionsByWork(data.workId) });
        },
        ...options,
    });
};

/**
 * Hook para restaurar una versión de un trabajo
 */
export const useRestoreWorkVersion = (
    options?: UseMutationOptions<Work, ApiError, { workId: string; versionId: string }>
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ workId, versionId }) =>
            apiService.restoreWorkVersion(workId, versionId).then(response => response.data),
        onSuccess: (data) => {
            // Invalidar todas las queries relacionadas al trabajo
            queryClient.setQueryData(queryKeys.work(data.id), data);
            queryClient.invalidateQueries({ queryKey: queryKeys.works });
            queryClient.invalidateQueries({ queryKey: queryKeys.reportsByWork(data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.versionsByWork(data.id) });
        },
        ...options,
    });
};

// --- SYNC STATUS HOOKS ---

/**
 * Hook para obtener el estado de sincronización
 */
export const useSyncStatus = () => {
    const syncService = getSyncService();

    return useQuery({
        queryKey: queryKeys.syncStatus,
        queryFn: async () => {
            const [serverStatus, pendingCount] = await Promise.all([
                apiService.getSyncStatus().then(response => response.data),
                syncService.getPendingSyncCount(),
            ]);

            return {
                ...serverStatus,
                pendingLocal: pendingCount,
                isOnline: syncService.getConnectionStatus(),
            };
        },
        ...queryOptions.realtime,
        refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
    });
};

/**
 * Hook para forzar sincronización manual
 */
export const useForcSync = () => {
    const queryClient = useQueryClient();
    const syncService = getSyncService();

    return useMutation({
        mutationFn: () => syncService.forceSyncNow(),
        onSuccess: () => {
            // Invalidar todas las queries después de sincronizar
            queryClient.invalidateQueries();
        },
    });
};