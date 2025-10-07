import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
    baseFileLoadSuccess,
    updateSelectedMonth,
    resetBaseData
} from '../../features/reporte/redux/baseExcelSlice';
import {
    reporte01FileLoadSuccess,
    resetReporte01Data
} from '../../features/reporte/redux/reporteIngresosSlice';
import {
    reporte02FileLoadSuccess,
    resetReporte02Data
} from '../../features/reporte/redux/reporteIngresosAuxiliarSlice';
import {
    reporte03FileLoadSuccess,
    resetReporte03Data
} from '../../features/reporte/redux/reporteIngresosMiAdminSlice';

// Types for work report data
type ExcelRow = (string | number | boolean | null | undefined)[];

interface ReportState {
    fileName: string | null;
    excelData: ExcelRow[] | null;
    loading: boolean;
    error: string | null;
}

interface BaseExcelState extends ReportState {
    selectedMonth: number;
}

export interface WorkReportData {
    baseExcel: BaseExcelState;
    reporte01: ReportState;
    reporte02: ReportState;
    reporte03: ReportState;
}

export const useWorkState = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Seleccionar todos los estados de reportes
    const baseExcelState = useSelector((state: RootState) => state.baseExcel);
    const reporte01State = useSelector((state: RootState) => state.reporte01);
    const reporte02State = useSelector((state: RootState) => state.reporte02);
    const reporte03State = useSelector((state: RootState) => state.reporte03);

    // Función para capturar el estado actual completo
    const captureCurrentState = (): WorkReportData => {
        return {
            baseExcel: {
                fileName: baseExcelState.fileName,
                excelData: baseExcelState.excelData,
                selectedMonth: baseExcelState.selectedMonth,
                loading: false, // No guardamos el estado de loading
                error: null,    // No guardamos errores
            },
            reporte01: {
                fileName: reporte01State.fileName,
                excelData: reporte01State.excelData,
                loading: false,
                error: null,
            },
            reporte02: {
                fileName: reporte02State.fileName,
                excelData: reporte02State.excelData,
                loading: false,
                error: null,
            },
            reporte03: {
                fileName: reporte03State.fileName,
                excelData: reporte03State.excelData,
                loading: false,
                error: null,
            },
        };
    };

    // Función para restaurar un estado guardado
    const restoreState = (workData: WorkReportData) => {
        // Restaurar base excel
        if (workData.baseExcel.excelData) {
            dispatch(baseFileLoadSuccess({ data: workData.baseExcel.excelData }));
        }
        if (workData.baseExcel.selectedMonth !== undefined) {
            dispatch(updateSelectedMonth(workData.baseExcel.selectedMonth));
        }

        // Restaurar reporte01
        if (workData.reporte01.excelData) {
            dispatch(reporte01FileLoadSuccess({ data: workData.reporte01.excelData }));
        }

        // Restaurar reporte02
        if (workData.reporte02.excelData) {
            dispatch(reporte02FileLoadSuccess({ data: workData.reporte02.excelData }));
        }

        // Restaurar reporte03
        if (workData.reporte03.excelData) {
            dispatch(reporte03FileLoadSuccess({ data: workData.reporte03.excelData }));
        }
    };

    // Función para limpiar todo el estado
    const clearAllState = () => {
        dispatch(resetBaseData());
        dispatch(resetReporte01Data());
        dispatch(resetReporte02Data());
        dispatch(resetReporte03Data());
    };

    // Verificar si hay datos para guardar
    const hasDataToSave = (): boolean => {
        return !!(
            baseExcelState.excelData ||
            reporte01State.excelData ||
            reporte02State.excelData ||
            reporte03State.excelData
        );
    };

    // Obtener resumen del estado actual
    const getStateSummary = () => {
        const reportCount = [
            baseExcelState.excelData,
            reporte01State.excelData,
            reporte02State.excelData,
            reporte03State.excelData,
        ].filter(Boolean).length;

        const fileNames = [
            baseExcelState.fileName,
            reporte01State.fileName,
            reporte02State.fileName,
            reporte03State.fileName,
        ].filter(Boolean);

        return {
            reportCount,
            fileNames,
            hasData: hasDataToSave(),
            selectedMonth: baseExcelState.selectedMonth,
        };
    };

    return {
        // Estados
        baseExcelState,
        reporte01State,
        reporte02State,
        reporte03State,

        // Funciones
        captureCurrentState,
        restoreState,
        clearAllState,
        hasDataToSave,
        getStateSummary,
    };
};