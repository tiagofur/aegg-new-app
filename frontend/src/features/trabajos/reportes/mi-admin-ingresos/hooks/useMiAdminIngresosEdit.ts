/**
 * Hook para manejar ediciones in-memory de Mi Admin Ingresos
 * Usa Map para tracking eficiente de cambios por folio
 */

import { useState, useCallback, useMemo } from 'react';
import {
    recalculateRowAfterTipoCambioChange,
    updateRowEstadoSat,
} from '../utils';
import type { MiAdminIngresosRow } from '../types';
import type { AuxiliarIngresosRow } from '../../auxiliar-ingresos';

interface UseMiAdminIngresosEditProps {
    data: MiAdminIngresosRow[];
    auxiliarData: AuxiliarIngresosRow[] | undefined;
}

export const useMiAdminIngresosEdit = ({
    data,
    auxiliarData,
}: UseMiAdminIngresosEditProps) => {
    // Map de cambios: folio -> cambios parciales
    const [edits, setEdits] = useState<Map<string, Partial<MiAdminIngresosRow>>>(
        new Map()
    );

    // Datos con ediciones aplicadas
    const editedData = useMemo(() => {
        return data.map((row) => {
            const edit = edits.get(row.folio);
            return edit ? { ...row, ...edit } : row;
        });
    }, [data, edits]);

    // ¿Hay cambios sin guardar?
    const hasUnsavedChanges = edits.size > 0;

    /**
     * Actualizar tipo de cambio de una fila
     */
    const updateTipoCambio = useCallback(
        (folio: string, newTipoCambio: number | null) => {
            const row = data.find((r) => r.folio === folio);
            if (!row) return;

            const updatedRow = recalculateRowAfterTipoCambioChange(row, newTipoCambio);

            setEdits((prev) => {
                const newEdits = new Map(prev);
                const existing = newEdits.get(folio) || {};
                newEdits.set(folio, {
                    ...existing,
                    tipoCambio: updatedRow.tipoCambio,
                    subtotalMXN: updatedRow.subtotalMXN,
                });
                return newEdits;
            });
        },
        [data]
    );

    /**
     * Actualizar estado SAT de una fila
     */
    const updateEstadoSat = useCallback(
        (folio: string, newEstadoSat: 'Vigente' | 'Cancelada') => {
            const row = data.find((r) => r.folio === folio);
            if (!row) return;

            const updatedRow = updateRowEstadoSat(row, newEstadoSat);

            setEdits((prev) => {
                const newEdits = new Map(prev);
                const existing = newEdits.get(folio) || {};
                newEdits.set(folio, {
                    ...existing,
                    estadoSat: updatedRow.estadoSat,
                });
                return newEdits;
            });
        },
        [data]
    );

    /**
     * Aplicar TC Sugerido a una fila específica
     */
    const aplicarTCSugerido = useCallback(
        (folio: string) => {
            const row = editedData.find((r) => r.folio === folio);
            if (!row || row.tcSugerido === null) return;

            updateTipoCambio(folio, row.tcSugerido);
        },
        [editedData, updateTipoCambio]
    );

    /**
     * Aplicar TC Sugerido a TODAS las filas que lo tengan
     */
    const aplicarTCSugeridoATodos = useCallback(() => {
        const newEdits = new Map(edits);

        editedData.forEach((row) => {
            if (row.tcSugerido !== null && row.estadoSat === 'Vigente') {
                const updatedRow = recalculateRowAfterTipoCambioChange(row, row.tcSugerido);
                const existing = newEdits.get(row.folio) || {};
                newEdits.set(row.folio, {
                    ...existing,
                    tipoCambio: updatedRow.tipoCambio,
                    subtotalMXN: updatedRow.subtotalMXN,
                });
            }
        });

        setEdits(newEdits);
    }, [editedData, edits]);

    /**
     * Cancelar todos los folios que SOLO existen en Mi Admin (no en Auxiliar)
     */
    const cancelarFoliosUnicos = useCallback(() => {
        if (!auxiliarData) return;

        const auxiliarFolios = new Set(
            auxiliarData
                .filter((row) => row.estadoSat === 'Vigente')
                .map((row) => row.folio)
        );

        const newEdits = new Map(edits);

        editedData.forEach((row) => {
            // Si el folio NO existe en Auxiliar y está Vigente, cancelarlo
            if (!auxiliarFolios.has(row.folio) && row.estadoSat === 'Vigente') {
                const updatedRow = updateRowEstadoSat(row, 'Cancelada');
                const existing = newEdits.get(row.folio) || {};
                newEdits.set(row.folio, {
                    ...existing,
                    estadoSat: updatedRow.estadoSat,
                });
            }
        });

        setEdits(newEdits);
    }, [editedData, auxiliarData, edits]);

    /**
     * Resetear todos los cambios
     */
    const resetChanges = useCallback(() => {
        setEdits(new Map());
    }, []);

    return {
        editedData,
        hasUnsavedChanges,
        updateTipoCambio,
        updateEstadoSat,
        aplicarTCSugerido,
        aplicarTCSugeridoATodos,
        cancelarFoliosUnicos,
        resetChanges,
    };
};
