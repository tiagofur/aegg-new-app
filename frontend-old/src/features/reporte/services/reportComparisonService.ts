// src/features/reporte/services/reportComparisonService.ts
/**
 * Servicio para comparar reportes basado en la columna "Folio"
 * - Marca en morado las filas donde el folio existe solo en un reporte
 * - Marca en rojo las filas donde los valores de "Subtotal" no coinciden entre reportes
 */

export interface ComparisonResult {
  folioStatus: 'unique' | 'common' | 'mismatch';
  subtotalMismatch: boolean;
  comparisonData?: {
    reporte02Subtotal?: number;
    reporte03Subtotal?: number;
  };
}

export interface ReportData {
  folio: string;
  subtotal: number;
  rowIndex: number;
  originalRow: any[];
}

export class ReportComparisonService {
  /**
   * Extrae datos de folios y subtotales del reporte auxiliar (reporte02)
   */
  static extractReporte02Data(excelData: any[][]): ReportData[] {
    if (!excelData || excelData.length < 4) return [];

    const headerRow = excelData[3]; // Fila 4 contiene los headers
    if (!Array.isArray(headerRow)) return [];

    // Buscar índices de columnas importantes
    const folioIdx = headerRow.findIndex((h: any) => 
      h?.toString().toLowerCase().includes('uuid') ||
      h?.toString().toLowerCase().includes('folio')
    );
    
    const subtotalIdx = headerRow.findIndex((h: any) => 
      h?.toString().toLowerCase().includes('subtotal')
    );

    if (folioIdx === -1 || subtotalIdx === -1) {
      console.warn('⚠️ No se encontraron columnas UUID/Folio o Subtotal en reporte02');
      return [];
    }

    console.log('🔍 Índices encontrados en reporte02:', {
      folioIdx,
      subtotalIdx,
      headers: headerRow
    });

    // Extraer datos desde la fila 5 en adelante (saltando headers y metadatos)
    const dataRows = excelData.slice(4);
    const extractedData: ReportData[] = [];

    dataRows.forEach((row, index) => {
      if (!Array.isArray(row)) return;
      
      // Verificar que no sea la fila de totales
      if (row[0]?.toString().toLowerCase() === 'totales') return;

      const folio = row[folioIdx]?.toString()?.trim();
      const subtotal = Number(row[subtotalIdx]);

      if (folio && !isNaN(subtotal)) {
        extractedData.push({
          folio,
          subtotal,
          rowIndex: index + 4, // +4 para ajustar por las filas de metadata
          originalRow: row
        });
      }
    });

    console.log('📊 Datos extraídos de reporte02:', {
      totalRows: extractedData.length,
      primeros3: extractedData.slice(0, 3)
    });

    return extractedData;
  }

  /**
   * Extrae datos de folios y subtotales del reporte admin (reporte03)
   */
  static extractReporte03Data(excelData: any[][]): ReportData[] {
    if (!excelData || excelData.length < 1) return [];

    const headerRow = excelData[0]; // Fila 1 contiene los headers
    if (!Array.isArray(headerRow)) return [];

    // Buscar índices de columnas importantes
    const folioIdx = headerRow.findIndex((h: any) => 
      h?.toString().toLowerCase().includes('uuid') ||
      h?.toString().toLowerCase().includes('folio') ||
      h?.toString().toLowerCase().includes('serie') ||
      h?.toString().toLowerCase().includes('número')
    );
    
    const subtotalIdx = headerRow.findIndex((h: any) => 
      h?.toString().toLowerCase().includes('subtotal')
    );

    if (folioIdx === -1 || subtotalIdx === -1) {
      console.warn('⚠️ No se encontraron columnas Folio o Subtotal en reporte03');
      return [];
    }

    console.log('🔍 Índices encontrados en reporte03:', {
      folioIdx,
      subtotalIdx,
      headers: headerRow
    });

    // Extraer datos desde la fila 2 en adelante (saltando header)
    const dataRows = excelData.slice(1);
    const extractedData: ReportData[] = [];

    dataRows.forEach((row, index) => {
      if (!Array.isArray(row)) return;
      
      // Verificar que no sea la fila de totales
      if (row[0]?.toString().toLowerCase() === 'totales') return;

      const folio = row[folioIdx]?.toString()?.trim();
      const subtotal = Number(row[subtotalIdx]);

      if (folio && !isNaN(subtotal)) {
        extractedData.push({
          folio,
          subtotal,
          rowIndex: index + 1, // +1 para ajustar por el header
          originalRow: row
        });
      }
    });

    console.log('📊 Datos extraídos de reporte03:', {
      totalRows: extractedData.length,
      primeros3: extractedData.slice(0, 3)
    });

    return extractedData;
  }

  /**
   * Compara dos reportes y genera los resultados de comparación
   */
  static compareReports(
    reporte02Data: ReportData[], 
    reporte03Data: ReportData[]
  ): Map<string, ComparisonResult> {
    const results = new Map<string, ComparisonResult>();

    // Crear mapas para acceso rápido
    const reporte02Map = new Map<string, ReportData>();
    const reporte03Map = new Map<string, ReportData>();

    reporte02Data.forEach(item => {
      reporte02Map.set(item.folio, item);
    });

    reporte03Data.forEach(item => {
      reporte03Map.set(item.folio, item);
    });

    // Set de todos los folios únicos
    const allFolios = new Set([
      ...reporte02Map.keys(),
      ...reporte03Map.keys()
    ]);

    console.log('🔄 Iniciando comparación de reportes:', {
      totalFolios: allFolios.size,
      reporte02Folios: reporte02Map.size,
      reporte03Folios: reporte03Map.size
    });

    // Comparar cada folio
    allFolios.forEach(folio => {
      const inReporte02 = reporte02Map.has(folio);
      const inReporte03 = reporte03Map.has(folio);

      let result: ComparisonResult;

      if (inReporte02 && inReporte03) {
        // Folio existe en ambos reportes
        const reporte02Item = reporte02Map.get(folio)!;
        const reporte03Item = reporte03Map.get(folio)!;

        const subtotalMatch = Math.abs(reporte02Item.subtotal - reporte03Item.subtotal) < 0.01;

        result = {
          folioStatus: 'common',
          subtotalMismatch: !subtotalMatch,
          comparisonData: {
            reporte02Subtotal: reporte02Item.subtotal,
            reporte03Subtotal: reporte03Item.subtotal
          }
        };
      } else {
        // Folio existe solo en un reporte
        result = {
          folioStatus: 'unique',
          subtotalMismatch: false,
          comparisonData: inReporte02 
            ? { reporte02Subtotal: reporte02Map.get(folio)!.subtotal }
            : { reporte03Subtotal: reporte03Map.get(folio)!.subtotal }
        };
      }

      results.set(folio, result);
    });

    // Estadísticas finales
    const uniqueFolios = Array.from(results.values()).filter(r => r.folioStatus === 'unique').length;
    const mismatchedSubtotals = Array.from(results.values()).filter(r => r.subtotalMismatch).length;

    console.log('📈 Resultados de la comparación:', {
      totalComparaciones: results.size,
      foliosUnicos: uniqueFolios,
      subtotalesNoCoincidentes: mismatchedSubtotals
    });

    return results;
  }

  /**
   * Determina el estilo CSS para una fila basado en el resultado de la comparación
   */
  static getRowStyle(folio: string, comparisonResults: Map<string, ComparisonResult>) {
    const result = comparisonResults.get(folio);
    
    if (!result) return {};

    if (result.folioStatus === 'unique') {
      // Morado para folios únicos
      return {
        backgroundColor: '#E1BEE7', // Morado claro
        borderLeft: '4px solid #9C27B0' // Borde morado
      };
    }

    if (result.subtotalMismatch) {
      // Rojo para subtotales que no coinciden
      return {
        backgroundColor: '#FFCDD2', // Rojo claro
        borderLeft: '4px solid #F44336' // Borde rojo
      };
    }

    // Sin estilo especial para filas que coinciden
    return {};
  }

  /**
   * Genera un tooltip con información de la comparación
   */
  static getComparisonTooltip(folio: string, comparisonResults: Map<string, ComparisonResult>): string {
    const result = comparisonResults.get(folio);
    
    if (!result) return '';

    if (result.folioStatus === 'unique') {
      const reporteSource = result.comparisonData?.reporte02Subtotal !== undefined ? 'Auxiliar' : 'Admin';
      const subtotal = result.comparisonData?.reporte02Subtotal || result.comparisonData?.reporte03Subtotal;
      return `🟣 Folio único: Solo existe en Reporte ${reporteSource} (Subtotal: $${subtotal?.toFixed(2)})`;
    }

    if (result.subtotalMismatch && result.comparisonData) {
      return `🔴 Subtotales no coinciden:\n• Auxiliar: $${result.comparisonData.reporte02Subtotal?.toFixed(2)}\n• Admin: $${result.comparisonData.reporte03Subtotal?.toFixed(2)}`;
    }

    if (result.comparisonData) {
      return `✅ Coincidencia: $${result.comparisonData.reporte02Subtotal?.toFixed(2)}`;
    }

    return '';
  }
}
