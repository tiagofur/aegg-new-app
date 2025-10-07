import React, { ChangeEvent, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import * as XLSX from "xlsx";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store";
import {
  reporte03FileLoadStart,
  reporte03FileLoadSuccess,
  reporte03FileLoadFailure,
} from "../redux/reporteIngresosMiAdminSlice";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_Cell } from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";

type ExcelCellValue = any;
type ExcelRow = ExcelCellValue[];
type DataRow = { 
  [key: string]: ExcelCellValue;
  _id?: string;
};
type EstadoSAT = "Vigente" | "Cancelada";

const ReporteMiAdmin: React.FC = () => {
  const { fileName, excelData, loading, error } = useSelector(
    (state: RootState) => state.reporte03
  );
  const dispatch: AppDispatch = useDispatch();

  const [localExcelData, setLocalExcelData] = useState<ExcelRow[] | null>(null);
  const [totalsKey, setTotalsKey] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  // Función para validar y encontrar el header y contenido de la tabla
  const validateAndExtractTableData = useCallback((data: ExcelRow[]): { header: ExcelRow | null, content: ExcelRow[] } => {
    if (!data || data.length === 0) return { header: null, content: [] };

    // Buscar la primera fila con al menos 8 columnas con valores válidos
    const headerIndex = data.findIndex((row: ExcelRow) =>
      Array.isArray(row) &&
      row.filter((cell: any) => {
        if (cell === null || cell === undefined) return false;
        if (typeof cell === 'string') return cell.trim() !== '';
        if (typeof cell === 'number' && !isNaN(cell)) return true;
        if (typeof cell === 'boolean') return true;
        return false;
      }).length >= 8
    );

    if (headerIndex === -1) {
      console.warn("No se encontró una fila válida con al menos 8 columnas con contenido válido.");
      return { header: null, content: [] };
    }

    const slicedData = data.slice(headerIndex);
    const header = slicedData[0];
    const content = slicedData.slice(1);

    return { header, content };
  }, []);

  // Función para manejar la carga del archivo
  const handleFileChangeInternal = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(reporte03FileLoadStart({ fileName: file.name }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("FileReader: No se pudo obtener el resultado del target.");
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("XLSX: El archivo Excel no contiene hojas.");
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error(`XLSX: No se pudo encontrar la hoja "${sheetName}".`);
        let jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          header: 1,
          blankrows: false,
          defval: null,
          raw: true,
        });

        if (!Array.isArray(jsonData)) throw new Error("XLSX: Formato de datos inesperado.");

        // Limpiar estados antes de cargar nuevos datos
        setLocalExcelData(null);
        setTotalsKey(0);
        setPagination({ pageIndex: 0, pageSize: 15 });
        
        dispatch(reporte03FileLoadSuccess({ data: jsonData }));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error desconocido";
        dispatch(reporte03FileLoadFailure({ error: `Error al procesar: ${errorMsg}` }));
      }
    };
    reader.onerror = () => {
      dispatch(reporte03FileLoadFailure({ error: "Error del navegador al intentar leer el archivo." }));
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  // Función para calcular totales
  const calculateTotals = useCallback((data: ExcelRow[] | null, headerIndex: number): ExcelRow[] => {
    if (!data || data.length < headerIndex + 1) return data || [];

    const headerRow = data[headerIndex] as ExcelRow;
    if (!Array.isArray(headerRow) || headerRow.length === 0) return data;

    const dataRowsStartIndex = headerIndex + 1;
    const dataRows = data.slice(dataRowsStartIndex);

    const filteredDataRows = dataRows.filter((row: ExcelRow) => {
      if (!Array.isArray(row) || row.length === 0) return false;
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') return false;
      if (row.every(cell => cell === null || cell === '')) return false;
      return true;
    });

    const totalRow: ExcelRow = ["Totales"];
    for (let i = 1; i < headerRow.length; i++) {
      let sum = 0;
      let hasValues = false;
      for (const row of filteredDataRows) {
        const firstColCheck = row[0]?.toString().toLowerCase() || '';
        if (firstColCheck === 'totales' || firstColCheck === 'total') continue;

        if (i < row.length && typeof row[i] === 'number' && !isNaN(row[i])) {
          sum += row[i];
          hasValues = true;
        }
      }
      totalRow.push(hasValues ? parseFloat(sum.toFixed(2)) : null);
    }
    
    const resultData = [
      ...data.slice(0, headerIndex + 1),
      ...data.slice(dataRowsStartIndex).filter((row: ExcelRow) => {
          if (!Array.isArray(row) || row.length === 0) return true;
          const firstCol = row[0]?.toString().toLowerCase() || '';
          if (firstCol === 'totales' || firstCol === 'total') return false;
          return true;
      }),
      totalRow
    ];
    
    const finalResult = resultData.filter((row: ExcelRow, index: number, self: ExcelRow[]) => {
        const firstCol = row[0]?.toString().toLowerCase() || '';
        if (firstCol === 'totales' || firstCol === 'total') {
            return index === self.findIndex((r: ExcelRow) => (r[0]?.toString().toLowerCase() || '') === firstCol);
        }
        return true;
    });

    return finalResult;
  }, []);

  // Efecto para inicializar localExcelData cuando excelData cambia
  useEffect(() => {
    if (excelData && !localExcelData) {
      const deepCopy = excelData.map((row: ExcelRow) => Array.isArray(row) ? [...row] : row);
      setLocalExcelData(deepCopy);
      setTotalsKey(prev => prev + 1);
    } else if (!excelData && localExcelData) {
      setLocalExcelData(null);
      setTotalsKey(0);
    }
  }, [excelData, localExcelData]);

  const updatedExcelData = useMemo(() => {
    if (!localExcelData) return [];
    const { header } = validateAndExtractTableData(localExcelData);
    const headerIndex = header ? localExcelData.findIndex(row => row === header) : -1;
    if (headerIndex === -1) return localExcelData;
    return calculateTotals(localExcelData, headerIndex);
  }, [localExcelData, calculateTotals, totalsKey, validateAndExtractTableData]);

  const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
    if (!Array.isArray(updatedExcelData) || updatedExcelData.length === 0) {
      return [];
    }
    
    const { header } = validateAndExtractTableData(updatedExcelData);
    if (!header) return [];
    
    const headerIndex = updatedExcelData.findIndex(row => row === header);
    if (headerIndex === -1) return [];

    return header.map((headerCell, colIndex) => {
      return {
        id: colIndex.toString(),
        accessorKey: colIndex.toString(),
        header: headerCell ?? `Columna ${colIndex + 1}`,
        Cell: ({ cell }: { cell: MRT_Cell<DataRow, ExcelCellValue> }) => {
          const cellValue = cell.getValue();
          const isNumericColumn = typeof headerCell === 'string' && (
            headerCell.toLowerCase().includes('subtotal') ||
            headerCell.toLowerCase().includes('total') ||
            headerCell.toLowerCase().includes('importe') ||
            headerCell.toLowerCase().includes('monto')
          ) || (typeof cellValue === 'number' && typeof headerCell === 'string' && !headerCell.toLowerCase().includes('fecha'));
          
          if (isNumericColumn && typeof cellValue === 'number') {
            return <span>{cellValue.toFixed(2)}</span>;
          }
          return <span>{cellValue?.toString() || ''}</span>;
        },
      };
    });
  }, [updatedExcelData, validateAndExtractTableData]);

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
    <Box sx={{ width: "100%" }}>
      {/* Sección de carga de archivo */}
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
            id="excelFile-reporte03"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChangeInternal}
            style={{ display: "none" }}
            disabled={loading}
          />
          <label htmlFor="excelFile-reporte03">
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
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
        >
          Error: {error}
        </Typography>
      )}

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
            density: "compact",
          }}
          enableRowSelection={false}
          enableRowVirtualization={false}
          autoResetPageIndex={false}
          getRowId={(row, index) => row._id || `row-${index}`}
          enableStickyHeader={false}
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
    </Box>
  );
};

export default ReporteMiAdmin;
