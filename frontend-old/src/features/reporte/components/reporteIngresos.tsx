import React, { ChangeEvent, useMemo, useState, useCallback, useEffect } from "react";
import { Box, Button, CircularProgress, Typography, Tooltip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import * as XLSX from "xlsx";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store";
import {
  reporte01FileLoadStart,
  reporte01FileLoadSuccess,
  reporte01FileLoadFailure,
  resetReporte01Data,
} from "../redux/reporteIngresosSlice";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_Cell } from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { indexedDBService, type PersistedReportData } from "../../../shared/services/indexedDbService";

type ExcelCellValue = any;
type ExcelRow = ExcelCellValue[];
type DataRow = { [key: string]: ExcelCellValue };

const Reporte01: React.FC = () => {
  const { fileName, excelData, loading, error } = useSelector(
    (state: RootState) => state.reporte01
  );
  const dispatch: AppDispatch = useDispatch();

  // Estado local para manejar los cambios
  const [localExcelData, setLocalExcelData] = useState<ExcelRow[] | null>(null);
  
  // Estado para mantener la paginación
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  // Estados para el manejo de persistencia
  const [savedWorkExists, setSavedWorkExists] = useState(false);

  // Estado para el menú desplegable de guardado
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const saveMenuOpen = Boolean(saveMenuAnchor);

  const handleSaveMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSaveMenuAnchor(event.currentTarget);
  };

  const handleSaveMenuClose = () => {
    setSaveMenuAnchor(null);
  };

  // Función para guardar el trabajo actual
  const saveCurrentWork = useCallback(async () => {
    if (!fileName || !excelData || !localExcelData) return;

    try {
      const reportData: PersistedReportData = {
        id: `reporte01-${Date.now()}`,
        fileName,
        uploadDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        originalExcelData: excelData,
        localChanges: localExcelData,
        pagination,
        metadata: {
          totalRows: localExcelData.length,
          reportType: 'reporte01'
        }
      };

      await indexedDBService.saveReportData(reportData);
      setSavedWorkExists(true);
    } catch (error) {
      console.error('Error al guardar reporte01:', error);
    }
  }, [fileName, excelData, localExcelData, pagination]);

  // Función para recuperar trabajo guardado
  const restoreWork = useCallback(async () => {
    try {
      const savedData = await indexedDBService.getLatestReportDataByType('reporte01');
      if (savedData) {
        dispatch(reporte01FileLoadSuccess({ 
          data: savedData.originalExcelData 
        }));
        
        setLocalExcelData(savedData.localChanges);
        setPagination(savedData.pagination);
        
      }
    } catch (error) {
      console.error('Error al restaurar reporte01:', error);
    }
  }, [dispatch]);

  // Función para limpiar completamente (guardado + tabla + Redux)
  const clearSavedWork = useCallback(async () => {
    try {
      // 1. Limpiar datos guardados en IndexedDB
      await indexedDBService.clearReportDataByType('reporte01');
      console.log('[LIMPIAR] ✅ Datos guardados eliminados');
      
      // 2. Limpiar Redux
      dispatch(resetReporte01Data());
      console.log('[LIMPIAR] ✅ Estado Redux limpiado');
      
      // 3. Limpiar estado local
      setLocalExcelData(null);
      setSavedWorkExists(false);
      setPagination({ pageIndex: 0, pageSize: 15 });
      console.log('[LIMPIAR] ✅ Estado local limpiado');
      
      console.log('[LIMPIAR] 🎉 Limpieza completa de Reporte 01 exitosa');
    } catch (error) {
      console.error('[LIMPIAR] ❌ Error al limpiar reporte01:', error);
    }
  }, [dispatch]);

  // Verificar si existe trabajo guardado al montar el componente
  useEffect(() => {
    const checkSavedWork = async () => {
      try {
        const savedData = await indexedDBService.getLatestReportDataByType('reporte01');
        if (savedData) {
          setSavedWorkExists(true);
          
          if (!excelData) {
            dispatch(reporte01FileLoadSuccess({ 
              data: savedData.originalExcelData 
            }));
            setLocalExcelData(savedData.localChanges);
            setPagination(savedData.pagination);
          }
        }
      } catch (error) {
        console.error('Error al verificar trabajo guardado:', error);
      }
    };
    
    checkSavedWork();
  }, []);

  // Actualizar el estado local cuando cambien los datos del Redux
  useEffect(() => {
    if (excelData && !localExcelData) {
      const deepCopy = excelData.map(row => Array.isArray(row) ? [...row] : row);
      setLocalExcelData(deepCopy);
    }
  }, [excelData, localExcelData]);

  // Auto-guardado cuando cambian los datos locales
  useEffect(() => {
    if (!localExcelData || !fileName || !excelData) return;

    const saveTimeout = setTimeout(async () => {
      try {
        await saveCurrentWork();
        console.log('🔄 Auto-guardado completado para reporte01');
      } catch (error) {
        console.error('❌ Error en auto-guardado reporte01:', error);
      }
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [localExcelData, pagination, fileName, saveCurrentWork]);

  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 REPORTE01: Archivo seleccionado - DETALLES:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    dispatch(reporte01FileLoadStart({ fileName: file.name }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No se pudo leer el archivo.");

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) throw new Error("El archivo Excel no contiene hojas.");

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet)
          throw new Error(`No se pudo encontrar la hoja "${sheetName}".`);

        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          header: 1,
          blankrows: false,
          defval: null,
          raw: true,
        });

        if (!Array.isArray(jsonData))
          throw new Error("Formato de datos inesperado.");

        dispatch(reporte01FileLoadSuccess({ data: jsonData }));
      } catch (err) {
        console.error("Error al procesar el archivo Excel (Reporte01):", err);
        const errorMsg =
          err instanceof Error ? err.message : "Error desconocido";
        dispatch(
          reporte01FileLoadFailure({ error: `Error al procesar: ${errorMsg}` })
        );
      }
    };
    reader.onerror = (err) => {
      console.error("Error al leer el archivo (Reporte01):", err);
      dispatch(
        reporte01FileLoadFailure({ error: "Error al leer el archivo." })
      );
    };
    reader.readAsArrayBuffer(file);

    event.target.value = "";
  };

  // Función para validar y encontrar el header y contenido de la tabla
  const validateAndExtractTableData = (data: ExcelRow[]): { header: ExcelRow | null, content: ExcelRow[] } => {
    if (!data || data.length === 0) return { header: null, content: [] };

    // Buscar la primera fila con al menos 8 columnas con contenido válido
    const headerIndex = data.findIndex(row => 
      Array.isArray(row) && 
      row.filter(cell => typeof cell === 'string' && cell.trim() !== '').length >= 6
    );

    if (headerIndex === -1) {
      console.warn("No se encontró una fila válida con al menos 6 columnas con contenido.");
      return { header: null, content: [] };
    }

    // Dividir los datos en encabezado y contenido
    const header = data[headerIndex];
    const content = data.slice(headerIndex + 1);

    return { header, content };
  };

  // Aplicar el validador a los datos cargados
  const validatedData = useMemo(() => {
    if (!excelData) return { header: null, content: [] };
    return validateAndExtractTableData(excelData);
  }, [excelData]);

  // --- Preparación de datos para Material React Table ---
  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
    if (!validatedData.header) return [];

    return validatedData.header.map((header, index) => {
      const columnDef: MRT_ColumnDef<DataRow> = {
        id: index.toString(),
        accessorKey: index.toString(),
        header: header?.toString() ?? `Columna ${index + 1}`,
      };

      if (index === 2 || index === 3) {
        columnDef.Cell = ({ cell }: { cell: MRT_Cell<DataRow, ExcelCellValue> }) => {
          const value = cell.getValue();
          if (typeof value === 'number' && value > 0) {
            try {
              return XLSX.SSF.format('dd/mm/yyyy', value);
            } catch (e) { return String(value); }
          }
          return value?.toString() ?? '';
        };
      }
      return columnDef;
    });
  }, [validatedData.header]);

  const tableData = useMemo<DataRow[]>(() => {
    if (!validatedData.content || validatedData.content.length === 0) {
      return [];
    }

    return validatedData.content.map((rowArray) => {
      if (!Array.isArray(rowArray)) return {};
      const rowObject: DataRow = {};
      const headerLength = columns.length;
      for (let i = 0; i < headerLength; i++) {
        rowObject[i.toString()] = rowArray[i];
      }
      return rowObject;
    });
  }, [validatedData.content, columns.length]);

  // --- Renderizado del componente ---
  return (
    <Box>
      {/* Información del archivo y botón de carga */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
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
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: fileName ? "text.primary" : "text.disabled",
            }}
          >
            {fileName || "Ningún archivo seleccionado"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexShrink: 0, alignItems: "center" }}>
          <input
            id="excelFile-reporte01"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChangeInternal}
            style={{ display: "none" }}
            disabled={loading}
          />
          <label htmlFor="excelFile-reporte01">
            <Button
              variant="contained"
              component="span"
              disabled={loading}
              startIcon={!loading ? <UploadFileIcon /> : undefined}
              size="small"
              sx={{ minWidth: "auto" }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Cargar Archivo"
              )}
            </Button>
          </label>

          {/* Menú desplegable para opciones de guardado */}
          {(savedWorkExists || excelData) && (
            <>
              <Tooltip title="Opciones de guardado" arrow>
                <IconButton
                  size="small"
                  onClick={handleSaveMenuClick}
                  sx={{ color: "primary.main" }}
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
                  <MenuItem onClick={() => { saveCurrentWork(); handleSaveMenuClose(); }}>
                    <ListItemIcon>
                      <SaveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Guardar trabajo actual</ListItemText>
                  </MenuItem>
                )}
                {savedWorkExists && (
                  <MenuItem onClick={() => { restoreWork(); handleSaveMenuClose(); }}>
                    <ListItemIcon>
                      <RestoreIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Restaurar trabajo guardado</ListItemText>
                  </MenuItem>
                )}
                {savedWorkExists && (
                  <MenuItem onClick={() => { clearSavedWork(); handleSaveMenuClose(); }}>
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

      {/* Error */}
      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mb: 2, textAlign: "center" }}
        >
          {error}
        </Typography>
      )}

      {/* Tabla */}
      {columns.length > 0 && (
        <MaterialReactTable
          columns={columns}
          data={tableData}
          localization={MRT_Localization_ES}
          state={{
            isLoading: loading,
            showProgressBars: loading,
            pagination,
          }}
          onPaginationChange={setPagination}
          enableColumnFilters={true} // ✅ HABILITAR FILTROS
          enableSorting={true} // ✅ HABILITAR ORDENAMIENTO
          enableMultiSort={true} // ✅ HABILITAR ORDENAMIENTO MÚLTIPLE
          manualSorting={false} // Mantener false para ordenamiento automático
          enableColumnOrdering={true} // ✅ HABILITAR REORDENAMIENTO DE COLUMNAS
          enableRowOrdering={true} // ✅ HABILITAR REORDENAMIENTO MANUAL DE FILAS
          enableRowDragging={true} // ✅ HABILITAR ARRASTRAR FILAS
          enablePagination={true}
          enableDensityToggle={true}
          enableFullScreenToggle={true}
          enableHiding={true}
          initialState={{
            density: "compact",
          }}
        />
      )}
    </Box>
  );
};

export default Reporte01;
