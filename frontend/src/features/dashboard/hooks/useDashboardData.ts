import { useEffect, useMemo, useState } from "react";
import {
    CreateAnnouncementInput,
    CreateEventInput,
    CreateTaskInput,
    DashboardState,
    Task,
} from "../../../types";

const STORAGE_KEY = "dashboard-state:v1";

const LEGACY_ANNOUNCEMENT_IDS = new Set(["a1", "a2", "a3"]);
const LEGACY_EVENT_IDS = new Set(["e1", "e2", "e3", "e4"]);
const LEGACY_TASK_IDS = new Set(["t1", "t2", "t3"]);

const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEmptyState = (): DashboardState => ({
    announcements: [],
    events: [],
    tasks: [],
    acknowledgements: {},
});

const sanitizeState = (state?: Partial<DashboardState> | null): DashboardState => {
    const base = createEmptyState();
    const announcements = (state?.announcements ?? []).filter(
        (announcement) => announcement && !LEGACY_ANNOUNCEMENT_IDS.has(announcement.id)
    );
    const events = (state?.events ?? []).filter(
        (event) => event && !LEGACY_EVENT_IDS.has(event.id)
    );
    const tasks = (state?.tasks ?? []).filter((task) => task && !LEGACY_TASK_IDS.has(task.id));

    const acknowledgements: Record<string, string[]> = {};
    const sourceAcknowledgements = state?.acknowledgements ?? {};
    for (const [userId, ids] of Object.entries(sourceAcknowledgements)) {
        const filtered = ids.filter((id) => !LEGACY_ANNOUNCEMENT_IDS.has(id));
        if (filtered.length) {
            acknowledgements[userId] = filtered;
        }
    }

    return {
        ...base,
        announcements,
        events,
        tasks,
        acknowledgements,
    };
};

const loadState = (): DashboardState => {
    try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (!raw) {
            return createEmptyState();
        }
        const parsed = JSON.parse(raw) as Partial<DashboardState>;
        return sanitizeState(parsed);
    } catch (error) {
        console.warn("No fue posible cargar el estado del dashboard, se usará el default", error);
        return createEmptyState();
    }
};

export const useDashboardData = (currentUserId?: string | null) => {
    const [state, setState] = useState<DashboardState>(() => loadState());

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const acknowledgedIds = useMemo(() => {
        if (!currentUserId) return [];
        return state.acknowledgements[currentUserId] ?? [];
    }, [state.acknowledgements, currentUserId]);

    const acknowledgeAnnouncement = (announcementId: string) => {
        if (!currentUserId) return;
        setState((prev) => {
            const existing = prev.acknowledgements[currentUserId] ?? [];
            if (existing.includes(announcementId)) {
                return prev;
            }
            return {
                ...prev,
                acknowledgements: {
                    ...prev.acknowledgements,
                    [currentUserId]: [...existing, announcementId],
                },
            };
        });
    };

    const toggleTaskStatus = (taskId: string) => {
        setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((task) => {
                if (task.id !== taskId) {
                    return task;
                }
                const nextStatus: Task["status"] =
                    task.status === "completed" ? "in_progress" : "completed";
                return { ...task, status: nextStatus };
            }),
        }));
    };

    const addAnnouncement = (input: CreateAnnouncementInput) => {
        setState((prev) => ({
            ...prev,
            announcements: [
                {
                    id: generateId(),
                    date: new Date().toISOString(),
                    ...input,
                },
                ...prev.announcements,
            ],
        }));
    };

    const addTask = (input: CreateTaskInput) => {
        setState((prev) => ({
            ...prev,
            tasks: [
                {
                    id: generateId(),
                    status: "pending",
                    createdAt: new Date().toISOString(),
                    ...input,
                },
                ...prev.tasks,
            ],
        }));
    };

    const addEvent = (input: CreateEventInput) => {
        setState((prev) => ({
            ...prev,
            events: [
                ...prev.events,
                {
                    id: generateId(),
                    ...input,
                },
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        }));
    };

    const resetState = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
        }
        setState(createEmptyState());
    };

    return {
        announcements: state.announcements,
        events: state.events,
        tasks: state.tasks,
        acknowledgedIds,
        acknowledgeAnnouncement,
        toggleTaskStatus,
        addAnnouncement,
        addTask,
        addEvent,
        resetState,
    };
};
