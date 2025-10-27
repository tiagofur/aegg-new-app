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
exports.Mes = exports.EstadoRevisionMes = exports.EstadoMes = void 0;
const typeorm_1 = require("typeorm");
const trabajo_entity_1 = require("./trabajo.entity");
const reporte_mensual_entity_1 = require("./reporte-mensual.entity");
const user_entity_1 = require("../../auth/entities/user.entity");
var EstadoMes;
(function (EstadoMes) {
    EstadoMes["PENDIENTE"] = "PENDIENTE";
    EstadoMes["EN_PROCESO"] = "EN_PROCESO";
    EstadoMes["COMPLETADO"] = "COMPLETADO";
})(EstadoMes || (exports.EstadoMes = EstadoMes = {}));
var EstadoRevisionMes;
(function (EstadoRevisionMes) {
    EstadoRevisionMes["EN_EDICION"] = "EN_EDICION";
    EstadoRevisionMes["ENVIADO"] = "ENVIADO";
    EstadoRevisionMes["APROBADO"] = "APROBADO";
    EstadoRevisionMes["CAMBIOS_SOLICITADOS"] = "CAMBIOS_SOLICITADOS";
})(EstadoRevisionMes || (exports.EstadoRevisionMes = EstadoRevisionMes = {}));
let Mes = class Mes {
};
exports.Mes = Mes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mes.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Mes.prototype, "trabajoId", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], Mes.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstadoMes,
        default: EstadoMes.PENDIENTE,
    }),
    __metadata("design:type", String)
], Mes.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstadoRevisionMes,
        name: 'estado_revision',
        default: EstadoRevisionMes.EN_EDICION,
    }),
    __metadata("design:type", String)
], Mes.prototype, "estadoRevision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'enviado_revision_por_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Mes.prototype, "enviadoRevisionPorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_envio_revision', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Mes.prototype, "fechaEnvioRevision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aprobado_por_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Mes.prototype, "aprobadoPorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Mes.prototype, "fechaAprobacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentario_revision', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Mes.prototype, "comentarioRevision", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Mes.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Mes.prototype, "fechaActualizacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trabajo_entity_1.Trabajo, (trabajo) => trabajo.meses, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'trabajoId' }),
    __metadata("design:type", trabajo_entity_1.Trabajo)
], Mes.prototype, "trabajo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reporte_mensual_entity_1.ReporteMensual, (reporte) => reporte.mes, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], Mes.prototype, "reportes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'enviado_revision_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Mes.prototype, "enviadoRevisionPor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'aprobado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Mes.prototype, "aprobadoPor", void 0);
exports.Mes = Mes = __decorate([
    (0, typeorm_1.Entity)('meses'),
    (0, typeorm_1.Index)(['trabajoId', 'mes'], { unique: true })
], Mes);
//# sourceMappingURL=mes.entity.js.map