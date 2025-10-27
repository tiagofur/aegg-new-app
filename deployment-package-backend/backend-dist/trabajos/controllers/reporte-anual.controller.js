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
exports.ReporteAnualController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const reporte_anual_service_1 = require("../services/reporte-anual.service");
let ReporteAnualController = class ReporteAnualController {
    constructor(reporteAnualService) {
        this.reporteAnualService = reporteAnualService;
    }
    async obtenerReporteAnual(trabajoId, anio) {
        return this.reporteAnualService.obtenerOCrearReporteAnual(trabajoId, anio);
    }
    async obtenerResumenAnual(trabajoId, anio) {
        return this.reporteAnualService.obtenerResumenAnual(trabajoId, anio);
    }
    async obtenerReporteMensual(trabajoId, anio, mes) {
        return this.reporteAnualService.obtenerReporteMensual(trabajoId, anio, mes);
    }
    async actualizarVentas(trabajoId, body) {
        return this.reporteAnualService.actualizarVentas({
            trabajoId,
            ...body,
        });
    }
};
exports.ReporteAnualController = ReporteAnualController;
__decorate([
    (0, common_1.Get)(':anio'),
    __param(0, (0, common_1.Param)('trabajoId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('anio', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ReporteAnualController.prototype, "obtenerReporteAnual", null);
__decorate([
    (0, common_1.Get)(':anio/resumen'),
    __param(0, (0, common_1.Param)('trabajoId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('anio', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ReporteAnualController.prototype, "obtenerResumenAnual", null);
__decorate([
    (0, common_1.Get)(':anio/mes/:mes'),
    __param(0, (0, common_1.Param)('trabajoId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('anio', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('mes', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ReporteAnualController.prototype, "obtenerReporteMensual", null);
__decorate([
    (0, common_1.Post)('actualizar-ventas'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('trabajoId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReporteAnualController.prototype, "actualizarVentas", null);
exports.ReporteAnualController = ReporteAnualController = __decorate([
    (0, common_1.Controller)('trabajos/:trabajoId/reporte-anual'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reporte_anual_service_1.ReporteAnualService])
], ReporteAnualController);
//# sourceMappingURL=reporte-anual.controller.js.map