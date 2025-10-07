import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '@config/api';
import { LoginResponse } from '@shared/types/user';

interface AuthLoginState {
    isLoginLoading: boolean;
    loginError: string | null;
}

const initialState: AuthLoginState = {
    isLoginLoading: false,
    loginError: null,
};

// Async Thunk para Login (sin cambios en la lógica interna, solo en el tipo de retorno si es necesario)
export const loginUser = createAsyncThunk<
    LoginResponse, // Retorna LoginResponse que contiene user y token
    { email: string; password: string },
    { rejectValue: string }
>(
    'auth/login',
    async (credentials, thunkAPI) => {
        try {
            const result = await apiRequest('/auth/login', 'POST', credentials) as LoginResponse;
            if (!result.accessToken || !result.user) {
                return thunkAPI.rejectWithValue('Formato de respuesta inválido del servidor tras login.');
            }

            // Sigue guardando en localStorage aquí
            localStorage.setItem('authToken', result.accessToken);
            localStorage.setItem('userData', JSON.stringify(result.user));
            return result; // Devuelve el resultado completo
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado durante el login.';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const authLoginReducer = createSlice({
    name: 'authLogin',
    initialState,
    reducers: {
        // Podrías añadir un reducer para limpiar el error manualmente si es necesario
        clearLoginError: (state) => {
            state.loginError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoginLoading = true;
                state.loginError = null;
            })
            .addCase(loginUser.fulfilled, (state) => {
                state.isLoginLoading = false;
                // state.user = action.payload.user; // <-- Eliminar
                // state.token = action.payload.accessToken; // <-- Eliminar
                state.loginError = null;
                // La actualización del estado global se hará desde el componente
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoginLoading = false;
                // state.user = null; // <-- Eliminar
                // state.token = null; // <-- Eliminar
                state.loginError = action.payload ?? action.error.message ?? 'Error desconocido en login';
            });
    },
});

// Exporta la nueva acción si la añadiste
export const { clearLoginError } = authLoginReducer.actions;
export default authLoginReducer.reducer;