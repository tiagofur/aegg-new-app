// src/features/reporte/redux/reporte02Slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ExcelRow = any[];

interface Reporte02State {
  fileName: string | null;
  excelData: ExcelRow[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: Reporte02State = {
  fileName: null,
  excelData: null,
  loading: false,
  error: null,
};

const reporte02Reducer = createSlice({
  name: 'reporte02', // Nombre único
  initialState,
  reducers: {
    reporte02FileLoadStart(state, action: PayloadAction<{ fileName: string }>) {
      state.loading = true;
      state.error = null;
      state.excelData = null;
      state.fileName = action.payload.fileName;
    },
    reporte02FileLoadSuccess(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      state.loading = false;
      if (Array.isArray(action.payload.data)) {
        state.excelData = action.payload.data;
        state.error = null;
      } else {
        state.excelData = null;
        state.error = "Los datos del archivo no tienen el formato esperado.";
      }
    },
    reporte02FileLoadFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading = false;
      state.error = action.payload.error || "Ocurrió un error desconocido al cargar el archivo.";
      state.excelData = null;
    },
    reporte02UpdateLocalChanges(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      if (Array.isArray(action.payload.data)) {
        state.excelData = action.payload.data;
      }
    },
    resetReporte02Data(state) {
      Object.assign(state, initialState);
    }
  },
});

export const {
  reporte02FileLoadStart,
  reporte02FileLoadSuccess,
  reporte02FileLoadFailure,
  reporte02UpdateLocalChanges,
  resetReporte02Data,
} = reporte02Reducer.actions;

export default reporte02Reducer.reducer;
