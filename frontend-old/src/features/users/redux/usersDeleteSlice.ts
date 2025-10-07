// src/features/users/redux/usersDeleteSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from "../../../config/api";
// Quitamos RootState si no se usa getState
// import { RootState } from '../../../store';

// Definimos un tipo para la respuesta exitosa del thunk
interface DeleteUserSuccessPayload {
  userId: string;
  message: string;
}

interface UsersDeleteState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  successMessage: string | null; // <-- Añadido para guardar el mensaje
}

const initialState: UsersDeleteState = {
  isLoading: false,
  error: null,
  success: false,
  successMessage: null, // <-- Inicializado
};

// Thunk asíncrono para eliminar un usuario (modificado)
export const deleteUser = createAsyncThunk<
  DeleteUserSuccessPayload, // <-- Tipo de retorno modificado
  string, // Tipo del argumento (ID del usuario a eliminar)
  { rejectValue: string }
>(
  'users/deleteUser',
  async (userId, thunkAPI) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return thunkAPI.rejectWithValue('No se encontró token de autenticación.');
      }

      // Guardamos la respuesta de la API
      const response = await apiRequest(`/users/${userId}`, 'DELETE', undefined, token) as any;

      // Extraemos el mensaje de la respuesta (o usamos uno por defecto)
      const message = response?.message || `Usuario con ID ${userId} eliminado con éxito.`;

      // Devolvemos el ID y el mensaje
      return { userId, message }; // <-- Devolvemos el objeto

    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al eliminar usuario';
      console.error("Error deleting user:", error);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const usersDeleteSlice = createSlice({
  name: 'usersDelete',
  initialState,
  reducers: {
    resetDeleteUserState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.successMessage = null; // <-- Reseteamos el mensaje
    },
    resetDeleteUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
        state.successMessage = null; // <-- Reseteamos al iniciar
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<DeleteUserSuccessPayload>) => { // <-- Tipo de PayloadAction modificado
        state.isLoading = false;
        state.success = true;
        state.successMessage = action.payload.message; // <-- Guardamos el mensaje de éxito
        // Ya no necesitamos guardar el userId aquí, se usará en el componente
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Error desconocido al eliminar usuario';
        state.successMessage = null; // <-- Reseteamos en caso de error
      });
  },
});

export const { resetDeleteUserState, resetDeleteUserError } = usersDeleteSlice.actions;
export default usersDeleteSlice.reducer;
