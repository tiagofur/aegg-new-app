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
exports.MesesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../auth/entities/user.entity");
let MesesService = class MesesService {
    constructor(mesRepository, reporteMensualRepository, trabajoRepository, reporteBaseRepository) {
        this.mesRepository = mesRepository;
        this.reporteMensualRepository = reporteMensualRepository;
        this.trabajoRepository = trabajoRepository;
        this.reporteBaseRepository = reporteBaseRepository;
    }
    async create(createMesDto) {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: createMesDto.trabajoId },
        });
        if (!trabajo) {
            throw new common_1.NotFoundException(`Trabajo con id ${createMesDto.trabajoId} no encontrado`);
        }
        const existe = await this.mesRepository.findOne({
            where: {
                trabajoId: createMesDto.trabajoId,
                mes: createMesDto.mes,
            },
        });
        if (existe) {
            throw new common_1.ConflictException(`El mes ${createMesDto.mes} ya existe para este trabajo`);
        }
        const mes = this.mesRepository.create(createMesDto);
        const mesGuardado = await this.mesRepository.save(mes);
        const reportes = [
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS,
                datos: [],
            }),
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_AUXILIAR,
                datos: [],
            }),
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_MI_ADMIN,
                datos: [],
            }),
        ];
        await this.reporteMensualRepository.save(reportes);
        await this.actualizarEstadoAprobacionTrabajo(createMesDto.trabajoId);
        return this.findOne(mesGuardado.id);
    }
    async findByTrabajo(trabajoId) {
        return this.mesRepository.find({
            where: { trabajoId },
            relations: ['reportes', 'enviadoRevisionPor', 'aprobadoPor'],
            order: {
                mes: 'ASC',
            },
        });
    }
    async findOne(id) {
        const mes = await this.mesRepository.findOne({
            where: { id },
            relations: ['reportes', 'trabajo', 'trabajo.miembroAsignado', 'trabajo.gestorResponsable', 'enviadoRevisionPor', 'aprobadoPor'],
        });
        if (!mes) {
            throw new common_1.NotFoundException(`Mes con id ${id} no encontrado`);
        }
        return mes;
    }
    async remove(id) {
        const mes = await this.findOne(id);
        if (mes.estado === entities_1.EstadoMes.COMPLETADO) {
            await this.revertirReporteBase(mes);
        }
        await this.mesRepository.remove(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
    }
    async reabrirMes(id) {
        const mes = await this.findOne(id);
        if (mes.estado !== entities_1.EstadoMes.COMPLETADO) {
            throw new common_1.ConflictException(`El mes ${mes.mes} no está completado, no se puede reabrir`);
        }
        mes.estado = entities_1.EstadoMes.EN_PROCESO;
        mes.estadoRevision = entities_1.EstadoRevisionMes.EN_EDICION;
        mes.enviadoRevisionPorId = null;
        mes.fechaEnvioRevision = null;
        mes.aprobadoPorId = null;
        mes.fechaAprobacion = null;
        mes.comentarioRevision = null;
        await this.mesRepository.save(mes);
        await this.revertirReporteBase(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
        return this.findOne(id);
    }
    async enviarRevision(id, currentUser, comentario) {
        const mes = await this.findOne(id);
        this.assertPuedeSolicitarRevision(mes, currentUser);
        if (mes.estado !== entities_1.EstadoMes.COMPLETADO) {
            throw new common_1.ConflictException('Debes procesar el mes antes de enviarlo a revisión.');
        }
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.ENVIADO) {
            throw new common_1.ConflictException('El mes ya está en revisión.');
        }
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.APROBADO) {
            throw new common_1.ConflictException('El mes ya fue aprobado.');
        }
        mes.estadoRevision = entities_1.EstadoRevisionMes.ENVIADO;
        mes.enviadoRevisionPorId = currentUser.userId;
        mes.fechaEnvioRevision = new Date();
        if (comentario) {
            mes.comentarioRevision = comentario;
        }
        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
        return this.findOne(id);
    }
    async enviarRevisionManual(id, currentUser) {
        const mes = await this.findOne(id);
        this.assertPuedeEnviarManual(mes, currentUser);
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.ENVIADO) {
            throw new common_1.ConflictException('El mes ya fue enviado a revisión.');
        }
        if (mes.estadoRevision === entities_1.EstadoRevisionMes.APROBADO) {
            throw new common_1.ConflictException('El mes ya fue aprobado.');
        }
        if (mes.estado === entities_1.EstadoMes.PENDIENTE) {
            mes.estado = entities_1.EstadoMes.EN_PROCESO;
        }
        mes.estadoRevision = entities_1.EstadoRevisionMes.ENVIADO;
        mes.enviadoRevisionPorId = currentUser.userId;
        mes.fechaEnvioRevision = new Date();
        mes.aprobadoPorId = null;
        mes.fechaAprobacion = null;
        mes.comentarioRevision = null;
        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
        return this.findOne(id);
    }
    async aprobarMes(id, currentUser) {
        const mes = await this.findOne(id);
        this.assertPuedeRevisar(mes, currentUser);
        if (mes.estadoRevision !== entities_1.EstadoRevisionMes.ENVIADO) {
            throw new common_1.ConflictException('Solo puedes aprobar meses enviados a revisión.');
        }
        mes.estadoRevision = entities_1.EstadoRevisionMes.APROBADO;
        mes.aprobadoPorId = currentUser.userId;
        mes.fechaAprobacion = new Date();
        mes.comentarioRevision = null;
        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
        return this.findOne(id);
    }
    async solicitarCambios(id, currentUser, comentario) {
        const mes = await this.findOne(id);
        this.assertPuedeRevisar(mes, currentUser);
        if (mes.estadoRevision !== entities_1.EstadoRevisionMes.ENVIADO) {
            throw new common_1.ConflictException('Solo puedes solicitar cambios para meses en revisión.');
        }
        if (!comentario || comentario.trim().length === 0) {
            throw new common_1.BadRequestException('Debes incluir un comentario para solicitar cambios.');
        }
        if (mes.estado === entities_1.EstadoMes.COMPLETADO) {
            mes.estado = entities_1.EstadoMes.EN_PROCESO;
            await this.revertirReporteBase(mes);
        }
        mes.estadoRevision = entities_1.EstadoRevisionMes.CAMBIOS_SOLICITADOS;
        mes.aprobadoPorId = null;
        mes.fechaAprobacion = null;
        mes.comentarioRevision = comentario.trim();
        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
        return this.findOne(id);
    }
    assertPuedeSolicitarRevision(mes, currentUser) {
        if (currentUser.role === user_entity_1.UserRole.ADMIN || currentUser.role === user_entity_1.UserRole.GESTOR) {
            return;
        }
        if (currentUser.role === user_entity_1.UserRole.MIEMBRO &&
            mes.trabajo?.miembroAsignadoId === currentUser.userId) {
            return;
        }
        throw new common_1.ForbiddenException('No tienes permisos para enviar este mes a revisión.');
    }
    assertPuedeEnviarManual(mes, currentUser) {
        if (currentUser.role === user_entity_1.UserRole.ADMIN) {
            return;
        }
        if (currentUser.role === user_entity_1.UserRole.GESTOR) {
            const gestorAsignadoId = mes.trabajo?.gestorResponsableId ?? null;
            if (!gestorAsignadoId || gestorAsignadoId === currentUser.userId) {
                return;
            }
            throw new common_1.ForbiddenException('Solo el gestor responsable puede enviar este mes manualmente.');
        }
        throw new common_1.ForbiddenException('No tienes permisos para enviar este mes manualmente.');
    }
    assertPuedeRevisar(mes, currentUser) {
        if (currentUser.role === user_entity_1.UserRole.ADMIN) {
            return;
        }
        if (currentUser.role === user_entity_1.UserRole.GESTOR) {
            const gestorAsignadoId = mes.trabajo?.gestorResponsableId ?? null;
            if (!gestorAsignadoId || gestorAsignadoId === currentUser.userId) {
                return;
            }
            throw new common_1.ForbiddenException('Solo el gestor responsable puede aprobar o rechazar este mes.');
        }
        throw new common_1.ForbiddenException('No tienes permisos para aprobar o rechazar meses.');
    }
    async revertirReporteBase(mes) {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: mes.trabajoId },
            relations: ['reporteBaseAnual'],
        });
        if (trabajo?.reporteBaseAnual) {
            const mesesCompletados = trabajo.reporteBaseAnual.mesesCompletados.filter((m) => m !== mes.mes);
            trabajo.reporteBaseAnual.mesesCompletados = mesesCompletados;
            await this.reporteBaseRepository.save(trabajo.reporteBaseAnual);
        }
    }
    async actualizarEstadoAprobacionTrabajo(trabajoId) {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
            relations: ['meses'],
        });
        if (!trabajo) {
            return;
        }
        const meses = trabajo.meses ?? [];
        const hayEnRevision = meses.some((m) => m.estadoRevision === entities_1.EstadoRevisionMes.ENVIADO);
        const hayCambios = meses.some((m) => m.estadoRevision === entities_1.EstadoRevisionMes.CAMBIOS_SOLICITADOS);
        const todosAprobados = meses.length > 0 && meses.every((m) => m.estadoRevision === entities_1.EstadoRevisionMes.APROBADO);
        if (hayEnRevision) {
            trabajo.estadoAprobacion = entities_1.EstadoAprobacion.EN_REVISION;
        }
        else if (hayCambios) {
            trabajo.estadoAprobacion = entities_1.EstadoAprobacion.REABIERTO;
        }
        else if (todosAprobados) {
            trabajo.estadoAprobacion = entities_1.EstadoAprobacion.APROBADO;
        }
        else {
            trabajo.estadoAprobacion = entities_1.EstadoAprobacion.EN_PROGRESO;
        }
        await this.trabajoRepository.save(trabajo);
    }
};
exports.MesesService = MesesService;
exports.MesesService = MesesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Mes)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ReporteMensual)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Trabajo)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ReporteBaseAnual)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MesesService);
//# sourceMappingURL=meses.service.js.map