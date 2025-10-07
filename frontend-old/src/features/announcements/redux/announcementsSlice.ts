import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@store';
import { getAuthToken } from '@features/auth/hooks/getAuthToken';
import { apiRequest } from '@config/api';

export interface AnnouncementItem {
    _id: string;
    title: string;
    body: string;
    level: 'info' | 'urgent';
    publishedAt: string;
    expiresAt?: string;
}

interface AnnouncementsState {
    items: AnnouncementItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    lastFetched?: number;
    error?: string;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
}

const initialState: AnnouncementsState = {
    items: [],
    status: 'idle',
    creating: false,
    updating: false,
    deleting: false,
};

export const fetchAnnouncements = createAsyncThunk<AnnouncementItem[], void, { state: RootState }>(
    'announcements/fetch',
    async (_, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const data = await apiRequest('/announcements?limit=10', 'GET', undefined, token) as { items: AnnouncementItem[] };
            return data.items;
        } catch (error: unknown) {
            console.error('Error in fetchAnnouncements:', error);
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
            return thunkAPI.rejectWithValue('Error desconocido al cargar comunicados');
        }
    },
    {
        condition: (_, { getState }) => {
            const state = getState();
            const sliceState = state.announcements as AnnouncementsState | undefined;
            const lastFetched = sliceState?.lastFetched;
            const status = sliceState?.status;
            if (status === 'loading') return false;
            if (lastFetched && Date.now() - lastFetched < 60000) return false; // cache 60s
            return true;
        },
    }
);

export const createAnnouncement = createAsyncThunk<
    AnnouncementItem,
    { title: string; body: string; level: 'info' | 'urgent'; expiresAt: string },
    { state: RootState }
>(
    'announcements/create',
    async (payload, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest('/announcements', 'POST', payload, token) as AnnouncementItem;
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error creando comunicado';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateAnnouncement = createAsyncThunk<
    AnnouncementItem,
    { id: string; title?: string; body?: string; level?: 'info' | 'urgent'; expiresAt?: string },
    { state: RootState }
>(
    'announcements/update',
    async ({ id, ...payload }, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest(`/announcements/${id}`, 'PATCH', payload, token) as AnnouncementItem;
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error actualizando comunicado';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteAnnouncement = createAsyncThunk<string, string, { state: RootState }>(
    'announcements/delete',
    async (id, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            await apiRequest(`/announcements/${id}`, 'DELETE', undefined, token);
            return id;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error eliminando comunicado';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const slice = createSlice({
    name: 'announcements',
    initialState,
    reducers: {
        prepend(state, action: PayloadAction<AnnouncementItem>) {
            state.items.unshift(action.payload);
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchAnnouncements.pending, state => { state.status = 'loading'; })
            .addCase(fetchAnnouncements.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchAnnouncements.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(createAnnouncement.pending, state => { state.creating = true; })
            .addCase(createAnnouncement.fulfilled, (state, action) => {
                state.creating = false;
                state.items.unshift(action.payload);
            })
            .addCase(createAnnouncement.rejected, (state, action) => {
                state.creating = false;
                state.error = action.error.message;
            })
            .addCase(updateAnnouncement.pending, state => { state.updating = true; })
            .addCase(updateAnnouncement.fulfilled, (state, action) => {
                state.updating = false;
                const idx = state.items.findIndex(item => item._id === action.payload._id);
                if (idx >= 0) state.items[idx] = action.payload;
            })
            .addCase(updateAnnouncement.rejected, (state, action) => {
                state.updating = false;
                state.error = action.error.message;
            })
            .addCase(deleteAnnouncement.pending, state => { state.deleting = true; })
            .addCase(deleteAnnouncement.fulfilled, (state, action) => {
                state.deleting = false;
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(deleteAnnouncement.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.error.message;
            });
    },
});

export const { prepend } = slice.actions;
export default slice.reducer;