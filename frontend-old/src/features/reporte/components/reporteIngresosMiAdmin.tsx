import React, { ChangeEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as XLSX from 'xlsx';
import { workbookService } from '../../../shared/services/workbookService';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  reporte03FileLoadStart,
  reporte03FileLoadSuccess,
  reporte03FileLoadFailure,
  reporte03UpdateLocalChanges,
} from '../redux/reporteIngresosMiAdminSlice';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { useReportComparison } from '../context/ReportComparisonContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import {
  indexedDBService,
  type PersistedReportData,
} from '../../../shared/services/indexedDbService';

// Tipo base de celdas compatible con ReportComparisonContext (ExcelPrimitive)
// Evita conflicto al pasar matrices a updateReporte03Data (ExcelMatrix)
type ExcelCellValue = string | number | boolean | null | undefined;
type ExcelRow = ExcelCellValue[];
type DataRow = {
  [key: string]: ExcelCellValue;
  _id?: string;
  _originalIndex?: number; // ✅ NUEVO: Índice estable de la fila original en Excel
};
type EstadoSAT = 'Vigente' | 'Cancelada'; // Nuevo tipo para Estado SAT

// 🛠️ Helper para normalizar datos persistidos (PersistedReportRow[]) a ExcelRow[] tipado
const toExcelRows = (rows: any): ExcelRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) =>
    Array.isArray(r) ? (r.map((c: any) => c as ExcelCellValue) as ExcelRow) : ([] as ExcelRow)
  );
};

const ReporteMiAdmin: React.FC = () => {
  const { fileName, excelData, loading, error } = useSelector(
    (state: RootState) => state.reporte03
  );
  const dispatch: AppDispatch = useDispatch();

  // 🔄 Obtener el mes seleccionado desde Redux (centralizado)
  const selectedMonth = useSelector((state: RootState) => state.baseExcel.selectedMonth);

  // 🔄 Integrar contexto de comparación de manera segura
  const {
    updateReporte03Data,
    getSubtotalFromReporte02,
    getSubtotalAuxByFolio,
    getSuggestedTipoCambioByFolio,
    isComparisonActive,
    getRowStyle,
    getTooltip,
    lastComparisonTime,
    toggleComparison,
    clearComparison,
    // getSubtotalMXNFromReporte03,
    areSubtotalsEqual,
    getSubtotalMXNFromReporte03,
    saveToPlantillaBase,
  } = useReportComparison();

  // Estado para el subtotal MXN total calculado
  const [subtotalMXNTotal, setSubtotalMXNTotal] = useState<number | null>(null);

  const [localExcelData, setLocalExcelData] = useState<ExcelRow[] | null>(null);
  const [totalsKey, setTotalsKey] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Toast
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const closeToast = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setToast((t) => ({ ...t, open: false }));
  };

  const [savedWorkExists, setSavedWorkExists] = useState(false);

  // Estado local para valores de Tipo Cambio para evitar pérdida de foco
  const [localTipoCambioValues, setLocalTipoCambioValues] = useState<{
    [key: string]: string;
  }>({});

  // 🆕 Estado para mantener el foco en la celda activa
  const [activeCellFocus, setActiveCellFocus] = useState<{
    rowIndex: number;
    colIndex: number;
  } | null>(null);
  const activeCellRef = useRef<HTMLInputElement | null>(null);

  // Estado para el menú desplegable de guardado
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const saveMenuOpen = Boolean(saveMenuAnchor);

  const handleSaveMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSaveMenuAnchor(event.currentTarget);
  };

  const handleSaveMenuClose = () => {
    setSaveMenuAnchor(null);
  };

  // Función para generar clave única de celda de Tipo Cambio
  const getTipoCambioKey = useCallback((rowIndex: number, colIndex: number) => {
    return `tipo-cambio-${rowIndex}-${colIndex}`;
  }, []);

  // Función para detectar índice de columna Estado SAT
  const getEstatusSatColumnIndex = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): number => {
      if (!data || data.length <= headerIndex) {
        return -1;
      }
      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) {
        return -1;
      }
      return headerRow.findIndex(
        (header) =>
          header?.toString().toLowerCase() === 'estatus sat' ||
          header?.toString().toLowerCase() === 'estado sat'
      );
    },
    []
  );

  // 🆕 Función para detectar índice de columna Subtotal
  const getSubtotalColumnIndex = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): number => {
      if (!data || data.length <= headerIndex) {
        return -1;
      }
      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) {
        return -1;
      }
      return headerRow.findIndex((header) => header?.toString().toLowerCase().includes('subtotal'));
    },
    []
  );

  // 🆕 Función para detectar índice de columna Tipo de Cambio
  const getTipoCambioColumnIndex = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): number => {
      if (!data || data.length <= headerIndex) {
        return -1;
      }
      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) {
        return -1;
      }
      return headerRow.findIndex((header) => {
        const headerStr = header?.toString().toLowerCase() || '';
        return (
          headerStr.includes('tipo cambio') ||
          headerStr.includes('tipo de cambio') ||
          headerStr.includes('tipocambio')
        );
      });
    },
    []
  );

  // 🆕 Función para detectar índice de columna Moneda
  const getMonedaColumnIndex = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): number => {
      if (!data || data.length <= headerIndex) {
        return -1;
      }
      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) {
        return -1;
      }
      return headerRow.findIndex((header) => header?.toString().toLowerCase() === 'moneda');
    },
    []
  );

  // Función para inicializar valores de Estado SAT
  const initializeEstatusSatValues = useCallback(
    (data: ExcelRow[], headerIndex: number): ExcelRow[] => {
      if (!data || data.length === 0) return data;

      if (data.length <= headerIndex) return data; // No hay suficientes filas para un encabezado y datos

      const newData = data.map((r) => (Array.isArray(r) ? [...r] : r)); // Copia profunda

      const headerRow = newData[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) return newData; // Si la fila de encabezado no es un array, devolver los datos tal cual

      let estadoSatIdx = headerRow.findIndex(
        (header) =>
          header?.toString().toLowerCase() === 'estatus sat' ||
          header?.toString().toLowerCase() === 'estado sat'
      );

      // Si la columna "Estado SAT" no existe, la agregamos
      if (estadoSatIdx === -1) {
        headerRow.push('Estado SAT');
        estadoSatIdx = headerRow.length - 1; // Nuevo índice

        // Agregar "Vigente" por defecto en todas las filas de datos (excepto totales)
        for (let i = headerIndex + 1; i < newData.length; i++) {
          const currentRow = Array.isArray(newData[i]) ? [...(newData[i] as ExcelRow)] : [];
          const firstCol = currentRow[0]?.toString().toLowerCase() || '';
          if (firstCol !== 'totales' && firstCol !== 'total') {
            if (currentRow.length <= estadoSatIdx) {
              // Extender la fila si es necesario
              while (currentRow.length <= estadoSatIdx) {
                currentRow.push(null);
              }
            }
            currentRow[estadoSatIdx] = 'Vigente';
          } else {
            currentRow.push(null); // No poner "Vigente" en la fila de totales
          }
          newData[i] = currentRow;
        }
      } else {
        // Si ya existe la columna, asegurar que todas las filas de datos tengan valores válidos
        for (let i = headerIndex + 1; i < newData.length; i++) {
          const currentRow = Array.isArray(newData[i]) ? [...(newData[i] as ExcelRow)] : [];
          const firstCol = currentRow[0]?.toString().toLowerCase() || '';
          if (firstCol !== 'totales' && firstCol !== 'total') {
            if (currentRow.length <= estadoSatIdx) {
              while (currentRow.length <= estadoSatIdx) {
                currentRow.push(null);
              }
            }
            if (
              currentRow[estadoSatIdx] !== 'Vigente' &&
              currentRow[estadoSatIdx] !== 'Cancelada'
            ) {
              currentRow[estadoSatIdx] = 'Vigente';
            }
          }
          newData[i] = currentRow;
        }
      }

      return newData;
    },
    []
  );

  // Función para validar y encontrar el header y contenido de la tabla
  const validateAndExtractTableData = useCallback(
    (data: ExcelRow[]): { header: ExcelRow | null; content: ExcelRow[] } => {
      if (!data || data.length === 0) return { header: null, content: [] };

      // Buscar la primera fila con al menos 8 columnas con valores válidos
      const headerIndex = data.findIndex(
        (row: ExcelRow) =>
          Array.isArray(row) &&
          row.filter((cell: ExcelCellValue) => {
            if (cell === null || cell === undefined) return false;
            if (typeof cell === 'string') return cell.trim() !== '';
            if (typeof cell === 'number' && !isNaN(cell)) return true;
            if (typeof cell === 'boolean') return true;
            return false;
          }).length >= 8
      );

      if (headerIndex === -1) {
        console.warn(
          'No se encontró una fila válida con al menos 8 columnas con contenido válido.'
        );
        return { header: null, content: [] };
      }

      const slicedData = data.slice(headerIndex);
      const header = slicedData[0];
      const content = slicedData.slice(1);

      return { header, content };
    },
    []
  );

  // 🛡️ Guardado automático simple y seguro
  const saveCurrentWork = useCallback(async () => {
    if (!fileName || !excelData || !localExcelData) {
      console.warn('⚠️ No se puede guardar: faltan datos básicos', {
        fileName: !!fileName,
        excelData: !!excelData,
        localExcelData: !!localExcelData,
      });
      return false;
    }

    try {
      const { header } = validateAndExtractTableData(localExcelData);
      const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
      const estadoSatColumnIdx =
        headerIndex !== -1 ? getEstatusSatColumnIndex(localExcelData, headerIndex) : -1;

      const reportData: PersistedReportData = {
        id: `reporte03-${Date.now()}`,
        fileName: fileName,
        uploadDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        originalExcelData: excelData,
        localChanges: localExcelData,
        pagination,
        metadata: {
          totalRows: localExcelData.length,
          reportType: 'reporte03',
          estadoSatColumnIndex: estadoSatColumnIdx,
        },
      };

      await indexedDBService.saveReportData(reportData);
      setSavedWorkExists(true);
      console.log('💾 Trabajo guardado automáticamente para reporte03', {
        fileName,
        totalRows: localExcelData.length,
        estadoSatColumnIdx,
      });
      return true;
    } catch (error) {
      console.error('❌ Error en guardado automático:', error);
      return false;
    }
  }, [
    fileName,
    excelData,
    localExcelData,
    pagination,
    getEstatusSatColumnIndex,
    validateAndExtractTableData,
  ]);

  // Función para forzar guardado inmediato
  const forceImmediateSave = useCallback(
    async (reason: string) => {
      try {
        await saveCurrentWork();
        console.log(`💾 Guardado forzado exitoso: ${reason}`);
      } catch (error) {
        console.warn(`⚠️ Error en guardado forzado (${reason}):`, error);
      }
    },
    [saveCurrentWork]
  );

  // Función para recuperar trabajo guardado
  const restoreWork = useCallback(async () => {
    try {
      const savedData = await indexedDBService.getLatestReportDataByType('reporte03');
      if (savedData) {
        // Asegurar que fileName se establece en Redux
        if (savedData.fileName) {
          dispatch(reporte03FileLoadStart({ fileName: savedData.fileName }));
        }
        dispatch(reporte03FileLoadSuccess({ data: toExcelRows(savedData.originalExcelData) }));

        // Restaurar localExcelData
        const localChangesExcel = toExcelRows(savedData.localChanges);
        const { header } = validateAndExtractTableData(localChangesExcel);
        const headerIndex = header ? localChangesExcel.findIndex((row) => row === header) : -1;
        const dataWithEstatusSat =
          headerIndex !== -1
            ? initializeEstatusSatValues(localChangesExcel, headerIndex)
            : localChangesExcel;
        setLocalExcelData(dataWithEstatusSat);
        setLocalTipoCambioValues({});

        setPagination(savedData.pagination);
        setTotalsKey((prev) => prev + 1);
        setSavedWorkExists(true);

        console.log('🔄 Trabajo restaurado desde IndexedDB');
      }
    } catch (error) {
      console.error('❌ Error al restaurar trabajo:', error);
    }
  }, [dispatch, initializeEstatusSatValues, validateAndExtractTableData]);

  // Función para limpiar completamente (guardado + tabla + Redux)
  const clearSavedWork = useCallback(async () => {
    try {
      await indexedDBService.clearReportDataByType('reporte03');
      setLocalExcelData(null);
      setPagination({ pageIndex: 0, pageSize: 15 });
      setTotalsKey(0);
      setSavedWorkExists(false);
      dispatch(reporte03FileLoadSuccess({ data: [] }));

      if (isComparisonActive) {
        clearComparison();
      }

      console.log('🗑️ Trabajo y datos limpiados completamente');
    } catch (error) {
      console.error('❌ Error al limpiar trabajo:', error);
    }
  }, [dispatch, isComparisonActive, clearComparison]);

  // 🔍 Verificar trabajo guardado al montar el componente
  useEffect(() => {
    const checkSavedWork = async () => {
      try {
        console.log('🔍 Verificando trabajo guardado existente para reporte03...');
        const savedData = await indexedDBService.getLatestReportDataByType('reporte03');
        if (savedData) {
          console.log('✅ Trabajo guardado encontrado para reporte03:', {
            fileName: savedData.fileName,
            lastModified: savedData.lastModified,
            excelDataExists: !!excelData,
            localExcelDataExists: !!localExcelData,
            reportType: savedData.metadata?.reportType,
          });
          setSavedWorkExists(true);

          // Solo cargar automáticamente si NO hay datos de Excel en Redux Y NO hay datos locales
          if (!excelData && !localExcelData) {
            console.log(
              '🔄 Cargando automáticamente datos guardados de reporte03 (sin datos existentes)'
            );
            // Asegurar que fileName se establece en Redux
            if (savedData.fileName) {
              dispatch(reporte03FileLoadStart({ fileName: savedData.fileName }));
            }
            dispatch(reporte03FileLoadSuccess({ data: toExcelRows(savedData.originalExcelData) }));

            const localChangesExcel = toExcelRows(savedData.localChanges);
            const { header } = validateAndExtractTableData(localChangesExcel);
            const headerIndex = header ? localChangesExcel.findIndex((row) => row === header) : -1;
            const dataWithEstatusSat =
              headerIndex !== -1
                ? initializeEstatusSatValues(localChangesExcel, headerIndex)
                : localChangesExcel;
            setLocalExcelData(dataWithEstatusSat);
            setLocalTipoCambioValues({});

            setPagination(savedData.pagination);
            setTotalsKey((prev) => prev + 1);
          } else {
            console.log(
              'ℹ️ Datos existentes detectados en Mi Admin, no se restaurará automáticamente'
            );
          }
        } else {
          console.log('ℹ️ No se encontró trabajo guardado para reporte03');
        }
      } catch (error) {
        console.error('❌ Error al verificar trabajo guardado reporte03:', error);
      }
    };

    // Solo ejecutar al montar el componente
    checkSavedWork();
    // Ejecutar solo al montar (intencional)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para manejar edición de Tipo de Cambio
  const handleTipoCambioEdit = useCallback(
    (rowIndexInTable: number, columnId: number, newValue: string) => {
      console.log('🔄 Iniciando edición Tipo de Cambio:', {
        rowIndexInTable,
        columnId,
        newValue,
        fileName,
      });

      // Validar que sea un número válido o string vacío
      if (newValue !== '') {
        const numericValue = parseFloat(newValue);
        if (isNaN(numericValue) || numericValue < 0) return;
      }

      // Guardar la posición de la celda activa para restaurar el foco
      setActiveCellFocus({ rowIndex: rowIndexInTable, colIndex: columnId });

      // Actualizar el estado local inmediatamente para mantener el foco
      const tipoCambioKey = getTipoCambioKey(rowIndexInTable, columnId);
      setLocalTipoCambioValues((prev) => ({
        ...prev,
        [tipoCambioKey]: newValue,
      }));

      // Actualizar localExcelData sin triggear re-renders inmediatos
      setLocalExcelData((prevData) => {
        if (!prevData) return prevData;
        const { header } = validateAndExtractTableData(prevData);
        const headerIndex = header ? prevData.findIndex((row) => row === header) : -1;
        const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
        const newData = [...prevData];
        if (newData[actualRowIndexInLocalData]) {
          newData[actualRowIndexInLocalData] = [...newData[actualRowIndexInLocalData]];
          newData[actualRowIndexInLocalData][columnId] =
            newValue === '' ? null : parseFloat(newValue);

          console.log('✅ Tipo de Cambio actualizado en localExcelData:', {
            row: actualRowIndexInLocalData,
            column: columnId,
            value: newData[actualRowIndexInLocalData][columnId],
          });
        }
        return newData;
      });

      // 🆕 Recalcular totales de forma más eficiente sin setTimeout
      // Solo actualizar si es necesario y con un pequeño delay para evitar múltiples renders
      const timeoutId = setTimeout(() => {
        setTotalsKey((prev) => prev + 1);
      }, 100); // Reducido a 100ms

      // Programar guardado inmediato para Tipo Cambio
      window.setTimeout(async () => {
        await forceImmediateSave('Tipo Cambio Edit reporte03');
      }, 150); // Ligeramente después del recálculo

      // Limpiar timeout si el componente se desmonta
      return () => clearTimeout(timeoutId);
    },
    [getTipoCambioKey, forceImmediateSave, validateAndExtractTableData, fileName]
  );

  // Función para manejar cambio de Estado SAT
  const handleEstadoSatChange = useCallback(
    (rowIndexInTable: number, newValue: EstadoSAT) => {
      console.log('🔄 Iniciando cambio de Estado SAT:', {
        rowIndexInTable,
        nuevoValor: newValue,
        fileName: fileName,
        numeroDeGuardado: Date.now(), // Para trackear cada cambio
      });

      // Actualizar localExcelData inmediatamente
      setLocalExcelData((prevData) => {
        if (!prevData) return prevData;
        const { header } = validateAndExtractTableData(prevData);
        const headerIndex = header ? prevData.findIndex((row) => row === header) : -1;
        const estadoSatColumnIdx =
          headerIndex !== -1 ? getEstatusSatColumnIndex(prevData, headerIndex) : -1;

        console.log('🔍 Información de columnas:', {
          headerIndex,
          estadoSatColumnIdx,
          rowIndexInTable,
          actualRowIndex: rowIndexInTable + headerIndex + 1,
        });

        if (estadoSatColumnIdx === -1) {
          console.warn('⚠️ No se encontró columna Estado SAT');
          return prevData;
        }

        const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
        const newData = [...prevData];
        if (newData[actualRowIndexInLocalData]) {
          newData[actualRowIndexInLocalData] = [...newData[actualRowIndexInLocalData]];
          const oldValue = newData[actualRowIndexInLocalData][estadoSatColumnIdx];
          newData[actualRowIndexInLocalData][estadoSatColumnIdx] = newValue;

          console.log('✅ Estado SAT cambiado en localExcelData:', {
            row: actualRowIndexInLocalData,
            column: estadoSatColumnIdx,
            oldValue,
            newValue,
          });
        } else {
          console.warn('⚠️ No se encontró la fila para actualizar');
        }
        return newData;
      });

      // Forzar recálculo de totales
      setTotalsKey((prev) => prev + 1);

      // Programar guardado inmediato
      window.setTimeout(async () => {
        await forceImmediateSave('Estado SAT onChange');
      }, 100); // Reducido de 300ms a 100ms
    },
    [getEstatusSatColumnIndex, forceImmediateSave, validateAndExtractTableData, fileName]
  );

  // Función para aplicar un tipo de cambio sugerido a una fila específica
  const applySuggestedTipoCambio = useCallback(
    (rowIndexInTable: number, suggestedTC: number) => {
      console.log('🔄 Aplicando TC Sugerido:', {
        rowIndexInTable,
        suggestedTC,
        fileName,
      });

      // Actualizar localExcelData
      setLocalExcelData((prevData) => {
        if (!prevData) return prevData;
        const { header } = validateAndExtractTableData(prevData);
        const headerIndex = header ? prevData.findIndex((row) => row === header) : -1;
        const tipoCambioColumnIdx =
          headerIndex !== -1 ? getTipoCambioColumnIndex(prevData, headerIndex) : -1;

        if (tipoCambioColumnIdx === -1) {
          console.warn('⚠️ No se encontró columna Tipo Cambio');
          return prevData;
        }

        const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
        const newData = [...prevData];
        if (newData[actualRowIndexInLocalData]) {
          newData[actualRowIndexInLocalData] = [...newData[actualRowIndexInLocalData]];
          newData[actualRowIndexInLocalData][tipoCambioColumnIdx] = suggestedTC;

          console.log('✅ TC Sugerido aplicado:', {
            row: actualRowIndexInLocalData,
            column: tipoCambioColumnIdx,
            newValue: suggestedTC,
          });
        }
        return newData;
      });

      // Actualizar también el estado local de tipo cambio
      const tipoCambioKey = getTipoCambioKey(
        rowIndexInTable,
        localExcelData ? getTipoCambioColumnIndex(localExcelData, 0) : 0
      );
      setLocalTipoCambioValues((prev) => ({
        ...prev,
        [tipoCambioKey]: suggestedTC.toString(),
      }));

      // Recalcular totales
      setTotalsKey((prev) => prev + 1);

      // Guardar inmediatamente
      window.setTimeout(async () => {
        await forceImmediateSave('TC Sugerido aplicado');
      }, 100);
    },
    [
      getTipoCambioKey,
      forceImmediateSave,
      validateAndExtractTableData,
      getTipoCambioColumnIndex,
      fileName,
      localExcelData,
    ]
  );

  // Función para aplicar todos los tipos de cambio sugeridos que son diferentes
  const applyAllSuggestedTipoCambios = useCallback(async () => {
    if (!localExcelData) return;

    console.log('🔄 Aplicando todos los TC Sugeridos diferentes...');

    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;

    if (headerIndex === -1) return;

    const tipoCambioColumnIdx = getTipoCambioColumnIndex(localExcelData, headerIndex);
    const subtotalColumnIdx = getSubtotalColumnIndex(localExcelData, headerIndex);
    const monedaColumnIdx = getMonedaColumnIndex(localExcelData, headerIndex);

    if (tipoCambioColumnIdx === -1 || subtotalColumnIdx === -1 || monedaColumnIdx === -1) return;

    let changesCount = 0;
    const newData = [...localExcelData];

    // Recorrer todas las filas de datos
    for (let i = headerIndex + 1; i < localExcelData.length; i++) {
      const row = localExcelData[i];
      if (!Array.isArray(row)) continue;

      // Verificar si es fila de totales
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;

      const subtotal = row[subtotalColumnIdx];
      const moneda = row[monedaColumnIdx];
      const currentTipoCambio = row[tipoCambioColumnIdx];

      // Solo procesar filas USD con subtotal válido
      if (
        moneda?.toString().toUpperCase() !== 'USD' ||
        typeof subtotal !== 'number' ||
        isNaN(subtotal) ||
        subtotal <= 0
      )
        continue;

      // Buscar el folio
      let folio = '';
      for (let j = 0; j < 10; j++) {
        const cellValue = row[j];
        if (cellValue) {
          const cellStr = cellValue.toString();
          if (cellStr.length > 10 && (cellStr.includes('-') || cellStr.match(/^[A-Z0-9]+$/))) {
            folio = cellStr;
            break;
          }
        }
      }

      if (folio) {
        try {
          const suggestedTC = getSuggestedTipoCambioByFolio(folio, subtotal);
          if (typeof suggestedTC === 'number') {
            // Comparar si son diferentes (con tolerancia para decimales)
            const currentTC = typeof currentTipoCambio === 'number' ? currentTipoCambio : 0;
            if (Math.abs(currentTC - suggestedTC) > 0.0001) {
              newData[i] = [...newData[i]];
              newData[i][tipoCambioColumnIdx] = suggestedTC;
              changesCount++;

              // Actualizar también el estado local de tipo cambio
              const rowIndexInTable = i - headerIndex - 1;
              const tipoCambioKey = getTipoCambioKey(rowIndexInTable, tipoCambioColumnIdx);
              setLocalTipoCambioValues((prev) => ({
                ...prev,
                [tipoCambioKey]: suggestedTC.toString(),
              }));
            }
          }
        } catch {
          console.warn('Error obteniendo TC sugerido para folio:', folio);
        }
      }
    }

    if (changesCount > 0) {
      setLocalExcelData(newData);
      setTotalsKey((prev) => prev + 1);

      console.log(`✅ Aplicados ${changesCount} cambios de TC Sugerido`);

      // Guardar inmediatamente
      await forceImmediateSave(`Aplicados ${changesCount} TC Sugeridos`);
    } else {
      console.log('ℹ️ No hay cambios de TC Sugerido para aplicar');
    }
  }, [
    localExcelData,
    validateAndExtractTableData,
    getTipoCambioColumnIndex,
    getSubtotalColumnIndex,
    getMonedaColumnIndex,
    getSuggestedTipoCambioByFolio,
    getTipoCambioKey,
    forceImmediateSave,
  ]);

  // Función para contar cuántos TC Sugeridos son diferentes al actual
  const countDifferentSuggestedTC = useCallback((): number => {
    if (!localExcelData) return 0;

    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;

    if (headerIndex === -1) return 0;

    const tipoCambioColumnIdx = getTipoCambioColumnIndex(localExcelData, headerIndex);
    const subtotalColumnIdx = getSubtotalColumnIndex(localExcelData, headerIndex);
    const monedaColumnIdx = getMonedaColumnIndex(localExcelData, headerIndex);

    if (tipoCambioColumnIdx === -1 || subtotalColumnIdx === -1 || monedaColumnIdx === -1) return 0;

    let differentCount = 0;

    // Recorrer todas las filas de datos
    for (let i = headerIndex + 1; i < localExcelData.length; i++) {
      const row = localExcelData[i];
      if (!Array.isArray(row)) continue;

      // Verificar si es fila de totales
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;

      const subtotal = row[subtotalColumnIdx];
      const moneda = row[monedaColumnIdx];
      const currentTipoCambio = row[tipoCambioColumnIdx];

      // Solo procesar filas USD con subtotal válido
      if (
        moneda?.toString().toUpperCase() !== 'USD' ||
        typeof subtotal !== 'number' ||
        isNaN(subtotal) ||
        subtotal <= 0
      )
        continue;

      // Buscar el folio
      let folio = '';
      for (let j = 0; j < 10; j++) {
        const cellValue = row[j];
        if (cellValue) {
          const cellStr = cellValue.toString();
          if (cellStr.length > 10 && (cellStr.includes('-') || cellStr.match(/^[A-Z0-9]+$/))) {
            folio = cellStr;
            break;
          }
        }
      }

      if (folio) {
        try {
          const suggestedTC = getSuggestedTipoCambioByFolio(folio, subtotal);
          if (typeof suggestedTC === 'number') {
            // Comparar si son diferentes (con tolerancia para decimales)
            const currentTC = typeof currentTipoCambio === 'number' ? currentTipoCambio : 0;
            if (Math.abs(currentTC - suggestedTC) > 0.0001) {
              differentCount++;
            }
          }
        } catch {
          // Ignorar errores al contar
        }
      }
    }

    return differentCount;
  }, [
    localExcelData,
    validateAndExtractTableData,
    getTipoCambioColumnIndex,
    getSubtotalColumnIndex,
    getMonedaColumnIndex,
    getSuggestedTipoCambioByFolio,
  ]);

  // 🆕 Contar filas que están solo en Mi Admin (morado) -> candidatas a cancelar
  const countRowsOnlyInMiAdmin = useCallback((): number => {
    if (!localExcelData || !isComparisonActive) return 0;

    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
    if (headerIndex === -1) return 0;

    const estadoSatColumnIdx = getEstatusSatColumnIndex(localExcelData, headerIndex);

    let count = 0;
    for (let i = headerIndex + 1; i < localExcelData.length; i++) {
      const row = localExcelData[i];
      if (!Array.isArray(row)) continue;
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;

      // Omitir ya cancelada
      if (estadoSatColumnIdx !== -1 && row[estadoSatColumnIdx] === 'Cancelada') continue;

      // Buscar folio (misma lógica que estilos de fila)
      let folio = '';
      for (let j = 0; j < 15; j++) {
        const cellValue = row[j];
        if (cellValue) {
          const cellStr = cellValue.toString();
          if (cellStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            folio = cellStr;
            break;
          }
          if (cellStr.length > 10 && cellStr.includes('-')) {
            folio = cellStr;
            break;
          }
        }
      }
      if (!folio && row[0]) folio = row[0].toString();
      if (!folio) continue;
      const tooltip = getTooltip(folio) || '';
      if (tooltip.includes('SOLO EN MI ADMIN')) {
        count++;
      }
    }
    return count;
  }, [
    localExcelData,
    validateAndExtractTableData,
    getTooltip,
    isComparisonActive,
    getEstatusSatColumnIndex,
  ]);

  // 🆕 Acción batch: Cancelar todas las facturas solo en Mi Admin (folio sin igual en Auxiliar)
  const cancelAllFacturasSinFolioIgual = useCallback(async () => {
    if (!localExcelData) return;
    if (!isComparisonActive) {
      console.warn(
        '⚠️ La comparación no está activa. Actívela para detectar folios solo en Mi Admin.'
      );
      return;
    }

    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
    if (headerIndex === -1) return;

    const estadoSatColumnIdx = getEstatusSatColumnIndex(localExcelData, headerIndex);
    if (estadoSatColumnIdx === -1) {
      console.warn('⚠️ No se encontró columna Estado SAT para cancelar.');
      return;
    }

    const newData = [...localExcelData];
    let changes = 0;
    for (let i = headerIndex + 1; i < newData.length; i++) {
      const row = newData[i];
      if (!Array.isArray(row)) continue;
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;

      let folio = '';
      for (let j = 0; j < 15; j++) {
        const cellValue = row[j];
        if (cellValue) {
          const cellStr = cellValue.toString();
          if (cellStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            folio = cellStr;
            break;
          }
          if (cellStr.length > 10 && cellStr.includes('-')) {
            folio = cellStr;
            break;
          }
        }
      }
      if (!folio && row[0]) folio = row[0].toString();
      if (!folio) continue;
      const tooltip = getTooltip(folio) || '';
      if (tooltip.includes('SOLO EN MI ADMIN')) {
        if (row[estadoSatColumnIdx] !== 'Cancelada') {
          newData[i] = [...row];
          newData[i][estadoSatColumnIdx] = 'Cancelada';
          changes++;
        }
      }
    }

    if (changes > 0) {
      setLocalExcelData(newData);
      setTotalsKey((prev) => prev + 1);
      console.log(`✅ Canceladas ${changes} facturas sin folio igual (solo en Mi Admin)`);
      await forceImmediateSave(`Canceladas ${changes} facturas solo en Mi Admin (batch)`);
    } else {
      console.log('ℹ️ No se encontraron facturas adicionales para cancelar (solo en Mi Admin).');
    }
  }, [
    localExcelData,
    validateAndExtractTableData,
    getEstatusSatColumnIndex,
    getTooltip,
    forceImmediateSave,
    isComparisonActive,
  ]);

  // Función para manejar la carga del archivo
  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(reporte03FileLoadStart({ fileName: file.name }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('FileReader: No se pudo obtener el resultado del target.');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('XLSX: El archivo Excel no contiene hojas.');
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error(`XLSX: No se pudo encontrar la hoja "${sheetName}".`);
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          header: 1,
          blankrows: false,
          defval: null,
          raw: true,
        });

        if (!Array.isArray(jsonData)) throw new Error('XLSX: Formato de datos inesperado.');

        // Limpiar estados antes de cargar nuevos datos
        setLocalExcelData(null);
        setTotalsKey(0);
        setPagination({ pageIndex: 0, pageSize: 15 });

        dispatch(reporte03FileLoadSuccess({ data: jsonData }));
        // Registrar importación mensual en workbook multi-hoja (Mi Admin)
        (async () => {
          try {
            const metas = await workbookService.listTemplates();
            if (metas && metas.length > 0) {
              const wb = metas[0];
              const yearMonth = `${new Date().getFullYear()}-${String(selectedMonth + 1).padStart(
                2,
                '0'
              )}`;
              await workbookService.addImportedSheet({
                workbookId: wb.id,
                yearMonth,
                category: 'miadmin',
                sheetName: `MiAdmin_${yearMonth}`,
                data: jsonData as any,
              });
              console.log('🧾 (Mi Admin) Hoja mensual registrada', { yearMonth });
              window.dispatchEvent(
                new CustomEvent('workbook-months-updated', { detail: { workbookId: wb.id } })
              );
            }
          } catch (err) {
            console.warn('No se pudo registrar hoja mensual Mi Admin', err);
          }
        })();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        dispatch(reporte03FileLoadFailure({ error: `Error al procesar: ${errorMsg}` }));
      }
    };
    reader.onerror = () => {
      dispatch(
        reporte03FileLoadFailure({
          error: 'Error del navegador al intentar leer el archivo.',
        })
      );
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // Función para calcular totales, incluyendo SUBTOTAL MXN y excluyendo filas Cancelada
  const calculateTotals = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): ExcelRow[] => {
      if (!data || data.length < headerIndex + 1) return data || [];

      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow) || headerRow.length === 0) return data;

      const dataRowsStartIndex = headerIndex + 1;
      const dataRows = data.slice(dataRowsStartIndex);

      // Detectar índices de columnas clave
      const estadoSatColumnIdx = headerRow.findIndex(
        (header) =>
          header?.toString().toLowerCase() === 'estatus sat' ||
          header?.toString().toLowerCase() === 'estado sat'
      );
      const subtotalColumnIdx = headerRow.findIndex((header) =>
        header?.toString().toLowerCase().includes('subtotal')
      );
      const tipoCambioColumnIdx = headerRow.findIndex((header) => {
        const headerStr = header?.toString().toLowerCase() || '';
        return (
          headerStr.includes('tipo cambio') ||
          headerStr.includes('tipo de cambio') ||
          headerStr.includes('tipocambio')
        );
      });
      const monedaColumnIdx = headerRow.findIndex(
        (header) => header?.toString().toLowerCase() === 'moneda'
      );

      // Filtrar solo filas Vigente
      const filteredDataRows = dataRows.filter((row: ExcelRow) => {
        if (!Array.isArray(row) || row.length === 0) return false;
        const firstCol = row[0]?.toString().toLowerCase() || '';
        if (firstCol === 'totales' || firstCol === 'total') return false;
        if (row.every((cell) => cell === null || cell === '')) return false;
        if (estadoSatColumnIdx !== -1 && row[estadoSatColumnIdx] === 'Cancelada') return false;
        return true;
      });

      // Calcular la suma de SUBTOTAL MXN
      let subtotalMXNSum = null;
      if (subtotalColumnIdx !== -1 && tipoCambioColumnIdx !== -1 && monedaColumnIdx !== -1) {
        let sum = 0;
        for (const row of filteredDataRows) {
          const subtotal = row[subtotalColumnIdx];
          const tipoCambio = row[tipoCambioColumnIdx];
          const moneda = row[monedaColumnIdx];
          if (typeof subtotal === 'number' && !isNaN(subtotal)) {
            if (
              moneda?.toString().toUpperCase() === 'USD' &&
              typeof tipoCambio === 'number' &&
              !isNaN(tipoCambio)
            ) {
              sum += subtotal * tipoCambio;
            } else {
              sum += subtotal;
            }
          }
        }
        subtotalMXNSum = Number.isFinite(sum) ? parseFloat(sum.toFixed(2)) : null;
      }

      // Construir la fila de totales básica (sin columnas calculadas)
      const totalRow: ExcelRow = ['Totales'];
      for (let i = 1; i < headerRow.length; i++) {
        let sum = 0;
        let hasValues = false;
        for (const row of filteredDataRows) {
          if (i < row.length) {
            const cell = row[i];
            if (typeof cell === 'number' && !isNaN(cell)) {
              sum += cell;
              hasValues = true;
            }
          }
        }
        totalRow.push(hasValues ? parseFloat(sum.toFixed(2)) : null);
      }

      // Insertar el total de SUBTOTAL MXN en la posición correcta (antes de Moneda)
      let insertIdx = -1;
      for (let i = 0; i < headerRow.length; i++) {
        if (headerRow[i]?.toString().toLowerCase() === 'moneda') {
          insertIdx = i;
          break;
        }
      }

      if (insertIdx !== -1 && subtotalMXNSum !== null) {
        // Insertar SUBTOTAL MXN en la fila de totales antes de Moneda
        totalRow.splice(insertIdx + 1, 0, subtotalMXNSum);
      }

      const resultData = [
        ...data.slice(0, headerIndex + 1),
        ...data.slice(dataRowsStartIndex).filter((row: ExcelRow) => {
          if (!Array.isArray(row) || row.length === 0) return true;
          const firstCol = row[0]?.toString().toLowerCase() || '';
          if (firstCol === 'totales' || firstCol === 'total') return false;
          return true;
        }),
        totalRow,
      ];

      const finalResult = resultData.filter((row: ExcelRow, index: number, self: ExcelRow[]) => {
        const firstCol = row[0]?.toString().toLowerCase() || '';
        if (firstCol === 'totales' || firstCol === 'total') {
          return (
            index ===
            self.findIndex((r: ExcelRow) => (r[0]?.toString().toLowerCase() || '') === firstCol)
          );
        }
        return true;
      });

      return finalResult;
    },
    []
  );

  // Efecto para inicializar localExcelData cuando excelData cambia
  useEffect(() => {
    if (excelData && !localExcelData) {
      const deepCopy = excelData.map((row: ExcelRow) => (Array.isArray(row) ? [...row] : row));
      const { header } = validateAndExtractTableData(deepCopy);
      const headerIndex = header ? deepCopy.findIndex((row) => row === header) : -1;
      const dataWithEstatusSat =
        headerIndex !== -1 ? initializeEstatusSatValues(deepCopy, headerIndex) : deepCopy;
      setLocalExcelData(dataWithEstatusSat);
      setTotalsKey((prev) => prev + 1);
    } else if (!excelData && localExcelData) {
      setLocalExcelData(null);
      setTotalsKey(0);
    }
  }, [excelData, localExcelData, initializeEstatusSatValues, validateAndExtractTableData]);

  const updatedExcelData = useMemo(() => {
    if (!localExcelData) return [];
    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
    // Referenciar totalsKey explícitamente para justificar dependencia (forzar re-cálculo)
    void totalsKey;
    if (headerIndex === -1) return localExcelData;
    return calculateTotals(localExcelData, headerIndex);
  }, [localExcelData, calculateTotals, totalsKey, validateAndExtractTableData]);

  // Calcular la suma de SUBTOTAL MXN para la comparación
  useEffect(() => {
    if (!localExcelData) {
      setSubtotalMXNTotal(null);
      return;
    }
    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
    if (headerIndex === -1) {
      setSubtotalMXNTotal(null);
      return;
    }
    // Buscar índices necesarios
    const subtotalColumnIdx = getSubtotalColumnIndex(localExcelData, headerIndex);
    const tipoCambioColumnIdx = getTipoCambioColumnIndex(localExcelData, headerIndex);
    const monedaColumnIdx = getMonedaColumnIndex(localExcelData, headerIndex);
    const estadoSatColumnIdx = getEstatusSatColumnIndex(localExcelData, headerIndex);
    if (subtotalColumnIdx === -1 || tipoCambioColumnIdx === -1 || monedaColumnIdx === -1) {
      setSubtotalMXNTotal(null);
      return;
    }
    let total = 0;
    for (let i = headerIndex + 1; i < localExcelData.length; i++) {
      const row = localExcelData[i];
      if (!Array.isArray(row)) continue;
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;
      // Excluir filas canceladas para que coincida con la lógica de la fila Totales
      if (estadoSatColumnIdx !== -1 && row[estadoSatColumnIdx] === 'Cancelada') continue;
      const subtotal = row[subtotalColumnIdx];
      const tipoCambio = row[tipoCambioColumnIdx];
      const moneda = row[monedaColumnIdx];
      if (typeof subtotal === 'number' && !isNaN(subtotal)) {
        if (
          moneda?.toString().toUpperCase() === 'USD' &&
          typeof tipoCambio === 'number' &&
          !isNaN(tipoCambio)
        ) {
          total += subtotal * tipoCambio;
        } else {
          total += subtotal;
        }
      }
    }
    setSubtotalMXNTotal(Number.isFinite(total) ? total : null);
  }, [
    localExcelData,
    getSubtotalColumnIndex,
    getTipoCambioColumnIndex,
    getMonedaColumnIndex,
    getEstatusSatColumnIndex,
    validateAndExtractTableData,
  ]);

  // 🔄 Auto-recalculation: Sincronizar con contexto cuando hay datos actualizados
  useEffect(() => {
    if (updatedExcelData && updatedExcelData.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          updateReporte03Data(updatedExcelData);
          console.log('🔄 Datos Mi Admin sincronizados con contexto:', {
            rowCount: updatedExcelData.length,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn('⚠️ Error sincronizando datos con contexto:', error);
        }
      }, 50); // Reducido a 50ms para sincronización más rápida
      return () => clearTimeout(timeoutId);
    } else {
      try {
        updateReporte03Data([]);
        console.log('🔄 Contexto limpiado (sin datos)');
      } catch (error) {
        console.warn('⚠️ Error limpiando datos del contexto:', error);
      }
    }
  }, [updatedExcelData, updateReporte03Data]);

  // 🆕 Sincronizar localExcelData con Redux para mantener consistencia
  useEffect(() => {
    if (localExcelData && Array.isArray(localExcelData) && localExcelData.length > 0) {
      // Dispatch la acción para actualizar Redux con los cambios locales
      dispatch(reporte03UpdateLocalChanges({ data: localExcelData }));
      console.log('🔄 Redux sincronizado con localExcelData en reporte03:', {
        dataLength: localExcelData.length,
        timestamp: Date.now(),
      });
    }
  }, [localExcelData, dispatch]);

  // 🛡️ Guardado automático cuando cambian los datos locales
  useEffect(() => {
    if (localExcelData && fileName) {
      console.log('⏰ Programando guardado automático en 2 segundos...');
      const timeoutId = setTimeout(async () => {
        console.log('🔄 Ejecutando guardado automático programado...');
        const success = await saveCurrentWork();
        if (success) {
          console.log('✅ Guardado automático completado');
        } else {
          console.log('⚠️ Guardado automático omitido o falló');
        }
      }, 2000); // Guardar después de 2 segundos de inactividad
      return () => {
        console.log('🧹 Limpiando timeout de guardado automático');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('⏭️ Guardado automático omitido:', {
        hasLocalExcelData: !!localExcelData,
        hasFileName: !!fileName,
      });
    }
  }, [localExcelData, fileName, saveCurrentWork]);

  // 🆕 useEffect para restaurar el foco después de actualizaciones
  useEffect(() => {
    if (activeCellFocus && activeCellRef.current) {
      const timer = setTimeout(() => {
        if (activeCellRef.current) {
          activeCellRef.current.focus();
          activeCellRef.current.select();
          console.log('🎯 Foco restaurado en celda:', activeCellFocus);
        }
      }, 50); // Pequeño delay para asegurar que el DOM se ha actualizado

      return () => clearTimeout(timer);
    }
  }, [activeCellFocus, totalsKey]); // Escuchar cambios en totalsKey para restaurar foco después del recálculo

  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
    if (!Array.isArray(updatedExcelData) || updatedExcelData.length === 0) {
      return [];
    }

    const { header } = validateAndExtractTableData(updatedExcelData);
    if (!header) return [];

    const headerIndex = updatedExcelData.findIndex((row) => row === header);
    if (headerIndex === -1) return [];

    // Capturar el estado actual para el closure de Cell
    const currentLocalData = localExcelData;

    const allColumns: MRT_ColumnDef<DataRow>[] = [];

    header.forEach((headerCell, colIndex) => {
      const headerStr = typeof headerCell === 'string' ? headerCell.toLowerCase() : '';

      // 🆕 Columna Estado SAT editable
      if (headerStr === 'estatus sat' || headerStr === 'estado sat') {
        allColumns.push({
          id: colIndex.toString(),
          accessorKey: colIndex.toString(),
          header: typeof headerCell === 'string' ? headerCell : `Columna ${colIndex + 1}`,
          size: 120,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';
            if (isRowTotales) return null;

            const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
            let currentValue: EstadoSAT = 'Vigente';

            if (
              currentLocalData &&
              currentLocalData[actualRowIndexInLocalData] &&
              currentLocalData[actualRowIndexInLocalData][colIndex] !== undefined
            ) {
              const cellValue = currentLocalData[actualRowIndexInLocalData][colIndex];
              if (cellValue === 'Vigente' || cellValue === 'Cancelada') {
                currentValue = cellValue as EstadoSAT;
              }
            }

            const estadoSatColumnIdx = getEstatusSatColumnIndex(localExcelData, headerIndex);
            if (colIndex !== estadoSatColumnIdx) {
              return null;
            }

            const handleBlur = () => {
              if (fileName && excelData && localExcelData) {
                setTimeout(async () => {
                  await forceImmediateSave('Estado SAT onBlur');
                }, 100);
              }
            };
            const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const newValue = e.target.value as EstadoSAT;
              handleEstadoSatChange(rowIndexInTable, newValue);
            };
            const selectId = `estado-sat-${rowIndexInTable}-${colIndex}`;
            return (
              <select
                id={selectId}
                value={currentValue}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: currentValue === 'Cancelada' ? '#f3e5f5' : 'inherit',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Vigente">Vigente</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            );
          },
        });
        return;
      }

      // 🆕 Columna Tipo de Cambio editable
      if (
        headerStr.includes('tipo cambio') ||
        headerStr.includes('tipo de cambio') ||
        headerStr.includes('tipocambio')
      ) {
        allColumns.push({
          id: colIndex.toString(),
          accessorKey: colIndex.toString(),
          header: typeof headerCell === 'string' ? headerCell : `Columna ${colIndex + 1}`,
          size: 100,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';
            if (isRowTotales) return null;

            const tipoCambioKey = getTipoCambioKey(rowIndexInTable, colIndex);
            let currentValue = localTipoCambioValues[tipoCambioKey] || '';
            if (currentValue === '' && currentLocalData) {
              const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
              if (
                currentLocalData[actualRowIndexInLocalData] &&
                currentLocalData[actualRowIndexInLocalData][colIndex] !== undefined
              ) {
                const cellValue = currentLocalData[actualRowIndexInLocalData][colIndex];
                if (cellValue !== null && cellValue !== undefined) {
                  currentValue = cellValue.toString();
                }
              }
            }
            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const newValue = e.target.value;
              handleTipoCambioEdit(rowIndexInTable, colIndex, newValue);
            };

            const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
              // Guardar la referencia cuando se hace foco
              activeCellRef.current = e.target;
              setActiveCellFocus({ rowIndex: rowIndexInTable, colIndex });
              e.target.select();
            };

            const handleBlur = () => {
              // Limpiar la referencia cuando se pierde el foco
              if (activeCellRef.current === document.activeElement || !document.activeElement) {
                // Solo limpiar si realmente se perdió el foco
                setTimeout(() => {
                  if (activeCellRef.current !== document.activeElement) {
                    activeCellRef.current = null;
                    setActiveCellFocus(null);
                  }
                }, 100);
              }
            };

            const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (
                [8, 9, 27, 13, 46, 35, 36, 37, 39].indexOf(e.keyCode) !== -1 ||
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)
              ) {
                return;
              }
              if (
                (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                (e.keyCode < 96 || e.keyCode > 105) &&
                e.keyCode !== 190 &&
                e.keyCode !== 188 &&
                e.keyCode !== 110
              ) {
                e.preventDefault();
              }
            };

            // Determinar si esta celda debe tener la referencia
            const isActiveCell =
              activeCellFocus?.rowIndex === rowIndexInTable &&
              activeCellFocus?.colIndex === colIndex;

            return (
              <input
                ref={isActiveCell ? activeCellRef : undefined}
                type="text"
                value={currentValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            );
          },
        });

        // 🆕 Agregar la columna TC Sugerido inmediatamente después de TipoCambio
        allColumns.push({
          id: `tc-sugerido-after-tipocambio-${colIndex}`,
          accessorKey: `tc-sugerido-after-tipocambio-${colIndex}`,
          header: 'TC Sugerido',
          size: 140,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';

            if (isRowTotales) {
              return <span style={{ fontWeight: 'bold' }}>-</span>;
            }

            // Obtener valores necesarios para el cálculo
            const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;

            if (!currentLocalData || !currentLocalData[actualRowIndexInLocalData]) {
              return <span>-</span>;
            }

            const currentRow = currentLocalData[actualRowIndexInLocalData];
            const subtotalColumnIdx = getSubtotalColumnIndex(currentLocalData, headerIndex);
            const monedaColumnIdx = getMonedaColumnIndex(currentLocalData, headerIndex);
            const tipoCambioColumnIdx = getTipoCambioColumnIndex(currentLocalData, headerIndex);

            if (subtotalColumnIdx === -1 || monedaColumnIdx === -1 || tipoCambioColumnIdx === -1) {
              return <span>-</span>;
            }

            const subtotal = currentRow[subtotalColumnIdx];
            const moneda = currentRow[monedaColumnIdx];
            const currentTipoCambio = currentRow[tipoCambioColumnIdx];

            // Solo mostrar TC Sugerido para filas USD
            if (
              moneda?.toString().toUpperCase() !== 'USD' ||
              typeof subtotal !== 'number' ||
              isNaN(subtotal) ||
              subtotal <= 0
            ) {
              return <span style={{ color: '#9e9e9e' }}>-</span>;
            }

            // Buscar el folio en las primeras columnas
            let folio = '';
            for (let i = 0; i < 10; i++) {
              const cellValue = currentLocalData[actualRowIndexInLocalData][i];
              if (cellValue) {
                const cellStr = cellValue.toString();
                if (
                  cellStr.length > 10 &&
                  (cellStr.includes('-') || cellStr.match(/^[A-Z0-9]+$/))
                ) {
                  folio = cellStr;
                  break;
                }
              }
            }

            if (folio) {
              try {
                const suggestedTC = getSuggestedTipoCambioByFolio(folio, subtotal);
                if (typeof suggestedTC === 'number') {
                  // Comparar si son diferentes (con tolerancia para decimales)
                  const currentTC = typeof currentTipoCambio === 'number' ? currentTipoCambio : 0;
                  const isDifferent = Math.abs(currentTC - suggestedTC) > 0.0001;

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span
                        style={{
                          color: isDifferent ? '#ff9800' : '#4caf50',
                          fontWeight: isDifferent ? 600 : 500,
                          fontSize: '0.875rem',
                        }}
                      >
                        {suggestedTC.toFixed(4)}
                      </span>
                      {isDifferent && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            applySuggestedTipoCambio(rowIndexInTable, suggestedTC);
                          }}
                          sx={{
                            minWidth: 24,
                            width: 24,
                            height: 24,
                            p: 0,
                            fontSize: '0.7rem',
                          }}
                          title={`Aplicar TC Sugerido: ${suggestedTC.toFixed(4)}`}
                        >
                          ✓
                        </Button>
                      )}
                    </Box>
                  );
                } else {
                  return <span style={{ color: '#9e9e9e' }}>{suggestedTC}</span>;
                }
              } catch {
                return <span style={{ color: '#f44336' }}>Error</span>;
              }
            }

            return <span>-</span>;
          },
        });

        return;
      }

      // 🆕 Columna calculada "SUBTOTAL MXN" - antes de Moneda
      if (headerStr === 'moneda') {
        // Primero agregar la columna SUBTOTAL AUX
        allColumns.push({
          id: 'subtotal-aux',
          accessorKey: 'subtotal-aux',
          header: 'SUBTOTAL AUX',
          size: 120,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';

            if (isRowTotales) {
              try {
                const auxSubtotal = getSubtotalFromReporte02();
                const equal = isComparisonActive ? areSubtotalsEqual() : false;
                return (
                  <span
                    style={{
                      fontWeight: 700,
                      color: isComparisonActive ? (equal ? '#0d47a1' : '#b71c1c') : 'inherit',
                      background: isComparisonActive
                        ? equal
                          ? '#e3f2fd'
                          : '#ffebee'
                        : 'transparent',
                      display: 'inline-block',
                      padding: '2px 4px',
                      borderRadius: 4,
                    }}
                  >
                    {auxSubtotal?.toFixed(2) || 'N/A'}
                  </span>
                );
              } catch {
                return <span style={{ color: '#f44336' }}>Error</span>;
              }
            }

            // Para filas individuales, buscar por folio
            const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;

            if (!currentLocalData || !currentLocalData[actualRowIndexInLocalData]) {
              return <span>-</span>;
            }

            // Buscar el folio en las primeras columnas
            let folio = '';
            for (let i = 0; i < 10; i++) {
              // Revisar las primeras 10 columnas
              const cellValue = currentLocalData[actualRowIndexInLocalData][i];
              if (cellValue) {
                const cellStr = cellValue.toString();
                // Si parece un UUID o folio
                if (
                  cellStr.length > 10 &&
                  (cellStr.includes('-') || cellStr.match(/^[A-Z0-9]+$/))
                ) {
                  folio = cellStr;
                  break;
                }
              }
            }

            if (folio) {
              try {
                const auxSubtotal = getSubtotalAuxByFolio(folio);
                if (typeof auxSubtotal === 'number') {
                  return (
                    <span style={{ color: '#2e7d32', fontWeight: 500 }}>
                      {auxSubtotal.toFixed(2)}
                    </span>
                  );
                } else {
                  return <span style={{ color: '#9e9e9e' }}>N/F</span>; // No Encontrado
                }
              } catch {
                return <span style={{ color: '#f44336' }}>Error</span>;
              }
            }

            return <span>-</span>;
          },
        });

        // Luego agregar la columna SUBTOTAL MXN
        allColumns.push({
          id: 'subtotal-mxn',
          accessorKey: 'subtotal-mxn',
          header: 'SUBTOTAL MXN',
          size: 120,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';

            if (isRowTotales) {
              const { header } = validateAndExtractTableData(currentLocalData || []);
              const headerIndex = header
                ? (currentLocalData || []).findIndex((row) => row === header)
                : -1;
              const subtotalColumnIdx = getSubtotalColumnIndex(currentLocalData, headerIndex);
              const tipoCambioColumnIdx = getTipoCambioColumnIndex(currentLocalData, headerIndex);
              const monedaColumnIdx = getMonedaColumnIndex(currentLocalData, headerIndex);

              if (
                subtotalColumnIdx !== -1 &&
                tipoCambioColumnIdx !== -1 &&
                monedaColumnIdx !== -1
              ) {
                let sum = 0;
                for (let i = headerIndex + 1; i < (currentLocalData || []).length; i++) {
                  const row = (currentLocalData || [])[i];
                  if (!Array.isArray(row)) continue;
                  const firstCol = row[0]?.toString().toLowerCase() || '';
                  if (firstCol === 'totales' || firstCol === 'total') continue;
                  const estadoSatColumnIdx = getEstatusSatColumnIndex(
                    currentLocalData,
                    headerIndex
                  );
                  if (estadoSatColumnIdx !== -1 && row[estadoSatColumnIdx] === 'Cancelada')
                    continue;
                  const subtotal = row[subtotalColumnIdx];
                  const tipoCambio = row[tipoCambioColumnIdx];
                  const moneda = row[monedaColumnIdx];
                  if (typeof subtotal === 'number' && !isNaN(subtotal)) {
                    if (
                      moneda?.toString().toUpperCase() === 'USD' &&
                      typeof tipoCambio === 'number' &&
                      !isNaN(tipoCambio)
                    ) {
                      sum += subtotal * tipoCambio;
                    } else {
                      sum += subtotal;
                    }
                  }
                }
                const equal = isComparisonActive ? areSubtotalsEqual() : false;
                return (
                  <span
                    style={{
                      fontWeight: 700,
                      color: isComparisonActive ? (equal ? '#0d47a1' : '#b71c1c') : '#d32f2f',
                      background: isComparisonActive
                        ? equal
                          ? '#e3f2fd'
                          : '#ffebee'
                        : 'transparent',
                      display: 'inline-block',
                      padding: '2px 4px',
                      borderRadius: 4,
                    }}
                  >
                    {sum.toFixed(2)}
                  </span>
                );
              }
              return <span style={{ fontWeight: 700 }}>-</span>;
            }

            // Obtener valores necesarios para el cálculo
            const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;

            if (!currentLocalData || !currentLocalData[actualRowIndexInLocalData]) {
              return <span>-</span>;
            }

            const currentRow = currentLocalData[actualRowIndexInLocalData];
            const subtotalColumnIdx = getSubtotalColumnIndex(currentLocalData, headerIndex);
            const tipoCambioColumnIdx = getTipoCambioColumnIndex(currentLocalData, headerIndex);
            const monedaColumnIdx = getMonedaColumnIndex(currentLocalData, headerIndex);

            if (subtotalColumnIdx === -1 || tipoCambioColumnIdx === -1 || monedaColumnIdx === -1) {
              return <span>-</span>;
            }

            const subtotal = currentRow[subtotalColumnIdx];
            const tipoCambio = currentRow[tipoCambioColumnIdx];
            const moneda = currentRow[monedaColumnIdx];

            if (typeof subtotal === 'number' && !isNaN(subtotal)) {
              if (
                moneda?.toString().toUpperCase() === 'USD' &&
                typeof tipoCambio === 'number' &&
                !isNaN(tipoCambio)
              ) {
                const subtotalMXN = subtotal * tipoCambio;
                return (
                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {subtotalMXN.toFixed(2)}
                  </span>
                );
              } else {
                // Si la moneda NO es USD, mostrar el subtotal original
                return (
                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {subtotal.toFixed(2)}
                  </span>
                );
              }
            }
            return <span>-</span>;
          },
        });

        // Finalmente, agregar la columna Moneda original
        allColumns.push({
          id: colIndex.toString(),
          accessorKey: colIndex.toString(),
          header: typeof headerCell === 'string' ? headerCell : `Columna ${colIndex + 1}`,
          Cell: ({ cell }) => {
            const cellValue = cell.getValue();
            return <span>{cellValue?.toString() || ''}</span>;
          },
        });
        return;
      }

      // Columna regular
      allColumns.push({
        id: colIndex.toString(),
        accessorKey: colIndex.toString(),
        header: typeof headerCell === 'string' ? headerCell : `Columna ${colIndex + 1}`,
        Cell: ({ cell }) => {
          const cellValue = cell.getValue();
          const isNumericColumn =
            (typeof headerCell === 'string' &&
              (headerCell.toLowerCase().includes('subtotal') ||
                headerCell.toLowerCase().includes('total') ||
                headerCell.toLowerCase().includes('importe') ||
                headerCell.toLowerCase().includes('monto'))) ||
            (typeof cellValue === 'number' &&
              typeof headerCell === 'string' &&
              !headerCell.toLowerCase().includes('fecha'));

          if (isNumericColumn && typeof cellValue === 'number') {
            return <span>{cellValue.toFixed(2)}</span>;
          }
          return <span>{cellValue?.toString() || ''}</span>;
        },
      });
    });

    return allColumns;
  }, [
    updatedExcelData,
    validateAndExtractTableData,
    localExcelData,
    localTipoCambioValues,
    getSubtotalFromReporte02,
    getSubtotalAuxByFolio,
    getSuggestedTipoCambioByFolio,
    handleTipoCambioEdit,
    handleEstadoSatChange,
    getTipoCambioKey,
    getEstatusSatColumnIndex,
    getSubtotalColumnIndex,
    getTipoCambioColumnIndex,
    getMonedaColumnIndex,
    forceImmediateSave,
    fileName,
    excelData,
    applySuggestedTipoCambio,
    activeCellFocus?.rowIndex,
    activeCellFocus?.colIndex,
    areSubtotalsEqual,
    isComparisonActive,
  ]);

  const tableData = useMemo<DataRow[]>(() => {
    if (!Array.isArray(updatedExcelData) || updatedExcelData.length === 0 || columns.length === 0) {
      return [];
    }

    const { header, content } = validateAndExtractTableData(updatedExcelData);
    if (!header || !content.length) {
      return [];
    }

    return content.map((rowArray, index) => {
      const rowObject: DataRow = {};
      rowArray.forEach((cellValue: ExcelCellValue, colIndex: number) => {
        rowObject[colIndex.toString()] = cellValue;
      });

      rowObject._id = `row-${index}`;
      return rowObject;
    });
  }, [updatedExcelData, columns, validateAndExtractTableData]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* 🗑️ SELECTOR DE MES ELIMINADO: Ahora se usa el selector centralizado en el App Bar */}
      {/* Sección de carga de archivo */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, flexShrink: 0 }}
          >
            Archivo:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: fileName ? 'text.primary' : 'text.disabled',
            }}
          >
            {fileName || 'Ningún archivo seleccionado'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
          <input
            id="excelFile-reporte03"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChangeInternal}
            style={{ display: 'none' }}
            disabled={loading}
          />
          <label htmlFor="excelFile-reporte03">
            <Button
              variant="contained"
              component="span"
              disabled={loading}
              startIcon={!loading ? <UploadFileIcon /> : undefined}
              size="small"
              sx={{ minWidth: 'auto' }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Cargar Archivo'}
            </Button>
          </label>

          {/* Mostrar indicador solo si hay discrepancia para reducir ruido visual */}
          {excelData && isComparisonActive && !areSubtotalsEqual() && (
            <Tooltip
              title={`Subtotal MXN Mi Admin: $${
                subtotalMXNTotal !== null ? subtotalMXNTotal.toFixed(2) : 'N/A'
              }`}
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  bgcolor: 'warning.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  ⚠️ Totales diferentes
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Botón de comparación mejorado con ToggleButton */}
          {excelData && (
            <Tooltip
              title={isComparisonActive ? 'Desactivar comparación' : 'Activar comparación'}
              arrow
            >
              <ToggleButton
                value="comparison"
                selected={isComparisonActive}
                onChange={toggleComparison}
                size="small"
                sx={{
                  border: `1px solid ${isComparisonActive ? '#2e7d32' : '#1976d2'}`,
                  color: isComparisonActive ? '#2e7d32' : '#1976d2',
                  backgroundColor: isComparisonActive ? '#e8f5e8' : 'transparent',
                  '&:hover': {
                    backgroundColor: isComparisonActive ? '#c8e6c9' : '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    '&:hover': {
                      backgroundColor: '#c8e6c9',
                    },
                  },
                  borderRadius: '6px',
                  px: 1.5,
                  width: '110px',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  gap: 0.5,
                  height: '32px',
                }}
              >
                {isComparisonActive ? (
                  <VisibilityIcon fontSize="small" />
                ) : (
                  <CompareArrowsIcon fontSize="small" />
                )}
                {isComparisonActive ? 'Comparando' : 'Comparar'}
              </ToggleButton>
            </Tooltip>
          )}

          {/* Menú desplegable para opciones de guardado */}
          {(savedWorkExists || excelData) && (
            <>
              <Tooltip title="Opciones de guardado" arrow>
                <IconButton
                  size="small"
                  onClick={handleSaveMenuClick}
                  sx={{ color: 'primary.main' }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={saveMenuAnchor}
                open={saveMenuOpen}
                onClose={handleSaveMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {excelData && (
                  <MenuItem
                    onClick={() => {
                      saveCurrentWork();
                      handleSaveMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <SaveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Guardar trabajo actual</ListItemText>
                  </MenuItem>
                )}
                {savedWorkExists && (
                  <MenuItem
                    onClick={() => {
                      restoreWork();
                      handleSaveMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <RestoreIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Restaurar trabajo guardado</ListItemText>
                  </MenuItem>
                )}
                {savedWorkExists && (
                  <MenuItem
                    onClick={() => {
                      clearSavedWork();
                      handleSaveMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Limpiar todo el trabajo</ListItemText>
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}
        >
          Error: {error}
        </Typography>
      )}

      {/* 🆕 Zona de acciones batch en dos columnas */}
      {!error &&
        columns.length > 0 &&
        localExcelData &&
        (() => {
          const differentCount = countDifferentSuggestedTC();
          const cancelCount = countRowsOnlyInMiAdmin();
          if (differentCount === 0 && cancelCount === 0) return null;
          return (
            <Box
              sx={{
                mb: 2,
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                maxWidth: 900,
                mx: 'auto',
              }}
            >
              {differentCount > 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    onClick={applyAllSuggestedTipoCambios}
                    startIcon={<SaveIcon />}
                    sx={{ fontWeight: 600 }}
                  >
                    Aplicar todos los TC Sugeridos ({differentCount})
                  </Button>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    Aplica los tipos de cambio sugeridos distintos a los actuales.
                  </Typography>
                </Box>
              )}
              {cancelCount > 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    onClick={cancelAllFacturasSinFolioIgual}
                    startIcon={<DeleteIcon />}
                    sx={{ fontWeight: 600 }}
                  >
                    Cancelar todas Facturas sin Folio Igual ({cancelCount})
                  </Button>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    Marca Estado SAT = Cancelada para facturas solo presentes en Mi Admin.
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })()}

      {!error && columns.length > 0 && (
        <MaterialReactTable
          columns={columns}
          data={tableData}
          localization={MRT_Localization_ES}
          state={{
            isLoading: loading,
            showProgressBars: loading,
            pagination: pagination,
          }}
          onPaginationChange={setPagination}
          manualPagination={false}
          enableColumnFilters={true}
          enableSorting={true}
          enableMultiSort={true}
          manualSorting={false}
          enableColumnOrdering={true}
          enablePagination
          enableDensityToggle
          enableFullScreenToggle
          enableHiding
          initialState={{
            density: 'compact',
          }}
          enableRowSelection={false}
          enableRowVirtualization={false}
          autoResetPageIndex={false}
          getRowId={(row, index) => row._id || `row-${index}`}
          enableStickyHeader={false}
          // Usar key para forzar re-renderizado completo cuando cambia el estado de comparación
          key={`reporte03-table-${isComparisonActive ? 'active' : 'inactive'}-${
            lastComparisonTime?.getTime() || 0
          }`}
          muiTableBodyRowProps={({ row }) => {
            const rowData = row.original;

            // ✅ NUEVO: Estilo para filas canceladas (prioritario)
            // Verificar si la fila tiene Estado SAT = "Cancelada"
            const { header } = validateAndExtractTableData(localExcelData || []);
            const headerIndex =
              header && localExcelData ? localExcelData.findIndex((row) => row === header) : -1;
            const estadoSatColumnIdx =
              headerIndex !== -1 ? getEstatusSatColumnIndex(localExcelData, headerIndex) : -1;
            let isRowCancelled = false;

            if (estadoSatColumnIdx !== -1) {
              const estadoSatValue = rowData?.[estadoSatColumnIdx.toString()];
              isRowCancelled = estadoSatValue === 'Cancelada';
            }

            // Detectar fila de totales
            const firstCell = rowData?.['0']?.toString().toLowerCase() || '';
            const isTotalsRow = firstCell === 'totales' || firstCell === 'total';

            // Si la fila está cancelada, aplicar estilo de cancelada y retornar
            if (isRowCancelled) {
              return {
                sx: {
                  backgroundColor: '#f3e5f5 !important', // Fondo morado claro (con !important para forzar)
                  color: '#9e9e9e !important', // Texto en gris (con !important)
                  '& .MuiTableCell-root': {
                    backgroundColor: '#f3e5f5 !important', // Asegurar que todas las celdas tengan el fondo morado
                    color: '#9e9e9e !important', // Asegurar que todo el texto sea gris
                    borderBottom: '1px solid #e1bee7 !important', // Borde inferior morado más oscuro
                  },
                  '&:hover': {
                    backgroundColor: '#e1bee7 !important', // Morado más intenso en hover
                    '& .MuiTableCell-root': {
                      backgroundColor: '#e1bee7 !important', // Asegurar hover en todas las celdas
                    },
                  },
                },
                title: 'Fila cancelada - Los valores no se incluyen en totales',
              };
            }

            // Estilos específicos para fila de totales según comparación
            if (isTotalsRow && isComparisonActive) {
              const equal = areSubtotalsEqual();
              if (equal) {
                return {
                  sx: {
                    backgroundColor: '#e3f2fd !important', // azul claro
                    '& .MuiTableCell-root': {
                      backgroundColor: '#e3f2fd !important',
                      color: '#0d47a1 !important', // azul más oscuro
                      fontWeight: 700,
                      borderTop: '2px solid #90caf9 !important',
                      borderBottom: '2px solid #90caf9 !important',
                    },
                  },
                  title: 'Totales coinciden entre Mi Admin y Auxiliar',
                };
              } else {
                return {
                  sx: {
                    backgroundColor: '#ffebee !important', // rojo claro
                    '& .MuiTableCell-root': {
                      backgroundColor: '#ffebee !important',
                      color: '#b71c1c !important',
                      fontWeight: 700,
                      borderTop: '2px solid #ef9a9a !important',
                      borderBottom: '2px solid #ef9a9a !important',
                    },
                  },
                  title: 'Totales diferentes entre Mi Admin y Auxiliar',
                };
              }
            }

            // Si la comparación no está activa, no aplicar otros estilos extra (pero resaltar totales levemente)
            if (isTotalsRow && !isComparisonActive) {
              return {
                sx: {
                  backgroundColor: '#f5f5f5 !important',
                  '& .MuiTableCell-root': {
                    backgroundColor: '#f5f5f5 !important',
                    fontWeight: 700,
                  },
                },
                title: 'Fila de totales',
              };
            }

            // Si la comparación no está activa y no es totales/cancelada, sin estilos
            if (!isComparisonActive) return {};

            // Para reporte03, buscar el folio (UUID) en las columnas apropiadas
            let folio = '';

            // Buscar en las columnas que podrían contener UUID o folio
            for (let i = 0; i < 15; i++) {
              // Revisar las primeras 15 columnas
              const cellValue = rowData?.[i.toString()];
              if (cellValue) {
                const cellStr = cellValue.toString();
                // Si parece un UUID (formato UUID típico con guiones)
                if (
                  cellStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                ) {
                  folio = cellStr;
                  break;
                }
                // O si contiene la palabra "uuid" en el encabezado o es un folio largo
                if (cellStr.length > 10 && cellStr.includes('-')) {
                  folio = cellStr;
                  break;
                }
              }
            }

            // Si no se encontró folio específico, usar la primera columna como fallback
            if (!folio && rowData?.['0']) {
              folio = rowData['0'].toString();
            }

            const rowStyles = getRowStyle(folio);
            const rowTooltip = getTooltip(folio);

            // Crear una copia para modificar los estilos
            const enhancedStyles = { ...rowStyles };

            // Agregar !important para forzar los estilos
            if (enhancedStyles.backgroundColor) {
              enhancedStyles.backgroundColor = enhancedStyles.backgroundColor + ' !important';
            }
            if (enhancedStyles.borderLeft) {
              enhancedStyles.borderLeft = enhancedStyles.borderLeft + ' !important';
            }

            return {
              sx: enhancedStyles,
              title: rowTooltip,
            };
          }}
        />
      )}

      {!loading &&
        !error &&
        (!localExcelData || columns.length === 0 || tableData.length === 0) &&
        fileName && (
          <Typography sx={{ my: 2, textAlign: 'center' }}>
            No hay datos para mostrar en la tabla. Verifique el archivo o los filtros.
          </Typography>
        )}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReporteMiAdmin;
