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

        // Calcular totales reales de cada reporte
        const totalesIngresos = this.calcularTotalesReporte(ingresos);
        const totalesAuxiliar = this.calcularTotalesReporte(auxiliar);
        const totalesMiAdmin = this.calcularTotalesReporte(miAdmin);

        // Consolidar todos los totales
        const totalIngresosConsolidado = totalesIngresos.total + totalesAuxiliar.total + totalesMiAdmin.total;
        const totalIVATrasladado = totalesIngresos.iva + totalesAuxiliar.iva + totalesMiAdmin.iva;

        return {
            ingresos,
            auxiliar,
            miAdmin,
            totales: {
                totalIngresos: totalIngresosConsolidado,
                totalIVATrasladado: totalIVATrasladado,
                subtotal: totalIngresosConsolidado - totalIVATrasladado,
            },
            detalleTotales: {
                ingresos: totalesIngresos,
                auxiliar: totalesAuxiliar,
                miAdmin: totalesMiAdmin,
            },
        };
    }

    private calcularTotalesReporte(datos: any[]): { total: number; subtotal: number; iva: number } {
        if (!Array.isArray(datos) || datos.length === 0) {
            return { total: 0, subtotal: 0, iva: 0 };
        }

        let total = 0;
        let subtotal = 0;
        let iva = 0;

        // Saltar la primera fila (headers) y procesar datos
        for (let i = 1; i < datos.length; i++) {
            const fila = datos[i];
            if (!Array.isArray(fila)) continue;

            // Intentar encontrar columnas de totales, subtotales e IVA
            // Buscar números en la fila
            for (const celda of fila) {
                if (typeof celda === 'number' && !isNaN(celda)) {
                    total += celda;
                }
            }
        }

        // Si no encontramos IVA específico, estimarlo como 16% del subtotal
        if (iva === 0 && total > 0) {
            subtotal = total / 1.16;
            iva = total - subtotal;
        }

        return {
            total: Math.round(total * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            iva: Math.round(iva * 100) / 100,
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

        // Inicializar hojas si está vacío o no tiene estructura
        let hojas = reporteBase.hojas as any[];
        if (!Array.isArray(hojas) || hojas.length === 0) {
            hojas = this.inicializarHojasVacias();
        }

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
        reporteBase.ultimaActualizacion = new Date();
        await this.reporteBaseRepository.save(reporteBase);
    }

    private inicializarHojasVacias(): any[] {
        return [
            {
                nombre: 'Resumen Anual',
                datos: [
                    ['Mes', 'Ingresos', 'IVA Trasladado', 'Subtotal', 'Fecha Actualización']
                ],
            },
            {
                nombre: 'Ingresos Consolidados',
                datos: [
                    ['Mes', 'Reporte Ingresos', 'Reporte Auxiliar', 'Reporte Mi Admin', 'Total']
                ],
            },
            {
                nombre: 'Comparativas',
                datos: [
                    ['Mes', 'Total Mes Actual', 'Total Mes Anterior', 'Variación %']
                ],
            },
        ];
    }

    private actualizarHojaResumen(hoja: any, mes: number, datos: any): void {
        // Asegurarse de que datos sea array
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Ingresos', 'IVA Trasladado', 'Subtotal', 'Fecha Actualización']];
        }

        const nombreMes = this.getNombreMes(mes);
        const fechaActual = new Date().toLocaleDateString('es-MX');

        // Buscar si ya existe una fila para este mes (empezando desde índice 1 para saltar headers)
        const index = hoja.datos.findIndex((fila: any[], idx: number) =>
            idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes)
        );

        const nuevaFila = [
            nombreMes,
            datos.totales.totalIngresos || 0,
            datos.totales.totalIVATrasladado || 0,
            datos.totales.subtotal || 0,
            fechaActual,
        ];

        if (index > 0) {
            // Actualizar fila existente
            hoja.datos[index] = nuevaFila;
        } else {
            // Agregar nueva fila
            hoja.datos.push(nuevaFila);
        }

        // Ordenar por mes (excepto header)
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a: any[], b: any[]) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }

    private actualizarHojaIngresos(hoja: any, mes: number, datos: any): void {
        // Asegurarse de que datos sea array
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Reporte Ingresos', 'Reporte Auxiliar', 'Reporte Mi Admin', 'Total']];
        }

        const nombreMes = this.getNombreMes(mes);
        const detalle = datos.detalleTotales || {};

        // Buscar si ya existe una fila para este mes
        const index = hoja.datos.findIndex((fila: any[], idx: number) =>
            idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes)
        );

        const nuevaFila = [
            nombreMes,
            detalle.ingresos?.total || 0,
            detalle.auxiliar?.total || 0,
            detalle.miAdmin?.total || 0,
            datos.totales.totalIngresos || 0,
        ];

        if (index > 0) {
            hoja.datos[index] = nuevaFila;
        } else {
            hoja.datos.push(nuevaFila);
        }

        // Ordenar por mes
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a: any[], b: any[]) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }

    private actualizarHojaComparativas(hoja: any, mes: number, datos: any): void {
        // Asegurarse de que datos sea array
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Total Mes Actual', 'Total Mes Anterior', 'Variación %']];
        }

        const nombreMes = this.getNombreMes(mes);
        const totalActual = datos.totales.totalIngresos || 0;

        // Buscar mes anterior
        const mesAnterior = mes === 1 ? 12 : mes - 1;
        const indexMesAnterior = hoja.datos.findIndex((fila: any[], idx: number) =>
            idx > 0 && Array.isArray(fila) && fila[0] === this.getNombreMes(mesAnterior)
        );

        const totalMesAnterior = indexMesAnterior > 0 ? (hoja.datos[indexMesAnterior][1] || 0) : 0;
        const variacion = totalMesAnterior > 0
            ? ((totalActual - totalMesAnterior) / totalMesAnterior * 100).toFixed(2) + '%'
            : 'N/A';

        // Buscar si ya existe una fila para este mes
        const index = hoja.datos.findIndex((fila: any[], idx: number) =>
            idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes)
        );

        const nuevaFila = [
            nombreMes,
            totalActual,
            totalMesAnterior,
            variacion,
        ];

        if (index > 0) {
            hoja.datos[index] = nuevaFila;
        } else {
            hoja.datos.push(nuevaFila);
        }

        // Ordenar por mes
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a: any[], b: any[]) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }

    private getMesNumero(nombreMes: string | number): number {
        if (typeof nombreMes === 'number') return nombreMes;

        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const index = meses.indexOf(nombreMes);
        return index >= 0 ? index + 1 : 0;
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

    async obtenerDatos(mesId: string, reporteId: string): Promise<{ datos: any[][] }> {
        // Buscar el mes con sus reportes
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
        }

        // Buscar el reporte específico
        const reporte = mes.reportes.find((r) => r.id === reporteId);

        if (!reporte) {
            throw new NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }

        return { datos: reporte.datos || [] };
    }

    async actualizarDatos(mesId: string, reporteId: string, datos: any[][]): Promise<ReporteMensual> {
        // Buscar el mes con sus reportes
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
        }

        // Buscar el reporte específico
        const reporte = mes.reportes.find((r) => r.id === reporteId);

        if (!reporte) {
            throw new NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }

        // Actualizar los datos
        reporte.datos = datos;
        reporte.fechaImportacion = new Date();

        // Guardar y retornar
        return await this.reporteMensualRepository.save(reporte);
    }
}
