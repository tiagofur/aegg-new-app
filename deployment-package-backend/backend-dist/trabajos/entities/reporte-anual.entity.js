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
exports.ReporteAnual = exports.MesEnum = void 0;
const typeorm_1 = require("typeorm");
const trabajo_entity_1 = require("./trabajo.entity");
var MesEnum;
(function (MesEnum) {
    MesEnum[MesEnum["ENERO"] = 1] = "ENERO";
    MesEnum[MesEnum["FEBRERO"] = 2] = "FEBRERO";
    MesEnum[MesEnum["MARZO"] = 3] = "MARZO";
    MesEnum[MesEnum["ABRIL"] = 4] = "ABRIL";
    MesEnum[MesEnum["MAYO"] = 5] = "MAYO";
    MesEnum[MesEnum["JUNIO"] = 6] = "JUNIO";
    MesEnum[MesEnum["JULIO"] = 7] = "JULIO";
    MesEnum[MesEnum["AGOSTO"] = 8] = "AGOSTO";
    MesEnum[MesEnum["SEPTIEMBRE"] = 9] = "SEPTIEMBRE";
    MesEnum[MesEnum["OCTUBRE"] = 10] = "OCTUBRE";
    MesEnum[MesEnum["NOVIEMBRE"] = 11] = "NOVIEMBRE";
    MesEnum[MesEnum["DICIEMBRE"] = 12] = "DICIEMBRE";
})(MesEnum || (exports.MesEnum = MesEnum = {}));
let ReporteAnual = class ReporteAnual {
};
exports.ReporteAnual = ReporteAnual;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReporteAnual.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trabajo_id' }),
    __metadata("design:type", String)
], ReporteAnual.prototype, "trabajoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trabajo_entity_1.Trabajo, (trabajo) => trabajo.reportesAnuales, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'trabajo_id' }),
    __metadata("design:type", trabajo_entity_1.Trabajo)
], ReporteAnual.prototype, "trabajo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReporteAnual.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReporteAnual.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'ventas',
    }),
    __metadata("design:type", Number)
], ReporteAnual.prototype, "ventas", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'ventas_auxiliar',
    }),
    __metadata("design:type", Number)
], ReporteAnual.prototype, "ventasAuxiliar", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'diferencia',
    }),
    __metadata("design:type", Number)
], ReporteAnual.prototype, "diferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ReporteAnual.prototype, "confirmado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion' }),
    __metadata("design:type", Date)
], ReporteAnual.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'fecha_actualizacion' }),
    __metadata("design:type", Date)
], ReporteAnual.prototype, "fechaActualizacion", void 0);
exports.ReporteAnual = ReporteAnual = __decorate([
    (0, typeorm_1.Entity)('reportes_anuales'),
    (0, typeorm_1.Index)(['trabajoId', 'anio', 'mes'], { unique: true }),
    (0, typeorm_1.Index)(['trabajoId']),
    (0, typeorm_1.Index)(['anio'])
], ReporteAnual);
//# sourceMappingURL=reporte-anual.entity.js.map