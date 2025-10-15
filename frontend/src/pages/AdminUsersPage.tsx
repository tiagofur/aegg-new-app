import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../components/layout/AppShell";
import { usersApi } from "../services/users";
import {
  AppUser,
  CreateUserPayload,
  DashboardRole,
  UpdateUserPayload,
} from "../types";
import {
  UserFormDialog,
  UserFormValues,
} from "../features/users/components/UserFormDialog";
import { ConfirmDeleteDialog } from "../features/users/components/ConfirmDeleteDialog";

const roleLabels: Record<
  DashboardRole,
  { label: string; Icon: typeof ShieldCheck }
> = {
  Admin: { label: "Admin", Icon: ShieldAlert },
  Gestor: { label: "Gestor", Icon: ShieldCheck },
  Miembro: { label: "Miembro", Icon: ShieldQuestion },
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formateando fecha", error);
    return value;
  }
};

export const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const {
    data: users = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeForm();
    },
    onError: (mutationError: any) => {
      console.error("Error creando usuario", mutationError);
      alert("No se pudo crear el usuario. Intenta nuevamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeForm();
    },
    onError: (mutationError: any) => {
      console.error("Error actualizando usuario", mutationError);
      alert("No se pudo actualizar el usuario. Intenta nuevamente.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    onError: (mutationError: any) => {
      console.error("Error eliminando usuario", mutationError);
      alert("No se pudo eliminar el usuario. Intenta nuevamente.");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const sorted = [...users].sort((a, b) =>
      a.name.localeCompare(b.name, "es")
    );

    if (!term) {
      return sorted;
    }

    return sorted.filter((user) => {
      return [user.name, user.email, user.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [users, searchTerm]);

  const roleCounts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] ?? 0) + 1;
        return acc;
      },
      { Admin: 0, Gestor: 0, Miembro: 0 } as Record<DashboardRole, number>
    );
  }, [users]);

  const openCreateForm = () => {
    setFormMode("create");
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (user: AppUser) => {
    setFormMode("edit");
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleSubmit = (values: UserFormValues) => {
    if (formMode === "create") {
      const payload: CreateUserPayload = {
        name: values.name,
        email: values.email,
        role: values.role,
        password: values.password ?? "",
      };
      createMutation.mutate(payload);
    } else if (selectedUser) {
      const payload: UpdateUserPayload = {
        name: values.name,
        email: values.email,
        role: values.role,
      };

      if (values.password) {
        payload.password = values.password;
      }

      updateMutation.mutate({ id: selectedUser.id, payload });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const primaryError = isError ? (error as Error | undefined)?.message : null;

  const actions = (
    <button
      type="button"
      onClick={openCreateForm}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
    >
      <Plus className="h-4 w-4" />
      Nuevo usuario
    </button>
  );

  return (
    <AppShell
      title="Gestión de usuarios"
      breadcrumbs={[
        { label: "Inicio", to: "/dashboard" },
        { label: "Usuarios" },
      ]}
      actions={actions}
    >
      <div className="space-y-6">
        {primaryError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Ocurrió un error al cargar los usuarios. {primaryError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(roleCounts) as DashboardRole[]).map((role) => {
            const { label, Icon } = roleLabels[role];
            return (
              <article
                key={role}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {roleCounts[role]}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 p-2 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Usuarios
              </h2>
              <p className="text-sm text-slate-500">
                Administra los usuarios que tienen acceso a la plataforma.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, correo o rol"
                className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </header>

          <div className="relative">
            {isFetching && (
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
            )}

            {isLoading ? (
              <div className="p-6 text-sm text-slate-500">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No hay usuarios que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Nombre</th>
                      <th className="px-6 py-3 font-medium">Correo</th>
                      <th className="px-6 py-3 font-medium">Rol</th>
                      <th className="px-6 py-3 font-medium">Creación</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {user.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              ID: {user.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {roleLabels[user.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(user)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(user)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserFormDialog
        open={isFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? selectedUser : undefined}
        loading={isSaving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Confirmar eliminación"
        description={
          deleteTarget
            ? `¿Seguro que quieres eliminar a ${deleteTarget.name}? Esta acción no se puede deshacer.`
            : ""
        }
        loading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
};

export default AdminUsersPage;
