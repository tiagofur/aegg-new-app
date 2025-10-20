import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
    Trabajo,
    EstadoAprobacion,
    EstadoMes,
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
            ],
            order: {
                fechaActualizacion: 'DESC',
            },
        });

        const visibles = this.applyEquipoVisibility(trabajos, currentUser);

        const resumenEstados = this.buildResumen(visibles);
        const filtrados = this.applyFilters(visibles, filters);

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

    private buildResumen(trabajos: Trabajo[]): Record<EstadoAprobacion, number> {
        const resumen: Record<EstadoAprobacion, number> = {
            [EstadoAprobacion.EN_PROGRESO]: 0,
            [EstadoAprobacion.EN_REVISION]: 0,
            [EstadoAprobacion.APROBADO]: 0,
            [EstadoAprobacion.REABIERTO]: 0,
        };

        for (const trabajo of trabajos) {
            resumen[trabajo.estadoAprobacion] = (resumen[trabajo.estadoAprobacion] ?? 0) + 1;
        }

        return resumen;
    }

    private applyFilters(
        trabajos: Trabajo[],
        filters?: AprobacionesDashboardQueryDto,
    ): Trabajo[] {
        if (!filters) {
            return trabajos;
        }

        let resultado = [...trabajos];

        if (filters.estado) {
            resultado = resultado.filter((trabajo) => trabajo.estadoAprobacion === filters.estado);
        }

        if (filters.search) {
            const termino = filters.search.trim().toLowerCase();
            resultado = resultado.filter((trabajo) => {
                const nombreCliente = (trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? '').toLowerCase();
                const miembro = (trabajo.miembroAsignado?.name ?? trabajo.miembroAsignado?.email ?? '').toLowerCase();
                const anio = trabajo.anio.toString();
                return (
                    nombreCliente.includes(termino) ||
                    miembro.includes(termino) ||
                    anio.includes(termino)
                );
            });
        }

        if (filters.equipoId) {
            resultado = resultado.filter((trabajo) => {
                const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
                return miembroEquipoId === filters.equipoId;
            });
        }

        return resultado;
    }

    private buildPendientes(trabajos: Trabajo[]): AprobacionTrabajoResumenDto[] {
        return trabajos
            .filter((trabajo) =>
                trabajo.estadoAprobacion === EstadoAprobacion.EN_REVISION ||
                trabajo.estadoAprobacion === EstadoAprobacion.REABIERTO,
            )
            .sort((a, b) => b.fechaActualizacion.getTime() - a.fechaActualizacion.getTime())
            .slice(0, 25)
            .map((trabajo) => this.mapTrabajoResumen(trabajo));
    }

    private buildRecientes(trabajos: Trabajo[]): AprobacionActividadDto[] {
        return [...trabajos]
            .sort((a, b) => b.fechaActualizacion.getTime() - a.fechaActualizacion.getTime())
            .slice(0, 10)
            .map((trabajo) => this.mapActividad(trabajo));
    }

    private mapTrabajoResumen(trabajo: Trabajo): AprobacionTrabajoResumenDto {
        const meses = trabajo.meses ?? [];
        const completados = meses.filter((mes) => mes.estado === EstadoMes.COMPLETADO).length;

        return {
            id: trabajo.id,
            clienteNombre: trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? 'Cliente sin nombre',
            anio: trabajo.anio,
            estadoAprobacion: trabajo.estadoAprobacion,
            fechaActualizacion: trabajo.fechaActualizacion.toISOString(),
            miembroAsignado: this.mapUser(trabajo.miembroAsignado),
            aprobadoPor: this.mapUser(trabajo.aprobadoPor),
            totalMeses: meses.length,
            mesesCompletados: completados,
        };
    }

    private mapActividad(trabajo: Trabajo): AprobacionActividadDto {
        const clienteNombre = trabajo.cliente?.nombre ?? trabajo.clienteNombre ?? 'Cliente sin nombre';
        return {
            trabajoId: trabajo.id,
            titulo: `${clienteNombre} · ${trabajo.anio}`,
            descripcion: this.describeEstado(trabajo.estadoAprobacion),
            fecha: trabajo.fechaActualizacion.toISOString(),
            estadoAprobacion: trabajo.estadoAprobacion,
        };
    }

    private describeEstado(estado: EstadoAprobacion): string {
        switch (estado) {
            case EstadoAprobacion.EN_REVISION:
                return 'Pendiente de aprobación';
            case EstadoAprobacion.APROBADO:
                return 'Trabajo aprobado';
            case EstadoAprobacion.REABIERTO:
                return 'Trabajo reabierto por el gestor';
            default:
                return 'Trabajo en progreso';
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
}
