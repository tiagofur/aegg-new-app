// src/features/reporte/redux/reporte03Slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ExcelRow = any[];

interface Reporte03State {
  fileName: string | null;
  excelData: ExcelRow[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: Reporte03State = {
  fileName: null,
  excelData: null,
  loading: false,
  error: null,
};

const reporte03Reducer = createSlice({
  name: 'reporte03', // Nombre único
  initialState,
  reducers: {
    reporte03FileLoadStart(state, action: PayloadAction<{ fileName: string }>) {
      state.loading = true;
      state.error = null;
      state.excelData = null;
      state.fileName = action.payload.fileName;
    },
    reporte03FileLoadSuccess(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      state.loading = false;
      if (Array.isArray(action.payload.data)) {
        state.excelData = action.payload.data;
        state.error = null;
      } else {
        state.excelData = null;
        state.error = "Los datos del archivo no tienen el formato esperado.";
      }
    },
    reporte03FileLoadFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading = false;
      state.error = action.payload.error || "Ocurrió un error desconocido al cargar el archivo.";
      state.excelData = null;
    },
    reporte03UpdateLocalChanges(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      if (Array.isArray(action.payload.data)) {
        state.excelData = action.payload.data;
      }
    },
    resetReporte03Data(state) {
      Object.assign(state, initialState);
    }
  },
});

export const {
  reporte03FileLoadStart,
  reporte03FileLoadSuccess,
  reporte03FileLoadFailure,
  reporte03UpdateLocalChanges,
  resetReporte03Data,
} = reporte03Reducer.actions;

export default reporte03Reducer.reducer;
