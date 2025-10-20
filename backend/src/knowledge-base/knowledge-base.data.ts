import { KnowledgeBaseEntry } from './knowledge-base.types';

export const KNOWLEDGE_BASE_ENTRIES: KnowledgeBaseEntry[] = [
    {
        id: 'kb-001',
        title: 'Flujo de aprobacion mensual',
        category: 'Operaciones',
        summary: 'Checklist y pasos para revisar y aprobar un mes contable dentro del dashboard.',
        content:
            '1. Verificar estados de reportes. 2. Confirmar conciliaciones. 3. Registrar comentarios y aprobar. 4. Comunicar cierre al equipo.',
        tags: ['aprobaciones', 'operaciones', 'cierre-mensual'],
        lastUpdated: '2025-01-10T09:30:00.000Z',
        links: [
            {
                label: 'Guia rapida de aprobaciones',
                url: 'https://intranet.example.com/docs/aprobaciones',
            },
        ],
    },
    {
        id: 'kb-002',
        title: 'Importacion de reportes de ingresos',
        category: 'Integraciones',
        summary: 'Requisitos del archivo y pasos para importar los reportes de ingresos desde Mi Admin y Auxiliar.',
        content:
            '1. Descargar los archivos XLSX desde las fuentes oficiales. 2. Revisar estructura y columnas obligatorias. 3. Importar primero Auxiliar, luego Mi Admin. 4. Validar totales y diferencias.',
        tags: ['reportes', 'importacion', 'ingresos'],
        lastUpdated: '2025-01-05T15:00:00.000Z',
        links: [
            {
                label: 'Plantilla de archivos',
                url: 'https://intranet.example.com/docs/plantillas',
            },
            {
                label: 'Solucion de problemas comunes',
                url: 'https://intranet.example.com/docs/troubleshooting',
            },
        ],
    },
    {
        id: 'kb-003',
        title: 'Uso del dashboard operativo',
        category: 'Operacion diaria',
        summary: 'Buenas practicas para mantener comunicados, eventos y tareas al dia dentro del dashboard.',
        content:
            '1. Publicar comunicados urgentes antes del medio dia. 2. Programar eventos con al menos 24 horas de anticipacion. 3. Revisar tareas pendientes al inicio y cierre de jornada.',
        tags: ['dashboard', 'operacion'],
        lastUpdated: '2025-01-15T18:45:00.000Z',
    },
];
