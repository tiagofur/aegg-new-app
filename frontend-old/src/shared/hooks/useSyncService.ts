import { useEffect, useRef, useState } from 'react';
import { getSyncService, createSyncService, SyncService } from '../services/syncService';

interface UseSyncServiceOptions {
    apiUrl?: string;
    autoSyncInterval?: number;
    autoStart?: boolean;
}

interface SyncServiceState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSync?: Date;
    error?: string;
}

export const useSyncService = (options?: UseSyncServiceOptions) => {
    const syncServiceRef = useRef<SyncService | null>(null);
    const [state, setState] = useState<SyncServiceState>({
        isOnline: navigator.onLine,
        isSyncing: false,
        pendingCount: 0,
    });

    // Inicializar el servicio de sincronización
    useEffect(() => {
        const initSyncService = async () => {
            try {
                // Configuración por defecto
                const config = {
                    apiUrl: options?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
                    autoSyncInterval: options?.autoSyncInterval || 30000, // 30 segundos
                    maxRetries: 3,
                    retryDelay: 1000,
                };

                console.log('Inicializando SyncService con config:', config);

                // Crear o obtener el servicio singleton
                let syncService: SyncService;
                try {
                    syncService = getSyncService();
                } catch {
                    syncService = createSyncService(config);
                }

                syncServiceRef.current = syncService;

                // Configurar event listeners
                const setupEventListeners = () => {
                    // Eventos de conexión
                    syncService.on('connection:online', () => {
                        setState(prev => ({ ...prev, isOnline: true, error: undefined }));
                    });

                    syncService.on('connection:offline', () => {
                        setState(prev => ({ ...prev, isOnline: false }));
                    });

                    // Eventos de sincronización
                    syncService.on('sync:started', () => {
                        setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
                    });

                    syncService.on('sync:completed', (event) => {
                        setState(prev => ({
                            ...prev,
                            isSyncing: false,
                            lastSync: event.timestamp,
                            error: undefined
                        }));
                        updatePendingCount();
                    });

                    syncService.on('sync:error', (event) => {
                        const errorData = event.data as { error?: { message?: string } };
                        setState(prev => ({
                            ...prev,
                            isSyncing: false,
                            error: errorData?.error?.message || 'Error de sincronización'
                        }));
                    });

                    // Eventos de trabajo sincronizado
                    syncService.on('work:synced', () => {
                        updatePendingCount();
                    });

                    // Eventos de conflicto
                    syncService.on('conflict:detected', (event) => {
                        console.warn('Conflicto detectado:', event.data);
                        // TODO: Mostrar notificación al usuario sobre el conflicto
                    });
                };

                const updatePendingCount = async () => {
                    try {
                        const count = await syncService.getPendingSyncCount();
                        setState(prev => ({ ...prev, pendingCount: count }));
                    } catch (error) {
                        console.error('Error obteniendo pending count:', error);
                    }
                };

                setupEventListeners();

                // Estado inicial
                const isOnline = syncService.getConnectionStatus();
                setState(prev => ({ ...prev, isOnline }));

                // Contar pendientes iniciales
                updatePendingCount();

                console.log('SyncService inicializado correctamente');

            } catch (error) {
                console.error('Error inicializando SyncService:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Error inicializando servicio de sincronización'
                }));
            }
        };

        if (options?.autoStart !== false) {
            initSyncService();
        }

        // Cleanup al desmontar
        return () => {
            if (syncServiceRef.current) {
                // No destruir el servicio ya que es singleton, solo limpiar listeners locales
                console.log('Limpiando listeners del SyncService');
            }
        };
    }, [options?.apiUrl, options?.autoSyncInterval, options?.autoStart]);

    // Métodos para interactuar con el servicio
    const forceSync = async () => {
        if (!syncServiceRef.current) {
            throw new Error('SyncService no está inicializado');
        }

        try {
            setState(prev => ({ ...prev, isSyncing: true, error: undefined }));
            const result = await syncServiceRef.current.forceSyncNow();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    isSyncing: false,
                    lastSync: new Date(),
                    pendingCount: 0
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    isSyncing: false,
                    error: `Errores en sync: ${result.errors.join(', ')}`
                }));
            }

            return result;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isSyncing: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }));
            throw error;
        }
    };

    const getSyncServiceInstance = () => {
        if (!syncServiceRef.current) {
            throw new Error('SyncService no está inicializado');
        }
        return syncServiceRef.current;
    };

    return {
        syncService: syncServiceRef.current,
        state,
        forceSync,
        getSyncServiceInstance,
        isInitialized: syncServiceRef.current !== null,
    };
};

export default useSyncService;