import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@shared/types/user';
import { apiRequest } from '@config/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isVerifyingToken: boolean;
    verificationError: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isVerifyingToken: false,
    verificationError: null,
};

export const verifyToken = createAsyncThunk<
    User,
    void,
    { rejectValue: string; state: { authState: AuthState } }
>(
    'auth/verifyToken',
    async (_, thunkAPI) => {
        const token = thunkAPI.getState().authState.token ?? localStorage.getItem('authToken');

        if (!token) {
            return thunkAPI.rejectWithValue('No hay token para verificar.');
        }

        try {
            const userData = await apiRequest('/auth/me', 'GET', undefined, token) as User;
            if (!userData) {
                throw new Error('Respuesta inválida del servidor al verificar token.');
            }
            localStorage.setItem('userData', JSON.stringify(userData));
            return userData;
        } catch (error: unknown) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            const errorMessage = error instanceof Error ? error.message : 'Token inválido o expirado.';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


const authStateReducer = createSlice({
    name: 'authState',
    initialState,
    reducers: {
        loadUserFromStorage: (state) => {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            if (token && userData) {
                try {
                    state.user = JSON.parse(userData);
                    state.token = token;
                } catch (e) {
                    console.error('Error parsing stored user data on load:', e);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    state.user = null;
                    state.token = null;
                }
            } else {
                state.user = null;
                state.token = null;
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.verificationError = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        },
        setAuthState: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.verificationError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyToken.pending, (state) => {
                state.isVerifyingToken = true;
                state.verificationError = null;
            })
            .addCase(verifyToken.fulfilled, (state, action: PayloadAction<User>) => {
                state.isVerifyingToken = false;
                state.user = action.payload;
                state.token = localStorage.getItem('authToken');
                state.verificationError = null;
            })
            .addCase(verifyToken.rejected, (state, action) => {
                state.isVerifyingToken = false;
                state.verificationError = action.payload ?? 'Error desconocido al verificar token.';
                state.user = null;
                state.token = null;
            });
    },
});

export const { loadUserFromStorage, logout, setAuthState } = authStateReducer.actions;
export default authStateReducer.reducer;

