export type AnnouncementCategory = "Urgente" | "Operativo" | "Actualización";
export type DashboardRole = "Admin" | "Gestor" | "Ejecutor";

export interface Announcement {
    id: string;
    title: string;
    summary: string;
    category: AnnouncementCategory;
    audience: DashboardRole[];
    date: string;
    requiresAcknowledgement: boolean;
    createdBy?: string;
}

export type CalendarEventType = "Corte" | "Mantenimiento" | "Reunión" | "Recordatorio";

export interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: CalendarEventType;
    createdBy?: string;
}

export type TaskPriority = "Alta" | "Media" | "Baja";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
    id: string;
    title: string;
    description: string;
    ownerRole: DashboardRole;
    dueDate: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: string;
    createdBy?: string;
}

export interface DashboardState {
    announcements: Announcement[];
    events: CalendarEvent[];
    tasks: Task[];
    acknowledgements: Record<string, string[]>;
}

export interface CreateAnnouncementInput {
    title: string;
    summary: string;
    category: AnnouncementCategory;
    audience: DashboardRole[];
    requiresAcknowledgement: boolean;
    createdBy?: string;
}

export interface CreateTaskInput {
    title: string;
    description: string;
    ownerRole: DashboardRole;
    dueDate: string;
    priority: TaskPriority;
    createdBy?: string;
}

export interface CreateEventInput {
    title: string;
    description: string;
    date: string;
    type: CalendarEventType;
    createdBy?: string;
}
