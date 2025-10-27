"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportesMensualesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const XLSX = require("xlsx");
let ReportesMensualesService = class ReportesMensualesService {
    constructor(reporteMensualRepository, mesRepository, reporteBaseRepository) {
        this.reporteMensualRepository = reporteMensualRepository;
        this.mesRepository = mesRepository;
        this.reporteBaseRepository = reporteBaseRepository;
    }
    async importarReporte(mesId, tipo, file) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        this.assertMesEditable(mes);
        const reporte = mes.reportes.find((r) => r.tipo === tipo);
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte tipo ${tipo} no encontrado`);
        }
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const datos = this.procesarExcel(workbook, tipo);
        reporte.archivoOriginal = file.originalname;
        reporte.datos = datos;
        reporte.estado = entities_1.EstadoReporte.IMPORTADO;
        reporte.fechaImportacion = new Date();
        await this.reporteMensualRepository.save(reporte);
        if (mes.estado === entities_1.EstadoMes.PENDIENTE) {
            mes.estado = entities_1.EstadoMes.EN_PROCESO;
            await this.mesRepository.save(mes);
        }
        return reporte;
    }
    async procesarYGuardar(mesId) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.reporteBaseAnual', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        this.assertMesEditable(mes);
        const todosImportados = mes.reportes.every((r) => r.estado === entities_1.EstadoReporte.IMPORTADO || r.estado === entities_1.EstadoReporte.PROCESADO);
        if (!todosImportados) {
            throw new Error('Todos los reportes deben estar importados antes de guardar');
        }
        const datosConsolidados = this.consolidarReportes(mes.reportes);
        await this.actualizarReporteBaseAnual(mes.trabajo.reporteBaseAnual.id, mes.mes, datosConsolidados);
        for (const reporte of mes.reportes) {
            reporte.estado = entities_1.EstadoReporte.PROCESADO;
            reporte.fechaProcesado = new Date();
        }
        await this.reporteMensualRepository.save(mes.reportes);
        mes.estado = entities_1.EstadoMes.COMPLETADO;
        await this.mesRepository.save(mes);
        return { success: true, message: 'Mes procesado y guardado correctamente' };
    }
    procesarExcel(workbook, tipo) {
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`📊 Procesando reporte tipo: ${tipo}`);
        console.log(`📄 Total de filas originales: ${datos.length}`);
        datos = this.limpiarFilasInnecesarias(datos);
        datos = this.limpiarFilasVacias(datos);
        datos = this.llenarEstadoSat(datos);
        console.log(`✅ Total de filas después de limpieza: ${datos.length}`);
        return datos;
    }
    limpiarFilasInnecesarias(datos, minCeldasHeader = 6) {
        if (!Array.isArray(datos) || datos.length === 0) {
            return datos;
        }
        const palabrasClaveHeader = [
            'codigo', 'cliente', 'rfc', 'razon', 'social', 'receptor',
            'fecha', 'factura', 'folio', 'uuid', 'monto', 'subtotal',
            'iva', 'total', 'regimen', 'fiscal', 'tipo', 'cambio',
            'moneda', 'estatus', 'estado', 'sat'
        ];
        const indexHeaderReal = datos.findIndex((fila, index) => {
            if (!Array.isArray(fila))
                return false;
            const celdasConDatos = fila.filter((celda) => {
                if (celda === null || celda === undefined || celda === '')
                    return false;
                if (typeof celda === 'string' && celda.trim() === '')
                    return false;
                return true;
            });
            const numCeldasConDatos = celdasConDatos.length;
            if (numCeldasConDatos <= minCeldasHeader) {
                return false;
            }
            const textoFila = celdasConDatos
                .filter(c => typeof c === 'string')
                .map(c => c.toLowerCase())
                .join(' ');
            const tienePalabrasClaveHeader = palabrasClaveHeader.some(palabra => textoFila.includes(palabra));
            const celdasTexto = celdasConDatos.filter(celda => {
                if (typeof celda !== 'string')
                    return false;
                return isNaN(Number(celda));
            });
            const porcentajeTexto = celdasTexto.length / numCeldasConDatos;
            const esHeader = tienePalabrasClaveHeader && porcentajeTexto > 0.5;
            if (esHeader) {
                console.log(`✓ Header detectado en fila ${index + 1}:`);
                console.log(`  - Celdas con datos: ${numCeldasConDatos}`);
                console.log(`  - Palabras clave encontradas: ${tienePalabrasClaveHeader}`);
                console.log(`  - % texto: ${(porcentajeTexto * 100).toFixed(0)}%`);
            }
            return esHeader;
        });
        if (indexHeaderReal === -1) {
            console.warn(`⚠ No se encontró header con palabras clave. Buscando por cantidad de celdas...`);
            const indexPorCantidad = datos.findIndex((fila) => {
                if (!Array.isArray(fila))
                    return false;
                const celdasConDatos = fila.filter((celda) => {
                    if (celda === null || celda === undefined || celda === '')
                        return false;
                    if (typeof celda === 'string' && celda.trim() === '')
                        return false;
                    return true;
                }).length;
                return celdasConDatos > minCeldasHeader;
            });
            if (indexPorCantidad === -1) {
                console.warn(`⚠ No se encontró header válido. Retornando datos originales.`);
                return datos;
            }
            if (indexPorCantidad === 0) {
                return datos;
            }
            const datosLimpios = datos.slice(indexPorCantidad);
            console.log(`✓ Limpieza automática: Se eliminaron ${indexPorCantidad} fila(s) innecesaria(s) antes del header.`);
            return datosLimpios;
        }
        if (indexHeaderReal === 0) {
            return datos;
        }
        const datosLimpios = datos.slice(indexHeaderReal);
        console.log(`✓ Limpieza automática: Se eliminaron ${indexHeaderReal} fila(s) innecesaria(s) antes del header.`);
        console.log(`✓ Header detectado en fila original ${indexHeaderReal + 1} con ${datosLimpios[0]?.length || 0} columnas`);
        return datosLimpios;
    }
    llenarEstadoSat(datos) {
        if (!Array.isArray(datos) || datos.length < 2) {
            return datos;
        }
        const headers = datos[0];
        if (!Array.isArray(headers)) {
            return datos;
        }
        const estadoSatIndex = headers.findIndex((header) => {
            if (!header || typeof header !== 'string')
                return false;
            const headerLower = header.toLowerCase().trim();
            return (headerLower.includes('estado') && headerLower.includes('sat') ||
                headerLower.includes('estatus') && headerLower.includes('sat') ||
                headerLower === 'estado sat' ||
                headerLower === 'estatus sat' ||
                headerLower === 'estadosat' ||
                headerLower === 'estatussat');
        });
        if (estadoSatIndex === -1) {
            console.log('ℹ️  No se encontró columna de Estado SAT en el reporte');
            return datos;
        }
        console.log(`✓ Columna "Estado SAT" encontrada en posición ${estadoSatIndex + 1} (${headers[estadoSatIndex]})`);
        let celdasLlenadas = 0;
        for (let i = 1; i < datos.length; i++) {
            const fila = datos[i];
            if (!Array.isArray(fila))
                continue;
            while (fila.length <= estadoSatIndex) {
                fila.push(null);
            }
            const valorActual = fila[estadoSatIndex];
            if (valorActual === null ||
                valorActual === undefined ||
                valorActual === '' ||
                (typeof valorActual === 'string' && valorActual.trim() === '')) {
                fila[estadoSatIndex] = 'Vigente';
                celdasLlenadas++;
            }
        }
        if (celdasLlenadas > 0) {
            console.log(`✓ Se llenaron ${celdasLlenadas} celda(s) de "Estado SAT" con valor "Vigente"`);
        }
        else {
            console.log('ℹ️  Todas las celdas de "Estado SAT" ya tenían valores');
        }
        return datos;
    }
    limpiarFilasVacias(datos) {
        if (!Array.isArray(datos) || datos.length === 0) {
            return datos;
        }
        let ultimaFilaConDatos = datos.length - 1;
        for (let i = datos.length - 1; i >= 0; i--) {
            const fila = datos[i];
            if (!Array.isArray(fila)) {
                continue;
            }
            const tieneDatos = fila.some((celda) => {
                if (celda === null || celda === undefined || celda === '')
                    return false;
                if (typeof celda === 'string' && celda.trim() === '')
                    return false;
                return true;
            });
            if (tieneDatos) {
                ultimaFilaConDatos = i;
                break;
            }
        }
        if (ultimaFilaConDatos < datos.length - 1) {
            const filasEliminadas = datos.length - ultimaFilaConDatos - 1;
            console.log(`✓ Se eliminaron ${filasEliminadas} fila(s) vacía(s) al final del archivo.`);
            return datos.slice(0, ultimaFilaConDatos + 1);
        }
        return datos;
    }
    consolidarReportes(reportes) {
        const ingresos = reportes.find((r) => r.tipo === entities_1.TipoReporteMensual.INGRESOS)?.datos || [];
        const auxiliar = reportes.find((r) => r.tipo === entities_1.TipoReporteMensual.INGRESOS_AUXILIAR)?.datos || [];
        const miAdmin = reportes.find((r) => r.tipo === entities_1.TipoReporteMensual.INGRESOS_MI_ADMIN)?.datos || [];
        const totalesIngresos = this.calcularTotalesReporte(ingresos);
        const totalesAuxiliar = this.calcularTotalesReporte(auxiliar);
        const totalesMiAdmin = this.calcularTotalesReporte(miAdmin);
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
    calcularTotalesReporte(datos) {
        if (!Array.isArray(datos) || datos.length === 0) {
            return { total: 0, subtotal: 0, iva: 0 };
        }
        let total = 0;
        let subtotal = 0;
        let iva = 0;
        for (let i = 1; i < datos.length; i++) {
            const fila = datos[i];
            if (!Array.isArray(fila))
                continue;
            for (const celda of fila) {
                if (typeof celda === 'number' && !isNaN(celda)) {
                    total += celda;
                }
            }
        }
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
    async actualizarReporteBaseAnual(reporteBaseId, mes, datosConsolidados) {
        const reporteBase = await this.reporteBaseRepository.findOne({
            where: { id: reporteBaseId },
        });
        if (!reporteBase) {
            throw new common_1.NotFoundException('Reporte base anual no encontrado');
        }
        let hojas = reporteBase.hojas;
        if (!Array.isArray(hojas) || hojas.length === 0) {
            hojas = this.inicializarHojasVacias();
        }
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
        const mesesCompletados = [...reporteBase.mesesCompletados];
        if (!mesesCompletados.includes(mes)) {
            mesesCompletados.push(mes);
            mesesCompletados.sort((a, b) => a - b);
        }
        reporteBase.hojas = hojas;
        reporteBase.mesesCompletados = mesesCompletados;
        reporteBase.ultimaActualizacion = new Date();
        await this.reporteBaseRepository.save(reporteBase);
    }
    inicializarHojasVacias() {
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
    actualizarHojaResumen(hoja, mes, datos) {
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Ingresos', 'IVA Trasladado', 'Subtotal', 'Fecha Actualización']];
        }
        const nombreMes = this.getNombreMes(mes);
        const fechaActual = new Date().toLocaleDateString('es-MX');
        const index = hoja.datos.findIndex((fila, idx) => idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes));
        const nuevaFila = [
            nombreMes,
            datos.totales.totalIngresos || 0,
            datos.totales.totalIVATrasladado || 0,
            datos.totales.subtotal || 0,
            fechaActual,
        ];
        if (index > 0) {
            hoja.datos[index] = nuevaFila;
        }
        else {
            hoja.datos.push(nuevaFila);
        }
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a, b) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }
    actualizarHojaIngresos(hoja, mes, datos) {
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Reporte Ingresos', 'Reporte Auxiliar', 'Reporte Mi Admin', 'Total']];
        }
        const nombreMes = this.getNombreMes(mes);
        const detalle = datos.detalleTotales || {};
        const index = hoja.datos.findIndex((fila, idx) => idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes));
        const nuevaFila = [
            nombreMes,
            detalle.ingresos?.total || 0,
            detalle.auxiliar?.total || 0,
            detalle.miAdmin?.total || 0,
            datos.totales.totalIngresos || 0,
        ];
        if (index > 0) {
            hoja.datos[index] = nuevaFila;
        }
        else {
            hoja.datos.push(nuevaFila);
        }
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a, b) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }
    actualizarHojaComparativas(hoja, mes, datos) {
        if (!Array.isArray(hoja.datos)) {
            hoja.datos = [['Mes', 'Total Mes Actual', 'Total Mes Anterior', 'Variación %']];
        }
        const nombreMes = this.getNombreMes(mes);
        const totalActual = datos.totales.totalIngresos || 0;
        const mesAnterior = mes === 1 ? 12 : mes - 1;
        const indexMesAnterior = hoja.datos.findIndex((fila, idx) => idx > 0 && Array.isArray(fila) && fila[0] === this.getNombreMes(mesAnterior));
        const totalMesAnterior = indexMesAnterior > 0 ? (hoja.datos[indexMesAnterior][1] || 0) : 0;
        const variacion = totalMesAnterior > 0
            ? ((totalActual - totalMesAnterior) / totalMesAnterior * 100).toFixed(2) + '%'
            : 'N/A';
        const index = hoja.datos.findIndex((fila, idx) => idx > 0 && Array.isArray(fila) && (fila[0] === nombreMes || fila[0] === mes));
        const nuevaFila = [
            nombreMes,
            totalActual,
            totalMesAnterior,
            variacion,
        ];
        if (index > 0) {
            hoja.datos[index] = nuevaFila;
        }
        else {
            hoja.datos.push(nuevaFila);
        }
        const headers = hoja.datos[0];
        const filasDatos = hoja.datos.slice(1);
        filasDatos.sort((a, b) => {
            const mesA = this.getMesNumero(a[0]);
            const mesB = this.getMesNumero(b[0]);
            return mesA - mesB;
        });
        hoja.datos = [headers, ...filasDatos];
    }
    getMesNumero(nombreMes) {
        if (typeof nombreMes === 'number')
            return nombreMes;
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const index = meses.indexOf(nombreMes);
        return index >= 0 ? index + 1 : 0;
    }
    getNombreMes(mes) {
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
    assertMesEditable(mes) {
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.ENVIADO) {
            const gestorNombre = mes.trabajo?.gestorResponsable?.name || 'No asignado';
            throw new common_1.ConflictException(`El mes está en revisión por el gestor y no puede ser modificado. ` +
                `Debes esperar a que el gestor lo apruebe o rechace. ` +
                `Gestor responsable: ${gestorNombre}`);
        }
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.APROBADO) {
            const gestorNombre = mes.trabajo?.gestorResponsable?.name || 'No asignado';
            throw new common_1.ConflictException(`El mes está aprobado y bloqueado permanentemente. ` +
                `Si necesitas hacer cambios, contacta al gestor responsable para que reabra el mes. ` +
                `Gestor responsable: ${gestorNombre}`);
        }
    }
    async obtenerDatos(mesId, reporteId) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        const reporte = mes.reportes.find((r) => r.id === reporteId);
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }
        return { datos: reporte.datos || [] };
    }
    async actualizarDatos(mesId, reporteId, datos) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        this.assertMesEditable(mes);
        const reporte = mes.reportes.find((r) => r.id === reporteId);
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }
        reporte.datos = datos;
        reporte.fechaImportacion = new Date();
        return await this.reporteMensualRepository.save(reporte);
    }
    async limpiarDatosReporte(mesId, reporteId) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        this.assertMesEditable(mes);
        const reporte = mes.reportes.find((r) => r.id === reporteId);
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }
        reporte.datos = [];
        reporte.archivoOriginal = null;
        reporte.estado = entities_1.EstadoReporte.SIN_IMPORTAR;
        reporte.fechaImportacion = null;
        reporte.fechaProcesado = null;
        await this.reporteMensualRepository.save(reporte);
        const todosCompletados = mes.reportes.every((r) => r.estado === entities_1.EstadoReporte.PROCESADO || r.estado === entities_1.EstadoReporte.IMPORTADO);
        if (!todosCompletados && mes.estado === entities_1.EstadoMes.COMPLETADO) {
            mes.estado = entities_1.EstadoMes.EN_PROCESO;
            await this.mesRepository.save(mes);
        }
        console.log(`✓ Datos del reporte ${reporteId} (tipo: ${reporte.tipo}) limpiados correctamente`);
        return {
            success: true,
            message: `Datos del reporte ${reporte.tipo} eliminados correctamente`
        };
    }
    async reprocesarEstadoSat(mesId, reporteId) {
        const mes = await this.mesRepository.findOne({
            where: { id: mesId },
            relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${mesId} no encontrado`);
        }
        this.assertMesEditable(mes);
        const reporte = mes.reportes.find((r) => r.id === reporteId);
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
        }
        if (!reporte.datos || reporte.datos.length === 0) {
            return {
                success: false,
                message: 'El reporte no tiene datos para procesar',
                celdasModificadas: 0,
            };
        }
        console.log(`🔄 Reprocesando Estado SAT para reporte ${reporteId} (tipo: ${reporte.tipo})`);
        const datosOriginales = JSON.parse(JSON.stringify(reporte.datos));
        const datosActualizados = this.llenarEstadoSat(reporte.datos);
        let celdasModificadas = 0;
        if (datosOriginales.length > 1) {
            const headers = datosOriginales[0];
            const estadoSatIndex = headers.findIndex((header) => {
                if (!header || typeof header !== 'string')
                    return false;
                const headerLower = header.toLowerCase().trim();
                return (headerLower.includes('estado') && headerLower.includes('sat') ||
                    headerLower.includes('estatus') && headerLower.includes('sat'));
            });
            if (estadoSatIndex !== -1) {
                for (let i = 1; i < datosOriginales.length; i++) {
                    const valorOriginal = datosOriginales[i]?.[estadoSatIndex];
                    const valorNuevo = datosActualizados[i]?.[estadoSatIndex];
                    const estabaVacio = !valorOriginal ||
                        (typeof valorOriginal === 'string' && valorOriginal.trim() === '');
                    const ahoraVigente = valorNuevo === 'Vigente';
                    if (estabaVacio && ahoraVigente) {
                        celdasModificadas++;
                    }
                }
            }
        }
        reporte.datos = datosActualizados;
        await this.reporteMensualRepository.save(reporte);
        console.log(`✓ Reporte ${reporteId} reprocesado: ${celdasModificadas} celda(s) actualizadas`);
        return {
            success: true,
            message: `Se llenaron ${celdasModificadas} celda(s) de "Estado SAT" con "Vigente"`,
            celdasModificadas,
        };
    }
};
exports.ReportesMensualesService = ReportesMensualesService;
exports.ReportesMensualesService = ReportesMensualesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ReporteMensual)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Mes)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ReporteBaseAnual)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportesMensualesService);
//# sourceMappingURL=reportes-mensuales.service.js.map