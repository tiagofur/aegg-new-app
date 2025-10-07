// src/features/reporte/pages/ExcelImportPage.tsx
import React, { useState, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import * as XLSX from 'xlsx';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Tooltip,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
// Ya no necesitamos importar las acciones de baseExcelSlice aquí
// import { useSelector, useDispatch } from 'react-redux'; // No necesario para baseExcel
// import { RootState, AppDispatch } from '../../app/store'; // No necesario para baseExcel
import BaseExcelTab from '../components/BaseExcelTab';
import Reporte01 from '../components/reporteIngresos';
import Reporte02 from '../components/reporteIngresosAuxiliar';
import Reporte03 from '../components/reporteIngresosMiAdmin';
import GuardarEnBaseButton from '../components/GuardarEnBaseButton';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { updateSelectedMonth, resetBaseData } from '../redux/baseExcelSlice';
import { resetReporte01Data } from '../redux/reporteIngresosSlice';
import { resetReporte02Data } from '../redux/reporteIngresosAuxiliarSlice';
import { resetReporte03Data } from '../redux/reporteIngresosMiAdminSlice';
import { ReportComparisonProvider, useReportComparison } from '../context/ReportComparisonContext';
import { indexedDBService } from '../../../shared/services/indexedDbService';

type ExcelRow = any[];

// Componente interno que puede acceder al contexto
const ReportPageContent: React.FC = () => {
  // Mantenemos el estado local para las pestañas auxiliares (si aún no usan Redux)
  const [, setExcelDataAux] = useState<Record<number, ExcelRow[] | null>>({});
  const [, setFileNamesAux] = useState<Record<number, string>>({});
  const [errorsAux, setErrorsAux] = useState<Record<number, string | null>>({});
  const [loadingAux, setLoadingAux] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  // Obtener el mes seleccionado y tipo cambio desde Redux
  const dispatch = useDispatch();
  const selectedMonth = useSelector((state: RootState) => state.baseExcel.selectedMonth);

  // Acceder al contexto de comparación
  const { clearComparison } = useReportComparison();

  // Función de reset global
  const handleGlobalReset = async () => {
    setIsResetting(true);
    try {
      console.log('[RESET] Iniciando reset global del sistema...');

      // 1. Limpiar IndexedDB
      await indexedDBService.clearAllData();
      console.log('[RESET] ✅ IndexedDB limpiado');

      // 2. Resetear todos los slices de Redux
      dispatch(resetBaseData());
      console.log('[RESET] ✅ baseExcelSlice reseteado');

      dispatch(resetReporte01Data());
      console.log('[RESET] ✅ reporteIngresosSlice reseteado');

      dispatch(resetReporte02Data());
      console.log('[RESET] ✅ reporteIngresosAuxiliarSlice reseteado');

      dispatch(resetReporte03Data());
      console.log('[RESET] ✅ reporteIngresosMiAdminSlice reseteado');

      // 3. Limpiar contexto de comparación
      clearComparison();
      console.log('[RESET] ✅ Contexto de comparación limpiado');

      // 4. Resetear estado local de pestañas auxiliares
      setExcelDataAux({});
      setFileNamesAux({});
      setErrorsAux({});
      setLoadingAux({});
      console.log('[RESET] ✅ Estado local de pestañas auxiliares reseteado');

      // 5. Volver a la primera pestaña
      setActiveTab(0);
      console.log('[RESET] ✅ Navegación reseteada a pestaña base');

      console.log('[RESET] 🎉 Reset global completado exitosamente');
    } catch (error) {
      console.error('[RESET] ❌ Error durante el reset global:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Manejar el cambio del mes en el combobox
  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    const newMonth = Number(event.target.value); // Convertir el valor a número
    dispatch(updateSelectedMonth(newMonth)); // Actualizar el mes en Redux
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    // La lógica para index === 0 ya no es necesaria aquí
    if (index === 0) {
      // BaseExcelTab ahora maneja su propio archivo
      console.warn(
        'handleFileChange llamado para index 0, pero BaseExcelTab lo maneja internamente.'
      );
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // --- Lógica para otras pestañas (índices > 0) usando estado local ---
    setFileNamesAux((prev) => ({ ...prev, [index]: file.name }));
    setErrorsAux((prev) => ({ ...prev, [index]: null }));
    setExcelDataAux((prev) => ({ ...prev, [index]: null }));
    setLoadingAux((prev) => ({ ...prev, [index]: true }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('No se pudo leer el archivo.');
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('El archivo Excel no contiene hojas.');
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error(`No se pudo encontrar la hoja llamada "${sheetName}".`);
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          header: 1,
          blankrows: false,
        });
        if (!Array.isArray(jsonData))
          throw new Error('Los datos extraídos no tienen el formato esperado.');

        setExcelDataAux((prev) => ({ ...prev, [index]: jsonData }));
        setErrorsAux((prev) => ({ ...prev, [index]: null }));
      } catch (err) {
        console.error(`Error al procesar el archivo Excel (Aux ${index}):`, err);
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setErrorsAux((prev) => ({
          ...prev,
          [index]: `Error al procesar: ${errorMsg}`,
        }));
        setExcelDataAux((prev) => ({ ...prev, [index]: null }));
      } finally {
        setLoadingAux((prev) => ({ ...prev, [index]: false }));
      }
    };
    reader.onerror = (err) => {
      console.error(`Error al leer el archivo (Aux ${index}):`, err);
      setErrorsAux((prev) => ({
        ...prev,
        [index]: 'Error al leer el archivo.',
      }));
      setLoadingAux((prev) => ({ ...prev, [index]: false }));
      setExcelDataAux((prev) => ({ ...prev, [index]: null }));
    };
    reader.readAsArrayBuffer(file);

    event.target.value = '';
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Box sx={{ padding: { xs: 1, sm: 2 } }}>
        {/* Header mejorado y simplificado */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Título y información */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                📊 Reportes de Ingresos
              </Typography>

              {/* Chip con información del mes seleccionado */}
              <Chip
                label={
                  [
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
                  ][selectedMonth] || 'Sin mes'
                }
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Controles principales */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              {/* Selector de mes */}
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                displayEmpty
                size="small"
                sx={{
                  minWidth: 140,
                  backgroundColor: 'background.paper',
                  '& .MuiSelect-select': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                {[
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
                ].map((monthName, index) => (
                  <MenuItem key={index} value={index} sx={{ fontSize: '0.875rem' }}>
                    {monthName}
                  </MenuItem>
                ))}
              </Select>

              {/* 🆕 Botón centralizado "Guardar en Base" */}
              <GuardarEnBaseButton selectedMonth={selectedMonth} />

              {/* Botón de Reset Global (más discreto) */}
              <Tooltip title="Reset completo del sistema" arrow>
                <IconButton
                  size="small"
                  onClick={handleGlobalReset}
                  disabled={isResetting}
                  sx={{
                    backgroundColor: 'background.paper',
                    color: 'error.main',
                    border: '1px solid',
                    borderColor: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: 'background.paper',
                      borderColor: 'error.dark',
                    },
                    '&:disabled': {
                      backgroundColor: 'action.disabledBackground',
                      color: 'action.disabled',
                      borderColor: 'action.disabled',
                    },
                  }}
                >
                  {isResetting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Pestañas mejoradas con diseño moderno */}
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                color: 'text.secondary',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main',
                },
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600,
                  backgroundColor: 'primary.50',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              },
              '& .MuiTabs-scrollButtons': {
                color: 'primary.main',
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
              backgroundColor: 'background.paper',
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {[
              { label: '📋 Plantilla Base', icon: '📋', color: '#4CAF50' },
              { label: '💰 Reporte Ingresos', icon: '💰', color: '#2196F3' },
              { label: '📊 Auxiliar Ingresos', icon: '📊', color: '#FF9800' },
              { label: '🏢 Mi Admin Ingresos', icon: '🏢', color: '#9C27B0' },
              ...Array.from({ length: 6 }, (_, i) => ({
                label: `📎 Auxiliar ${i + 4}`,
                icon: '📎',
                color: '#607D8B',
              })),
            ].map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '1.2rem',
                        filter: activeTab === index ? 'none' : 'grayscale(50%)',
                        transition: 'filter 0.2s ease-in-out',
                      }}
                    >
                      {tab.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: activeTab === index ? 600 : 500,
                        fontSize: '0.875rem',
                      }}
                    >
                      {tab.label.replace(tab.icon + ' ', '')}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {/* Contenido de las pestañas con diseño mejorado */}
        <Box
          sx={{
            minHeight: '400px',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 1,
          }}
        >
          {activeTab === 0 ? (
            <BaseExcelTab />
          ) : activeTab === 1 ? (
            <Reporte01 />
          ) : activeTab === 2 ? (
            <Reporte02 />
          ) : activeTab === 3 ? (
            <Reporte03 />
          ) : (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: 'background.default',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  📎 Archivo Auxiliar {activeTab}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Esta funcionalidad está en desarrollo. Por el momento utiliza el estado local.
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    borderRadius: 2,
                    backgroundColor: 'primary.50',
                    minWidth: 300,
                    maxWidth: 400,
                  }}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => handleFileChange(e, activeTab)}
                    disabled={loadingAux[activeTab]}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: loadingAux[activeTab] ? 'not-allowed' : 'pointer',
                    }}
                  />
                </Box>

                {loadingAux[activeTab] && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'primary.main',
                    }}
                  >
                    <CircularProgress size={20} />
                    <Typography variant="body2">Cargando archivo...</Typography>
                  </Box>
                )}

                {errorsAux[activeTab] && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'error.light',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'error.main',
                    }}
                  >
                    <Typography variant="body2" color="error.dark" sx={{ fontWeight: 500 }}>
                      ❌ {errorsAux[activeTab]}
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    fontStyle: 'italic',
                  }}
                >
                  💡 Tip: Puedes arrastrar y soltar archivos Excel (.xlsx, .xls) o CSV
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
};

// Componente principal que envuelve con el Provider
const ReportPage: React.FC = () => {
  return (
    <ReportComparisonProvider>
      <ReportPageContent />
    </ReportComparisonProvider>
  );
};

export default ReportPage;
