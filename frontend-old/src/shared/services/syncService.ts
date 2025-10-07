import { io, Socket } from 'socket.io-client';
import { db, CachedWork, CachedReport } from './dexieDb';

export interface SyncOptions {
    apiUrl: string;
    autoSyncInterval?: number; // milliseconds
    maxRetries?: number;
    retryDelay?: number; // milliseconds
}

export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

export interface ApiResponse {
    data: Record<string, unknown>;
    message?: string;
}

export interface RemoteUpdateData {
    entityType: string;
    entityId: string;
    serverData: Record<string, unknown>;
}

export interface ConflictData {
    entityType: string;
    entityId: string;
    localData: Record<string, unknown>;
    serverData: Record<string, unknown>;
}

export interface SyncItem {
    id?: string;
    entityType: 'work' | 'report';
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
    timestamp: Date;
    retries: number;
    lastError?: string;
}

export type SyncEventType =
    | 'sync:started'
    | 'sync:completed'
    | 'sync:error'
    | 'work:synced'
    | 'conflict:detected'
    | 'connection:online'
    | 'connection:offline';

export interface SyncEvent {
    type: SyncEventType;
    data?: unknown;
    timestamp: Date;
}

export class SyncService {
    private socket: Socket;
    private isOnline: boolean = navigator.onLine;
    private syncInProgress: boolean = false;
    private autoSyncTimer?: NodeJS.Timeout;
    private eventListeners: Map<SyncEventType, Array<(event: SyncEvent) => void>> = new Map();

    constructor(private options: SyncOptions) {
        this.socket = io(options.apiUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.initializeEventListeners();
        this.startAutoSync();
    }

    private initializeEventListeners(): void {
        // Network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit('connection:online', { status: 'online' });
            this.syncPendingChanges();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit('connection:offline', { status: 'offline' });
        });

        // Socket events
        this.socket.on('connect', () => {
            console.log('Connected to sync server');
            this.isOnline = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from sync server');
        });

        this.socket.on('work:updated', (data) => {
            this.handleRemoteUpdate(data);
        });

        this.socket.on('conflict:detected', (data) => {
            this.handleConflict(data);
            this.emit('conflict:detected', data);
        });
    }

    private startAutoSync(): void {
        if (this.options.autoSyncInterval) {
            this.autoSyncTimer = setInterval(() => {
                if (this.isOnline && !this.syncInProgress) {
                    this.syncPendingChanges();
                }
            }, this.options.autoSyncInterval);
        }
    }

    // Event emitter methods
    public on(eventType: SyncEventType, callback: (event: SyncEvent) => void): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType)!.push(callback);
    }

    public off(eventType: SyncEventType, callback: (event: SyncEvent) => void): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(eventType: SyncEventType, data?: unknown): void {
        const event: SyncEvent = {
            type: eventType,
            data,
            timestamp: new Date()
        };

        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => callback(event));
        }
    }

    // Main sync methods
    public async saveWorkLocal(work: Partial<CachedWork>): Promise<string> {
        try {
            const timestamp = new Date();

            const workToSave: CachedWork = {
                ...work as CachedWork,
                syncStatus: 'pending',
                updatedAt: timestamp,
                localChanges: [
                    ...(work.localChanges || []),
                    { timestamp, changes: work }
                ]
            };

            const id = await db.works.put(workToSave);

            // Add to sync queue
            await db.pendingSync.add({
                entityType: 'work',
                entityId: String(id),
                operation: work.id ? 'update' : 'create',
                data: workToSave as unknown as Record<string, unknown>,
                timestamp,
                retries: 0
            });

            // Try to sync immediately if online
            if (this.isOnline) {
                // Don't await to avoid blocking UI
                this.syncPendingChanges().catch(console.error);
            }

            return String(id);
        } catch (error) {
            console.error('Error saving work locally:', error);
            throw error;
        }
    }

    public async saveReportLocal(report: Partial<CachedReport>): Promise<string> {
        try {
            const timestamp = new Date();

            const reportToSave: CachedReport = {
                ...report as CachedReport,
                syncStatus: 'pending',
                updatedAt: timestamp
            };

            const id = await db.reports.put(reportToSave);

            // Add to sync queue
            await db.pendingSync.add({
                entityType: 'report',
                entityId: String(id),
                operation: report.id ? 'update' : 'create',
                data: reportToSave as unknown as Record<string, unknown>,
                timestamp,
                retries: 0
            });

            // Try to sync immediately if online
            if (this.isOnline) {
                this.syncPendingChanges().catch(console.error);
            }

            return String(id);
        } catch (error) {
            console.error('Error saving report locally:', error);
            throw error;
        }
    }

    public async syncPendingChanges(): Promise<SyncResult> {
        if (this.syncInProgress || !this.isOnline) {
            return { success: false, synced: 0, failed: 0, errors: ['Sync in progress or offline'] };
        }

        this.syncInProgress = true;
        this.emit('sync:started');

        const result: SyncResult = {
            success: true,
            synced: 0,
            failed: 0,
            errors: []
        };

        try {
            const pendingItems = await db.pendingSync
                .where('retries')
                .below(this.options.maxRetries || 3)
                .filter(item => item.entityType === 'work' || item.entityType === 'report')
                .toArray();

            for (const item of pendingItems) {
                try {
                    await this.syncSingleItem(item as SyncItem);
                    await db.pendingSync.delete(item.id!);
                    result.synced++;

                    this.emit('work:synced', {
                        entityType: item.entityType,
                        entityId: item.entityId
                    });

                } catch (error) {
                    console.error(`Failed to sync ${item.entityType} ${item.entityId}:`, error);

                    // Increment retry count
                    await db.pendingSync.update(item.id!, {
                        retries: item.retries + 1,
                        lastError: error instanceof Error ? error.message : 'Unknown error'
                    });

                    result.failed++;
                    result.errors.push(`${item.entityType}:${item.entityId} - ${error}`);
                }
            }

            this.emit('sync:completed', result);

        } catch (error) {
            console.error('Sync error:', error);
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
            this.emit('sync:error', { error });
        } finally {
            this.syncInProgress = false;
        }

        return result;
    }

    private async syncSingleItem(item: SyncItem): Promise<void> {
        const { entityType, operation, data } = item;

        switch (entityType) {
            case 'work':
                await this.syncWork(data as unknown as CachedWork, operation);
                break;
            case 'report':
                await this.syncReport(data as unknown as CachedReport, operation);
                break;
            default:
                throw new Error(`Unknown entity type: ${entityType}`);
        }
    }

    private async syncWork(work: CachedWork, operation: string): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { localChanges, syncStatus, lastSyncAt, ...workData } = work;

            let response;

            if (operation === 'create') {
                response = await this.apiCall('POST', '/works', workData);
            } else {
                response = await this.apiCall('PUT', `/works/${work.id}`, workData);
            }

            // Update local record with server data
            await db.works.update(work.id!, {
                ...response.data,
                syncStatus: 'synced',
                lastSyncAt: new Date(),
                localChanges: []
            });

        } catch (error) {
            // Mark as error for retry
            await db.works.update(work.id!, {
                syncStatus: 'error'
            });
            throw error;
        }
    }

    private async syncReport(report: CachedReport, operation: string): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { syncStatus, lastSyncAt, ...reportData } = report;

            let response;

            if (operation === 'create') {
                response = await this.apiCall('POST', '/reports', reportData);
            } else {
                response = await this.apiCall('PUT', `/reports/${report.id}`, reportData);
            }

            // Update local record
            await db.reports.update(report.id!, {
                ...response.data,
                syncStatus: 'synced',
                lastSyncAt: new Date()
            });

        } catch (error) {
            await db.reports.update(report.id!, {
                syncStatus: 'error'
            });
            throw error;
        }
    }

    private async apiCall(method: string, endpoint: string, data?: unknown): Promise<ApiResponse> {
        const response = await fetch(`${this.options.apiUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP ${response.status}`);
        }

        return response.json() as Promise<ApiResponse>;
    }

    private getAuthToken(): string {
        // Get token from localStorage or context
        return localStorage.getItem('authToken') || '';
    }

    private async handleRemoteUpdate(data: RemoteUpdateData): Promise<void> {
        try {
            const { entityType, entityId, serverData } = data;

            if (entityType === 'work') {
                const localWork = await db.works.get(entityId);

                if (!localWork || localWork.syncStatus === 'synced') {
                    // No local changes, safe to update
                    await db.works.put({
                        ...serverData,
                        syncStatus: 'synced',
                        lastSyncAt: new Date()
                    } as CachedWork);
                } else {
                    // Local changes detected, mark as conflict
                    await db.works.update(entityId, {
                        syncStatus: 'conflict'
                    });

                    this.emit('conflict:detected', {
                        entityType,
                        entityId,
                        localData: localWork as unknown as Record<string, unknown>,
                        serverData
                    });
                }
            }
        } catch (error) {
            console.error('Error handling remote update:', error);
        }
    }

    private async handleConflict(data: ConflictData): Promise<void> {
        // For now, just log conflicts
        // In the future, implement conflict resolution UI
        console.log('Conflict detected:', data);
    }

    // Utility methods
    public getConnectionStatus(): boolean {
        return this.isOnline && this.socket.connected;
    }

    public async getPendingSyncCount(): Promise<number> {
        return await db.pendingSync.count();
    }

    public async forceSyncNow(): Promise<SyncResult> {
        return await this.syncPendingChanges();
    }

    public destroy(): void {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }

        this.socket.disconnect();
        this.eventListeners.clear();

        // Remove event listeners
        window.removeEventListener('online', () => { });
        window.removeEventListener('offline', () => { });
    }
}

// Factory function for creating sync service
export const createSyncService = (options: SyncOptions): SyncService => {
    return new SyncService(options);
};

// Singleton instance (optional)
let syncServiceInstance: SyncService | null = null;

export const getSyncService = (options?: SyncOptions): SyncService => {
    if (!syncServiceInstance && options) {
        syncServiceInstance = new SyncService(options);
    }

    if (!syncServiceInstance) {
        throw new Error('Sync service not initialized. Provide options on first call.');
    }

    return syncServiceInstance;
};