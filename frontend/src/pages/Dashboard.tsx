import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  ChevronRight,
  ClipboardPlus,
  Inbox,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/layout/AppShell";
import {
  AnnouncementDialog,
  EventDialog,
  TaskDialog,
  useDashboardData,
} from "../features/dashboard";

const announcementCategoryStyles: Record<string, string> = {
  Urgente: "border border-red-200 bg-red-100 text-red-600",
  Operativo: "border border-blue-200 bg-blue-100 text-blue-600",
  Actualización: "border border-amber-200 bg-amber-100 text-amber-600",
};

const getAnnouncementTagStyles = (category: string) =>
  announcementCategoryStyles[category] ??
  "border border-slate-200 bg-slate-100 text-slate-600";

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    ...(options || {}),
  }).format(new Date(value));
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const Dashboard = () => {
  const { user } = useAuth();
  const {
    announcements,
    events,
    tasks,
    acknowledgedIds,
    acknowledgeAnnouncement,
    toggleTaskStatus,
    addAnnouncement,
    addTask,
    addEvent,
  } = useDashboardData(user?.id);

  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today && task.status !== "completed";
    }).length;
    const pendingAcknowledgements = announcements.filter(
      (announcement) => announcement.requiresAcknowledgement
    ).length;
    const awaitingAcknowledgement = announcements.filter(
      (announcement) =>
        announcement.requiresAcknowledgement &&
        !acknowledgedIds.includes(announcement.id)
    ).length;
    return {
      total,
      completed,
      overdue,
      pendingAcknowledgements,
      awaitingAcknowledgement,
    };
  }, [tasks, announcements, acknowledgedIds]);

  const quickActions = [
    {
      id: "qa1",
      label: "Crear comunicado",
      description: "Publica un aviso para todo el equipo",
      icon: Megaphone,
      onClick: () => setAnnouncementDialogOpen(true),
    },
    {
      id: "qa2",
      label: "Programar evento",
      description: "Agenda hitos clave y recordatorios",
      icon: CalendarPlus,
      onClick: () => setEventDialogOpen(true),
    },
    {
      id: "qa3",
      label: "Nueva tarea",
      description: "Asigna actividades puntuales",
      icon: ClipboardPlus,
      onClick: () => setTaskDialogOpen(true),
    },
  ];

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  );

  const handleCreateAnnouncement = (
    input: Parameters<typeof addAnnouncement>[0]
  ) => {
    addAnnouncement({ ...input, createdBy: user?.id ?? undefined });
    setAnnouncementDialogOpen(false);
  };

  const handleCreateTask = (input: Parameters<typeof addTask>[0]) => {
    addTask({ ...input, createdBy: user?.id ?? undefined });
    setTaskDialogOpen(false);
  };

  const handleCreateEvent = (input: Parameters<typeof addEvent>[0]) => {
    addEvent({ ...input, createdBy: user?.id ?? undefined });
    setEventDialogOpen(false);
  };

  return (
    <>
      <AppShell
        title="Inicio"
        breadcrumbs={[{ label: "Inicio" }]}
        actions={
          <button
            type="button"
            onClick={() => setAnnouncementDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Megaphone className="h-4 w-4" />
            Crear comunicado
          </button>
        }
      >
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-blue-600">
                    Centro operativo
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Hola {user?.name?.split(" ")[0] || ""} ({user?.role}),
                    prioricemos el día
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Revisa comunicados, próximos hitos y tareas críticas antes
                    de ir a tus módulos.
                  </p>
                </div>
                <div className="grid h-16 w-16 place-content-center rounded-full bg-blue-50 text-center text-xs font-semibold text-blue-600">
                  <span className="text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                  <span className="uppercase tracking-wide">
                    {user?.role?.[0] ?? ""}
                  </span>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {quickActions.map(
                  ({ id, label, description, icon: Icon, onClick }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={onClick}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {description}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Estado operativo
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-600">
                      Tareas completadas
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {stats.completed}/{stats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-slate-600">
                      Tareas vencidas
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {stats.overdue}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Inbox className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-slate-600">
                      Comunicados por confirmar
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {stats.awaitingAcknowledgement}/
                    {stats.pendingAcknowledgements}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Comunicados
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lo más relevante para tu rol
                  </h3>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver historial
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center">
                    <Megaphone className="h-10 w-10 text-blue-500" />
                    <p className="mt-4 text-base font-semibold text-slate-900">
                      Aún no hay comunicados
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-slate-600">
                      Comunica hitos clave, recordatorios y avisos importantes
                      para mantener al equipo alineado.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAnnouncementDialogOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Megaphone className="h-4 w-4" />
                      Crear comunicado
                    </button>
                  </div>
                ) : (
                  announcements.map((announcement) => {
                    const acknowledged = acknowledgedIds.includes(
                      announcement.id
                    );
                    return (
                      <div
                        key={announcement.id}
                        className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getAnnouncementTagStyles(
                              announcement.category
                            )}`}
                          >
                            {announcement.category}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(announcement.date, { year: "numeric" })}
                          </span>
                        </div>
                        <div className="mt-3">
                          <h4 className="text-base font-semibold text-slate-900">
                            {announcement.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-600">
                            {announcement.summary}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span>
                            Audiencia: {announcement.audience.join(", ")}
                          </span>
                          {announcement.requiresAcknowledgement && (
                            <button
                              type="button"
                              onClick={() =>
                                acknowledgeAnnouncement(announcement.id)
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 font-medium text-blue-600 transition-colors hover:bg-blue-50"
                            >
                              {acknowledged
                                ? "Confirmado"
                                : "Confirmar lectura"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Agenda</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Próximos hitos
                  </h3>
                </div>
                <CalendarDays className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-6 space-y-4">
                {sortedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <CalendarPlus className="h-10 w-10 text-slate-500" />
                    <p className="mt-4 text-base font-semibold text-slate-900">
                      Agenda sin eventos
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-slate-600">
                      Programa hitos clave, mantenimientos y recordatorios para
                      mantener tu operación bajo control.
                    </p>
                    <button
                      type="button"
                      onClick={() => setEventDialogOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Programar evento
                    </button>
                  </div>
                ) : (
                  sortedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium uppercase tracking-wide text-slate-600">
                          {event.type}
                        </span>
                        <span>{formatDateTime(event.date)}</span>
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-slate-900">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {event.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Gestor de tareas operativo
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Prioriza y cierra pendientes críticos
                </h3>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-200 hover:text-blue-700"
              >
                <CalendarClock className="h-4 w-4" />
                Ver calendario completo
              </button>
            </div>
            <div className="mt-6">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <ClipboardPlus className="h-10 w-10 text-slate-500" />
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    Sin tareas asignadas
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-slate-600">
                    Registra actividades prioritarias y asigna responsables para
                    coordinar al equipo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTaskDialogOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                    Crear tarea
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-200 hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                            {task.ownerRole}
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 font-semibold ${
                                task.priority === "Alta"
                                  ? "bg-red-100 text-red-600"
                                  : task.priority === "Media"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-emerald-100 text-emerald-600"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span>Vence {formatDate(task.dueDate)}</span>
                          </span>
                        </div>
                        <h4 className="mt-3 text-base font-semibold text-slate-900">
                          {task.title}
                        </h4>
                        <p className="mt-2 text-sm text-slate-600">
                          {task.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          task.status === "completed"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <CheckSquare className="h-4 w-4" />
                        {task.status === "completed"
                          ? "Marcar en progreso"
                          : "Marcar completa"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </AppShell>
      <AnnouncementDialog
        open={announcementDialogOpen}
        onClose={() => setAnnouncementDialogOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleCreateTask}
      />
      <EventDialog
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </>
  );
};

export default Dashboard;
