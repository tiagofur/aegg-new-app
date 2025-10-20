import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
    Trabajo,
    EstadoAprobacion,
    EstadoMes,
    EstadoRevisionMes,
    Mes,
} from '../entities';
import {
    AprobacionesDashboardQueryDto,
    AprobacionesDashboardResponseDto,
    AprobacionTrabajoResumenDto,
    AprobacionActividadDto,
    TrabajoUserSummaryDto,
} from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { UserRole, User } from '../../auth/entities/user.entity';

type MesContext = {
    trabajo: Trabajo;
    mes: Mes;
};

@Injectable()
export class AprobacionesService {
    constructor(
        @InjectRepository(Trabajo)
        private readonly trabajoRepository: Repository<Trabajo>,
    ) { }

    async getDashboard(
        currentUser: CurrentUserPayload,
        filters?: AprobacionesDashboardQueryDto,
    ): Promise<AprobacionesDashboardResponseDto> {
        const trabajos = await this.trabajoRepository.find({
            where: this.buildAccessWhere(currentUser),
            relations: [
                'cliente',
                'miembroAsignado',
                'aprobadoPor',
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

    private buildAccessWhere(currentUser: CurrentUserPayload): FindOptionsWhere<Trabajo> {
        if (currentUser.role === UserRole.MIEMBRO) {
            return { miembroAsignadoId: currentUser.userId };
        }

        return {};
    }

    private expandMeses(trabajos: Trabajo[]): MesContext[] {
        const items: MesContext[] = [];
        for (const trabajo of trabajos) {
            for (const mes of trabajo.meses ?? []) {
                items.push({ trabajo, mes });
            }
        }
        return items;
    }

    private buildResumen(items: MesContext[]): Record<EstadoAprobacion, number> {
        const resumen: Record<EstadoAprobacion, number> = {
            [EstadoAprobacion.EN_PROGRESO]: 0,
            [EstadoAprobacion.EN_REVISION]: 0,
            [EstadoAprobacion.APROBADO]: 0,
            [EstadoAprobacion.REABIERTO]: 0,
        };

        for (const item of items) {
            const estado = this.mapEstadoRevision(item.mes.estadoRevision);
            resumen[estado] = (resumen[estado] ?? 0) + 1;
        }

        return resumen;
    }

    private applyFilters(
        items: MesContext[],
        filters?: AprobacionesDashboardQueryDto,
    ): MesContext[] {
        if (!filters) {
            return items;
        }

        let resultado = [...items];

        if (filters.estado) {
            resultado = resultado.filter(
                ({ mes }) => this.mapEstadoRevision(mes.estadoRevision) === filters.estado,
            );
        }

        if (filters.search) {
            const termino = filters.search.trim().toLowerCase();
            resultado = resultado.filter(({ trabajo, mes }) => {
                const nombreCliente = (trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? '').toLowerCase();
                const miembro = (trabajo.miembroAsignado?.name ?? trabajo.miembroAsignado?.email ?? '').toLowerCase();
                const anio = trabajo.anio.toString();
                const mesNombre = this.getNombreMes(mes.mes).toLowerCase();
                return (
                    nombreCliente.includes(termino) ||
                    miembro.includes(termino) ||
                    anio.includes(termino) ||
                    mesNombre.includes(termino)
                );
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

    private buildPendientes(items: MesContext[]): AprobacionTrabajoResumenDto[] {
        return items
            .filter(({ mes }) =>
                mes.estadoRevision === EstadoRevisionMes.ENVIADO ||
                mes.estadoRevision === EstadoRevisionMes.CAMBIOS_SOLICITADOS,
            )
            .sort((a, b) =>
                b.mes.fechaActualizacion.getTime() - a.mes.fechaActualizacion.getTime(),
            )
            .slice(0, 25)
            .map(({ trabajo, mes }) => this.mapMesResumen(trabajo, mes));
    }

    private buildRecientes(items: MesContext[]): AprobacionActividadDto[] {
        return [...items]
            .sort((a, b) => b.mes.fechaActualizacion.getTime() - a.mes.fechaActualizacion.getTime())
            .slice(0, 10)
            .map(({ trabajo, mes }) => this.mapActividad(trabajo, mes));
    }

    private mapMesResumen(trabajo: Trabajo, mes: Mes): AprobacionTrabajoResumenDto {
        const meses = trabajo.meses ?? [];
        const completados = meses.filter((item) => item.estado === EstadoMes.COMPLETADO).length;
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

    private mapActividad(trabajo: Trabajo, mes: Mes): AprobacionActividadDto {
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

    private describeEstadoRevision(estado?: EstadoRevisionMes | null): string {
        switch (estado) {
            case EstadoRevisionMes.ENVIADO:
                return 'Pendiente de aprobación del gestor';
            case EstadoRevisionMes.APROBADO:
                return 'Mes aprobado por el gestor';
            case EstadoRevisionMes.CAMBIOS_SOLICITADOS:
                return 'El gestor solicitó ajustes en el mes';
            default:
                return 'Mes en edición';
        }
    }

    private mapEstadoRevision(estado?: EstadoRevisionMes | null): EstadoAprobacion {
        switch (estado) {
            case EstadoRevisionMes.ENVIADO:
                return EstadoAprobacion.EN_REVISION;
            case EstadoRevisionMes.APROBADO:
                return EstadoAprobacion.APROBADO;
            case EstadoRevisionMes.CAMBIOS_SOLICITADOS:
                return EstadoAprobacion.REABIERTO;
            default:
                return EstadoAprobacion.EN_PROGRESO;
        }
    }

    private mapUser(usuario?: User | null): TrabajoUserSummaryDto | null {
        if (!usuario) {
            return null;
        }

        return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.name,
        };
    }

    private applyEquipoVisibility(
        trabajos: Trabajo[],
        currentUser: CurrentUserPayload,
    ): Trabajo[] {
        if (currentUser.role !== UserRole.GESTOR || !currentUser.equipoId) {
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

    private getNombreMes(mesNumero: number): string {
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
}
