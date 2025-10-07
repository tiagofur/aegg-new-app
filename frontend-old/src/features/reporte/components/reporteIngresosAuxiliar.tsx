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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as XLSX from 'xlsx';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  reporte02FileLoadStart,
  reporte02FileLoadSuccess,
  reporte02FileLoadFailure,
  reporte02UpdateLocalChanges,
  resetReporte02Data,
} from '../redux/reporteIngresosAuxiliarSlice';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import {
  indexedDBService,
  type PersistedReportData,
} from '../../../shared/services/indexedDbService';
import { workbookService } from '../../../shared/services/workbookService';
import { useReportComparison } from '../context/ReportComparisonContext';

type ExcelCellValue = string | number | boolean | null | undefined;
type ExcelRow = ExcelCellValue[];
type DataRow = {
  [key: string]: ExcelCellValue;
  _id?: string;
  _originalIndex?: number; // ✅ NUEVO: Índice estable de la fila original en Excel
};
type EstadoSAT = 'Vigente' | 'Cancelada'; // Nuevo tipo

const ReporteAuxiliar: React.FC = () => {
  const { fileName, excelData, loading, error } = useSelector(
    (state: RootState) => state.reporte02
  );
  // 🆕 Obtener el mes seleccionado desde Redux para el guardado
  const selectedMonth = useSelector((state: RootState) => state.baseExcel.selectedMonth);
  const dispatch: AppDispatch = useDispatch();

  // Debugging temporal para entender el estado de Redux
  useEffect(() => {
    console.log('🔍 Estado actual de Redux reporte02:', {
      fileName,
      fileNameType: typeof fileName,
      hasExcelData: !!excelData,
      loading,
      error,
    });
  }, [fileName, excelData, loading, error]);

  const [localExcelData, setLocalExcelData] = useState<ExcelRow[] | null>(null);
  const [totalsKey, setTotalsKey] = useState(0);
  const [savedWorkExists, setSavedWorkExists] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  // Corregir el tipo de ref para timeout
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const lastAutoSaveRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef<number>(0);

  // Estado local para valores de Tipo Cambio para evitar pérdida de foco
  const [localTipoCambioValues, setLocalTipoCambioValues] = useState<{
    [key: string]: string;
  }>({});

  // Función para generar clave única de celda de Tipo Cambio
  const getTipoCambioKey = useCallback((rowIndex: number, colIndex: number) => {
    return `tipo-cambio-${rowIndex}-${colIndex}`;
  }, []);

  // Estado local para valores de Estado SAT para evitar pérdida de foco
  const [, setLocalEstadoSATValues] = useState<{ [key: string]: string }>({});

  // Estado para el menú desplegable de guardado
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const saveMenuOpen = Boolean(saveMenuAnchor);

  const handleSaveMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSaveMenuAnchor(event.currentTarget);
  };

  const handleSaveMenuClose = () => {
    setSaveMenuAnchor(null);
  };

  // Función para generar clave única de celda de Estado SAT

  const {
    updateReporte02Data,
    isComparisonActive, // Asegúrate de que esta variable esté disponible y se use correctamente
    getRowStyle, // Asegúrate de que esta variable esté disponible y se use correctamente
    getTooltip, // Asegúrate de que esta variable esté disponible y se use correctamente
    lastComparisonTime, // Asegúrate de que esta variable esté disponible y se use correctamente
    toggleComparison,
    clearComparison,
    // 🆕 NUEVAS FUNCIONES PARA LÓGICA DE BOTONES
    shouldShowSaveButton,
    saveToPlantillaBase,
    getSubtotalMXNFromReporte03,
    areSubtotalsEqual,
  } = useReportComparison();

  const getEstatusSatColumnIndex = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): number => {
      if (!data || data.length <= headerIndex) {
        return -1;
      }
      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) {
        return -1;
      }
      return headerRow.findIndex((header) => header?.toString().toLowerCase() === 'estatus sat');
    },
    []
  );

  const initializeEstatusSatValues = useCallback(
    (data: ExcelRow[], headerIndex: number): ExcelRow[] => {
      if (!data || data.length === 0) return data;

      if (data.length <= headerIndex) return data; // No hay suficientes filas para un encabezado y datos

      const newData = data.map((r) => (Array.isArray(r) ? [...r] : r)); // Copia profunda

      const headerRow = newData[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow)) return newData; // Si la fila de encabezado no es un array, devolver los datos tal cual

      let estadoSatIdx = headerRow.findIndex((h) => h?.toString().toLowerCase() === 'estatus sat');

      // Si la columna "Estado SAT" no existe, la agregamos
      if (estadoSatIdx === -1) {
        headerRow.push('Estatus Sat');
        estadoSatIdx = headerRow.length - 1; // Nuevo índice

        for (let i = headerIndex + 1; i < newData.length; i++) {
          const currentRow = newData[i] as ExcelRow;
          if (Array.isArray(currentRow)) {
            const firstCol = currentRow[0]?.toString().toLowerCase() || '';
            if (firstCol !== 'totales' && firstCol !== 'total') {
              currentRow.push('Vigente');
            } else {
              currentRow.push(null); // No poner "Vigente" en la fila de totales
            }
          }
        }
      } else {
        // Si la columna ya existe, validamos los valores
        for (let i = headerIndex + 1; i < newData.length; i++) {
          const currentRow = newData[i] as ExcelRow;
          if (Array.isArray(currentRow)) {
            const firstCol = currentRow[0]?.toString().toLowerCase() || '';
            if (firstCol !== 'totales' && firstCol !== 'total') {
              if (
                currentRow[estadoSatIdx] !== 'Vigente' &&
                currentRow[estadoSatIdx] !== 'Cancelada'
              ) {
                currentRow[estadoSatIdx] = 'Vigente';
              }
            }
          }
        }
      }
      return newData;
    },
    []
  );

  // Función para validar y encontrar el header y contenido de la tabla (movida arriba para evitar uso antes de declaración)
  const validateAndExtractTableData = useCallback(
    (data: ExcelRow[]): { header: ExcelRow | null; content: ExcelRow[] } => {
      if (!data || data.length === 0) return { header: null, content: [] };

      // Buscar la primera fila con al menos 8 columnas con contenido válido
      const headerIndex = data.findIndex(
        (row) =>
          Array.isArray(row) &&
          row.filter((cell) => typeof cell === 'string' && cell.trim() !== '').length >= 6
      );

      if (headerIndex === -1) {
        console.warn('No se encontró una fila válida con al menos 6 columnas con contenido.');
        return { header: null, content: [] };
      }

      // Dividir los datos en encabezado y contenido
      const header = data[headerIndex];
      const content = data.slice(headerIndex + 1);

      return { header, content };
    },
    []
  );

  const saveCurrentWork = useCallback(async () => {
    console.log('🔧 Iniciando saveCurrentWork:', {
      fileName: fileName,
      fileNameType: typeof fileName,
      fileNameValue: JSON.stringify(fileName),
      excelData: !!excelData,
      localExcelData: !!localExcelData,
      isSaving: isSavingRef.current,
      lastAutoSaveRef: lastAutoSaveRef.current.substring(0, 20) + '...', // Solo primeros 20 chars
    });

    // Verificar si fileName es null o undefined y convertir a string si es necesario
    const validFileName = fileName || 'archivo-sin-nombre.xlsx';
    console.log('🔧 Usando fileName:', validFileName);

    if (!validFileName || !excelData || !localExcelData || isSavingRef.current) {
      console.warn('⚠️ No se puede guardar:', {
        fileName: fileName,
        validFileName: validFileName,
        hayExcelData: !!excelData,
        hayLocalExcelData: !!localExcelData,
        estáGuardando: isSavingRef.current,
      });
      return false;
    }

    // Verificar si el último guardado fue muy reciente (menos de 250ms para ser menos restrictivo)
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    if (timeSinceLastSave < 250) {
      console.log('⏱️ Rate limiting aplicado (muy reciente):', {
        timeSinceLastSave,
        minimumInterval: 250,
      });
      return false;
    }

    // Generar hash para evitar guardados duplicados
    const currentDataHash = JSON.stringify(localExcelData);
    console.log('🔍 Hash generado:', {
      currentHashStart: currentDataHash.substring(0, 20) + '...',
      lastHashStart: lastAutoSaveRef.current.substring(0, 20) + '...',
      currentHashLength: currentDataHash.length,
      lastHashLength: lastAutoSaveRef.current.length,
    });

    // Verificar si los datos han cambiado realmente
    if (lastAutoSaveRef.current === currentDataHash) {
      console.log('📋 Datos sin cambios, omitiendo guardado');
      return false;
    }

    console.log('💾 Datos detectados como diferentes, procediendo con guardado');

    try {
      isSavingRef.current = true;
      console.log('💾 Iniciando proceso de guardado...');

      const { header } = validateAndExtractTableData(localExcelData);
      const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
      const estadoSatColumnIdx =
        headerIndex !== -1 ? getEstatusSatColumnIndex(localExcelData, headerIndex) : -1;

      const localExcelDataCopy = localExcelData.map((row) => (Array.isArray(row) ? [...row] : row));

      const reportData: PersistedReportData = {
        id: `reporte02-${Date.now()}`,
        fileName: validFileName, // Usar validFileName en lugar de fileName
        uploadDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        originalExcelData: excelData,
        localChanges: localExcelDataCopy,
        pagination,
        metadata: {
          totalRows: localExcelDataCopy.length,
          reportType: 'reporte02',
          estadoSatColumnIndex: estadoSatColumnIdx,
        },
      };

      console.log('💾 Guardando en IndexedDB:', {
        fileName: validFileName,
        totalRows: localExcelDataCopy.length,
        estadoSatColumnIdx,
        reportId: reportData.id,
      });

      await indexedDBService.saveReportData(reportData);

      // Actualizar referencias de control
      console.log('🔄 Actualizando lastAutoSaveRef después del guardado');
      lastAutoSaveRef.current = currentDataHash;
      lastSaveTimeRef.current = Date.now();
      setSavedWorkExists(true);

      console.log('✅ Guardado completado para reporte02');
      return true;
    } catch (error) {
      console.error('❌ Error al guardar reporte02:', error);
      return false;
    } finally {
      console.log('🏁 Finalizando guardado, setting isSaving to false');
      isSavingRef.current = false;
    }
  }, [
    fileName,
    excelData,
    localExcelData,
    pagination,
    getEstatusSatColumnIndex,
    validateAndExtractTableData,
  ]);

  // Función especializada para guardado inmediato en cambios críticos (Estado SAT, Tipo Cambio)
  const forceImmediateSave = useCallback(
    async (context: string) => {
      if (!fileName || !excelData || !localExcelData) {
        console.warn(`⚠️ No se puede forzar guardado inmediato (${context}): faltan datos básicos`);
        return false;
      }

      try {
        // Forzar un pequeño delay para asegurar que localExcelData se haya actualizado
        await new Promise((resolve) => setTimeout(resolve, 50));

        const success = await saveCurrentWork();
        console.log(
          success
            ? `💾 Guardado inmediato forzado (${context}) - completado`
            : `⚠️ Guardado inmediato forzado (${context}) - omitido`
        );
        return success;
      } catch (error) {
        console.error(`❌ Error en guardado inmediato forzado (${context}):`, error);
        return false;
      }
    },
    [fileName, excelData, localExcelData, saveCurrentWork]
  );

  // Debugging específico para cambios en fileName con más detalle
  useEffect(() => {
    console.log('📁 fileName cambió - DETALLE COMPLETO:', {
      valor: fileName,
      tipo: typeof fileName,
      esNull: fileName === null,
      esUndefined: fileName === undefined,
      esFalsy: !fileName,
      json: JSON.stringify(fileName),
      timestamp: Date.now(),
    });
  }, [fileName]);

  // Función simplificada de auto-guardado con fix temporal
  // Función para manejar la carga del archivo
  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(reporte02FileLoadStart({ fileName: file.name }));

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

        // Limpiar localExcelData y otros estados relacionados antes de cargar nuevos datos de Redux
        setLocalExcelData(null);
        setTotalsKey(0);
        setPagination({ pageIndex: 0, pageSize: 15 });
        setLocalTipoCambioValues({});
        setLocalEstadoSATValues({});

        dispatch(reporte02FileLoadSuccess({ data: jsonData }));
        // Registrar importación mensual en workbook multi-hoja (Auxiliar)
        (async () => {
          try {
            const metas = await workbookService.listTemplates();
            if (metas && metas.length > 0) {
              const wb = metas[0];
              const currentMonth = new Date().getMonth();
              const yearMonth = `${new Date().getFullYear()}-${String(currentMonth + 1).padStart(
                2,
                '0'
              )}`;
              await workbookService.addImportedSheet({
                workbookId: wb.id,
                yearMonth,
                category: 'auxiliar',
                sheetName: `Aux_${yearMonth}`,
                data: jsonData as any,
              });
              console.log('🧾 (Auxiliar) Hoja mensual registrada', { yearMonth });
              window.dispatchEvent(
                new CustomEvent('workbook-months-updated', { detail: { workbookId: wb.id } })
              );
            }
          } catch (err) {
            console.warn('No se pudo registrar hoja mensual Auxiliar', err);
          }
        })();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        dispatch(reporte02FileLoadFailure({ error: `Error al procesar: ${errorMsg}` }));
      }
    };
    reader.onerror = () => {
      dispatch(
        reporte02FileLoadFailure({
          error: 'Error del navegador al intentar leer el archivo.',
        })
      );
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Para permitir cargar el mismo archivo de nuevo
  };

  // Función para manejar la edición del tipo de cambio con debounce
  const handleTipoCambioEdit = useCallback(
    (rowIndexInTable: number, columnId: number, newValue: string) => {
      // Validar que sea un número válido o string vacío
      if (newValue !== '') {
        const numericValue = parseFloat(newValue);
        if (isNaN(numericValue) || numericValue < 0) return;
      }

      // Actualizar el estado local inmediatamente para mantener el foco
      const tipoCambioKey = getTipoCambioKey(rowIndexInTable, columnId);
      setLocalTipoCambioValues((prev) => ({
        ...prev,
        [tipoCambioKey]: newValue,
      }));

      // Actualizar localExcelData con debounce para evitar re-renders excesivos
      setLocalExcelData((prevData) => {
        if (!prevData) return prevData;
        const actualRowIndexInLocalData = rowIndexInTable + 4;
        const newData = [...prevData];
        if (newData[actualRowIndexInLocalData]) {
          newData[actualRowIndexInLocalData] = [...newData[actualRowIndexInLocalData]];
          newData[actualRowIndexInLocalData][columnId] =
            newValue === '' ? null : parseFloat(newValue);
        }
        return newData;
      });

      setTimeout(() => {
        setTotalsKey((prev) => prev + 1);
      }, 300);

      // Programar guardado inmediato para Tipo Cambio
      window.setTimeout(async () => {
        await forceImmediateSave('Tipo Cambio Edit reporte02');
      }, 100); // 100ms delay
    },
    [getTipoCambioKey, forceImmediateSave]
  );

  const handleEstadoSatChange = useCallback(
    (rowIndexInTable: number, newValue: EstadoSAT) => {
      console.log('🔄 Iniciando cambio de Estatus SAT:', {
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
        if (estadoSatColumnIdx === -1) return prevData;

        const actualRowIndexInLocalData = rowIndexInTable + headerIndex + 1;
        const newData = [...prevData];
        if (newData[actualRowIndexInLocalData]) {
          newData[actualRowIndexInLocalData] = [...newData[actualRowIndexInLocalData]];
          newData[actualRowIndexInLocalData][estadoSatColumnIdx] = newValue;

          console.log('✅ Estatus SAT cambiado en localExcelData');
        }
        return newData;
      });

      // Forzar recálculo de totales
      setTotalsKey((prev) => prev + 1);

      // Programar guardado inmediato
      window.setTimeout(async () => {
        await forceImmediateSave('Estatus SAT onChange');
      }, 100); // Reducido de 300ms a 100ms
    },
    [getEstatusSatColumnIndex, forceImmediateSave, validateAndExtractTableData, fileName]
  );

  // Efecto para inicializar localExcelData cuando excelData (de Redux) cambia (ej. carga de archivo)
  useEffect(() => {
    if (excelData && !localExcelData) {
      // Solo inicializar si localExcelData está vacío
      const deepCopy = excelData.map((row) => (Array.isArray(row) ? [...row] : row));
      const { header } = validateAndExtractTableData(deepCopy);
      const headerIndex = header ? deepCopy.findIndex((row) => row === header) : -1;
      const dataWithEstatusSat =
        headerIndex !== -1 ? initializeEstatusSatValues(deepCopy, headerIndex) : deepCopy;
      setLocalExcelData(dataWithEstatusSat);
      setTotalsKey((prev) => prev + 1); // Forzar recálculo de totales
      // updateReporte02Data se llamará en el efecto que observa localExcelData
    } else if (!excelData && localExcelData) {
      // Si excelData se limpia en Redux (ej. el usuario borra el reporte), limpiar localExcelData también
      setLocalExcelData(null);
      setTotalsKey(0);
      updateReporte02Data([]); // Limpiar también en el contexto de comparación, usando [] en lugar de null
    }
  }, [
    excelData,
    localExcelData,
    initializeEstatusSatValues,
    updateReporte02Data,
    validateAndExtractTableData,
  ]);

  // Auto-guardado automático cuando cambian los datos locales
  useEffect(() => {
    if (!localExcelData || !fileName) {
      return;
    }
    // Limpiar cualquier timeout previo
    if (autoSaveTimeoutRef.current !== null) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }
    const timeoutId = window.setTimeout(async () => {
      try {
        await saveCurrentWork();
      } catch (e) {
        console.error('❌ Error en auto-guardado automático reporte02:', e);
      }
    }, 2000);
    autoSaveTimeoutRef.current = timeoutId;
    return () => {
      if (autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [localExcelData, fileName, excelData, saveCurrentWork]);

  // Sincronizar valores locales de Tipo Cambio cuando cambie localExcelData
  useEffect(() => {
    if (localExcelData && localExcelData.length > 4) {
      const headerRowIndex = 3;
      const headerRow = localExcelData[headerRowIndex] as ExcelRow;
      if (Array.isArray(headerRow)) {
        const newTipoCambioValues: { [key: string]: string } = {};

        // Encontrar columnas de Tipo Cambio
        headerRow.forEach((header, colIndex) => {
          const headerStr = header?.toString().toLowerCase() || '';
          if (
            headerStr.includes('tipo cambio') ||
            headerStr.includes('tipo de cambio') ||
            headerStr.includes('tipocambio')
          ) {
            // Iterar sobre las filas de datos
            for (let rowIndex = headerRowIndex + 1; rowIndex < localExcelData.length; rowIndex++) {
              const row = localExcelData[rowIndex] as ExcelRow;
              if (Array.isArray(row)) {
                const firstCol = row[0]?.toString().toLowerCase() || '';
                if (firstCol !== 'totales' && firstCol !== 'total') {
                  const tableRowIndex = rowIndex - (headerRowIndex + 1); // Convertir a índice de tabla
                  const tipoCambioKey = getTipoCambioKey(tableRowIndex, colIndex);
                  const cellValue = row[colIndex];

                  // Solo actualizar si no hay un valor local ya establecido (para mantener el estado durante la edición)
                  if (!localTipoCambioValues[tipoCambioKey]) {
                    newTipoCambioValues[tipoCambioKey] =
                      cellValue !== null && cellValue !== undefined ? cellValue.toString() : '';
                  }
                }
              }
            }
          }
        });

        // Solo actualizar si hay cambios
        if (Object.keys(newTipoCambioValues).length > 0) {
          setLocalTipoCambioValues((prev) => ({
            ...prev,
            ...newTipoCambioValues,
          }));
        }
      }
    }
  }, [localExcelData, getTipoCambioKey, localTipoCambioValues]);

  // (Definición movida arriba)

  const calculateTotals = useCallback(
    (data: ExcelRow[] | null, headerIndex: number): ExcelRow[] => {
      if (!data || data.length < headerIndex + 1) return data || [];

      const headerRow = data[headerIndex] as ExcelRow;
      if (!Array.isArray(headerRow) || headerRow.length === 0) return data;

      const estadoSatColumnIdx = getEstatusSatColumnIndex(data, headerIndex);

      const dataRowsStartIndex = headerIndex + 1;
      const dataRows = data.slice(dataRowsStartIndex);

      const filteredDataRows = dataRows.filter((row) => {
        if (!Array.isArray(row) || row.length === 0) return false;
        const firstCol = row[0]?.toString().toLowerCase() || '';
        // Excluir filas de totales existentes
        if (firstCol === 'totales' || firstCol === 'total') return false;
        // Excluir filas completamente vacías (ej. solo con nulls o strings vacíos)
        if (row.every((cell) => cell === null || cell === '')) return false;

        // Excluir filas si "Estado SAT" es "Cancelada"
        if (estadoSatColumnIdx !== -1 && row[estadoSatColumnIdx] === 'Cancelada') {
          return false;
        }
        return true;
      });

      const totalRow: ExcelRow = ['Totales'];
      for (let i = 1; i < headerRow.length; i++) {
        // No sumar para la columna "Estado SAT"
        if (i === estadoSatColumnIdx) {
          totalRow.push(null);
          continue;
        }
        // No sumar para la columna "Tipo Cambio" en la fila de totales (se deja vacía)
        const headerText = headerRow[i]?.toString().toLowerCase() || '';
        if (
          headerText.includes('tipo cambio') ||
          headerText.includes('tipo de cambio') ||
          headerText.includes('tipocambio')
        ) {
          totalRow.push(null);
          continue;
        }

        let sum = 0;
        let hasValues = false;
        for (const row of filteredDataRows) {
          // Asegurarse de que la fila no sea la de totales que se está construyendo
          const firstColCheck = row[0]?.toString().toLowerCase() || '';
          if (firstColCheck === 'totales' || firstColCheck === 'total') continue;

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

      // ✅ CAMBIO CRÍTICO: Mantener TODAS las filas de datos en su orden original
      // Solo remover filas de totales existentes, pero mantener todas las demás
      const resultData = [
        ...data.slice(0, headerIndex + 1), // Metadatos + header
        ...data.slice(dataRowsStartIndex).filter((row) => {
          if (!Array.isArray(row) || row.length === 0) return true; // Mantener filas vacías
          const firstCol = row[0]?.toString().toLowerCase() || '';
          // ✅ SOLO remover filas de totales antiguas - MANTENER TODO LO DEMÁS
          if (firstCol === 'totales' || firstCol === 'total') return false;
          return true; // ✅ MANTENER todas las filas incluyendo canceladas
        }),
        totalRow, // Nueva fila de totales
      ];

      // Eliminar filas de totales antiguas que pudieron quedar antes de la nueva
      const finalResult = resultData.filter((row, index, self) => {
        const firstCol = row[0]?.toString().toLowerCase() || '';
        if (firstCol === 'totales' || firstCol === 'total') {
          return (
            index === self.findIndex((r) => (r[0]?.toString().toLowerCase() || '') === firstCol)
          );
        }
        return true;
      });

      return finalResult;
    },
    [getEstatusSatColumnIndex]
  );

  const updatedExcelData = useMemo(() => {
    // Usar localExcelData si existe, si no, no hay datos para mostrar o calcular
    if (!localExcelData) return [];
    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex((row) => row === header) : -1;
    if (headerIndex === -1) return localExcelData;
    return calculateTotals(localExcelData, headerIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- usamos totalsKey para forzar recálculo aunque no se use directamente
  }, [localExcelData, calculateTotals, totalsKey, validateAndExtractTableData]);

  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
    if (!Array.isArray(updatedExcelData) || updatedExcelData.length === 0) {
      return [];
    }

    const { header } = validateAndExtractTableData(updatedExcelData);
    if (!header) return [];

    const headerIndex = updatedExcelData.findIndex((row) => row === header);
    if (headerIndex === -1) return [];

    const currentLocalData = localExcelData; // Capturar el estado actual para el closure de Cell

    return header.map((headerCell, colIndex): MRT_ColumnDef<DataRow> => {
      // Usar el valor plano del header
      const headerText = (headerCell ?? `Columna ${colIndex + 1}`).toString();
      const headerStr = headerText.toLowerCase();

      if (headerStr === 'estatus sat') {
        return {
          id: colIndex.toString(),
          accessorKey: colIndex.toString(),
          header: headerText,
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
                  await forceImmediateSave('Estatus SAT onBlur');
                }, 100);
              }
            };
            const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const newValue = e.target.value as EstadoSAT;
              handleEstadoSatChange(rowIndexInTable, newValue);
            };
            const selectId = `estatus-sat-${rowIndexInTable}-${colIndex}`;
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
        };
      }

      if (
        headerStr.includes('tipo cambio') ||
        headerStr.includes('tipo de cambio') ||
        headerStr.includes('tipocambio')
      ) {
        return {
          id: colIndex.toString(),
          accessorKey: colIndex.toString(),
          header: headerText,
          size: 100,
          Cell: ({ cell }) => {
            const rowIndexInTable = cell.row.index;
            const rowData = cell.row.original;
            const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';
            if (isRowTotales) return null;

            const tipoCambioKey = getTipoCambioKey(rowIndexInTable, colIndex);
            let currentValue: string = localTipoCambioValues[tipoCambioKey] || '';
            if (currentValue === '' && currentLocalData) {
              const actualRowIndexInLocalData = rowIndexInTable + 4;
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
            return (
              <input
                type="text"
                value={currentValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
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
                onFocus={(e) => e.target.select()}
              />
            );
          },
        };
      }

      return {
        id: colIndex.toString(),
        accessorKey: colIndex.toString(),
        header: headerText,
        Cell: ({ cell }) => {
          const rowData = cell.row.original;
          const isRowTotales = rowData && rowData['0']?.toString().toLowerCase() === 'totales';
          const cellValue = cell.getValue() as ExcelCellValue;
          // Formatear números con 2 decimales para columnas específicas
          const lower = headerText.toLowerCase();
          const isNumericColumn =
            lower.includes('subtotal') ||
            lower.includes('total') ||
            lower.includes('importe') ||
            lower.includes('monto') ||
            (typeof cellValue === 'number' && !lower.includes('fecha') && !lower.includes('folio'));
          if (isNumericColumn && typeof cellValue === 'number') {
            const displayValue = cellValue.toFixed(2);
            return (
              <span
                style={{
                  fontWeight: isRowTotales ? 'bold' : 'normal',
                  color: isRowTotales ? '#1976d2' : 'inherit',
                  textAlign: 'right',
                  display: 'block',
                }}
              >
                {displayValue}
              </span>
            );
          }
          // Para valores no numéricos o nulos
          const displayValue = cellValue !== null && cellValue !== undefined ? cellValue : '';
          return (
            <span
              style={{
                fontWeight: isRowTotales ? 'bold' : 'normal',
                color: isRowTotales ? '#1976d2' : 'inherit',
              }}
            >
              {displayValue}
            </span>
          );
        },
      };
    });
  }, [
    updatedExcelData,
    localExcelData,
    localTipoCambioValues,
    handleTipoCambioEdit,
    handleEstadoSatChange,
    getTipoCambioKey,
    fileName,
    excelData,
    forceImmediateSave,
    getEstatusSatColumnIndex,
    validateAndExtractTableData,
  ]);

  const tableData = useMemo<DataRow[]>(() => {
    if (!Array.isArray(updatedExcelData) || updatedExcelData.length === 0 || columns.length === 0) {
      return [];
    }

    const { header, content } = validateAndExtractTableData(updatedExcelData);
    if (!header || !content.length) return [];

    return content.map((rowArray, originalIndexInSlicedData) => {
      if (!Array.isArray(rowArray)) return {};
      const rowObject: DataRow = {};
      const headerLength = columns.length;
      for (let i = 0; i < headerLength; i++) {
        rowObject[i.toString()] = rowArray[i];
      }
      // Usar un ID único y estable para las filas
      rowObject._id = `row-${originalIndexInSlicedData}`;
      return rowObject;
    });
  }, [updatedExcelData, columns, validateAndExtractTableData]);

  // Función para recuperar trabajo guardado
  const restoreWork = useCallback(async () => {
    try {
      const savedData = await indexedDBService.getLatestReportDataByType('reporte02');
      if (savedData) {
        // Cargar datos originales en Redux y fileName
        if (savedData.fileName) {
          dispatch(reporte02FileLoadStart({ fileName: savedData.fileName }));
        }
        const originalCast = (savedData.originalExcelData as unknown[]).filter(
          Array.isArray
        ) as ExcelRow[];
        dispatch(reporte02FileLoadSuccess({ data: originalCast }));

        // Procesar localChanges y establecer en estado local
        const localCast = (savedData.localChanges as unknown[]).filter(Array.isArray) as ExcelRow[];
        const { header } = validateAndExtractTableData(localCast);
        const headerIndex = header ? localCast.findIndex((row) => row === header) : -1;
        const dataWithEstatusSat =
          headerIndex !== -1 ? initializeEstatusSatValues(localCast, headerIndex) : localCast;
        setLocalExcelData(dataWithEstatusSat);
        setLocalTipoCambioValues({});
        setPagination(savedData.pagination);
        setTotalsKey((prev) => prev + 1);
        setSavedWorkExists(true);
      }
    } catch (error) {
      console.error('Error al restaurar reporte02:', error);
    }
  }, [dispatch, initializeEstatusSatValues, validateAndExtractTableData]);

  // Función para limpiar trabajo guardado
  // Función para limpiar completamente (guardado + tabla + Redux)
  const clearSavedWork = useCallback(async () => {
    try {
      // 1. Limpiar datos guardados en IndexedDB
      await indexedDBService.clearReportDataByType('reporte02');
      console.log('[LIMPIAR] ✅ Datos guardados eliminados');

      // 2. Resetear estado Redux
      dispatch(resetReporte02Data());
      console.log('[LIMPIAR] ✅ Estado Redux reseteado');

      // 3. Limpiar estado local
      setLocalExcelData(null);
      setSavedWorkExists(false);
      setPagination({ pageIndex: 0, pageSize: 15 });
      console.log('[LIMPIAR] ✅ Estado local limpiado');

      // 4. Limpiar contexto de comparación si está activo
      if (isComparisonActive) {
        clearComparison();
        console.log('[LIMPIAR] ✅ Datos de comparación limpiados');
      }

      console.log('[LIMPIAR] 🎉 Limpieza completa de Reporte 02 exitosa');
    } catch (error) {
      console.error('[LIMPIAR] ❌ Error al limpiar reporte02:', error);
    }
  }, [dispatch, isComparisonActive, clearComparison]);

  // Verificar si existe trabajo guardado al montar el componente
  useEffect(() => {
    const checkSavedWork = async () => {
      try {
        console.log('🔍 Verificando trabajo guardado existente para reporte02...');
        const savedData = await indexedDBService.getLatestReportDataByType('reporte02');
        if (savedData) {
          console.log('✅ Trabajo guardado encontrado para reporte02:', {
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
              '🔄 Cargando automáticamente datos guardados de reporte02 (sin datos existentes)'
            );
            // Asegurar que fileName se establece en Redux
            if (savedData.fileName) {
              dispatch(reporte02FileLoadStart({ fileName: savedData.fileName }));
            }
            const originalCast = (savedData.originalExcelData as unknown[]).filter(
              Array.isArray
            ) as ExcelRow[];
            dispatch(reporte02FileLoadSuccess({ data: originalCast }));

            const localCast = (savedData.localChanges as unknown[]).filter(
              Array.isArray
            ) as ExcelRow[];
            const { header } = validateAndExtractTableData(localCast);
            const headerIndex = header ? localCast.findIndex((row) => row === header) : -1;
            const dataWithEstatusSat =
              headerIndex !== -1 ? initializeEstatusSatValues(localCast, headerIndex) : localCast;
            setLocalExcelData(dataWithEstatusSat);
            setLocalTipoCambioValues({});
            setLocalEstadoSATValues({});

            setPagination(savedData.pagination);
            setTotalsKey((prev) => prev + 1);
          } else {
            console.log(
              'ℹ️ Datos existentes detectados en auxiliar, no se restaurará automáticamente'
            );
          }
        } else {
          console.log('ℹ️ No se encontró trabajo guardado para reporte02');
        }
      } catch (error) {
        console.error('❌ Error al verificar trabajo guardado reporte02:', error);
      }
    };

    // Solo ejecutar al montar el componente, no cuando cambien los datos
    checkSavedWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo ejecutar al montar
  }, [dispatch, initializeEstatusSatValues]);

  // Cleanup al desmontar el componente
  // Eliminado efecto de cleanup separado: el cleanup del auto-save effect ya maneja la limpieza

  // Agregar listeners para persistir datos al cambiar de pestaña o cerrar ventana
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (localExcelData && fileName && excelData && !isSavingRef.current) {
        try {
          await saveCurrentWork();
          console.log('💾 Guardado antes de cerrar/cambiar pestaña - auxiliar');
        } catch (error) {
          console.error('❌ Error al guardar antes de cerrar - auxiliar:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden && localExcelData && fileName && excelData && !isSavingRef.current) {
        try {
          await saveCurrentWork();
          console.log('💾 Guardado al ocultar pestaña - auxiliar');
        } catch (error) {
          console.error('❌ Error al guardar al ocultar pestaña - auxiliar:', error);
        }
      }
    };

    // Agregar los event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [localExcelData, fileName, excelData, saveCurrentWork]);

  // Actualizar datos de comparación cuando cambia updatedExcelData (datos procesados con totales)
  useEffect(() => {
    if (updatedExcelData && updatedExcelData.length > 0) {
      const timeoutId = setTimeout(() => {
        // 🔄 CAMBIO: Usar updatedExcelData (datos procesados con totales) en lugar de localExcelData (datos crudos)
        console.log('🔄 Actualizando contexto Auxiliar con datos procesados (con totales):', {
          rowCount: updatedExcelData.length,
          hasData: !!updatedExcelData,
        });
        updateReporte02Data(updatedExcelData);
      }, 150); // Pequeño delay para evitar re-renderizados excesivos
      return () => clearTimeout(timeoutId);
    } else {
      updateReporte02Data([]); // Si no hay datos procesados, limpiar en comparación
    }
  }, [updatedExcelData, updateReporte02Data]); // 🔄 CAMBIO: Dependencia en updatedExcelData

  // Sincronizar localExcelData con Redux para mantener consistencia entre tabs
  useEffect(() => {
    if (localExcelData && Array.isArray(localExcelData) && localExcelData.length > 0) {
      // Dispatch la acción para actualizar Redux con los cambios locales
      dispatch(reporte02UpdateLocalChanges({ data: localExcelData }));
      console.log('🔄 Redux sincronizado con localExcelData en reporte02:', {
        dataLength: localExcelData.length,
        timestamp: Date.now(),
      });
    }
  }, [localExcelData, dispatch]);

  // 🆕 Función para manejar el guardado en Plantilla Base desde Auxiliar
  // Toast state
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const handleToastClose = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setToast((t) => ({ ...t, open: false }));
  };

  const handleSaveToPlantillaBase = useCallback(async () => {
    const subtotalMXN = getSubtotalMXNFromReporte03();

    if (subtotalMXN === null) {
      console.error('❌ No se puede obtener Subtotal MXN para guardar desde Auxiliar');
      return;
    }

    try {
      console.log(`💾 Iniciando guardado en Plantilla Base desde Auxiliar: $${subtotalMXN}`);
      const success = await saveToPlantillaBase(subtotalMXN, selectedMonth);

      if (success) {
        console.log('✅ Guardado exitoso en Plantilla Base desde Auxiliar');
        setToast({ open: true, message: 'Guardado en Plantilla Base', severity: 'success' });
      } else {
        console.error('❌ Error al guardar en Plantilla Base desde Auxiliar');
        setToast({ open: true, message: 'Error al guardar en Plantilla Base', severity: 'error' });
      }
    } catch (error) {
      console.error('❌ Error inesperado al guardar desde Auxiliar:', error);
      setToast({ open: true, message: 'Error inesperado al guardar', severity: 'error' });
    }
  }, [getSubtotalMXNFromReporte03, saveToPlantillaBase, selectedMonth]);

  return (
    <>
      <Box sx={{ width: '100%' }}>
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
              id="excelFile-reporte02"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChangeInternal}
              style={{ display: 'none' }}
              disabled={loading}
            />
            <label htmlFor="excelFile-reporte02">
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

            {/* 🆕 NUEVO BOTÓN: Guardar en Base (visible cuando los subtotales coinciden) */}
            {shouldShowSaveButton() && (
              <Tooltip
                title={`Guardar Subtotal MXN ($${
                  getSubtotalMXNFromReporte03()?.toFixed(2) || 'N/A'
                }) en Plantilla Base`}
                arrow
              >
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveToPlantillaBase}
                  startIcon={<SaveIcon />}
                  size="small"
                  sx={{
                    minWidth: 'auto',
                    bgcolor: '#2e7d32',
                    '&:hover': {
                      bgcolor: '#1b5e20',
                    },
                  }}
                >
                  💾 Guardar en Base
                </Button>
              </Tooltip>
            )}

            {/* Mostrar información de subtotales cuando están siendo comparados */}
            {excelData && isComparisonActive && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  bgcolor: areSubtotalsEqual() ? 'success.light' : 'warning.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: areSubtotalsEqual() ? 'success.main' : 'warning.main',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {areSubtotalsEqual() ? '✅ Subtotales Iguales' : '⚠️ Subtotales Diferentes'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  De Mi Admin - MXN: ${getSubtotalMXNFromReporte03()?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>
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
                    width: '110px', // Ancho fijo para mantener consistencia
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    gap: 0.5,
                    height: '32px', // Altura específica para coincidir con el botón de cargar archivo
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

        {!error && columns.length > 0 && (
          <MaterialReactTable
            columns={columns}
            data={tableData} // Usar tableData que ya está formateada para MRT
            localization={MRT_Localization_ES}
            state={{
              isLoading: loading,
              showProgressBars: loading,
              pagination: pagination,
              // ✅ PERMITIR SORTING DINÁMICO (sin forzar estado vacío)
            }}
            onPaginationChange={setPagination}
            manualPagination={false} // La paginación es manejada por el estado local
            enableColumnFilters={true} // ✅ HABILITAR FILTROS
            enableSorting={true} // ✅ HABILITAR ORDENAMIENTO
            enableMultiSort={true} // ✅ HABILITAR ORDENAMIENTO MÚLTIPLE
            manualSorting={false} // Mantener false para ordenamiento automático
            enableColumnOrdering={true} // ✅ HABILITAR REORDENAMIENTO DE COLUMNAS
            enableRowOrdering={true} // ✅ HABILITAR REORDENAMIENTO MANUAL DE FILAS
            enableRowDragging={true} // ✅ HABILITAR ARRASTRAR FILAS
            enablePagination
            enableDensityToggle
            enableFullScreenToggle
            enableHiding
            initialState={{
              density: 'compact',
              sorting: [], // Estado inicial sin ordenamiento (pero permitir cambios)
              columnFilters: [], // Filtros iniciales vacíos (pero permitir cambios)
            }}
            enableRowSelection={false} // Deshabilitar selección de filas si no se usa
            enableRowVirtualization={false} // Considerar true para tablas muy grandes
            autoResetPageIndex={false} // Mantener la página al actualizar datos
            getRowId={(row, index) => row._id || `row-${index}`} // Asegurar que siempre retorne un string
            enableStickyHeader={false} // Desactivar si causa problemas de layout
            // ✅ ESTILOS CSS TEMPORALMENTE DESHABILITADOS (funcionalidades habilitadas)
            // muiTableProps={{
            //   sx: {
            //     '& .MuiTableHead-root .MuiTableCell-root': {
            //       cursor: 'default !important',
            //       userSelect: 'none',
            //       '& .Mui-TableHeadCell-Content': {
            //         cursor: 'default !important',
            //       },
            //       '& .MuiTableSortLabel-root': {
            //         display: 'none !important',
            //       },
            //       '& .MuiButtonBase-root': {
            //         pointerEvents: 'none !important',
            //       },
            //       '&:hover': {
            //         backgroundColor: 'inherit !important',
            //       },
            //     }
            //   }
            // }}
            // Usar key para forzar re-renderizado completo cuando cambia el estado de comparación
            key={`reporte02-table-${isComparisonActive ? 'active' : 'inactive'}-${
              lastComparisonTime?.getTime() || 0
            }`}
            muiTableBodyRowProps={({ row }) => {
              const rowData = row.original;
              const { header } = validateAndExtractTableData(localExcelData || []);
              const headerIndex =
                header && localExcelData ? localExcelData.findIndex((r) => r === header) : -1;
              const estadoSatColumnIdx =
                headerIndex !== -1 ? getEstatusSatColumnIndex(localExcelData, headerIndex) : -1;
              let isRowCancelled = false;
              if (estadoSatColumnIdx !== -1) {
                const estadoSatValue = rowData?.[estadoSatColumnIdx.toString()];
                isRowCancelled = estadoSatValue === 'Cancelada';
              }
              const firstCell = rowData?.['0']?.toString().toLowerCase() || '';
              const isTotalsRow = firstCell === 'totales' || firstCell === 'total';

              if (isRowCancelled) {
                return {
                  sx: {
                    backgroundColor: '#f3e5f5 !important',
                    color: '#9e9e9e !important',
                    '& .MuiTableCell-root': {
                      backgroundColor: '#f3e5f5 !important',
                      color: '#9e9e9e !important',
                      borderBottom: '1px solid #e1bee7 !important',
                    },
                    '&:hover': {
                      backgroundColor: '#e1bee7 !important',
                      '& .MuiTableCell-root': {
                        backgroundColor: '#e1bee7 !important',
                      },
                    },
                  },
                  title: 'Fila cancelada - Los valores no se incluyen en totales',
                };
              }

              if (isTotalsRow) {
                if (!isComparisonActive) {
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
                const equal = areSubtotalsEqual();
                return {
                  sx: {
                    backgroundColor: equal ? '#e3f2fd !important' : '#ffebee !important',
                    '& .MuiTableCell-root': {
                      backgroundColor: equal ? '#e3f2fd !important' : '#ffebee !important',
                      color: equal ? '#0d47a1 !important' : '#b71c1c !important',
                      fontWeight: 700,
                      borderTop: equal
                        ? '2px solid #90caf9 !important'
                        : '2px solid #ef9a9a !important',
                      borderBottom: equal
                        ? '2px solid #90caf9 !important'
                        : '2px solid #ef9a9a !important',
                    },
                  },
                  title: equal
                    ? 'Totales coinciden entre Auxiliar y Mi Admin'
                    : 'Totales diferentes entre Auxiliar y Mi Admin',
                };
              }

              if (!isComparisonActive) return {};

              // Para reporte02, buscar el folio (UUID) en las columnas apropiadas
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
          fileName && ( // Mostrar solo si se cargó un archivo pero no hay datos para la tabla
            <Typography sx={{ my: 2, textAlign: 'center' }}>
              No hay datos para mostrar en la tabla. Verifique el archivo o los filtros.
            </Typography>
          )}
      </Box>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReporteAuxiliar;
