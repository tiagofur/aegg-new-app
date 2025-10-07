// IndexedDB Service para persistir datos de reportes
// A row persisted can be either an object (keyed record) or an array (raw Excel row)
// We keep it flexible to support legacy object-shaped reports and new raw matrix based ones.
// Using unknown[] instead of any[] to satisfy linting while allowing arbitrary Excel cell values
export type PersistedReportRow = Record<string, unknown> | unknown[];

export interface PersistedReportData {
  id: string;
  fileName: string;
  uploadDate: string;
  lastModified: string;
  originalExcelData: PersistedReportRow[]; // may contain raw Excel rows (arrays) or object records
  localChanges: PersistedReportRow[]; // same shape as originalExcelData after user edits
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  metadata: {
    totalRows: number;
    estatusSatColumnIndex?: number;
    reportType?: string;
    [key: string]: unknown;
  };
}

class IndexedDBService {
  private dbName = 'ReporteDB';
  private version = 1;
  private storeName = 'reportes';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear el store si no existe
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('lastModified', 'lastModified', { unique: false });
          store.createIndex('reportType', 'metadata.reportType', { unique: false });
        }
      };
    });
  }

  // Método genérico para guardar datos con reportType específico
  async saveReportData(data: PersistedReportData): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Actualizar fecha de modificación
      data.lastModified = new Date().toISOString();

      // Asegurar que el ID incluya el reportType para evitar colisiones
      if (data.metadata?.reportType) {
        data.id = `${data.metadata.reportType}-${Date.now()}`;
      }

      const request = store.put(data);

      request.onerror = () => {
        console.error('Error al guardar datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(`Datos guardados exitosamente para ${data.metadata?.reportType || 'reporte desconocido'}`);
        resolve();
      };
    });
  }

  // Método para obtener el reporte más reciente de un tipo específico
  async getLatestReportDataByType(reportType: string): Promise<PersistedReportData | null> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onerror = () => {
        console.error('Error al recuperar datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const allReports = request.result || [];
        // Filtrar por reportType y obtener el más reciente
        const filteredReports = allReports
          .filter(report => report.metadata?.reportType === reportType)
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

        resolve(filteredReports.length > 0 ? filteredReports[0] : null);
      };
    });
  }

  // Método para mantener compatibilidad con código existente
  async getLatestReportData(): Promise<PersistedReportData | null> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastModified');

      // Obtener el registro más reciente
      const request = index.openCursor(null, 'prev');

      request.onerror = () => {
        console.error('Error al recuperar datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(null);
        }
      };
    });
  }

  // Método para limpiar datos de un tipo específico de reporte
  async clearReportDataByType(reportType: string): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onerror = () => {
        console.error('Error al obtener datos para limpiar:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const allReports = request.result || [];
        const reportsToDelete = allReports.filter(report => report.metadata?.reportType === reportType);

        const deletePromises = reportsToDelete.map(report => {
          return new Promise<void>((deleteResolve, deleteReject) => {
            const deleteRequest = store.delete(report.id);
            deleteRequest.onerror = () => deleteReject(deleteRequest.error);
            deleteRequest.onsuccess = () => deleteResolve();
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            console.log(`Datos de ${reportType} limpiados exitosamente`);
            resolve();
          })
          .catch(reject);
      };
    });
  }

  async clearAllData(): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onerror = () => {
        console.error('Error al limpiar datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Todos los datos han sido limpiados de IndexedDB');
        resolve();
      };
    });
  }

  async deleteReportData(id: string): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(id);

      request.onerror = () => {
        console.error('Error al eliminar datos:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Datos eliminados exitosamente de IndexedDB');
        resolve();
      };
    });
  }

  async getAllReports(): Promise<PersistedReportData[]> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onerror = () => {
        console.error('Error al obtener todos los reportes:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  // Método para obtener todos los reportes de un tipo específico
  async getReportsByType(reportType: string): Promise<PersistedReportData[]> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onerror = () => {
        console.error('Error al obtener reportes por tipo:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const allReports = request.result || [];
        const filteredReports = allReports
          .filter(report => report.metadata?.reportType === reportType)
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

        resolve(filteredReports);
      };
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();
