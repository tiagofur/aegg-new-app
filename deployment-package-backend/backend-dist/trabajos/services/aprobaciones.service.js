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
exports.AprobacionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const user_entity_1 = require("../../auth/entities/user.entity");
let AprobacionesService = class AprobacionesService {
    constructor(trabajoRepository) {
        this.trabajoRepository = trabajoRepository;
    }
    async getDashboard(currentUser, filters) {
        const trabajos = await this.trabajoRepository.find({
            where: this.buildAccessWhere(currentUser),
            relations: [
                'cliente',
                'miembroAsignado',
                'aprobadoPor',
                'gestorResponsable',
                'meses',
                'meses.enviadoRevisionPor',
                'meses.aprobadoPor',
            ],
            order: {
                fechaActualizacion: 'DESC',
            },
        });
        const visibles = this.applyEquipoVisibility(trabajos, currentUser);
        const contextoMeses = this.expandMeses(visibles);
        const resumenEstados = this.buildResumen(contextoMeses);
        const filtrados = this.applyFilters(contextoMeses, filters);
        const pendientes = this.buildPendientes(filtrados);
        const recientes = this.buildRecientes(filtrados);
        return {
            resumenEstados,
            pendientes,
            recientes,
        };
    }
    buildAccessWhere(currentUser) {
        if (currentUser.role === user_entity_1.UserRole.MIEMBRO) {
            return { miembroAsignadoId: currentUser.userId };
        }
        return {};
    }
    expandMeses(trabajos) {
        const items = [];
        for (const trabajo of trabajos) {
            for (const mes of trabajo.meses ?? []) {
                items.push({ trabajo, mes });
            }
        }
        return items;
    }
    buildResumen(items) {
        const resumen = {
            [entities_1.EstadoAprobacion.EN_PROGRESO]: 0,
            [entities_1.EstadoAprobacion.EN_REVISION]: 0,
            [entities_1.EstadoAprobacion.APROBADO]: 0,
            [entities_1.EstadoAprobacion.REABIERTO]: 0,
        };
        for (const item of items) {
            const estado = this.mapEstadoRevision(item.mes.estadoRevision);
            resumen[estado] = (resumen[estado] ?? 0) + 1;
        }
        return resumen;
    }
    applyFilters(items, filters) {
        if (!filters) {
            return items;
        }
        let resultado = [...items];
        if (filters.estado) {
            resultado = resultado.filter(({ mes }) => this.mapEstadoRevision(mes.estadoRevision) === filters.estado);
        }
        if (filters.search) {
            const termino = filters.search.trim().toLowerCase();
            resultado = resultado.filter(({ trabajo, mes }) => {
                const nombreCliente = (trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? '').toLowerCase();
                const miembro = (trabajo.miembroAsignado?.name ?? trabajo.miembroAsignado?.email ?? '').toLowerCase();
                const anio = trabajo.anio.toString();
                const mesNombre = this.getNombreMes(mes.mes).toLowerCase();
                return (nombreCliente.includes(termino) ||
                    miembro.includes(termino) ||
                    anio.includes(termino) ||
                    mesNombre.includes(termino));
            });
        }
        if (filters.equipoId) {
            resultado = resultado.filter(({ trabajo }) => {
                const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
                return miembroEquipoId === filters.equipoId;
            });
        }
        return resultado;
    }
    buildPendientes(items) {
        return items
            .filter(({ mes }) => mes.estadoRevision === entities_1.EstadoRevisionMes.ENVIADO ||
            mes.estadoRevision === entities_1.EstadoRevisionMes.CAMBIOS_SOLICITADOS)
            .sort((a, b) => b.mes.fechaActualizacion.getTime() - a.mes.fechaActualizacion.getTime())
            .slice(0, 25)
            .map(({ trabajo, mes }) => this.mapMesResumen(trabajo, mes));
    }
    buildRecientes(items) {
        return [...items]
            .sort((a, b) => b.mes.fechaActualizacion.getTime() - a.mes.fechaActualizacion.getTime())
            .slice(0, 10)
            .map(({ trabajo, mes }) => this.mapActividad(trabajo, mes));
    }
    mapMesResumen(trabajo, mes) {
        const meses = trabajo.meses ?? [];
        const completados = meses.filter((item) => item.estado === entities_1.EstadoMes.COMPLETADO).length;
        const estadoAprobacion = this.mapEstadoRevision(mes.estadoRevision);
        return {
            id: mes.id,
            trabajoId: trabajo.id,
            clienteNombre: trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? 'Cliente sin nombre',
            anio: trabajo.anio,
            mesNumero: mes.mes,
            mesNombre: this.getNombreMes(mes.mes),
            estadoAprobacion,
            estadoRevision: mes.estadoRevision,
            fechaActualizacion: mes.fechaActualizacion.toISOString(),
            fechaEnvioRevision: mes.fechaEnvioRevision ? mes.fechaEnvioRevision.toISOString() : null,
            fechaAprobacion: mes.fechaAprobacion ? mes.fechaAprobacion.toISOString() : null,
            miembroAsignado: this.mapUser(trabajo.miembroAsignado),
            aprobadoPor: this.mapUser(mes.aprobadoPor ?? trabajo.aprobadoPor),
            enviadoPor: this.mapUser(mes.enviadoRevisionPor),
            comentarioRevision: mes.comentarioRevision ?? null,
            totalMeses: meses.length,
            mesesCompletados: completados,
        };
    }
    mapActividad(trabajo, mes) {
        const clienteNombre = trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? 'Cliente sin nombre';
        const estadoAprobacion = this.mapEstadoRevision(mes.estadoRevision);
        return {
            trabajoId: trabajo.id,
            mesId: mes.id,
            titulo: `${clienteNombre} · ${this.getNombreMes(mes.mes)} ${trabajo.anio}`,
            descripcion: this.describeEstadoRevision(mes.estadoRevision),
            fecha: mes.fechaActualizacion.toISOString(),
            estadoAprobacion,
            estadoRevision: mes.estadoRevision,
        };
    }
    describeEstadoRevision(estado) {
        switch (estado) {
            case entities_1.EstadoRevisionMes.ENVIADO:
                return 'Pendiente de aprobación del gestor';
            case entities_1.EstadoRevisionMes.APROBADO:
                return 'Mes aprobado por el gestor';
            case entities_1.EstadoRevisionMes.CAMBIOS_SOLICITADOS:
                return 'El gestor solicitó ajustes en el mes';
            default:
                return 'Mes en edición';
        }
    }
    mapEstadoRevision(estado) {
        switch (estado) {
            case entities_1.EstadoRevisionMes.ENVIADO:
                return entities_1.EstadoAprobacion.EN_REVISION;
            case entities_1.EstadoRevisionMes.APROBADO:
                return entities_1.EstadoAprobacion.APROBADO;
            case entities_1.EstadoRevisionMes.CAMBIOS_SOLICITADOS:
                return entities_1.EstadoAprobacion.REABIERTO;
            default:
                return entities_1.EstadoAprobacion.EN_PROGRESO;
        }
    }
    mapUser(usuario) {
        if (!usuario) {
            return null;
        }
        return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.name,
        };
    }
    applyEquipoVisibility(trabajos, currentUser) {
        if (currentUser.role !== user_entity_1.UserRole.GESTOR || !currentUser.equipoId) {
            return trabajos;
        }
        return trabajos.filter((trabajo) => {
            if (!trabajo.visibilidadEquipo) {
                return true;
            }
            if (!trabajo.miembroAsignadoId) {
                return true;
            }
            if (trabajo.miembroAsignadoId === currentUser.userId) {
                return true;
            }
            if (trabajo.gestorResponsableId === currentUser.userId) {
                return true;
            }
            const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
            if (miembroEquipoId === currentUser.equipoId) {
                return true;
            }
            if (trabajo.aprobadoPorId === currentUser.userId) {
                return true;
            }
            return false;
        });
    }
    getNombreMes(mesNumero) {
        const meses = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
        ];
        return meses[mesNumero - 1] ?? `Mes ${mesNumero}`;
    }
};
exports.AprobacionesService = AprobacionesService;
exports.AprobacionesService = AprobacionesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Trabajo)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AprobacionesService);
//# sourceMappingURL=aprobaciones.service.js.map