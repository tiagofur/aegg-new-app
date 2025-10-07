import { QueryClient } from '@tanstack/react-query';

// Configuración optimizada para la aplicación
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache por 5 minutos por defecto
            staleTime: 5 * 60 * 1000,

            // Mantener datos en cache por 10 minutos después de que ya no se usen (gcTime en v4+)
            gcTime: 10 * 60 * 1000,

            // Reintentos automáticos en caso de error
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Revalidar cuando la ventana recupera el foco
            refetchOnWindowFocus: true,

            // Revalidar cuando se reconecta a internet
            refetchOnReconnect: true,

            // No revalidar cuando se monta el componente (usar cache)
            refetchOnMount: false,
        },
        mutations: {
            // Reintentos para mutaciones críticas
            retry: 2,
            retryDelay: 1000,
        },
    },
});

// Query keys para consistencia en toda la aplicación
export const queryKeys = {
    // Trabajos (works)
    works: ['works'] as const,
    work: (id: string) => ['works', id] as const,
    worksByUser: (userId: string) => ['works', 'by-user', userId] as const,
    worksByStatus: (status: string) => ['works', 'by-status', status] as const,

    // Reportes
    reports: ['reports'] as const,
    report: (id: string) => ['reports', id] as const,
    reportsByWork: (workId: string) => ['reports', 'by-work', workId] as const,
    reportsByType: (workId: string, type: string) => ['reports', 'by-work', workId, 'type', type] as const,

    // Versiones
    versions: ['versions'] as const,
    versionsByWork: (workId: string) => ['versions', 'by-work', workId] as const,

    // Estado de sincronización
    syncStatus: ['sync-status'] as const,
    pendingSync: ['pending-sync'] as const,
} as const;

// Tipos para Query Keys (ayuda con TypeScript)
export type QueryKeys = typeof queryKeys;
export type WorkQueryKey = ReturnType<typeof queryKeys.work>;
export type ReportQueryKey = ReturnType<typeof queryKeys.report>;

// Configuración específica para diferentes tipos de consultas
export const queryOptions = {
    // Consultas que raramente cambian
    static: {
        staleTime: 30 * 60 * 1000, // 30 minutos
        gcTime: 60 * 60 * 1000, // 1 hora
    },

    // Datos que cambian frecuentemente  
    realtime: {
        staleTime: 30 * 1000, // 30 segundos
        gcTime: 2 * 60 * 1000, // 2 minutos
        refetchInterval: 60 * 1000, // Revalidar cada minuto
    },

    // Datos críticos del usuario
    user: {
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 15 * 60 * 1000, // 15 minutos
        refetchOnWindowFocus: true,
    },

    // Datos para trabajos en progreso
    activeWork: {
        staleTime: 10 * 1000, // 10 segundos
        gcTime: 60 * 1000, // 1 minuto
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
    },
} as const;