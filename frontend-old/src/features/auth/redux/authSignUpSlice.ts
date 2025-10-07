import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '@config/api';
import { SignUpFormData } from '../components/SignUpForm';

interface SignUpResponse {
    message: string;
}

interface AuthSignUpState {
    isSignUpLoading: boolean;
    signUpError: string | null;
    signUpSuccess: boolean;
}

const initialState: AuthSignUpState = {
    isSignUpLoading: false,
    signUpError: null,
    signUpSuccess: false,
};

// Async Thunk para SignUp
export const signUpUser = createAsyncThunk<
    SignUpResponse,
    SignUpFormData,
    { rejectValue: string }
>(
    'auth/register',
    async (signUpData, thunkAPI) => {
        try {
            const result = await apiRequest('/auth/register', 'POST', signUpData) as SignUpResponse;
            if (!result.message) {
                return thunkAPI.rejectWithValue('Formato de respuesta inválido del servidor tras signup.');
            }
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado durante el registro.';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const authSignUpReducer = createSlice({
    name: 'authSignUp',
    initialState,
    reducers: {
        resetSignUpState: (state) => {
            state.isSignUpLoading = false;
            state.signUpError = null;
            state.signUpSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(signUpUser.pending, (state) => {
                state.isSignUpLoading = true;
                state.signUpError = null;
                state.signUpSuccess = false;
            })
            .addCase(signUpUser.fulfilled, (state) => {
                state.isSignUpLoading = false;
                state.signUpError = null;
                state.signUpSuccess = true;
            })
            .addCase(signUpUser.rejected, (state, action) => {
                state.isSignUpLoading = false;
                state.signUpError = action.payload || action.error.message || 'Error desconocido en registro';
                state.signUpSuccess = false;
            });
    },
});

export const { resetSignUpState } = authSignUpReducer.actions;
export default authSignUpReducer.reducer;