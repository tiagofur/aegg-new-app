import { useCallback, useEffect, useRef, useState } from "react";
import { trabajosService } from "../../../services";
import {
    AprobacionesDashboardData,
    AprobacionesFilters,
} from "../../../types";

const INITIAL_DATA: AprobacionesDashboardData = {
    resumenEstados: {
        EN_PROGRESO: 0,
        EN_REVISION: 0,
        APROBADO: 0,
        REABIERTO: 0,
    },
    pendientes: [],
    recientes: [],
};

export interface UseAprobacionesDashboardResult {
    data: AprobacionesDashboardData;
    loading: boolean;
    error: string | null;
    filters: AprobacionesFilters;
    updateFilters: (input: Partial<AprobacionesFilters>) => void;
    refetch: () => void;
}

export const useAprobacionesDashboard = (
    initialFilters: AprobacionesFilters = {}
): UseAprobacionesDashboardResult => {
    const [filters, setFilters] = useState<AprobacionesFilters>(initialFilters);
    const [data, setData] = useState<AprobacionesDashboardData>(INITIAL_DATA);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const latestRequest = useRef(0);

    const fetchDashboard = useCallback(
        async (nextFilters: AprobacionesFilters = filters) => {
            const requestId = ++latestRequest.current;
            setLoading(true);
            setError(null);

            try {
                const response = await trabajosService.getAprobacionesDashboard(
                    nextFilters
                );

                if (latestRequest.current !== requestId) {
                    return;
                }

                setData(response);
            } catch (err: any) {
                if (latestRequest.current !== requestId) {
                    return;
                }

                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    "No fue posible obtener el dashboard de aprobaciones";
                setError(message);
                setData(INITIAL_DATA);
            } finally {
                if (latestRequest.current === requestId) {
                    setLoading(false);
                }
            }
        },
        [filters]
    );

    useEffect(() => {
        void fetchDashboard(filters);
    }, [fetchDashboard, filters]);

    const updateFilters = useCallback((input: Partial<AprobacionesFilters>) => {
        setFilters((prev) => ({ ...prev, ...input }));
    }, []);

    const refetch = useCallback(() => {
        void fetchDashboard(filters);
    }, [fetchDashboard, filters]);

    return {
        data,
        loading,
        error,
        filters,
        updateFilters,
        refetch,
    };
};
