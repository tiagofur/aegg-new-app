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
exports.ReporteBaseAnual = void 0;
const typeorm_1 = require("typeorm");
const trabajo_entity_1 = require("./trabajo.entity");
let ReporteBaseAnual = class ReporteBaseAnual {
};
exports.ReporteBaseAnual = ReporteBaseAnual;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReporteBaseAnual.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ReporteBaseAnual.prototype, "trabajoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReporteBaseAnual.prototype, "archivoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { array: true, default: [] }),
    __metadata("design:type", Array)
], ReporteBaseAnual.prototype, "mesesCompletados", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Array)
], ReporteBaseAnual.prototype, "hojas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReporteBaseAnual.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReporteBaseAnual.prototype, "ultimaActualizacion", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => trabajo_entity_1.Trabajo, (trabajo) => trabajo.reporteBaseAnual, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'trabajoId' }),
    __metadata("design:type", trabajo_entity_1.Trabajo)
], ReporteBaseAnual.prototype, "trabajo", void 0);
exports.ReporteBaseAnual = ReporteBaseAnual = __decorate([
    (0, typeorm_1.Entity)('reportes_base_anual')
], ReporteBaseAnual);
//# sourceMappingURL=reporte-base-anual.entity.js.map