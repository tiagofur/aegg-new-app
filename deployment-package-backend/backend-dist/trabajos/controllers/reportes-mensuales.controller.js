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
exports.ReportesMensualesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const reportes_mensuales_service_1 = require("../services/reportes-mensuales.service");
const dto_1 = require("../dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
let ReportesMensualesController = class ReportesMensualesController {
    constructor(reportesService) {
        this.reportesService = reportesService;
    }
    importar(importDto, file) {
        return this.reportesService.importarReporte(importDto.mesId, importDto.tipo, file);
    }
    procesarYGuardar(mesId) {
        return this.reportesService.procesarYGuardar(mesId);
    }
    obtenerDatos(mesId, reporteId) {
        return this.reportesService.obtenerDatos(mesId, reporteId);
    }
    actualizarDatos(mesId, reporteId, datos) {
        return this.reportesService.actualizarDatos(mesId, reporteId, datos);
    }
    limpiarDatos(mesId, reporteId) {
        return this.reportesService.limpiarDatosReporte(mesId, reporteId);
    }
    reprocesarEstadoSat(mesId, reporteId) {
        return this.reportesService.reprocesarEstadoSat(mesId, reporteId);
    }
};
exports.ReportesMensualesController = ReportesMensualesController;
__decorate([
    (0, common_1.Post)('importar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ImportReporteMensualDto, Object]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "importar", null);
__decorate([
    (0, common_1.Post)(':mesId/procesar'),
    __param(0, (0, common_1.Param)('mesId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "procesarYGuardar", null);
__decorate([
    (0, common_1.Get)(':mesId/:reporteId/datos'),
    __param(0, (0, common_1.Param)('mesId')),
    __param(1, (0, common_1.Param)('reporteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "obtenerDatos", null);
__decorate([
    (0, common_1.Put)(':mesId/:reporteId/datos'),
    __param(0, (0, common_1.Param)('mesId')),
    __param(1, (0, common_1.Param)('reporteId')),
    __param(2, (0, common_1.Body)('datos')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "actualizarDatos", null);
__decorate([
    (0, common_1.Delete)(':mesId/:reporteId/datos'),
    __param(0, (0, common_1.Param)('mesId')),
    __param(1, (0, common_1.Param)('reporteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "limpiarDatos", null);
__decorate([
    (0, common_1.Post)(':mesId/:reporteId/reprocesar-estado-sat'),
    __param(0, (0, common_1.Param)('mesId')),
    __param(1, (0, common_1.Param)('reporteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportesMensualesController.prototype, "reprocesarEstadoSat", null);
exports.ReportesMensualesController = ReportesMensualesController = __decorate([
    (0, common_1.Controller)('reportes-mensuales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reportes_mensuales_service_1.ReportesMensualesService])
], ReportesMensualesController);
//# sourceMappingURL=reportes-mensuales.controller.js.map