// src/features/reporte/redux/baseExcelSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ExcelRow = any[];

interface BaseExcelState {
  fileName: string | null;
  excelData: ExcelRow[] | null;
  loading: boolean;
  error: string | null;
  selectedMonth: number;
}

const initialState: BaseExcelState = {
  fileName: null,
  excelData: null,
  loading: false,
  error: null,
  selectedMonth: new Date().getMonth() - 1,
};

const baseExcelReducer = createSlice({
  name: 'baseExcel', // Nombre único para este slice
  initialState,
  reducers: {
    // Acción cuando comienza la carga del archivo base
    baseFileLoadStart(state, action: PayloadAction<{ fileName: string }>) {
      state.loading = true;
      state.error = null;
      state.excelData = null; // Limpiar datos anteriores
      state.fileName = action.payload.fileName;
    },
    // Acción cuando el archivo base se carga y procesa correctamente
    baseFileLoadSuccess(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      state.loading = false;
      state.excelData = action.payload.data;
      state.error = null; // Asegurarse de limpiar errores previos
    },
    // Acción cuando ocurre un error al cargar o procesar el archivo base
    baseFileLoadFailure(state, action: PayloadAction<{ error: string }>) {
      state.loading = false;
      state.error = action.payload.error;
      state.excelData = null;
      // Opcional: decidir si mantener o limpiar el fileName en caso de error
      // state.fileName = null;
    },
    // Opcional: Acción para resetear el estado del archivo base
    resetBaseData(state) {
      // Podríamos usar Object.assign para mantener la referencia del objeto state
      Object.assign(state, initialState);
      // O simplemente retornar el estado inicial si la inmutabilidad no es problema aquí
      // return initi,
      // alState;
    },
    baseUpdateLocalChanges(state, action: PayloadAction<{ data: ExcelRow[] }>) {
      if (Array.isArray(action.payload.data)) {
        state.excelData = action.payload.data;
      }
    },
    updateSelectedMonth(state, action: PayloadAction<number>) {
      state.selectedMonth = action.payload; // Actualizar el mes seleccionado
    },
  },
});

// Exporta las acciones generadas automáticamente
export const {
  baseFileLoadStart,
  baseFileLoadSuccess,
  baseFileLoadFailure,
  resetBaseData,
  baseUpdateLocalChanges,
  updateSelectedMonth,
} = baseExcelReducer.actions;

// Exporta el reducer
export default baseExcelReducer.reducer;
