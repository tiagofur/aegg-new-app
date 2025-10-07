// src/features/users/pages/UsersPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/index";
import { fetchUsers } from "../redux/usersFetchSlice";
import { deleteUser, resetDeleteUserError, resetDeleteUserState } from "../redux/usersDeleteSlice";
import { showNotification } from "../../../shared/redux/notificationSlice";
import { Box, } from "@mui/material";
import UserFetchErrorAlert from "../components/UserFetchErrorAlert";
import UsersPageHeader from "../components/UsersPageHeader";
import UsersTable from "../components/UsersTable";
import CreateUserDialog from "../components/CreateUserDialog";
import EditUserDialog from "../components/EditUserDialog";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

const UsersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // --- Selectores de Redux ---
  const { users, isLoading: isLoadingFetch, error: fetchError } = useSelector(
    (state: RootState) => state.usersFetch
  );
  const { token, user: loggedInUser } = useSelector(
    (state: RootState) => state.authState
  );
  // 3. Quita el selector de updateUserError si solo se usaba para la alerta
  // const { updateUserError } = useSelector(
  //   (state: RootState) => state.usersUpdate
  // );
  // Mantenemos los selectores de delete para la lógica, pero no necesariamente para mostrar el error directamente
  const { isLoading: isLoadingDelete, success: deleteSuccess } = useSelector(
    (state: RootState) => state.usersDelete
  );
  // Selector específico para el mensaje de error de delete
  const deleteErrorMessage = useSelector((state: RootState) => state.usersDelete.error);


  // --- Estado Local ---
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- Efecto para cargar usuarios ---
  useEffect(() => {
    if (token && loggedInUser?.role === 'ADMIN') {
      dispatch(fetchUsers());
    }
    return () => {
        dispatch(resetDeleteUserState());
    }
  }, [dispatch, token, loggedInUser]);

  // --- Efecto para éxito de eliminación ---
  useEffect(() => {
    if (deleteSuccess) {
      // 4. Notificación de éxito al eliminar
      dispatch(showNotification({ message: `Usuario eliminado correctamente.`, severity: 'success' }));
      dispatch(fetchUsers());
      dispatch(resetDeleteUserState());
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  }, [deleteSuccess, dispatch]);

  // --- Efecto para error de eliminación ---
  useEffect(() => {
    if (deleteErrorMessage) {
      // 5. Notificación de error al eliminar
      dispatch(showNotification({ message: `Error al eliminar usuario: ${deleteErrorMessage}`, severity: 'error' }));
      // Opcional: Resetear el error en Redux aquí si quieres que la notificación
      // solo aparezca una vez por intento fallido.
      // dispatch(resetDeleteUserError());
    }
  }, [deleteErrorMessage, dispatch]);


  // --- Handlers ---
  const handleOpenCreateDialog = useCallback(() => setCreateDialogOpen(true), []);
  const handleCloseCreateDialog = useCallback(() => setCreateDialogOpen(false), []);

  const handleOpenEditDialog = useCallback((userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditDialogOpen(true);
    // 6. Quita el reset de error de update aquí si ya no es necesario
    // dispatch(resetUpdateUserError());
  }, [dispatch]); // Quita dispatch si ya no se usa aquí

  const handleCloseEditDialog = useCallback(() => {
    setSelectedUser(null);
    setEditDialogOpen(false);
  }, []);

  const handleOpenDeleteDialog = useCallback((userToDelete: User) => {
    setSelectedUser(userToDelete);
    setDeleteDialogOpen(true);
    // 7. Limpia el error de delete *antes* de abrir el diálogo de confirmación
    //    para no mostrar un error viejo si el usuario cancela y vuelve a intentar.
    dispatch(resetDeleteUserError());
  }, [dispatch]);

  const handleCloseDeleteDialog = useCallback(() => {
    if (!isLoadingDelete) {
        setSelectedUser(null);
        setDeleteDialogOpen(false);
        // 8. No es necesario limpiar el error aquí, se limpia al abrir o se muestra en el Snackbar
        // dispatch(resetDeleteUserError());
    }
  }, [isLoadingDelete, dispatch]); // Quita dispatch si ya no se usa aquí

  const handleConfirmDelete = useCallback(() => {
    if (selectedUser) {
      dispatch(deleteUser(selectedUser.id));
    }
  }, [dispatch, selectedUser]);

  const handleRetryFetch = useCallback(() => {
    if (loggedInUser?.role === 'ADMIN') {
      dispatch(fetchUsers());
    }
  }, [dispatch, loggedInUser]);

  // --- Lógica de Acceso ---
  if (!token) { /* ... sin cambios ... */ }
  if (!loggedInUser || loggedInUser.role !== 'ADMIN') { /* ... sin cambios ... */ }

  // --- Renderizado de la Página para ADMIN ---
  return (
    <Box sx={{ mt: 4 }}>
      {/* 10. Quita las alertas específicas de update y delete */}
      <UserFetchErrorAlert error={fetchError} onRetry={handleRetryFetch} />
      {/* <UserUpdateErrorAlert error={updateUserError} onClose={handleResetUpdateError} /> */}
      {/* <UserDeleteErrorAlert error={deleteError} onClose={handleResetDeleteError} /> */}

      <UsersPageHeader onCreateUserClick={handleOpenCreateDialog} />

      <UsersTable
        users={users ?? []}
        isLoading={isLoadingFetch}
        onEditUser={handleOpenEditDialog}
        onDeleteUser={handleOpenDeleteDialog}
      />

      {/* Diálogos (sin cambios aquí) */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
      />
      <EditUserDialog
        open={isEditDialogOpen}
        user={selectedUser}
        onClose={handleCloseEditDialog}
      />
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        userName={selectedUser?.name}
        isLoading={isLoadingDelete}
      />
    </Box>
  );
};

export default UsersPage;
