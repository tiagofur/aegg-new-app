import api from './api';
import { ReporteMensual, ImportReporteMensualDto } from '../types/trabajo';

export const reportesMensualesService = {
    async importar(importDto: ImportReporteMensualDto): Promise<ReporteMensual> {
        const formData = new FormData();
        formData.append('mesId', importDto.mesId);
        formData.append('tipo', importDto.tipo);
        formData.append('file', importDto.file);

        const { data } = await api.post(
            '/reportes-mensuales/importar',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return data;
    },

    async procesarYGuardar(
        mesId: string
    ): Promise<{ success: boolean; message: string }> {
        const { data } = await api.post(
            `/reportes-mensuales/${mesId}/procesar`
        );
        return data;
    },
};
