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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteMensual = exports.EstadoReporte = exports.TipoReporteMensual = void 0;
const typeorm_1 = require("typeorm");
const mes_entity_1 = require("./mes.entity");
var TipoReporteMensual;
(function (TipoReporteMensual) {
    TipoReporteMensual["INGRESOS"] = "INGRESOS";
    TipoReporteMensual["INGRESOS_AUXILIAR"] = "INGRESOS_AUXILIAR";
    TipoReporteMensual["INGRESOS_MI_ADMIN"] = "INGRESOS_MI_ADMIN";
})(TipoReporteMensual || (exports.TipoReporteMensual = TipoReporteMensual = {}));
var EstadoReporte;
(function (EstadoReporte) {
    EstadoReporte["SIN_IMPORTAR"] = "SIN_IMPORTAR";
    EstadoReporte["IMPORTADO"] = "IMPORTADO";
    EstadoReporte["PROCESADO"] = "PROCESADO";
    EstadoReporte["ERROR"] = "ERROR";
})(EstadoReporte || (exports.EstadoReporte = EstadoReporte = {}));
let ReporteMensual = class ReporteMensual {
};
exports.ReporteMensual = ReporteMensual;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReporteMensual.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReporteMensual.prototype, "mesId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TipoReporteMensual,
    }),
    __metadata("design:type", String)
], ReporteMensual.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReporteMensual.prototype, "archivoOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { default: [] }),
    __metadata("design:type", Array)
], ReporteMensual.prototype, "datos", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstadoReporte,
        default: EstadoReporte.SIN_IMPORTAR,
    }),
    __metadata("design:type", String)
], ReporteMensual.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ReporteMensual.prototype, "fechaImportacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ReporteMensual.prototype, "fechaProcesado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReporteMensual.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => mes_entity_1.Mes, (mes) => mes.reportes, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'mesId' }),
    __metadata("design:type", mes_entity_1.Mes)
], ReporteMensual.prototype, "mes", void 0);
exports.ReporteMensual = ReporteMensual = __decorate([
    (0, typeorm_1.Entity)('reportes_mensuales'),
    (0, typeorm_1.Index)(['mesId', 'tipo'], { unique: true })
], ReporteMensual);
//# sourceMappingURL=reporte-mensual.entity.js.map