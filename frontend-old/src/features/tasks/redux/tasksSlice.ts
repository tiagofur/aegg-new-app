import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@store';
import { getAuthToken } from '@features/auth/hooks/getAuthToken';
import { apiRequest } from '@config/api';

export interface TaskItem {
    _id: string;
    title: string;
    dueDate?: string;
    status: 'open' | 'done';
    priority: 'low' | 'normal' | 'high';
}

interface TasksState {
    items: TaskItem[];
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error?: string;
}

const initialState: TasksState = {
    items: [],
    creating: false,
    updating: false,
    deleting: false,
    status: 'idle',
};

export const fetchTasks = createAsyncThunk<TaskItem[], void, { state: RootState }>(
    'tasks/fetch',
    async (_, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const data = await apiRequest('/tasks?status=open', 'GET', undefined, token) as { items: TaskItem[] };
            return data.items;
        } catch (error: unknown) {
            console.error('Error in fetchTasks:', error);
            if (error instanceof Error) {
                // Si es un error de conexión
                if (error.message.includes('Failed to fetch') || error.message.includes('fetch') || error.message.includes('Network')) {
                    return thunkAPI.rejectWithValue('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
                }
                // Si es un error de autenticación
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    return thunkAPI.rejectWithValue('No se encontró token de autenticación');
                }
                // Error específico del servidor
                return thunkAPI.rejectWithValue(error.message);
            }
            return thunkAPI.rejectWithValue('Error desconocido al cargar tareas');
        }
    }
);

export const createTask = createAsyncThunk<TaskItem, { title: string; dueDate?: string; priority?: string }, { state: RootState }>(
    'tasks/create',
    async (payload, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest('/tasks', 'POST', payload, token) as TaskItem;
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error creando tarea';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const toggleTaskDone = createAsyncThunk<TaskItem, { id: string; done: boolean }, { state: RootState }>(
    'tasks/toggleDone',
    async ({ id, done }, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest(`/tasks/${id}`, 'PATCH', { status: done ? 'done' : 'open' }, token) as TaskItem;
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error actualizando tarea';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateTask = createAsyncThunk<TaskItem, { id: string; title?: string; priority?: string; dueDate?: string }, { state: RootState }>(
    'tasks/update',
    async ({ id, ...payload }, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest(`/tasks/${id}`, 'PATCH', payload, token) as TaskItem;
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error actualizando tarea';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteTask = createAsyncThunk<string, string, { state: RootState }>(
    'tasks/delete',
    async (id, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            await apiRequest(`/tasks/${id}`, 'DELETE', undefined, token);
            return id;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error eliminando tarea';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const slice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        // Optimistic toggle (opcional futuro)
        optimisticToggle(state, action: PayloadAction<{ id: string }>) {
            const t = state.items.find(x => x._id === action.payload.id);
            if (t) t.status = t.status === 'done' ? 'open' : 'done';
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTasks.pending, state => { state.status = 'loading'; })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(createTask.pending, state => { state.creating = true; })
            .addCase(createTask.fulfilled, (state, action) => {
                state.creating = false;
                state.items.unshift(action.payload);
            })
            .addCase(createTask.rejected, (state, action) => {
                state.creating = false;
                state.error = action.error.message;
            })
            .addCase(toggleTaskDone.pending, state => { state.updating = true; })
            .addCase(toggleTaskDone.fulfilled, (state, action) => {
                state.updating = false;
                const idx = state.items.findIndex(t => t._id === action.payload._id);
                if (idx >= 0) state.items[idx] = action.payload;
            })
            .addCase(toggleTaskDone.rejected, (state, action) => {
                state.updating = false;
                state.error = action.error.message;
            })
            .addCase(updateTask.pending, state => { state.updating = true; })
            .addCase(updateTask.fulfilled, (state, action) => {
                state.updating = false;
                const idx = state.items.findIndex(t => t._id === action.payload._id);
                if (idx >= 0) state.items[idx] = action.payload;
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.updating = false;
                state.error = action.error.message;
            })
            .addCase(deleteTask.pending, state => { state.deleting = true; })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.deleting = false;
                state.items = state.items.filter(t => t._id !== action.payload);
            })
            .addCase(deleteTask.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.error.message;
            });
    },
});

export const { optimisticToggle } = slice.actions;
export default slice.reducer;
