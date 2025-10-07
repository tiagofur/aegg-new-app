// src/features/reporte/redux/reporte01Slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ExcelRow = any[];

interface Reporte01State {
  fileName: string | null;
  excelData: ExcelRow[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: Reporte01State = {
  fileName: null,
  excelData: null,
  loading: false,
  error: null,
};

const reporte01Reducer = createSlice({
  name: 'reporte01', // Nombre único para este slice
  initialState,
  reducers: {
    // Acción cuando comienza la carga del archivo Reporte01
    reporte01FileLoadStart(state, action: PayloadAction<{ fileName: string }>) {
      state.loading = true;
      state.error = null;
      state.excelData = null;
      state.fileName = action.payload.fileName;
    },
    // Acción cuando el archivo Reporte01 se carga y procesa correctamente
    reporte01FileLoadSuccess(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      state.loading = false;
      state.excelData = action.payload.data;
      state.error = null;
    },
    // Acción cuando ocurre un error al cargar o procesar el archivo Reporte01
    reporte01FileLoadFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading = false;
      state.error = action.payload.error;
      state.excelData = null;
      // state.fileName = null; // Opcional: limpiar nombre en error
    },
    // Opcional: Acción para resetear el estado del archivo Reporte01
    resetReporte01Data(state) {
      Object.assign(state, initialState);
    }
  },
});

// Exporta las acciones
export const {
  reporte01FileLoadStart,
  reporte01FileLoadSuccess,
  reporte01FileLoadFailure,
  resetReporte01Data,
} = reporte01Reducer.actions;

// Exporta el reducer
export default reporte01Reducer.reducer;
