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
exports.Trabajo = exports.EstadoAprobacion = exports.EstadoTrabajo = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../auth/entities/user.entity");
const entities_1 = require("../../clientes/entities");
const reporte_base_anual_entity_1 = require("./reporte-base-anual.entity");
const mes_entity_1 = require("./mes.entity");
const reporte_anual_entity_1 = require("./reporte-anual.entity");
var EstadoTrabajo;
(function (EstadoTrabajo) {
    EstadoTrabajo["ACTIVO"] = "ACTIVO";
    EstadoTrabajo["INACTIVO"] = "INACTIVO";
    EstadoTrabajo["COMPLETADO"] = "COMPLETADO";
})(EstadoTrabajo || (exports.EstadoTrabajo = EstadoTrabajo = {}));
var EstadoAprobacion;
(function (EstadoAprobacion) {
    EstadoAprobacion["EN_PROGRESO"] = "EN_PROGRESO";
    EstadoAprobacion["EN_REVISION"] = "EN_REVISION";
    EstadoAprobacion["APROBADO"] = "APROBADO";
    EstadoAprobacion["REABIERTO"] = "REABIERTO";
})(EstadoAprobacion || (exports.EstadoAprobacion = EstadoAprobacion = {}));
let Trabajo = class Trabajo {
};
exports.Trabajo = Trabajo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Trabajo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "clienteNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "clienteRfc", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], Trabajo.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clienteId', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "clienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'miembroAsignadoId', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "miembroAsignadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gestor_responsable_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "gestorResponsableId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstadoTrabajo,
        default: EstadoTrabajo.ACTIVO,
    }),
    __metadata("design:type", String)
], Trabajo.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EstadoAprobacion,
        name: 'estado_aprobacion',
        default: EstadoAprobacion.EN_PROGRESO,
    }),
    __metadata("design:type", String)
], Trabajo.prototype, "estadoAprobacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Trabajo.prototype, "fechaAprobacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aprobado_por_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Trabajo.prototype, "aprobadoPorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'visibilidad_equipo', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Trabajo.prototype, "visibilidadEquipo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Trabajo.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Trabajo.prototype, "fechaActualizacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.Cliente, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'clienteId' }),
    __metadata("design:type", entities_1.Cliente)
], Trabajo.prototype, "cliente", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'miembroAsignadoId' }),
    __metadata("design:type", user_entity_1.User)
], Trabajo.prototype, "miembroAsignado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'gestor_responsable_id' }),
    __metadata("design:type", user_entity_1.User)
], Trabajo.prototype, "gestorResponsable", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'aprobado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], Trabajo.prototype, "aprobadoPor", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => reporte_base_anual_entity_1.ReporteBaseAnual, (reporte) => reporte.trabajo, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", reporte_base_anual_entity_1.ReporteBaseAnual)
], Trabajo.prototype, "reporteBaseAnual", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mes_entity_1.Mes, (mes) => mes.trabajo, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], Trabajo.prototype, "meses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reporte_anual_entity_1.ReporteAnual, (reporte) => reporte.trabajo, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], Trabajo.prototype, "reportesAnuales", void 0);
exports.Trabajo = Trabajo = __decorate([
    (0, typeorm_1.Entity)('trabajos'),
    (0, typeorm_1.Index)('IDX_trabajos_cliente_anio', ['clienteId', 'anio'], { unique: true })
], Trabajo);
//# sourceMappingURL=trabajo.entity.js.map