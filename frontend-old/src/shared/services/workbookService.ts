// Servicio para manejar importación y exportación multi-hoja de plantillas Excel
// Nota: Depende de la librería `xlsx` ya incluida en el proyecto.

import * as XLSX from 'xlsx';

// Tipos utilitarios para reducir uso de 'any'
export type CellPrimitive = string | number | boolean | Date | null | undefined;
export type SheetAOA = CellPrimitive[][]; // Array of Arrays

// Estructuras simplificadas de metadatos Excel (parcial, suficiente para rehidratación básica)
export interface SheetMergeRange { s: { r: number; c: number }; e: { r: number; c: number }; }
export interface SheetCol { wpx?: number; wch?: number; hidden?: boolean; }
export interface SheetRow { hpx?: number; hpt?: number; hidden?: boolean; }

// Tipos de dominio
export interface StoredWorkbookMeta {
    id: string;
    hash: string;
    originalFileName: string;
    sheetCount: number;
    createdAt: string;
    version: number;
}

export interface StoredSheetData {
    workbookId: string;
    index: number;
    name: string;
    data: SheetAOA;
    merges?: SheetMergeRange[];
    cols?: SheetCol[];
    rows?: SheetRow[];
    immutable: boolean;
    rowCount: number;
    colCount: number;
}

export interface MonthlyCoverOverride {
    workbookId: string;
    yearMonth: string; // YYYY-MM
    data: SheetAOA;
    updatedAt: string;
}

export interface ImportedMonthlySheet {
    id: string;
    workbookId: string;
    yearMonth: string;
    category: string;
    sheetName: string;
    data: SheetAOA;
    createdAt: string;
}

export interface WorkbookImportResult {
    workbookId: string;
    sheetNames: string[];
    sheetCount: number;
}

// --- IndexedDB v2 (multi-store) ---
// Implementación interna ligera sin romper el servicio existente `indexedDBService`.

const DB_NAME = 'ReporteDB';
const DB_VERSION = 2; // Nueva versión

// Stores
const STORE_WORKBOOKS = 'workbooks';
const STORE_SHEETS = 'sheets';
const STORE_COVERS = 'monthlyCovers';
const STORE_IMPORTS = 'imports';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
                const db = request.result;
                // Crear stores si no existen
                if (!db.objectStoreNames.contains(STORE_WORKBOOKS)) {
                    db.createObjectStore(STORE_WORKBOOKS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_SHEETS)) {
                    db.createObjectStore(STORE_SHEETS, { keyPath: ['workbookId', 'index'] });
                }
                if (!db.objectStoreNames.contains(STORE_COVERS)) {
                    db.createObjectStore(STORE_COVERS, { keyPath: ['workbookId', 'yearMonth'] });
                }
                if (!db.objectStoreNames.contains(STORE_IMPORTS)) {
                    db.createObjectStore(STORE_IMPORTS, { keyPath: 'id' });
                }
            };
        });
    }
    return dbPromise;
}

// Utilidades
async function sha256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function buildFileName(base: string, yearMonth: string): string {
    const extIndex = base.lastIndexOf('.');
    const nameOnly = extIndex !== -1 ? base.substring(0, extIndex) : base;
    return `${nameOnly}_${yearMonth}.xlsx`;
}

function toYearMonth(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function put<T>(storeName: string, value: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.onabort = () => reject(tx.error);
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(storeName);
        store.put(value as unknown as T);
        tx.oncomplete = () => resolve();
    });
}

async function getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result as T[]);
    });
}

// key puede ser string | number | IDBValidKey | cualquier array compuesto aceptado por keyPath
// Definimos tipo amplio pero sin usar 'any'
type StoreKey = IDBValidKey | IDBValidKey[];
async function getOne<T>(storeName: string, key: StoreKey): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result as T | undefined);
    });
}

// Servicio principal
export const workbookService = {
    // Importa un archivo plantilla completo con todas sus hojas
    async importTemplate(file: File): Promise<WorkbookImportResult> {
        const arrayBuffer = await file.arrayBuffer();
        const hash = await sha256(arrayBuffer);

        // Reutilizar si ya existe
        const existing = (await getAll<StoredWorkbookMeta>(STORE_WORKBOOKS))
            .find(w => w.hash === hash);
        if (existing) {
            return {
                workbookId: existing.id,
                sheetNames: (await getAll<StoredSheetData>(STORE_SHEETS))
                    .filter(s => s.workbookId === existing.id)
                    .sort((a, b) => a.index - b.index)
                    .map(s => s.name),
                sheetCount: existing.sheetCount,
            };
        }

        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const workbookId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const meta: StoredWorkbookMeta = {
            id: workbookId,
            hash,
            originalFileName: file.name,
            sheetCount: wb.SheetNames.length,
            createdAt,
            version: 1,
        };
        await put(STORE_WORKBOOKS, meta);

        // Guardar cada hoja
        for (let i = 0; i < wb.SheetNames.length; i++) {
            const name = wb.SheetNames[i];
            const sheet = wb.Sheets[name];
            const data = XLSX.utils.sheet_to_json<CellPrimitive[]>(sheet, {
                header: 1,
                raw: true,
                blankrows: true,
            });
            const stored: StoredSheetData = {
                workbookId,
                index: i,
                name,
                data: data as SheetAOA,
                merges: (sheet as XLSX.WorkSheet & { ['!merges']?: SheetMergeRange[] })['!merges'],
                cols: (sheet as XLSX.WorkSheet & { ['!cols']?: SheetCol[] })['!cols'],
                rows: (sheet as XLSX.WorkSheet & { ['!rows']?: SheetRow[] })['!rows'],
                immutable: i !== 0,
                rowCount: data.length,
                colCount: Math.max(0, ...data.map(r => (Array.isArray(r) ? r.length : 0))),
            };
            await put(STORE_SHEETS, stored);
        }

        return {
            workbookId,
            sheetNames: wb.SheetNames,
            sheetCount: wb.SheetNames.length,
        };
    },

    async saveMonthlyCover(workbookId: string, yearMonth: string, data: SheetAOA): Promise<void> {
        const record: MonthlyCoverOverride = {
            workbookId,
            yearMonth,
            data,
            updatedAt: new Date().toISOString(),
        };
        await put(STORE_COVERS, record);
    },

    async addImportedSheet(params: { workbookId: string; yearMonth: string; category: string; sheetName: string; data: SheetAOA; }): Promise<string> {
        const id = `${params.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const rec: ImportedMonthlySheet = {
            id,
            workbookId: params.workbookId,
            yearMonth: params.yearMonth,
            category: params.category,
            sheetName: params.sheetName,
            data: params.data,
            createdAt: new Date().toISOString(),
        };
        await put(STORE_IMPORTS, rec);
        return id;
    },

    async listTemplates(): Promise<StoredWorkbookMeta[]> {
        return getAll<StoredWorkbookMeta>(STORE_WORKBOOKS);
    },

    // Lista metadatos ligeros de hojas para un workbook (sin cargar datos grandes ajenos)
    async listSheets(workbookId: string): Promise<Pick<StoredSheetData, 'index' | 'name' | 'rowCount' | 'colCount' | 'immutable'>[]> {
        const all = await getAll<StoredSheetData>(STORE_SHEETS);
        return all
            .filter(s => s.workbookId === workbookId)
            .sort((a, b) => a.index - b.index)
            .map(s => ({ index: s.index, name: s.name, rowCount: s.rowCount, colCount: s.colCount, immutable: s.immutable }));
    },

    // Obtiene los datos de una hoja específica (por index) sin otras hojas
    async getSheetData(workbookId: string, index: number): Promise<StoredSheetData | undefined> {
        // No tenemos índice directo además de composite; usamos getAll y filtramos (dataset local limitado)
        const all = await getAll<StoredSheetData>(STORE_SHEETS);
        return all.find(s => s.workbookId === workbookId && s.index === index);
    },

    async exportWorkbook(workbookId: string, yearMonth: string): Promise<void> {
        const meta = await getOne<StoredWorkbookMeta>(STORE_WORKBOOKS, workbookId);
        if (!meta) throw new Error('Workbook no encontrado');

        const allSheets = (await getAll<StoredSheetData>(STORE_SHEETS))
            .filter(s => s.workbookId === workbookId)
            .sort((a, b) => a.index - b.index);
        if (!allSheets.length) throw new Error('No hay hojas almacenadas');

        const cover = (await getOne<MonthlyCoverOverride>(STORE_COVERS, [workbookId, yearMonth])) || undefined;
        const imported = (await getAll<ImportedMonthlySheet>(STORE_IMPORTS))
            .filter(r => r.workbookId === workbookId && r.yearMonth === yearMonth);

        const wb = XLSX.utils.book_new();

        // Helper para agregar hoja
        const append = (name: string, data: SheetAOA, merges?: SheetMergeRange[], cols?: SheetCol[], rows?: SheetRow[]) => {
            const ws = XLSX.utils.aoa_to_sheet(data);
            if (merges) (ws as XLSX.WorkSheet & { ['!merges']?: SheetMergeRange[] })['!merges'] = merges;
            if (cols) (ws as XLSX.WorkSheet & { ['!cols']?: SheetCol[] })['!cols'] = cols;
            if (rows) (ws as XLSX.WorkSheet & { ['!rows']?: SheetRow[] })['!rows'] = rows;
            XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(name));
        };

        // Carátula (override o la index 0)
        const baseCover = cover ? { data: cover.data } : { data: allSheets[0].data };
        append(allSheets[0].name, baseCover.data, allSheets[0].merges, allSheets[0].cols, allSheets[0].rows);

        // Resto hojas base
        for (const sheet of allSheets.slice(1)) {
            append(sheet.name, sheet.data, sheet.merges, sheet.cols, sheet.rows);
        }

        // Imports (resolver colisiones de nombre)
        const existingNames = new Set(allSheets.map(s => s.name));
        for (const imp of imported) {
            let candidate = imp.sheetName;
            let counter = 2;
            while (existingNames.has(candidate)) {
                candidate = `${imp.sheetName} (${counter++})`;
            }
            existingNames.add(candidate);
            append(candidate, imp.data);
        }

        const fileName = buildFileName(meta.originalFileName, yearMonth);
        XLSX.writeFile(wb, fileName, { compression: true });
    },

    // Actualiza completamente los datos de una hoja existente (mutable). Especialmente útil para la hoja 0 (carátula anual)
    async updateSheetData(workbookId: string, index: number, data: SheetAOA): Promise<void> {
        const existing = await workbookService.getSheetData(workbookId, index);
        if (!existing) throw new Error('Sheet no encontrada');
        if (existing.immutable) throw new Error('Sheet marcada como inmutable');
        const updated: StoredSheetData = {
            ...existing,
            data,
            rowCount: data.length,
            colCount: Math.max(0, ...data.map(r => (Array.isArray(r) ? r.length : 0))),
        };
        await put(STORE_SHEETS, updated);
    },
    // Lista todos los yearMonth disponibles (covers guardados e imports) para un workbook
    async listAvailableMonths(workbookId: string): Promise<string[]> {
        const covers = await getAll<MonthlyCoverOverride>(STORE_COVERS);
        const imports = await getAll<ImportedMonthlySheet>(STORE_IMPORTS);
        const months = new Set<string>();
        for (const c of covers) {
            if (c.workbookId === workbookId) months.add(c.yearMonth);
        }
        for (const imp of imports) {
            if (imp.workbookId === workbookId) months.add(imp.yearMonth);
        }
        return Array.from(months).sort();
    },
    async getMonthlyCover(workbookId: string, yearMonth: string): Promise<MonthlyCoverOverride | undefined> {
        return getOne<MonthlyCoverOverride>(STORE_COVERS, [workbookId, yearMonth]);
    },
};

function sanitizeSheetName(name: string): string {
    // Excel limita a 31 caracteres y no permite: \ / * ? : [ ]
    const invalid = /[\\/*?:[\]]/g; // caracteres inválidos (escapes mínimos requeridos)
    let clean = name.replace(invalid, ' ').trim();
    if (clean.length > 31) clean = clean.slice(0, 31);
    return clean || 'Hoja';
}

export const workbookUtils = { sha256, buildFileName, toYearMonth };
