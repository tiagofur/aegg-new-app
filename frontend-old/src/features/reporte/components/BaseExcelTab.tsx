// src/features/reporte/components/BaseExcelTab.tsx
import React, { ChangeEvent, useMemo, useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SyncIcon from '@mui/icons-material/Sync';
import * as XLSX from 'xlsx';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  baseFileLoadStart,
  baseFileLoadSuccess,
  baseFileLoadFailure,
  baseUpdateLocalChanges,
} from '../redux/baseExcelSlice';
import { MaterialReactTable, type MRT_ColumnDef, type MRT_Cell } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import {
  indexedDBService,
  type PersistedReportData,
  type PersistedReportRow,
} from '../../../shared/services/indexedDbService';
import {
  workbookService,
  workbookUtils,
  StoredWorkbookMeta,
} from '../../../shared/services/workbookService';
import { useReportComparison } from '../context/ReportComparisonContext';

type ExcelCellValue = any;
type ExcelRow = ExcelCellValue[];
type DataRow = { [key: string]: ExcelCellValue };

import { TextField } from '@mui/material';
// **NUEVO: Helper para verificar si una fila está en blanco**
const isRowBlank = (row: ExcelRow | null | undefined): boolean => {
  // Si la fila no es un array o está vacía, considerarla en blanco
  if (!Array.isArray(row) || row.length === 0) {
    return true;
  }
  // Si todas las celdas son null, undefined o '', considerarla en blanco
  return row.every((cell) => cell === null || cell === undefined || cell === '');
};

interface BaseExcelTabProps {}

const BaseExcelTab: React.FC<BaseExcelTabProps> = () => {
  const { fileName, excelData, loading, error } = useSelector(
    (state: RootState) => state.baseExcel
  );
  const dispatch: AppDispatch = useDispatch();

  // 🆕 NUEVO: Acceso al contexto para resaltado de celdas guardadas
  const { savedCellHighlight } = useReportComparison();

  // Estado local para manejar los cambios
  const [localExcelData, setLocalExcelData] = useState<ExcelRow[] | null>(null);

  // Estado para mantener la paginación
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // Estados para el manejo de persistencia
  const [savedWorkExists, setSavedWorkExists] = useState(false);

  // Estado para el menú desplegable de guardado
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const saveMenuOpen = Boolean(saveMenuAnchor);

  // --- Estado experimental multi-hoja ---
  const [templateWorkbook, setTemplateWorkbook] = useState<StoredWorkbookMeta | null>(null);
  const [templateSheets, setTemplateSheets] = useState<string[]>([]);
  // NUEVO: lista ligera de hojas y hoja seleccionada
  const [sheetList, setSheetList] = useState<
    { index: number; name: string; rowCount: number; colCount: number; immutable: boolean }[]
  >([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [loadingSheet, setLoadingSheet] = useState<boolean>(false);
  // Mes de exportación: siempre trabajar sobre el mes anterior
  const computePreviousMonth = () => {
    const now = new Date();
    let m = now.getMonth() - 1; // mes anterior
    let y = now.getFullYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  };
  const [exportMonth, setExportMonth] = useState<string>(computePreviousMonth());
  // Opciones de meses disponibles detectadas (covers o imports)
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const loadMonthOptions = useCallback(
    async (wbId: string) => {
      try {
        const months = await workbookService.listAvailableMonths(wbId);
        const base = workbookUtils.toYearMonth(); // incluir mes actual si no existe todavía
        const merged = Array.from(new Set([...months, base])).sort();
        setMonthOptions(merged);
        // Asegurar exportMonth válido
        if (!merged.includes(exportMonth)) {
          setExportMonth(merged[merged.length - 1]);
        }
      } catch (e) {
        console.warn('No se pudieron cargar meses disponibles', e);
      }
    },
    [exportMonth]
  );
  const [savingCover, setSavingCover] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateBackgroundSync, setTemplateBackgroundSync] = useState<
    null | 'pending' | 'done' | 'error'
  >(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  // NUEVO: estado refresco
  const [refreshingSheet, setRefreshingSheet] = useState(false);
  // Cache mes por workbook en localStorage
  const monthCacheKey = (id: string) => `workbook-month-${id}`;

  // Auto-cargar primer workbook si no hay uno ya seleccionado
  useEffect(() => {
    const autoLoad = async () => {
      if (templateWorkbook) return; // ya cargado
      try {
        console.log('🔄 Auto-cargando workbook después de refresh...');
        const metas = await workbookService.listTemplates();
        if (metas && metas.length > 0) {
          const first = metas[0];
          console.log('✅ Workbook encontrado para auto-carga:', {
            id: first.id,
            fileName: first.originalFileName,
            sheetCount: first.sheetCount,
          });

          setTemplateWorkbook(first);
          const mCached = localStorage.getItem(monthCacheKey(first.id));
          if (mCached) {
            setExportMonth(mCached);
            console.log('✅ Mes cacheado restaurado:', mCached);
          }

          // Intentar cargar cover mensual primero, luego sheet0 original
          let dataLoaded = false;
          if (mCached) {
            try {
              const cover = await workbookService.getMonthlyCover(first.id, mCached);
              if (cover) {
                dispatch(
                  baseFileLoadStart({
                    fileName: `${first.originalFileName} :: Carátula (${mCached})`,
                  })
                );
                dispatch(baseFileLoadSuccess({ data: cover.data as any }));
                setLocalExcelData(cover.data as any);
                dataLoaded = true;
                console.log('✅ Cover mensual cargado para mes:', mCached);
              }
            } catch (e) {
              console.warn('⚠️ No se pudo cargar cover mensual, usando sheet0 original', e);
            }
          }

          if (!dataLoaded) {
            const sheet0 = await workbookService.getSheetData(first.id, 0);
            if (sheet0) {
              dispatch(
                baseFileLoadStart({ fileName: `${first.originalFileName} :: ${sheet0.name}` })
              );
              dispatch(baseFileLoadSuccess({ data: sheet0.data as any }));
              setLocalExcelData(sheet0.data as any);
              console.log('✅ Sheet0 original cargado');
            }
          }

          // Cargar meses disponibles
          loadMonthOptions(first.id);
          console.log('✅ Auto-carga de workbook completada');
        } else {
          console.log('ℹ️ No hay workbooks para auto-cargar');
        }
      } catch (e) {
        console.warn('⚠️ Auto-load workbook falló:', e);
      }
    };
    autoLoad();
  }, [templateWorkbook, dispatch, loadMonthOptions]);

  // Cargar lista ligera de hojas cuando hay workbook
  useEffect(() => {
    const loadSheetList = async () => {
      if (!templateWorkbook) return;
      try {
        const list = await workbookService.listSheets(templateWorkbook.id);
        setSheetList(list);
        loadMonthOptions(templateWorkbook.id);
      } catch (err) {
        console.warn('No se pudo obtener lista de hojas', err);
      }
    };
    loadSheetList();
  }, [templateWorkbook, loadMonthOptions]);

  // Escuchar evento global de actualización de Plantilla Base (sheet 0)
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { workbookId: string } | undefined;
      if (!detail || !templateWorkbook) return;
      if (detail.workbookId !== templateWorkbook.id) return;
      try {
        const sheet = await workbookService.getSheetData(templateWorkbook.id, 0);
        if (sheet) {
          dispatch(
            baseFileLoadStart({
              fileName: `${templateWorkbook.originalFileName} :: ${sheet.name}`,
            })
          );
          dispatch(baseFileLoadSuccess({ data: sheet.data as any }));
          setLocalExcelData(sheet.data as any);
          console.log('🔄 BaseExcelTab: Refrescada hoja 0 tras actualización externa');
        }
        // También refrescar meses disponibles
        loadMonthOptions(templateWorkbook.id);
      } catch (err) {
        console.error('Error refrescando hoja 0 post-guardado', err);
      }
    };
    window.addEventListener('plantilla-base-updated', handler as EventListener);
    // Evento para meses
    const monthsEvt = (e: Event) => {
      const detail = (e as CustomEvent).detail as { workbookId: string } | undefined;
      if (!detail || !templateWorkbook) return;
      if (detail.workbookId !== templateWorkbook.id) return;
      loadMonthOptions(templateWorkbook.id);
    };
    window.addEventListener('workbook-months-updated', monthsEvt as EventListener);
    return () => {
      window.removeEventListener('plantilla-base-updated', handler as EventListener);
      window.removeEventListener('workbook-months-updated', monthsEvt as EventListener);
    };
  }, [templateWorkbook, dispatch, loadMonthOptions]);

  // Cambio de hoja seleccionada
  const handleChangeSheet = useCallback(
    async (newIndex: number) => {
      if (!templateWorkbook) return;
      setSelectedSheetIndex(newIndex);
      if (newIndex === 0) {
        // Al regresar a carátula intentar cargar cover mensual (override) si existe
        try {
          const cover = await workbookService.getMonthlyCover(templateWorkbook.id, exportMonth);
          if (cover) {
            dispatch(
              baseFileLoadStart({
                fileName: `${templateWorkbook.originalFileName} :: ${
                  sheetList[0]?.name || 'Carátula'
                }`,
              })
            );
            dispatch(baseFileLoadSuccess({ data: cover.data as any }));
            setLocalExcelData(cover.data as any);
            return;
          }
        } catch (e) {
          console.warn('No se pudo cargar cover mensual al volver a hoja 0', e);
        }
        return; // No recargar si no hay override; mantenemos datos actuales
      }
      setLoadingSheet(true);
      try {
        const sheet = await workbookService.getSheetData(templateWorkbook.id, newIndex);
        if (sheet) {
          dispatch(
            baseFileLoadStart({ fileName: `${templateWorkbook.originalFileName} :: ${sheet.name}` })
          );
          dispatch(baseFileLoadSuccess({ data: sheet.data as any }));
          setLocalExcelData(sheet.data as any);
        }
      } catch (err) {
        console.error('Error cargando hoja', err);
      } finally {
        setLoadingSheet(false);
      }
    },
    [templateWorkbook, dispatch]
  );

  // Re-sincronizar lista y hoja actual
  const handleResync = useCallback(async () => {
    if (!templateWorkbook) return;
    setRefreshingSheet(true);
    try {
      const list = await workbookService.listSheets(templateWorkbook.id);
      setSheetList(list);
      if (selectedSheetIndex !== 0) {
        const sheet = await workbookService.getSheetData(templateWorkbook.id, selectedSheetIndex);
        if (sheet) {
          dispatch(
            baseFileLoadStart({ fileName: `${templateWorkbook.originalFileName} :: ${sheet.name}` })
          );
          dispatch(baseFileLoadSuccess({ data: sheet.data as any }));
          setLocalExcelData(sheet.data as any);
        }
      }
    } catch (err) {
      console.error('Error re-sync', err);
    } finally {
      setRefreshingSheet(false);
    }
  }, [templateWorkbook, selectedSheetIndex, dispatch]);

  // Cargar cover mensual cuando cambia exportMonth estando en hoja 0
  useEffect(() => {
    const loadCover = async () => {
      if (!templateWorkbook) return;
      if (selectedSheetIndex !== 0) return;
      try {
        const cover = await workbookService.getMonthlyCover(templateWorkbook.id, exportMonth);
        if (cover) {
          dispatch(
            baseFileLoadStart({
              fileName: `${templateWorkbook.originalFileName} :: ${
                sheetList[0]?.name || 'Carátula'
              }`,
            })
          );
          dispatch(baseFileLoadSuccess({ data: cover.data as any }));
          setLocalExcelData(cover.data as any);
        }
      } catch (e) {
        console.warn('Error cargando cover mensual en cambio de mes', e);
      }
    };
    loadCover();
  }, [exportMonth, templateWorkbook, selectedSheetIndex, dispatch, sheetList]);

  const handleSaveMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSaveMenuAnchor(event.currentTarget);
  };

  const handleSaveMenuClose = () => {
    setSaveMenuAnchor(null);
  };

  // Función para alternar auto-guardado

  // 🛡️ Guardado automático mejorado como en Mi Admin
  // Helper: ensure we persist raw matrix (array rows); if current data are arrays already just use them
  const normalizeToMatrix = (rows: ExcelRow[]): ExcelRow[] => {
    // Rows already arrays (each row is an array of cell values) -> return as is
    return rows;
  };

  const saveCurrentWork = useCallback(async () => {
    if (!fileName || !excelData || !localExcelData) {
      console.warn('⚠️ BaseExcel: No se puede guardar - faltan datos básicos', {
        fileName: !!fileName,
        excelData: !!excelData,
        localExcelData: !!localExcelData,
      });
      return false;
    }

    try {
      const originalMatrix = normalizeToMatrix(excelData as ExcelRow[]);
      const localMatrix = normalizeToMatrix(localExcelData as ExcelRow[]);
      const reportData: PersistedReportData = {
        id: `base-excel-${Date.now()}`,
        fileName,
        uploadDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        originalExcelData: originalMatrix,
        localChanges: localMatrix,
        pagination,
        metadata: {
          totalRows: localExcelData.length,
          reportType: 'base-excel',
        },
      };

      await indexedDBService.saveReportData(reportData);
      // Persistir también en workbook si estamos en sheet 0
      if (templateWorkbook && selectedSheetIndex === 0) {
        try {
          await workbookService.updateSheetData(templateWorkbook.id, 0, localMatrix as any);
          console.log('💾 Sheet 0 actualizada en workbook multi-hoja');
        } catch (err) {
          console.warn('⚠️ No se pudo persistir sheet 0 en workbook', err);
        }
      }
      setSavedWorkExists(true);
      console.log('💾 BaseExcel guardado automáticamente:', {
        fileName,
        totalRows: localExcelData.length,
      });
      return true;
    } catch (error) {
      console.error('❌ Error en guardado automático BaseExcel:', error);
      return false;
    }
  }, [fileName, excelData, localExcelData, pagination, templateWorkbook, selectedSheetIndex]);

  // Función para recuperar trabajo guardado - mejorada
  const restoreWork = useCallback(async () => {
    try {
      const savedData = await indexedDBService.getLatestReportDataByType('base-excel');
      if (savedData) {
        // Asegurar que fileName se establece en Redux
        if (savedData.fileName) {
          dispatch(baseFileLoadStart({ fileName: savedData.fileName }));
        }
        // Cast only array rows; ignore object shaped legacy rows
        const originalRows = savedData.originalExcelData.filter(
          (r: PersistedReportRow): r is ExcelRow => Array.isArray(r)
        );
        dispatch(baseFileLoadSuccess({ data: originalRows }));

        // Restaurar localExcelData
        const localRows = savedData.localChanges.filter((r: PersistedReportRow): r is ExcelRow =>
          Array.isArray(r)
        );
        setLocalExcelData(localRows);
        setPagination(savedData.pagination);
        setSavedWorkExists(true);

        console.log('🔄 BaseExcel trabajo restaurado desde IndexedDB');
      }
    } catch (error) {
      console.error('❌ Error al restaurar trabajo BaseExcel:', error);
    }
  }, [dispatch]);

  // Función para limpiar completamente (guardado + tabla + Redux) - mejorada
  const clearSavedWork = useCallback(async () => {
    try {
      await indexedDBService.clearReportDataByType('base-excel');
      setLocalExcelData(null);
      setPagination({ pageIndex: 0, pageSize: 20 });
      setSavedWorkExists(false);
      dispatch(baseFileLoadSuccess({ data: [] }));

      console.log('🗑️ BaseExcel trabajo y datos limpiados completamente');
    } catch (error) {
      console.error('❌ Error al limpiar trabajo BaseExcel:', error);
    }
  }, [dispatch]);

  // 🔍 Verificar trabajo guardado al montar el componente - mejorado como Mi Admin
  useEffect(() => {
    const checkSavedWork = async () => {
      try {
        console.log('🔍 Verificando trabajo guardado existente para BaseExcel...');
        const savedData = await indexedDBService.getLatestReportDataByType('base-excel');
        if (savedData) {
          console.log('✅ Trabajo guardado encontrado para BaseExcel:', {
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
              '🔄 Cargando automáticamente datos guardados de BaseExcel (sin datos existentes)'
            );
            // Asegurar que fileName se establece en Redux
            if (savedData.fileName) {
              dispatch(baseFileLoadStart({ fileName: savedData.fileName }));
            }
            const originalRows = savedData.originalExcelData.filter(
              (r: PersistedReportRow): r is ExcelRow => Array.isArray(r)
            );
            dispatch(baseFileLoadSuccess({ data: originalRows }));

            const localRows = savedData.localChanges.filter(
              (r: PersistedReportRow): r is ExcelRow => Array.isArray(r)
            );
            setLocalExcelData(localRows);
            setPagination(savedData.pagination);
          } else {
            console.log(
              'ℹ️ Datos existentes detectados en BaseExcel, no se restaurará automáticamente'
            );
          }
        } else {
          console.log('ℹ️ No se encontró trabajo guardado para BaseExcel');
        }
      } catch (error) {
        console.error('❌ Error al verificar trabajo guardado BaseExcel:', error);
      }
    };

    // Solo ejecutar al montar el componente
    checkSavedWork();
  }, [dispatch]);

  // 🆕 Sincronizar localExcelData con Redux para mantener consistencia - como Mi Admin
  useEffect(() => {
    if (localExcelData && Array.isArray(localExcelData) && localExcelData.length > 0) {
      // Dispatch la acción para actualizar Redux con los cambios locales
      dispatch(baseUpdateLocalChanges({ data: localExcelData }));
      console.log('🔄 Redux sincronizado con localExcelData en BaseExcel:', {
        dataLength: localExcelData.length,
        timestamp: Date.now(),
      });
    }
  }, [localExcelData, dispatch]);

  // 🛡️ Guardado automático cuando cambian los datos locales - mejorado como Mi Admin
  useEffect(() => {
    if (localExcelData && fileName) {
      console.log('⏰ BaseExcel: Programando guardado automático en 2 segundos...');
      const timeoutId = setTimeout(async () => {
        console.log('🔄 BaseExcel: Ejecutando guardado automático programado...');
        const success = await saveCurrentWork();
        if (success) {
          console.log('✅ BaseExcel: Guardado automático completado');
        } else {
          console.log('⚠️ BaseExcel: Guardado automático omitido o falló');
        }
      }, 2000); // Guardar después de 2 segundos de inactividad
      return () => {
        console.log('🧹 BaseExcel: Limpiando timeout de guardado automático');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('⏭️ BaseExcel: Guardado automático omitido:', {
        hasLocalExcelData: !!localExcelData,
        hasFileName: !!fileName,
      });
    }
  }, [localExcelData, fileName, saveCurrentWork]);

  // Actualizar el estado local cuando cambien los datos del Redux - mejorado
  useEffect(() => {
    if (excelData && !localExcelData) {
      const deepCopy = excelData.map((row) => (Array.isArray(row) ? [...row] : row));
      setLocalExcelData(deepCopy);
    } else if (!excelData && localExcelData) {
      setLocalExcelData(null);
    }
  }, [excelData, localExcelData]);

  // Handler de archivo
  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    dispatch(baseFileLoadStart({ fileName: file.name }));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('No se pudo leer el archivo.');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('El archivo Excel no contiene hojas.');
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error(`No se pudo encontrar la hoja "${sheetName}".`);

        // **CAMBIO: Permitir filas en blanco durante la lectura inicial**
        // Quitar `blankrows: false` o poner `blankrows: true`
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          header: 1,
          // blankrows: true, // O simplemente omitir la opción blankrows
        });

        if (!Array.isArray(jsonData)) throw new Error('Formato de datos inesperado.');
        dispatch(baseFileLoadSuccess({ data: jsonData }));
      } catch (err) {
        // ... (manejo de error igual)
        console.error('Error al procesar el archivo Excel (Base):', err);
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        dispatch(baseFileLoadFailure({ error: `Error al procesar: ${errorMsg}` }));
      }
    };
    reader.onerror = (err) => {
      console.error('Error al leer el archivo (Base):', err);
      dispatch(baseFileLoadFailure({ error: 'Error al leer el archivo.' }));
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // --- Nuevo: importar plantilla completa ---
  const handleImportFullTemplate = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setTemplateLoading(true);
      setTemplateError(null);
      setTemplateBackgroundSync(null);
      try {
        // 1. Leer archivo en memoria
        const arrayBuf = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        if (!wb.SheetNames.length) throw new Error('La plantilla no tiene hojas');
        const firstName = wb.SheetNames[0];
        const firstSheet = wb.Sheets[firstName];
        if (!firstSheet) throw new Error('No se encontró la primera hoja');

        // 2. Convertir primera hoja y mostrar inmediatamente (UX optimista)
        const firstData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet, {
          header: 1,
          blankrows: true,
        });
        dispatch(baseFileLoadStart({ fileName: file.name }));
        dispatch(baseFileLoadSuccess({ data: firstData }));
        setLocalExcelData(firstData);

        // 3. Lanzar importación completa en background (persistencia multi-hoja)
        setTemplateBackgroundSync('pending');
        workbookService
          .importTemplate(new File([arrayBuf], file.name, { type: file.type }))
          .then(async (res) => {
            const metas = await workbookService.listTemplates();
            const meta = metas.find((m) => m.id === res.workbookId) || null;
            setTemplateWorkbook(meta);
            setTemplateSheets(res.sheetNames);
            setTemplateBackgroundSync('done');
          })
          .catch((bgErr) => {
            console.error('Error background importTemplate:', bgErr);
            setTemplateBackgroundSync('error');
          })
          .finally(() => {
            setTemplateLoading(false);
          });
      } catch (err) {
        setTemplateError(err instanceof Error ? err.message : 'Error importando plantilla');
        setTemplateLoading(false);
      } finally {
        e.target.value = '';
      }
    },
    [dispatch]
  );

  // Exportar plantilla ensamblada mes actual
  const handleExportTemplate = useCallback(async () => {
    if (!templateWorkbook) return;
    try {
      setTemplateLoading(true);
      await workbookService.exportWorkbook(templateWorkbook.id, exportMonth);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : 'Error exportando');
    } finally {
      setTemplateLoading(false);
    }
  }, [templateWorkbook, exportMonth]);

  // Guardar carátula mensual (usa datos actuales base/local)
  const handleSaveMonthlyCover = useCallback(async () => {
    if (!templateWorkbook) return;
    const dataToSave = localExcelData || excelData;
    if (!dataToSave) return;
    try {
      setSavingCover(true);
      await workbookService.saveMonthlyCover(
        templateWorkbook.id,
        exportMonth,
        dataToSave as any[][]
      );
      // Guardado de carátula puede introducir un nuevo mes, refrescar lista
      window.dispatchEvent(
        new CustomEvent('workbook-months-updated', { detail: { workbookId: templateWorkbook.id } })
      );
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : 'Error guardando carátula');
    } finally {
      setSavingCover(false);
    }
  }, [templateWorkbook, exportMonth, localExcelData, excelData]);
  // Extracción de metadatos (usando datos locales o datos originales)
  const getFirstCellsData = () => {
    const dataToUse = localExcelData || excelData;
    if (!Array.isArray(dataToUse) || dataToUse.length < 5) {
      return [];
    }
    const firstFourRows = dataToUse.slice(1, 5);
    return firstFourRows.map((row, index) => {
      if (Array.isArray(row)) {
        const firstNonEmptyCell = row.find((cell) => cell != null && cell !== '');
        return firstNonEmptyCell !== undefined ? firstNonEmptyCell : `(Fila ${index + 2} vacía)`;
      }
      return `(Fila ${index + 2} inválida)`;
    });
  };
  const firstCellsValues = getFirstCellsData();

  // --- Preparación DINÁMICA de datos para Material React Table ---

  // Buscar el índice de la fila de cabecera ('CONCEPTO') (usando datos locales)
  const foundHeaderIndex = useMemo<number>(() => {
    const dataToUse = localExcelData || excelData;
    if (!dataToUse || dataToUse.length === 0) return -1;
    for (let i = 0; i < dataToUse.length; i++) {
      const row = dataToUse[i];
      if (Array.isArray(row)) {
        for (const cell of row) {
          if (cell === 'CONCEPTO') {
            return i;
          }
        }
      }
    }
    return -1;
  }, [localExcelData, excelData]);

  // Determinar índice de inicio de datos (sin cambios)
  const dataStartIndex = foundHeaderIndex !== -1 ? foundHeaderIndex + 1 : -1;

  // 1. Determinar maxColumns (usando datos locales)
  const maxColumns = useMemo<number>(() => {
    const dataToUse = localExcelData || excelData;
    if (foundHeaderIndex === -1 || !dataToUse || dataToUse.length <= foundHeaderIndex) return 0;
    let max = 0;
    for (let i = foundHeaderIndex; i < dataToUse.length; i++) {
      const row = dataToUse[i];
      if (Array.isArray(row) && row.length > max) {
        max = row.length;
      }
    }
    return max;
  }, [localExcelData, excelData, foundHeaderIndex]);

  // 2. Definir las columnas (con resaltado verde para celdas guardadas)
  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
    const dataToUse = localExcelData || excelData;
    if (foundHeaderIndex === -1 || maxColumns === 0) return [];
    const headerRow =
      dataToUse && dataToUse.length > foundHeaderIndex && Array.isArray(dataToUse[foundHeaderIndex])
        ? (dataToUse[foundHeaderIndex] as ExcelRow)
        : [];
    const generatedColumns: MRT_ColumnDef<DataRow>[] = [];
    for (let index = 0; index < maxColumns; index++) {
      generatedColumns.push({
        accessorKey: index.toString(),
        header: headerRow[index] ?? `Columna ${index + 1}`,
        enableSorting: false, // Deshabilitar ordenamiento por columna
        enableColumnOrdering: false, // Deshabilitar reordenamiento de columnas
        enableHiding: true, // Mantener la opción de ocultar columnas
        enableResizing: false, // Deshabilitar redimensionamiento
        Cell: ({ cell }: { cell: MRT_Cell<DataRow, ExcelCellValue> }) => {
          const value = cell.getValue();
          const rowData = cell.row.original;
          const originalRowIndex = rowData._originalIndex;

          // 🆕 NUEVO: Verificar si esta celda fue recién guardada para resaltarla en verde
          const isSavedCell =
            savedCellHighlight &&
            savedCellHighlight.rowIndex === originalRowIndex &&
            savedCellHighlight.columnIndex === index;

          if (value === null || value === undefined || value === '') {
            return (
              <span
                style={{
                  backgroundColor: isSavedCell ? '#c8e6c9' : 'transparent',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.3s ease',
                  fontWeight: isSavedCell ? 'bold' : 'normal',
                }}
              >
                {'\u00A0'}
              </span>
            );
          }

          return (
            <span
              style={{
                backgroundColor: isSavedCell ? '#c8e6c9' : 'transparent',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.3s ease',
                fontWeight: isSavedCell ? 'bold' : 'normal',
                color: isSavedCell ? '#2e7d32' : 'inherit',
              }}
            >
              {String(value)}
            </span>
          );
        },
      });
    }
    return generatedColumns;
  }, [localExcelData, excelData, foundHeaderIndex, maxColumns, savedCellHighlight]);

  // 3. Transformar los datos (CON FILTRADO CONDICIONAL DE FILAS EN BLANCO)
  const tableData = useMemo<DataRow[]>(() => {
    const dataToUse = localExcelData || excelData;
    if (
      foundHeaderIndex === -1 ||
      dataStartIndex === -1 ||
      !dataToUse ||
      dataToUse.length <= dataStartIndex ||
      maxColumns === 0
    ) {
      return [];
    }

    // Obtener todas las filas desde el inicio de los datos
    const dataRows = dataToUse.slice(dataStartIndex);
    const excelLineLimit = 93; // Línea 93 del Excel
    const indexLimit = excelLineLimit - 1; // Índice correspondiente (92)

    // Filtrar Y Mapear
    return dataRows
      .map((rowArray, sliceIndex) => {
        // Calcular el índice original de esta fila en el array dataToUse completo
        const originalIndex = dataStartIndex + sliceIndex;
        return { originalIndex, rowArray }; // Devolver objeto temporal con índice y datos
      })
      .filter(({ originalIndex, rowArray }) => {
        // Condición para MANTENER la fila:
        // 1. Si el índice original es MENOR O IGUAL a 92 (línea 93) -> Mantener SIEMPRE (incluso si está en blanco)
        // 2. O si la fila NO está en blanco (independientemente de su índice) -> Mantener
        return originalIndex <= indexLimit || !isRowBlank(rowArray);
      })
      .map(({ originalIndex, rowArray }) => {
        // Usar originalIndex en lugar de filteredIndex
        const rowObject: DataRow = {};
        if (!Array.isArray(rowArray)) return rowObject; // Seguridad extra
        // CRÍTICO: Mantener el índice original del Excel para preservar las referencias entre filas
        // Esto es esencial para cálculos como TipoCambio vs Subtotal -> Subtotal MXN
        // NO usar índice filtrado ya que rompería las referencias de línea
        rowObject._originalIndex = originalIndex; // Usar el índice original, no el filtrado
        for (let i = 0; i < maxColumns; i++) {
          rowObject[i.toString()] = rowArray[i];
        }
        return rowObject;
      });
  }, [localExcelData, excelData, dataStartIndex, maxColumns, foundHeaderIndex]); // Incluir foundHeaderIndex por si acaso

  // --- Efecto para refrescar datos cuando se guarda algo en la Plantilla Base
  useEffect(() => {
    if (savedCellHighlight) {
      const refreshData = async () => {
        try {
          console.log('🔄 Refrescando datos de Plantilla Base tras guardado...');
          const savedData = await indexedDBService.getLatestReportDataByType('base-excel');
          if (savedData && savedData.localChanges) {
            const localRows = savedData.localChanges.filter(
              (r: PersistedReportRow): r is ExcelRow => Array.isArray(r)
            );
            setLocalExcelData([...localRows]); // Clonar para forzar re-renderizado
            console.log('✅ Datos de Plantilla Base refrescados');
          }
        } catch (error) {
          console.error('❌ Error al refrescar datos tras guardado:', error);
        }
      };

      refreshData();
    }
  }, [savedCellHighlight]);

  // --- Renderizado del componente ---
  return (
    <Box>
      {/* Barra superior */}
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
            id="excelFile-base"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChangeInternal}
            style={{ display: 'none' }}
            disabled={loading}
          />
          <label htmlFor="excelFile-base">
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

          {/* Importar Plantilla Completa (Experimental) */}
          <input
            id="excelFile-template"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFullTemplate}
            style={{ display: 'none' }}
            disabled={templateLoading}
          />
          <label htmlFor="excelFile-template">
            <Tooltip title="Importar Plantilla Completa (multi-hoja)" arrow>
              <span>
                <Button
                  variant="outlined"
                  color="secondary"
                  component="span"
                  size="small"
                  startIcon={<LibraryAddIcon />}
                  disabled={templateLoading}
                >
                  {templateLoading ? '...' : 'Importar Plantilla'}
                </Button>
              </span>
            </Tooltip>
          </label>

          {templateWorkbook && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                select
                label="Mes"
                size="small"
                value={exportMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setExportMonth(val);
                  if (templateWorkbook)
                    localStorage.setItem(monthCacheKey(templateWorkbook.id), val);
                }}
                sx={{ minWidth: 130 }}
                helperText="Mes disponible"
                SelectProps={{ native: true }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </TextField>
              <Tooltip title="Agregar mes actual si no aparece" arrow>
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!templateWorkbook}
                    onClick={() => {
                      const current = workbookUtils.toYearMonth();
                      if (!monthOptions.includes(current)) {
                        const updated = [...monthOptions, current].sort();
                        setMonthOptions(updated);
                        setExportMonth(current);
                        if (templateWorkbook)
                          localStorage.setItem(monthCacheKey(templateWorkbook.id), current);
                      }
                    }}
                  >
                    + Mes
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}

          {templateWorkbook && (
            <Tooltip title="Guardar Carátula Mes (Reporte Mensual)" arrow>
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={savingCover || templateLoading || !(localExcelData || excelData)}
                  onClick={handleSaveMonthlyCover}
                >
                  {savingCover ? 'Guardando...' : 'Guardar Carátula'}
                </Button>
              </span>
            </Tooltip>
          )}

          {templateWorkbook && (
            <Tooltip title="Exportar Plantilla (Reporte Mensual)" arrow>
              <span>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  disabled={templateLoading}
                  onClick={handleExportTemplate}
                >
                  Exportar Mes
                </Button>
              </span>
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
                {(localExcelData || excelData) && (
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

      {/* NUEVO: Selector de hojas si hay workbook */}
      {templateWorkbook && sheetList.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Hoja"
            value={selectedSheetIndex}
            onChange={(e) => handleChangeSheet(Number(e.target.value))}
            sx={{ minWidth: 200 }}
            SelectProps={{ native: true }}
          >
            {sheetList.map((s) => (
              <option key={s.index} value={s.index}>
                {s.index === 0 ? `Carátula (${s.name})` : `${s.index + 1}. ${s.name}`}
              </option>
            ))}
          </TextField>
          {loadingSheet && <CircularProgress size={20} />}
          <Tooltip title="Re-sincronizar lista y hoja" arrow>
            <span>
              <IconButton size="small" onClick={handleResync} disabled={refreshingSheet}>
                <SyncIcon fontSize="small" className={refreshingSheet ? 'spin' : ''} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            Filas: {sheetList.find((s) => s.index === selectedSheetIndex)?.rowCount ?? 0} |
            Columnas: {sheetList.find((s) => s.index === selectedSheetIndex)?.colCount ?? 0}
          </Typography>
          {sheetList.find((s) => s.index === selectedSheetIndex)?.immutable &&
            selectedSheetIndex !== 0 && (
              <Typography variant="caption" color="warning.main">
                Solo lectura
              </Typography>
            )}
        </Box>
      )}

      {/* Estado Plantilla Multi-hoja / Reporte Mensual */}
      {templateWorkbook && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: 'info.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.main',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Reporte Mensual - Plantilla Importada
          </Typography>
          <Typography variant="caption" display="block">
            Archivo: {templateWorkbook.originalFileName}
          </Typography>
          <Typography variant="caption" display="block">
            Hojas: {templateSheets.length}
          </Typography>
          {templateBackgroundSync === 'pending' && (
            <Typography variant="caption" display="block" color="warning.main">
              Guardando hojas restantes en segundo plano...
            </Typography>
          )}
          {templateBackgroundSync === 'done' && (
            <Typography variant="caption" display="block" color="success.main">
              Todas las hojas almacenadas localmente.
            </Typography>
          )}
          {templateBackgroundSync === 'error' && (
            <Typography variant="caption" display="block" color="error.main">
              Error al almacenar todas las hojas.
            </Typography>
          )}
          <Typography variant="caption" display="block">
            Mes Exportación: {exportMonth}
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'info.dark',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Próximos Cálculos Mensuales
            </Typography>
            <Typography variant="caption" display="block">
              Aquí se agregarán transformaciones, agregados y fórmulas específicas para el mes
              seleccionado.
            </Typography>
          </Box>
        </Box>
      )}
      {templateError && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography variant="caption" color="error">
            {templateError}
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{
            mb: 2,
            p: 1,
            bgcolor: 'error.light',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          {error}
        </Typography>
      )}

      {/* Metadatos compactos */}
      {!loading && (localExcelData || excelData) && firstCellsValues.length > 0 && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: 'primary.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            📋 Información del Archivo
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 1,
            }}
          >
            {firstCellsValues.map((value, index) => (
              <Typography
                key={index}
                variant="caption"
                sx={{
                  bgcolor: 'background.paper',
                  p: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                {value || ''}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Tabla optimizada */}
      {!loading && foundHeaderIndex !== -1 && maxColumns > 0 && (
        <MaterialReactTable
          columns={columns}
          data={tableData}
          localization={MRT_Localization_ES}
          state={{
            isLoading: loading,
            showProgressBars: loading,
            density: 'compact',
            pagination,
          }}
          onPaginationChange={setPagination}
          enableColumnOrdering={false}
          enableTableFooter={false}
          enableColumnFilters={false}
          enableGlobalFilter={false}
          enableSorting={false}
          enableMultiSort={false}
          enablePagination={true}
          enableDensityToggle={true}
          enableFullScreenToggle={true}
          enableHiding={true}
          enableRowOrdering={false}
          manualSorting={false}
          manualFiltering={false}
          enableRowSelection={false} // Deshabilitar selección de filas
          enableColumnResizing={false} // Deshabilitar redimensionado de columnas
          enableRowActions={false} // Deshabilitar acciones de fila
          enableTopToolbar={true} // Mantener toolbar superior
          enableBottomToolbar={true} // Mantener toolbar inferior
          getRowId={(row) => `stable-row-${row._originalIndex}`}
          initialState={{
            density: 'compact',
            sorting: [],
            columnFilters: [],
            globalFilter: '',
            showColumnFilters: false, // No mostrar filtros de columna
            showGlobalFilter: false, // No mostrar búsqueda global
          }}
          muiTableProps={{
            sx: {
              tableLayout: 'fixed',
              '& .MuiTableHead-root .MuiTableCell-root': {
                cursor: 'default !important',
                userSelect: 'none', // Prevenir selección de texto en headers
                pointerEvents: 'none', // Deshabilitar completamente la interacción con headers
                '& .Mui-sortable': {
                  pointerEvents: 'none', // Deshabilitar iconos de ordenamiento
                },
                '& [data-testid="ArrowDownwardIcon"]': {
                  display: 'none !important', // Ocultar iconos de ordenamiento
                },
                '& [data-testid="ArrowUpwardIcon"]': {
                  display: 'none !important', // Ocultar iconos de ordenamiento
                },
              },
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root': {
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)', // Mantener hover pero sin efectos de ordenación
                  },
                },
              },
            },
          }}
          muiTableHeadCellProps={{
            sx: {
              backgroundColor: 'primary.light',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '8px 12px',
            },
          }}
          muiTableBodyCellProps={{
            sx: {
              fontSize: '0.75rem',
              padding: '6px 12px',
            },
          }}
        />
      )}
      {/* Mensajes de estado compactos */}
      {!loading && foundHeaderIndex !== -1 && maxColumns > 0 && tableData.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            bgcolor: 'warning.light',
            borderRadius: 1,
            mt: 2,
          }}
        >
          <Typography variant="body2">
            ⚠️ Se encontró la cabecera 'CONCEPTO' en la fila {foundHeaderIndex + 1}, pero no se
            encontraron datos válidos.
          </Typography>
        </Box>
      )}

      {!loading &&
        foundHeaderIndex === -1 &&
        (localExcelData || excelData) &&
        (localExcelData?.length || excelData?.length || 0) > 0 && (
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              bgcolor: 'error.light',
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Typography variant="body2" color="error">
              ❌ No se encontró la fila de cabecera con el texto 'CONCEPTO' en el archivo cargado.
            </Typography>
          </Box>
        )}
    </Box>
  );
};

export default BaseExcelTab;
