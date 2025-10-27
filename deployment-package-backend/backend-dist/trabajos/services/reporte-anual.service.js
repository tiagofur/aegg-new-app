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
exports.ReporteAnualService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reporte_anual_entity_1 = require("../entities/reporte-anual.entity");
const trabajo_entity_1 = require("../entities/trabajo.entity");
let ReporteAnualService = class ReporteAnualService {
    constructor(reporteAnualRepository, trabajoRepository) {
        this.reporteAnualRepository = reporteAnualRepository;
        this.trabajoRepository = trabajoRepository;
    }
    async obtenerOCrearReporteAnual(trabajoId, anio) {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });
        if (!trabajo) {
            throw new common_1.NotFoundException(`Trabajo con ID ${trabajoId} no encontrado`);
        }
        if (anio < 2000 || anio > 2100) {
            throw new common_1.BadRequestException('Año debe estar entre 2000 y 2100');
        }
        const reportesExistentes = await this.reporteAnualRepository.find({
            where: {
                trabajoId,
                anio,
            },
            order: {
                mes: 'ASC',
            },
        });
        if (reportesExistentes.length === 12) {
            return reportesExistentes;
        }
        const mesesExistentes = new Set(reportesExistentes.map((r) => r.mes));
        const mesesFaltantes = [];
        for (let mes = 1; mes <= 12; mes++) {
            if (!mesesExistentes.has(mes)) {
                mesesFaltantes.push(mes);
            }
        }
        const nuevosReportes = [];
        for (const mes of mesesFaltantes) {
            const nuevoReporte = this.reporteAnualRepository.create({
                trabajoId,
                anio,
                mes,
                ventas: null,
                ventasAuxiliar: null,
                diferencia: null,
                confirmado: false,
            });
            nuevosReportes.push(nuevoReporte);
        }
        if (nuevosReportes.length > 0) {
            await this.reporteAnualRepository.save(nuevosReportes);
        }
        return this.reporteAnualRepository.find({
            where: {
                trabajoId,
                anio,
            },
            order: {
                mes: 'ASC',
            },
        });
    }
    async actualizarVentas(dto) {
        const { trabajoId, anio, mes, ventas, ventasAuxiliar } = dto;
        if (mes < 1 || mes > 12) {
            throw new common_1.BadRequestException('Mes debe estar entre 1 y 12');
        }
        if (anio < 2000 || anio > 2100) {
            throw new common_1.BadRequestException('Año debe estar entre 2000 y 2100');
        }
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
        });
        if (!trabajo) {
            throw new common_1.NotFoundException(`Trabajo con ID ${trabajoId} no encontrado`);
        }
        const diferencia = Math.abs(ventas - ventasAuxiliar);
        const confirmado = diferencia < 0.1;
        let reporte = await this.reporteAnualRepository.findOne({
            where: {
                trabajoId,
                anio,
                mes,
            },
        });
        if (reporte) {
            reporte.ventas = ventas;
            reporte.ventasAuxiliar = ventasAuxiliar;
            reporte.diferencia = diferencia;
            reporte.confirmado = confirmado;
        }
        else {
            reporte = this.reporteAnualRepository.create({
                trabajoId,
                anio,
                mes,
                ventas,
                ventasAuxiliar,
                diferencia,
                confirmado,
            });
        }
        return this.reporteAnualRepository.save(reporte);
    }
    async obtenerResumenAnual(trabajoId, anio) {
        const reportes = await this.obtenerOCrearReporteAnual(trabajoId, anio);
        let totalVentas = 0;
        let totalVentasAuxiliar = 0;
        let totalDiferencia = 0;
        let mesesConfirmados = 0;
        let mesesPendientes = 0;
        for (const reporte of reportes) {
            if (reporte.ventas !== null) {
                totalVentas += Number(reporte.ventas);
            }
            if (reporte.ventasAuxiliar !== null) {
                totalVentasAuxiliar += Number(reporte.ventasAuxiliar);
            }
            if (reporte.diferencia !== null) {
                totalDiferencia += Number(reporte.diferencia);
            }
            if (reporte.confirmado) {
                mesesConfirmados++;
            }
            else if (reporte.ventas !== null ||
                reporte.ventasAuxiliar !== null) {
                mesesPendientes++;
            }
        }
        return {
            anio,
            totalVentas,
            totalVentasAuxiliar,
            totalDiferencia,
            mesesConfirmados,
            mesesPendientes,
            reportes,
        };
    }
    async obtenerReporteMensual(trabajoId, anio, mes) {
        const reporte = await this.reporteAnualRepository.findOne({
            where: {
                trabajoId,
                anio,
                mes,
            },
        });
        if (!reporte) {
            throw new common_1.NotFoundException(`Reporte para ${mes}/${anio} no encontrado`);
        }
        return reporte;
    }
    async eliminarReportesAnio(trabajoId, anio) {
        await this.reporteAnualRepository.delete({
            trabajoId,
            anio,
        });
    }
};
exports.ReporteAnualService = ReporteAnualService;
exports.ReporteAnualService = ReporteAnualService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reporte_anual_entity_1.ReporteAnual)),
    __param(1, (0, typeorm_1.InjectRepository)(trabajo_entity_1.Trabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReporteAnualService);
//# sourceMappingURL=reporte-anual.service.js.map