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
exports.MesesController = void 0;
const common_1 = require("@nestjs/common");
const meses_service_1 = require("../services/meses.service");
const dto_1 = require("../dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_entity_1 = require("../../auth/entities/user.entity");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let MesesController = class MesesController {
    constructor(mesesService) {
        this.mesesService = mesesService;
    }
    create(createMesDto) {
        return this.mesesService.create(createMesDto);
    }
    findByTrabajo(trabajoId) {
        return this.mesesService.findByTrabajo(trabajoId);
    }
    findOne(id) {
        return this.mesesService.findOne(id);
    }
    reabrirMes(id) {
        return this.mesesService.reabrirMes(id);
    }
    remove(id) {
        return this.mesesService.remove(id);
    }
    enviarRevision(id, body, currentUser) {
        return this.mesesService.enviarRevision(id, currentUser, body?.comentario);
    }
    enviarRevisionManual(id, currentUser) {
        return this.mesesService.enviarRevisionManual(id, currentUser);
    }
    aprobarMes(id, currentUser) {
        return this.mesesService.aprobarMes(id, currentUser);
    }
    solicitarCambios(id, body, currentUser) {
        return this.mesesService.solicitarCambios(id, currentUser, body?.comentario);
    }
};
exports.MesesController = MesesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMesDto]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('trabajo/:trabajoId'),
    __param(0, (0, common_1.Param)('trabajoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "findByTrabajo", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/reabrir'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "reabrirMes", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/enviar-revision'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EnviarRevisionMesDto, Object]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "enviarRevision", null);
__decorate([
    (0, common_1.Patch)(':id/enviar-manual'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "enviarRevisionManual", null);
__decorate([
    (0, common_1.Patch)(':id/aprobar'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "aprobarMes", null);
__decorate([
    (0, common_1.Patch)(':id/solicitar-cambios'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.GESTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SolicitarCambiosMesDto, Object]),
    __metadata("design:returntype", void 0)
], MesesController.prototype, "solicitarCambios", null);
exports.MesesController = MesesController = __decorate([
    (0, common_1.Controller)('meses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [meses_service_1.MesesService])
], MesesController);
//# sourceMappingURL=meses.controller.js.map