/**
 * Hook para gestionar ediciones en el reporte Auxiliar de Ingresos
 * Mantiene un mapa de cambios en memoria hasta que se guarden
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  AuxiliarIngresosRow, 
  EstadoSat 
} from '../types';
import { 
  recalculateRowAfterTipoCambioChange, 
  updateRowEstadoSat 
} from '../utils';

interface UseAuxiliarIngresosEditProps {
  /** Datos originales del reporte */
  initialData: AuxiliarIngresosRow[];
}

interface UseAuxiliarIngresosEditReturn {
  /** Datos combinados (originales + ediciones) */
  data: AuxiliarIngresosRow[];
  /** Mapa de ediciones por UUID */
  editedRows: Map<string, Partial<AuxiliarIngresosRow>>;
  /** Si hay cambios sin guardar */
  isDirty: boolean;
  /** Actualizar tipo de cambio de una fila */
  updateTipoCambio: (uuid: string, tipoCambio: number) => void;
  /** Actualizar estado SAT de una fila */
  updateEstadoSat: (uuid: string, estadoSat: EstadoSat) => void;
  /** Resetear todas las ediciones */
  resetEdits: () => void;
  /** Obtener ediciones de una fila específica */
  getRowEdits: (uuid: string) => Partial<AuxiliarIngresosRow> | undefined;
}

/**
 * Hook para gestionar el estado de edición del reporte
 * Mantiene cambios en memoria sin mutar los datos originales
 */
export const useAuxiliarIngresosEdit = ({
  initialData,
}: UseAuxiliarIngresosEditProps): UseAuxiliarIngresosEditReturn => {
  // Estado: Mapa de ediciones por UUID
  const [editedRows, setEditedRows] = useState<
    Map<string, Partial<AuxiliarIngresosRow>>
  >(new Map());

  /**
   * Actualiza el tipo de cambio de una fila
   * Recalcula automáticamente el subtotalMXN
   */
  const updateTipoCambio = useCallback((uuid: string, tipoCambio: number) => {
    setEditedRows((prev) => {
      const newMap = new Map(prev);
      
      // Buscar la fila original
      const originalRow = initialData.find((row) => row.id === uuid);
      if (!originalRow) return prev;

      // Recalcular fila completa
      const updatedRow = recalculateRowAfterTipoCambioChange(
        originalRow,
        tipoCambio
      );

      // Guardar solo los cambios
      const edits = newMap.get(uuid) || {};
      newMap.set(uuid, {
        ...edits,
        tipoCambio: updatedRow.tipoCambio,
        subtotalMXN: updatedRow.subtotalMXN,
      });

      return newMap;
    });
  }, [initialData]);

  /**
   * Actualiza el estado SAT de una fila
   */
  const updateEstadoSat = useCallback((uuid: string, estadoSat: EstadoSat) => {
    setEditedRows((prev) => {
      const newMap = new Map(prev);
      const edits = newMap.get(uuid) || {};
      
      newMap.set(uuid, {
        ...edits,
        estadoSat,
      });

      return newMap;
    });
  }, []);

  /**
   * Resetea todas las ediciones
   */
  const resetEdits = useCallback(() => {
    setEditedRows(new Map());
  }, []);

  /**
   * Obtiene las ediciones de una fila específica
   */
  const getRowEdits = useCallback(
    (uuid: string): Partial<AuxiliarIngresosRow> | undefined => {
      return editedRows.get(uuid);
    },
    [editedRows]
  );

  /**
   * Combina datos originales con ediciones
   * Recalcula solo cuando cambian initialData o editedRows
   */
  const mergedData = useMemo(() => {
    if (editedRows.size === 0) {
      return initialData;
    }

    return initialData.map((row) => {
      const edits = editedRows.get(row.id);
      
      if (!edits) {
        return row;
      }

      // Combinar fila original con ediciones
      return {
        ...row,
        ...edits,
      };
    });
  }, [initialData, editedRows]);

  /**
   * Determina si hay cambios sin guardar
   */
  const isDirty = useMemo(() => {
    return editedRows.size > 0;
  }, [editedRows]);

  return {
    data: mergedData,
    editedRows,
    isDirty,
    updateTipoCambio,
    updateEstadoSat,
    resetEdits,
    getRowEdits,
  };
};
