import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ReporteMensual,
    Mes,
    ReporteBaseAnual,
    TipoReporteMensual,
    EstadoReporte,
    EstadoMes,
} from '../entities';
import * as XLSX from 'xlsx';

@Injectable()
export class ReportesMensualesService {
    constructor(
        @InjectRepository(ReporteMensual)
        private reporteMensualRepository: Repository<ReporteMensual>,
        @InjectRepository(Mes)
        private mesRepository: Repository<Mes>,
        @InjectRepository(ReporteBaseAnual)
        private reporteBaseRepository: Repository<ReporteBaseAnual>,
    ) { }

    async importarReporte(
        mesId: string,
        tipo: TipoReporteMensual,
        file: Express.Multer.File,
    ): Promise<ReporteMensual> {
        // Verificar que el mes existe
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
        }

        // Encontrar el reporte correspondiente
        const reporte = mes.reportes.find((r) => r.tipo === tipo);

        if (!reporte) {
            throw new NotFoundException(`Reporte tipo ${tipo} no encontrado`);
        }

        // Procesar el archivo Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const datos = this.procesarExcel(workbook, tipo);

        // Actualizar el reporte
        reporte.archivoOriginal = file.originalname;
        reporte.datos = datos;
        reporte.estado = EstadoReporte.IMPORTADO;
        reporte.fechaImportacion = new Date();

        await this.reporteMensualRepository.save(reporte);

        // Actualizar estado del mes a EN_PROCESO si no estaba ya
        if (mes.estado === EstadoMes.PENDIENTE) {
            mes.estado = EstadoMes.EN_PROCESO;
            await this.mesRepository.save(mes);
        }

        return reporte;
    }

    async procesarYGuardar(mesId: string): Promise<{ success: boolean; message: string }> {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.reporteBaseAnual'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
        }

        // Verificar que los 3 reportes estén importados
        const todosImportados = mes.reportes.every(
            (r) => r.estado === EstadoReporte.IMPORTADO || r.estado === EstadoReporte.PROCESADO,
        );

        if (!todosImportados) {
            throw new Error('Todos los reportes deben estar importados antes de guardar');
        }

        // Consolidar datos de los 3 reportes
        const datosConsolidados = this.consolidarReportes(mes.reportes);

        // Actualizar reporte base anual
        await this.actualizarReporteBaseAnual(
            mes.trabajo.reporteBaseAnual.id,
            mes.mes,
            datosConsolidados,
        );

        // Marcar reportes como procesados
        for (const reporte of mes.reportes) {
            reporte.estado = EstadoReporte.PROCESADO;
            reporte.fechaProcesado = new Date();
        }
        await this.reporteMensualRepository.save(mes.reportes);

        // Marcar mes como completado
        mes.estado = EstadoMes.COMPLETADO;
        await this.mesRepository.save(mes);

        return { success: true, message: 'Mes procesado y guardado correctamente' };
    }

    private procesarExcel(workbook: XLSX.WorkBook, tipo: TipoReporteMensual): any[] {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Aquí puedes agregar validaciones y transformaciones específicas
        // según el tipo de reporte

        return datos;
    }

    private consolidarReportes(reportes: ReporteMensual[]): any {
        const ingresos =
            reportes.find((r) => r.tipo === TipoReporteMensual.INGRESOS)?.datos || [];
        const auxiliar =
            reportes.find((r) => r.tipo === TipoReporteMensual.INGRESOS_AUXILIAR)?.datos || [];
        const miAdmin =
            reportes.find((r) => r.tipo === TipoReporteMensual.INGRESOS_MI_ADMIN)?.datos || [];

        // Lógica de consolidación básica
        // TODO: Implementar lógica de consolidación específica del negocio
        const totales = this.calcularTotales(ingresos, auxiliar, miAdmin);

        return {
            ingresos,
            auxiliar,
            miAdmin,
            totales,
        };
    }

    private calcularTotales(ingresos: any[], auxiliar: any[], miAdmin: any[]): any {
        // TODO: Implementar cálculos reales según tu lógica de negocio
        return {
            totalIngresos: 0,
            totalEgresos: 0,
            resultado: 0,
        };
    }

    private async actualizarReporteBaseAnual(
        reporteBaseId: string,
        mes: number,
        datosConsolidados: any,
    ): Promise<void> {
        const reporteBase = await this.reporteBaseRepository.findOne({
            where: { id: reporteBaseId },
        });

        if (!reporteBase) {
            throw new NotFoundException('Reporte base anual no encontrado');
        }

        const hojas = reporteBase.hojas as any[];

        // Actualizar cada hoja con los datos del mes
        hojas.forEach((hoja) => {
            switch (hoja.nombre) {
                case 'Resumen Anual':
                    this.actualizarHojaResumen(hoja, mes, datosConsolidados);
                    break;
                case 'Ingresos Consolidados':
                    this.actualizarHojaIngresos(hoja, mes, datosConsolidados);
                    break;
                case 'Comparativas':
                    this.actualizarHojaComparativas(hoja, mes, datosConsolidados);
                    break;
            }
        });

        // Agregar mes a completados si no está
        const mesesCompletados = [...reporteBase.mesesCompletados];
        if (!mesesCompletados.includes(mes)) {
            mesesCompletados.push(mes);
            mesesCompletados.sort((a, b) => a - b);
        }

        // Guardar cambios
        reporteBase.hojas = hojas;
        reporteBase.mesesCompletados = mesesCompletados;
        await this.reporteBaseRepository.save(reporteBase);
    }

    private actualizarHojaResumen(hoja: any, mes: number, datos: any): void {
        // Buscar si ya existe una fila para este mes
        const index = hoja.datos.findIndex((r: any) => r.mes === mes);

        const fila = {
            mes,
            nombreMes: this.getNombreMes(mes),
            totalIngresos: datos.totales.totalIngresos,
            totalEgresos: datos.totales.totalEgresos,
            resultado: datos.totales.resultado,
        };

        if (index >= 0) {
            hoja.datos[index] = fila;
        } else {
            hoja.datos.push(fila);
            hoja.datos.sort((a: any, b: any) => a.mes - b.mes);
        }
    }

    private actualizarHojaIngresos(hoja: any, mes: number, datos: any): void {
        // TODO: Implementar según tu lógica de negocio
        // Agregar/actualizar datos de ingresos del mes
        const ingresosMes = {
            mes,
            nombreMes: this.getNombreMes(mes),
            datos: datos.ingresos,
        };

        const index = hoja.datos.findIndex((r: any) => r.mes === mes);
        if (index >= 0) {
            hoja.datos[index] = ingresosMes;
        } else {
            hoja.datos.push(ingresosMes);
            hoja.datos.sort((a: any, b: any) => a.mes - b.mes);
        }
    }

    private actualizarHojaComparativas(hoja: any, mes: number, datos: any): void {
        // TODO: Implementar según tu lógica de negocio
        // Agregar/actualizar datos comparativos del mes
    }

    private getNombreMes(mes: number): string {
        const meses = [
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
        ];
        return meses[mes - 1];
    }
}
