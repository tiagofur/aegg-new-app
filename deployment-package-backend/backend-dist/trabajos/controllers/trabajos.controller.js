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
exports.TrabajosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const trabajos_service_1 = require("../services/trabajos.service");
const dto_1 = require("../dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_entity_1 = require("../../auth/entities/user.entity");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let TrabajosController = class TrabajosController {
    constructor(trabajosService) {
        this.trabajosService = trabajosService;
    }
    create(createTrabajoDto, currentUser) {
        return this.trabajosService.create(createTrabajoDto, currentUser);
    }
    findAll(currentUser, miembroId, usuarioIdLegacy) {
        const filtro = miembroId ?? usuarioIdLegacy;
        return this.trabajosService.findAll(currentUser, filtro);
    }
    findOne(id, currentUser) {
        return this.trabajosService.findOne(id, currentUser);
    }
    update(id, updateTrabajoDto, currentUser) {
        return this.trabajosService.update(id, updateTrabajoDto, currentUser);
    }
    remove(id, currentUser) {
        return this.trabajosService.remove(id, currentUser);
    }
    async importarReporteBase(id, file, currentUser) {
        if (!file) {
            throw new common_1.BadRequestException('No se proporcionó ningún archivo');
        }
        return this.trabajosService.importarReporteBase(id, file.buffer, currentUser);
    }
    async actualizarVentasMes(trabajoId, body, currentUser) {
        const { mes, ventas } = body;
        if (mes === undefined || ventas === undefined) {
            throw new common_1.BadRequestException('Los campos "mes" y "ventas" son requeridos');
        }
        return this.trabajosService.actualizarVentasMensualesEnExcel(trabajoId, mes, ventas, currentUser);
    }
};
exports.TrabajosController = TrabajosController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTrabajoDto, Object]),
    __metadata("design:returntype", void 0)
], TrabajosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('miembroId')),
    __param(2, (0, common_1.Query)('usuarioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TrabajosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrabajosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTrabajoDto, Object]),
    __metadata("design:returntype", void 0)
], TrabajosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrabajosController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/reporte-base/importar'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrabajosController.prototype, "importarReporteBase", null);
__decorate([
    (0, common_1.Post)(':id/reporte-base/actualizar-ventas-mes'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR, user_entity_1.UserRole.MIEMBRO),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrabajosController.prototype, "actualizarVentasMes", null);
exports.TrabajosController = TrabajosController = __decorate([
    (0, common_1.Controller)('trabajos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [trabajos_service_1.TrabajosService])
], TrabajosController);
//# sourceMappingURL=trabajos.controller.js.map