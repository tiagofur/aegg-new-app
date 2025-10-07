import Dexie, { Table } from 'dexie';

// Tipos para IndexedDB
export interface CachedWork {
    id?: string;
    userId: string;
    name: string;
    description?: string;
    status: 'draft' | 'in_progress' | 'completed' | 'archived';
    lastAccessedAt: Date;
    reports: string[]; // IDs de reportes
    metadata: {
        version: string;
        totalReports: number;
        completedReports: number;
        totalRows: number;
        size: number;
    };
    settings: {
        autoSave: boolean;
        autoSaveInterval: number;
        sharePermissions: string;
    };
    tags: string[];

    // Campos de sincronización
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
    lastSyncAt?: Date;
    localChanges?: Record<string, unknown>[];

    createdAt: Date;
    updatedAt: Date;
}

export interface CachedReport {
    id?: string;
    workId: string;
    type: 'ingresos' | 'egresos' | 'miAdmin' | 'miAdminSimple' | 'auxiliar';
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    period: {
        year: number;
        month: number;
        startDate?: Date;
        endDate?: Date;
    };
    data: {
        rows: Record<string, unknown>[];
        calculations: Record<string, unknown>[];
        comparisons: Record<string, unknown>[];
        customColumns: Record<string, unknown>[];
        totals: Record<string, unknown>[];
        filters: Record<string, unknown>[];
        sorting: Record<string, unknown>[];
    };

    // Campos de sincronización
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
    lastSyncAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export interface WorkVersion {
    id?: string;
    workId: string;
    versionNumber: number;
    type: 'auto' | 'manual' | 'milestone' | 'system';
    label?: string;
    description?: string;
    createdBy: string;
    snapshot: {
        data: Record<string, unknown>;
        checksum: string;
        size: number;
        compressed: boolean;
        storageLocation: 'indexeddb' | 'mongodb' | 's3';
        performanceMetrics: {
            snapshotTime: number;
            compressionTime: number;
            storageTime: number;
        };
    };
    metadata: {
        reports: Record<string, unknown>[];
        totalChanges: number;
        deltaFromPrevious?: Record<string, unknown>;
    };
    tags?: string[];

    createdAt: Date;
}

export interface PendingSync {
    id?: string;
    entityType: 'work' | 'report' | 'version';
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
    timestamp: Date;
    retries: number;
    lastError?: string;
}

// Clase principal de la base de datos
class AEGGDatabase extends Dexie {
    works!: Table<CachedWork>;
    reports!: Table<CachedReport>;
    versions!: Table<WorkVersion>;
    pendingSync!: Table<PendingSync>;

    constructor() {
        super('AEGG_Database');

        this.version(1).stores({
            works: '++id, userId, status, syncStatus, createdAt, updatedAt, lastAccessedAt, *tags',
            reports: '++id, workId, type, status, syncStatus, createdAt, updatedAt, [period.year+period.month]',
            versions: '++id, workId, versionNumber, type, createdAt, *tags',
            pendingSync: '++id, entityType, entityId, operation, timestamp, retries'
        });

        // Hooks para auto-timestamps
        this.works.hook('creating', function (primKey, obj) {
            obj.createdAt = new Date();
            obj.updatedAt = new Date();
            if (!obj.lastAccessedAt) {
                obj.lastAccessedAt = new Date();
            }
        });

        this.works.hook('updating', function (modifications) {
            modifications.updatedAt = new Date();
            modifications.lastAccessedAt = new Date();
        });

        this.reports.hook('creating', function (primKey, obj) {
            obj.createdAt = new Date();
            obj.updatedAt = new Date();
        });

        this.reports.hook('updating', function (modifications) {
            modifications.updatedAt = new Date();
        });

        this.versions.hook('creating', function (primKey, obj) {
            obj.createdAt = new Date();
        });
    }

    // Método para limpiar datos antiguos
    async cleanOldData(daysToKeep: number = 7): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        try {
            // Limpiar trabajos antiguos que ya están sincronizados
            const deletedWorks = await this.works
                .where('lastAccessedAt')
                .below(cutoffDate)
                .and(item => item.syncStatus === 'synced')
                .delete();

            // Limpiar versiones automáticas antiguas (mantener milestones)
            const deletedVersions = await this.versions
                .where('createdAt')
                .below(cutoffDate)
                .and(item => item.type === 'auto')
                .delete();

            console.log(`Cleanup: ${deletedWorks} works, ${deletedVersions} versions deleted`);
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // Método para obtener estadísticas de uso
    async getStorageStats(): Promise<{
        works: number;
        reports: number;
        versions: number;
        pendingSync: number;
        totalSize: number;
    }> {
        try {
            const [worksCount, reportsCount, versionsCount, pendingSyncCount] = await Promise.all([
                this.works.count(),
                this.reports.count(),
                this.versions.count(),
                this.pendingSync.count()
            ]);

            // Estimar tamaño total (aproximado)
            const estimate = await navigator.storage?.estimate?.() || { usage: 0 };

            return {
                works: worksCount,
                reports: reportsCount,
                versions: versionsCount,
                pendingSync: pendingSyncCount,
                totalSize: estimate.usage || 0
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                works: 0,
                reports: 0,
                versions: 0,
                pendingSync: 0,
                totalSize: 0
            };
        }
    }

    // Método para backup completo
    async exportToJson(): Promise<string> {
        try {
            const [works, reports, versions] = await Promise.all([
                this.works.toArray(),
                this.reports.toArray(),
                this.versions.toArray()
            ]);

            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {
                    works,
                    reports,
                    versions
                }
            };

            return JSON.stringify(backup, null, 2);
        } catch (error) {
            console.error('Error creating backup:', error);
            throw new Error('Failed to create backup');
        }
    }

    // Método para restaurar desde backup
    async importFromJson(jsonData: string): Promise<void> {
        try {
            const backup = JSON.parse(jsonData);

            if (!backup.data || !backup.version) {
                throw new Error('Invalid backup format');
            }

            await this.transaction('rw', [this.works, this.reports, this.versions], async () => {
                // Limpiar datos existentes
                await Promise.all([
                    this.works.clear(),
                    this.reports.clear(),
                    this.versions.clear()
                ]);

                // Restaurar datos
                await Promise.all([
                    this.works.bulkAdd(backup.data.works || []),
                    this.reports.bulkAdd(backup.data.reports || []),
                    this.versions.bulkAdd(backup.data.versions || [])
                ]);
            });

            console.log('Backup restored successfully');
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw new Error('Failed to restore backup');
        }
    }
}

// Instancia singleton de la base de datos
export const db = new AEGGDatabase();

// Inicializar la base de datos y configurar limpieza automática
export const initializeDB = async (): Promise<void> => {
    try {
        await db.open();

        // Limpieza automática al inicializar (opcional)
        if (Math.random() < 0.1) { // 10% de probabilidad
            await db.cleanOldData(7);
        }

        console.log('AEGG Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};

// Cerrar la base de datos limpiamente
export const closeDB = async (): Promise<void> => {
    try {
        await db.close();
        console.log('AEGG Database closed successfully');
    } catch (error) {
        console.error('Error closing database:', error);
    }
};

// Hook personalizado para usar en componentes React
export const useDB = () => {
    return {
        db,
        initializeDB,
        closeDB
    };
};