// src/features/reporte/context/ReportComparisonContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ReportComparisonService,
  type ComparisonResult,
  type ReportData,
} from '../services/reportComparisonService';
// Legacy indexedDBService removido: ya no se usa almacenamiento legacy para Plantilla Base

// 🆕 NUEVO: Estado para rastrear celdas recién guardadas (para resaltado en verde)
interface SavedCellHighlight {
  rowIndex: number;
  columnIndex: number;
  value: number;
  timestamp: number;
}

// Representa una celda de Excel básica que aceptamos (mantener simple)
type ExcelPrimitive = string | number | boolean | null | undefined;
// Matriz de datos proveniente de XLSX (sin procesar)
type ExcelMatrix = ExcelPrimitive[][];

interface ReportComparisonContextType {
  // Datos de reportes
  reporte02Data: ReportData[];
  reporte03Data: ReportData[];

  // Resultados de comparación
  comparisonResults: Map<string, ComparisonResult>;

  // Estado de comparación
  isComparisonActive: boolean;
  lastComparisonTime: Date | null;

  // Métodos
  updateReporte02Data: (excelData: ExcelMatrix) => void;
  updateReporte03Data: (excelData: ExcelMatrix) => void;
  performComparison: () => void;
  toggleComparison: () => void;
  clearComparison: () => void;

  // Utilidades para obtener estilos y tooltips
  getRowStyle: (folio: string) => React.CSSProperties;
  getTooltip: (folio: string) => string;

  // 🆕 Nuevas funciones helper para las columnas adicionales
  getSubtotalAuxByFolio: (folio: string) => number | string;
  getSuggestedTipoCambioByFolio: (folio: string, subtotalMiAdmin: number) => number | string;

  // 🆕 NUEVAS FUNCIONES PARA SUBTOTALES Y BOTÓN DE GUARDADO
  getSubtotalMXNFromReporte03: () => number | null;
  getSubtotalAUXFromReporte03: () => number | null;
  getSubtotalFromReporte02: () => number | null; // 🆕 NUEVA: Obtener subtotal total de Auxiliar
  areSubtotalsEqual: () => boolean;
  shouldShowSaveButton: () => boolean;
  saveToPlantillaBase: (subtotalMXN: number, selectedMonth: number) => Promise<boolean>;

  // 🆕 NUEVO: Para resaltado en verde
  savedCellHighlight: SavedCellHighlight | null;
  clearSavedCellHighlight: () => void;
}

const ReportComparisonContext = createContext<ReportComparisonContextType | null>(null);

interface ReportComparisonProviderProps {
  children: ReactNode;
}

export const ReportComparisonProvider: React.FC<ReportComparisonProviderProps> = ({ children }) => {
  // (performComparison se declara más abajo una vez que los estados están definidos para evitar TDZ)

  const [reporte02Data, setReporte02Data] = useState<ReportData[]>([]);
  const [reporte03Data, setReporte03Data] = useState<ReportData[]>([]);
  // Agregar estado para datos originales de Excel
  const [reporte02ExcelData, setReporte02ExcelData] = useState<ExcelMatrix>([]);
  const [reporte03ExcelData, setReporte03ExcelData] = useState<ExcelMatrix>([]);
  const [comparisonResults, setComparisonResults] = useState<Map<string, ComparisonResult>>(
    new Map()
  );
  const [isComparisonActive, setIsComparisonActive] = useState(false);
  const [lastComparisonTime, setLastComparisonTime] = useState<Date | null>(null);

  // 🆕 NUEVO: Estado para rastrear celdas recién guardadas (para resaltado en verde)
  const [savedCellHighlight, setSavedCellHighlight] = useState<SavedCellHighlight | null>(null);

  // Referencia mutable para evitar problemas de orden con callbacks dependientes
  const performComparisonRef = React.useRef<() => void>(() => {});

  const performComparison = useCallback(() => {
    if (reporte02Data.length === 0 || reporte03Data.length === 0) {
      console.warn('⚠️ No se puede realizar comparación: faltan datos de uno o ambos reportes');
      return;
    }
    console.log('🔄 Iniciando comparación de reportes...');
    try {
      const results = ReportComparisonService.compareReports(reporte02Data, reporte03Data);
      setComparisonResults(results);
      setLastComparisonTime(new Date());
      console.log('✅ Comparación completada:', {
        totalComparaciones: results.size,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('❌ Error durante la comparación:', error);
    }
  }, [reporte02Data, reporte03Data]);

  // Mantener ref sincronizado
  performComparisonRef.current = performComparison;

  const updateReporte02Data = useCallback(
    (excelData: ExcelMatrix) => {
      console.log('🔄 Actualizando datos de reporte02 para comparación');

      try {
        // Guardar datos originales de Excel
        setReporte02ExcelData(excelData);

        const extractedData = ReportComparisonService.extractReporte02Data(excelData);
        setReporte02Data(extractedData);

        console.log('✅ Datos de reporte02 actualizados:', {
          totalRecords: extractedData.length,
          primeros3: extractedData.slice(0, 3).map((item) => ({
            folio: item.folio,
            subtotal: item.subtotal,
          })),
        });

        // Si la comparación está activa y tenemos datos de ambos reportes, realizar comparación automática
        if (isComparisonActive && reporte03Data.length > 0) {
          performComparisonRef.current();
        }
      } catch (error) {
        console.error('❌ Error al actualizar datos de reporte02:', error);
      }
    },
    [isComparisonActive, reporte03Data.length]
  );

  const updateReporte03Data = useCallback(
    (excelData: ExcelMatrix) => {
      console.log('🔄 Actualizando datos de reporte03 para comparación');

      try {
        // Guardar datos originales de Excel
        setReporte03ExcelData(excelData);

        const extractedData = ReportComparisonService.extractReporte03Data(excelData);
        setReporte03Data(extractedData);

        console.log('✅ Datos de reporte03 actualizados:', {
          totalRecords: extractedData.length,
          primeros3: extractedData.slice(0, 3).map((item) => ({
            folio: item.folio,
            subtotal: item.subtotal,
          })),
        });

        // Si la comparación está activa y tenemos datos de ambos reportes, realizar comparación automática
        if (isComparisonActive && reporte02Data.length > 0) {
          performComparisonRef.current();
        }
      } catch (error) {
        console.error('❌ Error al actualizar datos de reporte03:', error);
      }
    },
    [isComparisonActive, reporte02Data.length]
  );

  // performComparison ya definido arriba (versión ref friendly)

  const toggleComparison = useCallback(() => {
    const newState = !isComparisonActive;
    setIsComparisonActive(newState);

    if (newState) {
      // Si se activa la comparación y hay datos, realizar comparación inmediata
      if (reporte02Data.length > 0 && reporte03Data.length > 0) {
        performComparison();
      }
      console.log('🟢 Comparación activada');
    } else {
      // Si se desactiva, limpiar resultados
      setComparisonResults(new Map());
      setLastComparisonTime(null);
      console.log('🔴 Comparación desactivada');
    }
  }, [isComparisonActive, reporte02Data.length, reporte03Data.length, performComparison]);

  const clearComparison = useCallback(() => {
    setComparisonResults(new Map());
    setLastComparisonTime(null);
    setIsComparisonActive(false);
    console.log('🧹 Comparación limpiada');
  }, []);

  // Nueva función para comparar valores numéricos específicos usando datos originales de Excel
  const compareSubtotalValues = useCallback(
    (
      folio: string
    ): {
      hasDiscrepancy: boolean;
      auxValue?: number;
      adminValue?: number;
      difference?: number;
      bothExist: boolean;
    } => {
      if (!reporte02ExcelData.length || !reporte03ExcelData.length) {
        return { hasDiscrepancy: false, bothExist: false };
      }

      // Buscar la fila en Auxiliar Ingresos (reporte02) - datos originales de Excel
      let auxRow: ExcelPrimitive[] | null = null;
      for (let i = 4; i < reporte02ExcelData.length; i++) {
        // Empezar después del header (índice 3)
        const row = reporte02ExcelData[i];
        if (Array.isArray(row)) {
          const found = row.some((cell) => cell?.toString() === folio);
          if (found) {
            auxRow = row;
            break;
          }
        }
      }

      // Buscar la fila en Mi Admin Ingresos (reporte03) - datos originales de Excel
      let adminRow: ExcelPrimitive[] | null = null;
      let adminHeaderIndex = -1;
      for (let i = 0; i < reporte03ExcelData.length; i++) {
        const row = reporte03ExcelData[i];
        if (Array.isArray(row) && row.length >= 8) {
          // Buscar header válido
          const validCells = row.filter(
            (cell) => cell !== null && cell !== undefined && cell !== ''
          ).length;
          if (validCells >= 8) {
            adminHeaderIndex = i;
            break;
          }
        }
      }

      if (adminHeaderIndex !== -1) {
        for (let i = adminHeaderIndex + 1; i < reporte03ExcelData.length; i++) {
          const row = reporte03ExcelData[i];
          if (Array.isArray(row)) {
            const found = row.some((cell) => cell?.toString() === folio);
            if (found) {
              adminRow = row;
              break;
            }
          }
        }
      }

      const bothExist = auxRow && adminRow;

      if (!bothExist) {
        return { hasDiscrepancy: false, bothExist: false };
      }

      // Encontrar el índice de la columna Subtotal en Auxiliar (reporte02)
      const auxHeaderRow = reporte02ExcelData[3]; // Header en índice 3
      let auxSubtotalIndex = -1;
      if (Array.isArray(auxHeaderRow)) {
        auxSubtotalIndex = auxHeaderRow.findIndex((header: ExcelPrimitive) => {
          const headerStr = header?.toString().toLowerCase() || '';
          return headerStr.includes('subtotal') && !headerStr.includes('mxn');
        });
      }

      // 🆕 NUEVO: Calcular SUBTOTAL MXN en Mi Admin usando la lógica correcta
      const adminHeaderRow = reporte03ExcelData[adminHeaderIndex];
      let adminSubtotalIndex = -1;
      let adminTipoCambioIndex = -1;
      let adminMonedaIndex = -1;

      if (Array.isArray(adminHeaderRow)) {
        adminSubtotalIndex = adminHeaderRow.findIndex((header: ExcelPrimitive) => {
          const headerStr = header?.toString().toLowerCase() || '';
          return headerStr.includes('subtotal') && !headerStr.includes('mxn');
        });

        adminTipoCambioIndex = adminHeaderRow.findIndex((header: ExcelPrimitive) => {
          const headerStr = header?.toString().toLowerCase() || '';
          return (
            headerStr.includes('tipo cambio') ||
            headerStr.includes('tipo de cambio') ||
            headerStr.includes('tipocambio')
          );
        });

        adminMonedaIndex = adminHeaderRow.findIndex((header: ExcelPrimitive) => {
          const headerStr = header?.toString().toLowerCase() || '';
          return headerStr === 'moneda';
        });
      }

      if (
        auxSubtotalIndex === -1 ||
        adminSubtotalIndex === -1 ||
        adminTipoCambioIndex === -1 ||
        adminMonedaIndex === -1
      ) {
        return { hasDiscrepancy: false, bothExist: true };
      }

      const auxValue =
        auxRow && typeof auxRow[auxSubtotalIndex] !== 'undefined'
          ? parseFloat(String(auxRow[auxSubtotalIndex]))
          : NaN;
      const adminSubtotal =
        adminRow && typeof adminRow[adminSubtotalIndex] !== 'undefined'
          ? parseFloat(String(adminRow[adminSubtotalIndex]))
          : NaN;
      const adminTipoCambio =
        adminRow && typeof adminRow[adminTipoCambioIndex] !== 'undefined'
          ? parseFloat(String(adminRow[adminTipoCambioIndex]))
          : NaN;
      const adminMoneda = adminRow ? adminRow[adminMonedaIndex] : undefined;

      if (isNaN(auxValue) || isNaN(adminSubtotal)) {
        return { hasDiscrepancy: false, bothExist: true };
      }

      // 🆕 Calcular SUBTOTAL MXN según la lógica del componente
      let adminValue: number;
      if (adminMoneda?.toString().toUpperCase() === 'USD' && !isNaN(adminTipoCambio)) {
        adminValue = adminSubtotal * adminTipoCambio; // USD: subtotal * tipoCambio
      } else {
        adminValue = adminSubtotal; // No USD: subtotal original
      }

      const difference = Math.abs(auxValue - adminValue);
      const tolerance = 0.1; // Tolerancia de 10 centavos para diferencias de redondeo

      return {
        hasDiscrepancy: difference > tolerance,
        auxValue,
        adminValue,
        difference,
        bothExist: true,
      };
    },
    [reporte02ExcelData, reporte03ExcelData]
  );

  // Modificar getRowStyle para incluir comparación de valores usando datos originales
  const getRowStyle = useCallback(
    (folio: string): React.CSSProperties => {
      if (!isComparisonActive || !reporte02ExcelData.length || !reporte03ExcelData.length) {
        return {};
      }

      // Verificar si el folio existe en ambos reportes usando datos originales de Excel
      const inReporte02 = reporte02ExcelData.some(
        (row) => Array.isArray(row) && row.some((cell) => cell?.toString() === folio)
      );
      const inReporte03 = reporte03ExcelData.some(
        (row) => Array.isArray(row) && row.some((cell) => cell?.toString() === folio)
      );

      // Si está en ambos reportes, verificar valores
      if (inReporte02 && inReporte03) {
        const comparison = compareSubtotalValues(folio);

        if (comparison.hasDiscrepancy) {
          // 🔴 Rojo suave para discrepancias en valores numéricos (folios iguales pero valores diferentes)
          return {
            backgroundColor: '#ffebee', // Rojo muy suave
            borderLeft: '4px solid #ef5350', // Rojo más suave que antes
          };
        } else {
          // 🟢 Verde suave para folios que coinciden y valores que coinciden
          return {
            backgroundColor: '#e8f5e9', // Verde muy suave
            borderLeft: '4px solid #66bb6a', // Verde más suave
          };
        }
      } else if (inReporte02 || inReporte03) {
        // 🟣 Morado suave para folios que solo están en un reporte
        return {
          backgroundColor: '#f3e5f5', // Morado muy suave
          borderLeft: '4px solid #ab47bc', // Morado más suave
        };
      }

      return {};
    },
    [isComparisonActive, reporte02ExcelData, reporte03ExcelData, compareSubtotalValues]
  );

  // Modificar getTooltip para incluir información de valores usando datos originales
  const getTooltip = useCallback(
    (folio: string): string => {
      if (!isComparisonActive || !reporte02ExcelData.length || !reporte03ExcelData.length) {
        return '';
      }

      // Verificar si el folio existe en ambos reportes usando datos originales de Excel
      const inReporte02 = reporte02ExcelData.some(
        (row) => Array.isArray(row) && row.some((cell) => cell?.toString() === folio)
      );
      const inReporte03 = reporte03ExcelData.some(
        (row) => Array.isArray(row) && row.some((cell) => cell?.toString() === folio)
      );

      if (inReporte02 && inReporte03) {
        const comparison = compareSubtotalValues(folio);

        if (comparison.hasDiscrepancy) {
          return `🔴 DISCREPANCIA: Folio ${folio} - Auxiliar: $${comparison.auxValue?.toFixed(
            2
          )} vs Mi Admin MXN: $${comparison.adminValue?.toFixed(
            2
          )} (Diferencia: $${comparison.difference?.toFixed(2)})`;
        } else if (comparison.auxValue !== undefined && comparison.adminValue !== undefined) {
          return `✅ VALORES COINCIDENTES: Folio ${folio} - Ambos reportes: $${comparison.auxValue.toFixed(
            2
          )}`;
        } else {
          return `✅ Folio ${folio} presente en ambos reportes`;
        }
      } else if (inReporte02) {
        return `🟣 SOLO EN AUXILIAR: Folio ${folio} únicamente en Auxiliar Ingresos`;
      } else if (inReporte03) {
        return `🟣 SOLO EN MI ADMIN: Folio ${folio} únicamente en Mi Admin Ingresos`;
      }

      return '';
    },
    [isComparisonActive, reporte02ExcelData, reporte03ExcelData, compareSubtotalValues]
  );

  // 🆕 Función helper para obtener Subtotal de Auxiliar por folio
  const getSubtotalAuxByFolio = useCallback(
    (folio: string): number | string => {
      if (!reporte02ExcelData.length) {
        return 'N/A';
      }

      // Buscar la fila en Auxiliar Ingresos por folio
      let auxRow: ExcelPrimitive[] | null = null;
      for (let i = 4; i < reporte02ExcelData.length; i++) {
        // Empezar después del header (índice 3)
        const row = reporte02ExcelData[i];
        if (Array.isArray(row)) {
          const found = row.some((cell) => cell?.toString() === folio);
          if (found) {
            auxRow = row;
            break;
          }
        }
      }

      if (!auxRow) {
        return 'N/A'; // Folio no encontrado en Auxiliar
      }

      // Encontrar el índice de la columna Subtotal en Auxiliar
      const auxHeaderRow = reporte02ExcelData[3]; // Header en índice 3
      let auxSubtotalIndex = -1;
      if (Array.isArray(auxHeaderRow)) {
        auxSubtotalIndex = auxHeaderRow.findIndex((header: ExcelPrimitive) => {
          const headerStr = header?.toString().toLowerCase() || '';
          return headerStr.includes('subtotal') && !headerStr.includes('mxn');
        });
      }

      if (auxSubtotalIndex === -1) {
        return 'N/A'; // Columna Subtotal no encontrada
      }

      const auxValue =
        auxRow && typeof auxRow[auxSubtotalIndex] !== 'undefined'
          ? parseFloat(String(auxRow[auxSubtotalIndex]))
          : NaN;
      return isNaN(auxValue) ? 'N/A' : auxValue;
    },
    [reporte02ExcelData]
  );

  // 🆕 Función helper para calcular Tipo de Cambio sugerido
  const getSuggestedTipoCambioByFolio = useCallback(
    (folio: string, subtotalMiAdmin: number): number | string => {
      if (!reporte02ExcelData.length) {
        return 'N/A';
      }

      // Validar que subtotalMiAdmin sea válido
      if (!subtotalMiAdmin || subtotalMiAdmin <= 0) {
        return 'Error: Revisar Subtotal';
      }

      const subtotalAux = getSubtotalAuxByFolio(folio);

      if (subtotalAux === 'N/A' || typeof subtotalAux !== 'number') {
        return 'N/A'; // No se puede calcular sin el valor del auxiliar
      }

      // Calcular TC Sugerido = Subtotal Auxiliar ÷ Subtotal Mi Admin
      const suggestedTC = subtotalAux / subtotalMiAdmin;
      return parseFloat(suggestedTC.toFixed(4)); // 4 decimales para mayor precisión
    },
    [reporte02ExcelData, getSubtotalAuxByFolio]
  );

  // 🆕 Nuevas funciones para manejar subtotales y botón de guardado
  const getSubtotalMXNFromReporte03 = useCallback((): number | null => {
    console.log('🔍 getSubtotalMXNFromReporte03 - Leyendo desde datos procesados (con totales)...');

    if (!reporte03ExcelData.length) {
      console.warn('⚠️ Mi Admin Ingresos: Datos procesados insuficientes');
      return null;
    }
    // Intentar localizar una columna existente "Subtotal MXN" (caso futuro)
    let headerRowIndex = reporte03ExcelData.findIndex((row) => {
      if (!Array.isArray(row)) return false;
      return row.some((cell) => cell?.toString().toLowerCase().includes('subtotal mxn'));
    });

    if (headerRowIndex !== -1) {
      const headerRow = reporte03ExcelData[headerRowIndex];
      const subtotalMXNIndex = headerRow.findIndex((cell) =>
        cell?.toString().toLowerCase().includes('subtotal mxn')
      );
      if (subtotalMXNIndex !== -1) {
        const lastRowIndex = reporte03ExcelData.length - 1;
        const totalesRow = reporte03ExcelData[lastRowIndex];
        if (Array.isArray(totalesRow)) {
          const firstCol = totalesRow[0]?.toString().toLowerCase() || '';
          if (firstCol === 'totales' || firstCol === 'total') {
            const val = totalesRow[subtotalMXNIndex];
            const parsed =
              typeof val === 'number'
                ? val
                : val != null && val !== '' && val !== 'N/A'
                ? parseFloat(val.toString())
                : NaN;
            if (!isNaN(parsed)) {
              return parsed;
            }
          }
        }
      }
      // Si falla seguimos al cálculo manual
      console.log(
        'ℹ️ Fallback: recalculando Subtotal MXN manualmente (no se pudo usar columna existente)'
      );
    }

    // Cálculo manual replicando lógica de componente (sin depender de columna SUBTOTAL MXN)
    // 1. Encontrar header dinámicamente (primera fila con >=8 celdas válidas)
    headerRowIndex = reporte03ExcelData.findIndex((row) => {
      return (
        Array.isArray(row) &&
        row.filter(
          (cell) =>
            cell !== null &&
            cell !== undefined &&
            cell !== '' &&
            !(typeof cell === 'number' && isNaN(cell as number))
        ).length >= 8
      );
    });
    if (headerRowIndex === -1) return null;
    const headerRow = reporte03ExcelData[headerRowIndex];
    if (!Array.isArray(headerRow)) return null;

    const subtotalIdx = headerRow.findIndex((h) =>
      h?.toString().toLowerCase().includes('subtotal')
    );
    const tipoCambioIdx = headerRow.findIndex((h) => {
      const hs = h?.toString().toLowerCase() || '';
      return (
        hs.includes('tipo cambio') || hs.includes('tipo de cambio') || hs.includes('tipocambio')
      );
    });
    const monedaIdx = headerRow.findIndex((h) => h?.toString().toLowerCase() === 'moneda');
    const estadoSatIdx = headerRow.findIndex((h) => {
      const hs = h?.toString().toLowerCase() || '';
      return hs === 'estatus sat' || hs === 'estado sat';
    });
    if (subtotalIdx === -1 || tipoCambioIdx === -1 || monedaIdx === -1) {
      return null;
    }
    let sum = 0;
    for (let i = headerRowIndex + 1; i < reporte03ExcelData.length; i++) {
      const row = reporte03ExcelData[i];
      if (!Array.isArray(row)) continue;
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (firstCol === 'totales' || firstCol === 'total') continue;
      if (estadoSatIdx !== -1 && row[estadoSatIdx] === 'Cancelada') continue;
      const subtotal = row[subtotalIdx];
      const moneda = row[monedaIdx];
      const tipoCambio = row[tipoCambioIdx];
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
    const finalSum = Number.isFinite(sum) ? parseFloat(sum.toFixed(2)) : null;
    console.log('✅ Subtotal MXN (fallback manual):', finalSum);
    return finalSum;
  }, [reporte03ExcelData]);

  // 🆕 NUEVA FUNCIÓN: Obtener subtotal total de Auxiliar Ingresos (reporte02)
  const getSubtotalFromReporte02 = useCallback((): number | null => {
    console.log('🔍 getSubtotalFromReporte02 - Iniciando cálculo...');

    if (!reporte02ExcelData.length || reporte02ExcelData.length <= 3) {
      console.warn('⚠️ Auxiliar Ingresos: Datos insuficientes', {
        dataLength: reporte02ExcelData.length,
        hasData: !!reporte02ExcelData.length,
      });
      return null;
    }

    console.log('📊 Auxiliar Ingresos: Datos disponibles', {
      totalRows: reporte02ExcelData.length,
      firstFewRows: reporte02ExcelData.slice(0, 5).map((row, i) => ({
        index: i,
        isArray: Array.isArray(row),
        length: Array.isArray(row) ? row.length : 'N/A',
        firstCells: Array.isArray(row) ? row.slice(0, 5) : 'N/A',
      })),
    });

    // En Auxiliar Ingresos, el header está en la fila 3 (índice 3)
    const headerRowIndex = 3;
    const headerRow = reporte02ExcelData[headerRowIndex];

    if (!Array.isArray(headerRow)) {
      console.warn('⚠️ Auxiliar Ingresos: Header no es un array', {
        headerRowIndex,
        headerRow,
        typeOf: typeof headerRow,
      });
      return null;
    }

    console.log('📋 Auxiliar Ingresos: Header encontrado', {
      headerRowIndex,
      headerLength: headerRow.length,
      headers: headerRow.map((h, i) => `${i}: "${h}"`),
    });

    // Buscar la columna "Subtotal" - debe ser exactamente "Subtotal", no incluir MXN ni AUX
    let subtotalIndex = headerRow.findIndex((cell) => {
      const cellStr = cell?.toString().toLowerCase().trim() || '';
      // Buscar exactamente "subtotal" sin otros modificadores
      return cellStr === 'subtotal';
    });

    if (subtotalIndex === -1) {
      console.log('🔍 Auxiliar Ingresos: No se encontró "subtotal" exacto, buscando fallback...');
      // Si no encuentra "subtotal" exacto, buscar que incluya "subtotal" pero no "mxn" ni "aux"
      subtotalIndex = headerRow.findIndex((cell) => {
        const cellStr = cell?.toString().toLowerCase() || '';
        const matches =
          cellStr.includes('subtotal') &&
          !cellStr.includes('mxn') &&
          !cellStr.includes('aux') &&
          !cellStr.includes('total'); // Excluir "Total" que es diferente

        if (matches) {
          console.log(`🎯 Posible candidato en índice ${headerRow.indexOf(cell)}: "${cell}"`);
        }
        return matches;
      });

      if (subtotalIndex === -1) {
        console.warn('⚠️ Auxiliar Ingresos: No se encontró columna "Subtotal"', {
          headerRow: headerRow.map((h, i) => `${i}: "${h}"`),
          searchedFor: 'subtotal (sin mxn, aux, total)',
        });
        return null;
      }

      console.log('💡 Auxiliar Ingresos: Usando índice fallback para Subtotal:', subtotalIndex);
    } else {
      console.log('✅ Auxiliar Ingresos: Encontrado "subtotal" exacto en índice:', subtotalIndex);
    }

    // 🔄 NUEVA LÓGICA: Sumar todas las filas válidas (NO buscar fila de totales)
    let total = 0;
    let rowsProcessed = 0;
    let rowsSkipped = 0;

    console.log(
      `🔄 Iniciando procesamiento de filas desde ${4} hasta ${reporte02ExcelData.length - 1}`
    );

    // Empezar desde la fila 4 (después del header en índice 3) hasta antes de posibles filas de totales
    for (let i = 4; i < reporte02ExcelData.length; i++) {
      const row = reporte02ExcelData[i];

      if (!Array.isArray(row) || row.length <= subtotalIndex) {
        console.log(
          `⏭️ Saltando fila ${i}: No es array o muy corta (length: ${
            Array.isArray(row) ? row.length : 'N/A'
          })`
        );
        continue;
      }

      // Saltar si es una fila de totales o similar
      const firstCol = row[0]?.toString().toLowerCase() || '';
      if (
        firstCol.includes('total') ||
        firstCol.includes('subtotal') ||
        firstCol.includes('suma')
      ) {
        console.log(`⏭️ Saltando fila de totales en índice ${i}: "${firstCol}"`);
        continue;
      }

      const cellValue = row[subtotalIndex];

      // Verificar si la celda tiene un valor válido (no "N/A", no vacío, no nulo)
      if (
        cellValue === null ||
        cellValue === undefined ||
        cellValue === '' ||
        cellValue?.toString().toLowerCase() === 'n/a' ||
        cellValue?.toString().toLowerCase() === 'na' ||
        cellValue?.toString().toLowerCase().includes('cancelad')
      ) {
        rowsSkipped++;
        console.log(
          `⏭️ Saltando fila ${i} (valor inválido): "${cellValue}" (primera columna: "${row[0]}")`
        );
        continue;
      }

      const numericValue = parseFloat(String(cellValue));

      if (!isNaN(numericValue)) {
        total += numericValue;
        rowsProcessed++;
        console.log(
          `➕ Fila ${i}: +$${numericValue} (Total acumulado: $${total.toFixed(
            2
          )}) (primera columna: "${row[0]}")`
        );
      } else {
        rowsSkipped++;
        console.log(
          `⏭️ Saltando fila ${i} (no numérico): "${cellValue}" (primera columna: "${row[0]}")`
        );
      }
    }

    const result = rowsProcessed > 0 ? total : null;

    console.log(`💰 Subtotal calculado de Auxiliar Ingresos: $${result?.toFixed(2) || 'N/A'}`, {
      subtotalIndex,
      headerValue: headerRow[subtotalIndex],
      rowsProcessed,
      rowsSkipped,
      totalAmount: result,
      totalDataRows: reporte02ExcelData.length - 4, // Filas después del header
    });

    return result;
  }, [reporte02ExcelData]);

  const getSubtotalAUXFromReporte03 = useCallback((): number | null => {
    console.log('🔍 getSubtotalAUXFromReporte03 - Leyendo desde datos procesados (con totales)...');

    if (!reporte03ExcelData.length) {
      console.warn('⚠️ Mi Admin Ingresos: Datos procesados insuficientes para Subtotal AUX');
      return null;
    }

    // Los datos ahora son updatedExcelData (procesados con totales)
    // Buscar el header para encontrar la columna "Subtotal AUX"
    const headerRowIndex = reporte03ExcelData.findIndex((row) => {
      if (!Array.isArray(row)) return false;
      return row.some((cell) => cell?.toString().toLowerCase().includes('subtotal aux'));
    });

    if (headerRowIndex === -1) {
      console.warn('⚠️ Mi Admin Ingresos: No se encontró header con "Subtotal AUX"');
      return null;
    }

    const headerRow = reporte03ExcelData[headerRowIndex];
    const subtotalAUXIndex = headerRow.findIndex((cell) =>
      cell?.toString().toLowerCase().includes('subtotal aux')
    );

    if (subtotalAUXIndex === -1) {
      console.warn('⚠️ Mi Admin Ingresos: No se encontró columna "Subtotal AUX"');
      return null;
    }

    // 🎯 La última fila ahora es la fila de totales calculada correctamente
    const lastRowIndex = reporte03ExcelData.length - 1;
    const totalesRow = reporte03ExcelData[lastRowIndex];

    if (!Array.isArray(totalesRow) || totalesRow.length <= subtotalAUXIndex) {
      console.warn('⚠️ Mi Admin Ingresos: Fila de totales inválida para AUX');
      return null;
    }

    // Verificar que realmente es una fila de totales
    const firstCol = totalesRow[0]?.toString().toLowerCase() || '';
    if (firstCol !== 'totales' && firstCol !== 'total') {
      console.warn('⚠️ Mi Admin Ingresos: La última fila no es una fila de totales para AUX', {
        firstCol,
        expectedTotales: true,
      });
      return null;
    }

    const subtotalAUXValue = totalesRow[subtotalAUXIndex];

    console.log('📊 Mi Admin Ingresos: Leyendo Subtotal AUX desde fila de totales calculada', {
      lastRowIndex,
      subtotalAUXIndex,
      headerValue: headerRow[subtotalAUXIndex],
      rawValue: subtotalAUXValue,
      valueType: typeof subtotalAUXValue,
      isFromCalculatedTotals: true,
    });

    // Convertir el valor a número
    let result = null;
    if (typeof subtotalAUXValue === 'number' && !isNaN(subtotalAUXValue)) {
      result = subtotalAUXValue;
    } else if (subtotalAUXValue != null && subtotalAUXValue !== '' && subtotalAUXValue !== 'N/A') {
      const parsed = parseFloat(subtotalAUXValue.toString());
      result = !isNaN(parsed) ? parsed : null;
    }

    console.log(`💰 Subtotal AUX desde fila de totales calculada: $${result?.toFixed(2) || 'N/A'}`);

    return result;
  }, [reporte03ExcelData]);

  const areSubtotalsEqual = useCallback((): boolean => {
    // Ajuste: comparar directamente el total AUX proveniente del reporte Auxiliar (reporte02)
    // con el Subtotal MXN calculado de Mi Admin. Antes se intentaba leer una columna
    // "Subtotal AUX" inexistente en los datos procesados de Mi Admin, devolviendo null
    // y provocando falsos negativos.
    const subtotalMXN = getSubtotalMXNFromReporte03();
    const subtotalAUX = getSubtotalFromReporte02();

    console.log(`🔍 areSubtotalsEqual check:`, {
      subtotalMXN,
      subtotalAUX,
      nullValues: subtotalMXN === null || subtotalAUX === null,
    });

    if (subtotalMXN === null || subtotalAUX === null) {
      return false;
    }

    const diferencia = Math.abs(subtotalMXN - subtotalAUX);
    const tolerancia = 0.1; // 10 centavos
    const result = diferencia <= tolerancia;

    console.log(`✅ areSubtotalsEqual result:`, {
      diferencia,
      tolerancia,
      result,
    });

    return result;
  }, [getSubtotalMXNFromReporte03, getSubtotalFromReporte02]);

  const shouldShowSaveButton = useCallback((): boolean => {
    // Mostrar botón de guardado cuando los subtotales coinciden
    return areSubtotalsEqual();
  }, [areSubtotalsEqual]);

  const saveToPlantillaBase = useCallback(
    async (subtotalMXN: number, selectedMonth: number): Promise<boolean> => {
      if (subtotalMXN <= 0) {
        console.warn('⚠️ Subtotal inválido, no se puede guardar:', subtotalMXN);
        return false;
      }

      try {
        console.log(
          `💾 Iniciando guardado en Plantilla Base: Subtotal MXN: $${subtotalMXN}, Mes: ${selectedMonth}`
        );

        // SOLO multi-hoja: tomar primer workbook y su sheet 0
        console.log('🔄 Importando workbookService...');
        const { workbookService } = await import('../../../shared/services/workbookService');

        console.log('🔄 Obteniendo lista de plantillas...');
        let templates: any;
        let plantillaData: any[][] | null = null;
        let workbookId: string | null = null;

        try {
          // Timeout de 2 segundos para evitar que se cuelgue (reducido)
          console.log('🔄 Intento 1: listTemplates() con timeout de 2 segundos...');
          const templatesPromise = workbookService.listTemplates();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout en listTemplates')), 2000)
          );
          templates = (await Promise.race([templatesPromise, timeoutPromise])) as any;

          if (Array.isArray(templates) && templates.length > 0) {
            workbookId = templates[0].id;
            console.log('✅ Templates obtenidos vía listTemplates:', {
              count: templates.length,
              firstTemplateId: workbookId,
            });
          } else {
            throw new Error('listTemplates retornó estructura vacía o inválida');
          }
        } catch (listError) {
          console.warn('⚠️ listTemplates() falló, intentando acceso directo...', listError);

          // ESTRATEGIA ALTERNATIVA: Acceso directo usando IDs conocidos
          const knownIds = ['template_1', 'workbook_1', 'base_template', 'plantilla_base'];

          for (const testId of knownIds) {
            try {
              console.log(`🔄 Probando ID conocido: ${testId}...`);
              const testSheet = await workbookService.getSheetData(testId, 0);
              if (testSheet && Array.isArray(testSheet.data)) {
                workbookId = testId;
                plantillaData = testSheet.data;
                console.log(`✅ Plantilla encontrada con ID: ${testId}`, {
                  rowCount: plantillaData.length,
                });
                break;
              }
            } catch (testError) {
              console.log(
                `❌ ID ${testId} no encontrado:`,
                testError instanceof Error ? testError.message : testError
              );
            }
          }

          if (!plantillaData) {
            console.error('❌ No se pudo acceder a ninguna plantilla mediante acceso directo');
            return false;
          }
        }

        // Si obtenemos workbookId via listTemplates pero no tenemos datos aún
        if (workbookId && !plantillaData) {
          console.log('🔄 Obteniendo datos de la hoja 0...', { workbookId });
          const sheet0 = await workbookService.getSheetData(workbookId, 0);
          console.log('📄 Sheet0 obtenido:', {
            sheet0: !!sheet0,
            hasData: !!sheet0?.data,
            dataIsArray: Array.isArray(sheet0?.data),
          });

          if (!sheet0 || !Array.isArray(sheet0.data)) {
            console.error('❌ No se pudo obtener datos de la hoja 0 del workbook');
            return false;
          }

          plantillaData = sheet0.data as any[][];
        }

        if (!plantillaData || !workbookId) {
          console.error('❌ No se pudo obtener datos de la Plantilla Base o workbookId es null');
          return false;
        }
        console.log('✅ Plantilla Base cargada exitosamente:', { rowCount: plantillaData.length });

        console.log('📊 Estructura de Plantilla Base:', {
          totalRows: plantillaData.length,
          firstFewRows: plantillaData.slice(0, 5).map((row, i) => ({
            index: i,
            length: Array.isArray(row) ? row.length : 0,
            preview: Array.isArray(row) ? row.slice(0, 8) : [],
          })),
        });

        // 🔍 DEBUGGING ADICIONAL: Ver todas las filas para encontrar headers
        console.log('🔍 DEBUGGING: Primeras 10 filas completas:', {
          rows: plantillaData.slice(0, 10).map((row, i) => ({
            index: i,
            type: Array.isArray(row) ? 'array' : typeof row,
            content: Array.isArray(row) ? row : [row],
          })),
        });

        // Normalizadores
        const normalize = (v: any) =>
          v == null
            ? ''
            : v
                .toString()
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '');

        // Buscar columna CONCEPTO (robusta: exactamente 'concepto', 'conceptos', etc.)
        let ventasRowIndex = -1;
        let conceptoColumnIndex = -1;
        for (let r = 0; r < plantillaData.length && conceptoColumnIndex === -1; r++) {
          const row = plantillaData[r];
          if (!Array.isArray(row)) continue;
          for (let c = 0; c < row.length; c++) {
            const val = normalize(row[c]);
            if (val === 'concepto' || val === 'conceptos') {
              conceptoColumnIndex = c;
              console.log('📋 Columna CONCEPTO detectada', { rowIndex: r, conceptoColumnIndex });
              break;
            }
          }
        }
        if (conceptoColumnIndex === -1) {
          console.error('❌ No se identificó columna CONCEPTO (normalizada)');
          throw new Error('Formato inválido: sin columna CONCEPTO');
        }
        // Buscar fila Ventas (acepta variantes: 'ventas', 'ingresos', 'venta neta')
        const ventasAliases = ['ventas', 'ingresos', 'venta neta', 'total ventas'];
        for (let r = 0; r < plantillaData.length; r++) {
          const row = plantillaData[r];
          if (!Array.isArray(row) || row.length <= conceptoColumnIndex) continue;
          const cellNorm = normalize(row[conceptoColumnIndex]);
          if (ventasAliases.includes(cellNorm)) {
            ventasRowIndex = r;
            console.log('🎯 Fila Ventas/Ingresos encontrada', {
              ventasRowIndex,
              raw: row[conceptoColumnIndex],
            });
            break;
          }
        }
        if (ventasRowIndex === -1) {
          console.error('❌ No se encontró fila Ventas con alias permitidos', { ventasAliases });
          throw new Error('Formato inválido: sin fila Ventas/Ingresos');
        }

        // Buscar el header para encontrar la columna del mes
        const monthNames = [
          'enero',
          'febrero',
          'marzo',
          'abril',
          'mayo',
          'junio',
          'julio',
          'agosto',
          'septiembre',
          'octubre',
          'noviembre',
          'diciembre',
        ];

        // 🔧 CORRECCIÓN: También incluir versiones en mayúsculas para mayor compatibilidad
        const monthNamesUppercase = [
          'ENERO',
          'FEBRERO',
          'MARZO',
          'ABRIL',
          'MAYO',
          'JUNIO',
          'JULIO',
          'AGOSTO',
          'SEPTIEMBRE',
          'OCTUBRE',
          'NOVIEMBRE',
          'DICIEMBRE',
        ];

        // Combinar ambas versiones para búsqueda robusta
        const allMonthVariants = [...monthNames, ...monthNamesUppercase];
        const targetMonthName = normalize(monthNames[selectedMonth]);
        const targetMonthNameUpper = normalize(monthNamesUppercase[selectedMonth]);

        console.log(
          `🔍 Buscando columna del mes: "${targetMonthName}" o "${targetMonthNameUpper}" (índice ${selectedMonth})`
        );
        console.log('🔍 DEBUGGING: Mes objetivo detallado:', {
          selectedMonthIndex: selectedMonth,
          monthNameRaw: monthNames[selectedMonth],
          monthNameUpperRaw: monthNamesUppercase[selectedMonth],
          monthNameNormalized: targetMonthName,
          monthNameUpperNormalized: targetMonthNameUpper,
          allMonthVariants,
        });

        // 🔧 NUEVA LÓGICA SIMPLIFICADA: Buscar directamente en la primera fila que contenga "CONCEPTO"
        // El header de meses está típicamente en la misma fila que "CONCEPTO"
        let headerRowIndex = -1;
        for (let r = 0; r < plantillaData.length; r++) {
          const row = plantillaData[r];
          if (!Array.isArray(row)) continue;

          // Verificar si esta fila contiene "CONCEPTO"
          const hasConcepto = row.some((cell) => {
            const val = normalize(cell);
            return val === 'concepto' || val === 'conceptos';
          });

          if (hasConcepto) {
            headerRowIndex = r;
            console.log('� Header de columnas encontrado en fila con CONCEPTO:', {
              headerRowIndex,
              rowContent: row.slice(0, 15), // Mostrar primeras 15 columnas
            });
            break;
          }
        }

        if (headerRowIndex === -1) {
          console.error('❌ No se encontró fila header con CONCEPTO');
          throw new Error('Plantilla Base: No se encontró fila header con CONCEPTO');
        }

        const headerRow = plantillaData[headerRowIndex];
        let monthColumnIndex = -1;

        // 🔧 BÚSQUEDA SIMPLIFICADA: Buscar exactamente el mes objetivo en el header
        console.log('🔍 DEBUGGING: Analizando header row para buscar mes:', {
          headerRowLength: headerRow.length,
          targetMonth: monthNames[selectedMonth],
          targetMonthUpper: monthNamesUppercase[selectedMonth],
          targetMonthNormalized: targetMonthName,
          targetMonthUpperNormalized: targetMonthNameUpper,
        });

        // 🔍 DEBUGGING DETALLADO: Mostrar estructura esperada vs actual
        console.log('📋 ESTRUCTURA HEADER DETALLADA:', {
          expectedStructure: 'OPN. | CONCEPTO | ENERO | FEBRERO | MARZO | ...',
          actualHeader: headerRow.slice(0, 15).map((cell, i) => `${i}: "${cell}"`),
          monthsStartFrom: 'columna 2 en adelante',
        });

        for (let i = 0; i < headerRow.length; i++) {
          const cell = headerRow[i];
          if (!cell) continue;

          const cellStr = cell.toString().trim();
          const cellNorm = normalize(cellStr);

          // 🔍 DEBUGGING: Log detallado para cada celda que podría ser un mes
          if (i >= 2) {
            // Solo desde columna 2 en adelante (después de OPN. y CONCEPTO)
            console.log(`🔍 Analizando columna ${i}: "${cellStr}"`, {
              original: cellStr,
              normalized: cellNorm,
              targetMonth: targetMonthName,
              targetMonthUpper: targetMonthNameUpper,
              exactMatchLower: cellNorm === targetMonthName,
              exactMatchUpper: cellNorm === targetMonthNameUpper,
              containsLower: cellNorm.includes(targetMonthName),
              containsUpper: cellNorm.includes(targetMonthNameUpper),
              couldBeAnyMonth: allMonthVariants.some(
                (m) => cellNorm === normalize(m) || cellNorm.includes(normalize(m))
              ),
            });
          }

          // Buscar coincidencia exacta primero
          if (cellNorm === targetMonthName || cellNorm === targetMonthNameUpper) {
            monthColumnIndex = i;
            console.log(
              `🎯 ENCONTRADO (exacto): Mes "${monthNames[selectedMonth]}" en columna ${i}:`,
              {
                original: cellStr,
                normalized: cellNorm,
                target: targetMonthName,
                targetUpper: targetMonthNameUpper,
              }
            );
            break;
          }

          // Buscar si contiene el mes (para casos como "Enero 2024")
          if (cellNorm.includes(targetMonthName) || cellNorm.includes(targetMonthNameUpper)) {
            monthColumnIndex = i;
            console.log(
              `🎯 ENCONTRADO (contiene): Mes "${monthNames[selectedMonth]}" en columna ${i}:`,
              {
                original: cellStr,
                normalized: cellNorm,
                target: targetMonthName,
                targetUpper: targetMonthNameUpper,
              }
            );
            break;
          }
        }

        console.log('🔍 DEBUGGING: Búsqueda de columna específica del mes:', {
          selectedMonthIndex: selectedMonth,
          selectedMonthName: monthNames[selectedMonth],
          selectedMonthNameUpper: monthNamesUppercase[selectedMonth],
          targetMonthName,
          targetMonthNameUpper,
          headerRowAnalysis: headerRow.map((cell, i) => ({
            index: i,
            raw: cell,
            normalized: cell ? normalize(cell) : 'null',
            exactMatchLower: cell ? normalize(cell) === targetMonthName : false,
            exactMatchUpper: cell ? normalize(cell) === targetMonthNameUpper : false,
            containsLower: cell ? normalize(cell).includes(targetMonthName) : false,
            containsUpper: cell ? normalize(cell).includes(targetMonthNameUpper) : false,
          })),
          monthColumnIndexFound: monthColumnIndex,
        });

        if (monthColumnIndex === -1) {
          console.error(
            `❌ No se encontró la columna del mes "${monthNames[selectedMonth]}" (índice ${selectedMonth})`
          );

          // 🔍 ANÁLISIS ESPECÍFICO: Identificar qué meses SÍ están presentes
          const foundMonths = [];
          for (let i = 2; i < headerRow.length; i++) {
            // Empezar desde columna 2 (después de OPN. y CONCEPTO)
            const cell = headerRow[i];
            if (cell) {
              const cellNorm = normalize(cell);
              for (const month of allMonthVariants) {
                if (cellNorm === normalize(month) || cellNorm.includes(normalize(month))) {
                  foundMonths.push({
                    column: i,
                    original: cell.toString(),
                    normalized: cellNorm,
                    matchedMonth: month,
                  });
                  break; // Solo agregar una vez por columna
                }
              }
            }
          }

          console.error('🔍 DEBUGGING: Análisis completo del header:', {
            headerRow,
            targetMonth: monthNames[selectedMonth],
            selectedMonthIndex: selectedMonth,
            targetNormalized: targetMonthName,
            targetUpperNormalized: targetMonthNameUpper,
            structure: {
              col0: headerRow[0], // Debería ser "OPN."
              col1: headerRow[1], // Debería ser "CONCEPTO"
              col2AndBeyond: headerRow.slice(2, 15), // Deberían ser los meses
            },
            foundMonths: foundMonths,
            allMonthsInHeader: headerRow.slice(2).filter((cell) => {
              if (!cell) return false;
              const cellNorm = normalize(cell);
              return allMonthVariants.some(
                (m) => cellNorm === normalize(m) || cellNorm.includes(normalize(m))
              );
            }),
          });

          throw new Error(
            `Plantilla Base: No se encontró la columna del mes "${monthNames[selectedMonth]}" (${
              selectedMonth + 1
            }). Meses encontrados: ${foundMonths.map((m) => m.original).join(', ')}`
          );
        }

        console.log(`🎯 Guardando en Plantilla Base:`, {
          ventasRowIndex,
          monthColumnIndex,
          conceptoColumnIndex,
          targetMonthName,
          subtotalMXN,
          currentValue: plantillaData[ventasRowIndex][monthColumnIndex],
        });

        // Actualizar la celda en la intersección de la fila "Ventas" y la columna del mes
        const updatedData = plantillaData.map((r) => (Array.isArray(r) ? [...r] : r));
        if (!Array.isArray(updatedData[ventasRowIndex])) {
          console.error('❌ La fila Ventas no es un array válido');
          return false;
        }
        (updatedData[ventasRowIndex] as any[])[monthColumnIndex] = subtotalMXN;
        console.log('📝 Escribiendo subtotal en celda destino', {
          ventasRowIndex,
          monthColumnIndex,
          headerSample: headerRow.slice(0, 15),
          ventasRowPreview: (updatedData[ventasRowIndex] as any[]).slice(0, 15),
        });
        const oldValue = plantillaData[ventasRowIndex][monthColumnIndex];

        console.log(`🔄 Actualizando celda: "${oldValue}" → "${subtotalMXN}"`);

        try {
          await workbookService.updateSheetData(workbookId, 0, updatedData);
          console.log('💾 Persistido directamente en sheet 0 del workbook multi-hoja');
          // Disparar evento global para que BaseExcelTab refresque si está mostrando sheet 0
          window.dispatchEvent(
            new CustomEvent('plantilla-base-updated', {
              detail: { workbookId, ventasRowIndex, monthColumnIndex, subtotal: subtotalMXN },
            })
          );
          // Forzar recarga inmediata (defensivo) leyendo nuevamente sheet 0 para confirmar
          try {
            const refreshed = await workbookService.getSheetData(workbookId, 0);
            console.log('🔁 Verificación post-guardado (primeras 3 filas fila ventas):', {
              ventasRow: refreshed?.data?.[ventasRowIndex]?.slice?.(0, 15),
              newValue:
                refreshed?.data?.[ventasRowIndex]?.[monthColumnIndex] === subtotalMXN
                  ? 'OK'
                  : refreshed?.data?.[ventasRowIndex]?.[monthColumnIndex],
            });
          } catch (verErr) {
            console.warn('No se pudo verificar post-guardado', verErr);
          }
        } catch (err) {
          console.error('❌ Error al persistir en workbook multi-hoja:', err);
          return false;
        }

        console.log(
          `✅ Guardado exitoso en Plantilla Base: $${subtotalMXN} en ${
            targetMonthName.charAt(0).toUpperCase() + targetMonthName.slice(1)
          }`
        );
        console.log(`📊 Valor anterior: ${oldValue}, Valor nuevo: ${subtotalMXN}`);

        // 🆕 NUEVO: Resaltar la celda guardada en verde
        setSavedCellHighlight({
          rowIndex: ventasRowIndex,
          columnIndex: monthColumnIndex,
          value: subtotalMXN,
          timestamp: Date.now(),
        });

        // Auto-limpiar el resaltado después de 5 segundos
        setTimeout(() => {
          setSavedCellHighlight(null);
        }, 5000);

        return true;
      } catch (error) {
        console.error('❌ Error al guardar en Plantilla Base:', error);
        return false;
      }
    },
    [] // Sin dependencias porque no usa ningún estado/prop del contexto
  );

  // 🆕 NUEVO: Limpiar resaltado de celdas guardadas
  const clearSavedCellHighlight = useCallback(() => {
    setSavedCellHighlight(null);
  }, []);

  const contextValue: ReportComparisonContextType = {
    reporte02Data,
    reporte03Data,
    comparisonResults,
    isComparisonActive,
    lastComparisonTime,
    updateReporte02Data,
    updateReporte03Data,
    performComparison,
    toggleComparison,
    clearComparison,
    getRowStyle,
    getTooltip,
    // 🆕 Agregar las nuevas funciones al contexto
    getSubtotalAuxByFolio,
    getSuggestedTipoCambioByFolio,
    getSubtotalMXNFromReporte03,
    getSubtotalAUXFromReporte03,
    getSubtotalFromReporte02,
    areSubtotalsEqual,
    shouldShowSaveButton,
    saveToPlantillaBase,
    // 🆕 NUEVO: Para resaltado en verde
    savedCellHighlight,
    clearSavedCellHighlight,
  };

  return (
    <ReportComparisonContext.Provider value={contextValue}>
      {children}
    </ReportComparisonContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useReportComparison = (): ReportComparisonContextType => {
  const context = useContext(ReportComparisonContext);
  if (!context) {
    throw new Error('useReportComparison debe ser usado dentro de ReportComparisonProvider');
  }
  return context;
};
