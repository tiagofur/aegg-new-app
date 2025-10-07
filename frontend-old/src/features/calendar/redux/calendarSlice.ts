import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '@store';
import { getAuthToken } from '@features/auth/hooks/getAuthToken';
import { apiRequest } from '@config/api';

export interface CalendarDay { day: number; tasks: number; announcements: number; }

interface CalendarState {
    year: number;
    month: number; // 1-12
    days: CalendarDay[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error?: string;
}

const now = new Date();
const initialState: CalendarState = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    days: [],
    status: 'idle',
};

export const fetchCalendar = createAsyncThunk<{ year: number; month: number; days: CalendarDay[] }, { year: number; month: number }, { state: RootState }>(
    'calendar/fetch',
    async ({ year, month }, thunkAPI) => {
        try {
            const token = getAuthToken(thunkAPI.getState());
            if (!token) {
                return thunkAPI.rejectWithValue('No se encontró token de autenticación');
            }
            const result = await apiRequest(`/calendar/month?year=${year}&month=${month}`, 'GET', undefined, token) as { year: number; month: number; days: CalendarDay[] };
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error cargando calendario';
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const slice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        navigate(state, action) {
            const { year, month } = action.payload as { year: number; month: number };
            state.year = year;
            state.month = month;
            state.status = 'idle';
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchCalendar.pending, state => { state.status = 'loading'; })
            .addCase(fetchCalendar.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.year = action.payload.year;
                state.month = action.payload.month;
                state.days = action.payload.days;
            })
            .addCase(fetchCalendar.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { navigate } = slice.actions;
export default slice.reducer;
