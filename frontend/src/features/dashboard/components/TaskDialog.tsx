import { useState } from "react";
import { CreateTaskInput, DashboardRole, TaskPriority } from "../../../types";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => void;
}

const roles: DashboardRole[] = ["Admin", "Gestor", "Ejecutor"];
const priorities: TaskPriority[] = ["Alta", "Media", "Baja"];

export const TaskDialog = ({ open, onClose, onSubmit }: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerRole, setOwnerRole] = useState<DashboardRole>("Gestor");
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<TaskPriority>("Alta");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      ownerRole,
      dueDate,
      priority,
    });
    setTitle("");
    setDescription("");
    setOwnerRole("Gestor");
    setPriority("Alta");
    setDueDate(new Date().toISOString().slice(0, 10));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Nueva tarea</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Título
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Describe la actividad"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Incluye pasos clave y expectativas"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Rol responsable
              <select
                value={ownerRole}
                onChange={(event) =>
                  setOwnerRole(event.target.value as DashboardRole)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Prioridad
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Fecha de vencimiento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Crear tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
