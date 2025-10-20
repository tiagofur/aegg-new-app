import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Mes,
    ReporteMensual,
    Trabajo,
    TipoReporteMensual,
    EstadoMes,
    ReporteBaseAnual,
    EstadoRevisionMes,
    EstadoAprobacion,
} from '../entities';
import { CreateMesDto } from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class MesesService {
    constructor(
        @InjectRepository(Mes)
        private mesRepository: Repository<Mes>,
        @InjectRepository(ReporteMensual)
        private reporteMensualRepository: Repository<ReporteMensual>,
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
        @InjectRepository(ReporteBaseAnual)
        private reporteBaseRepository: Repository<ReporteBaseAnual>,
    ) { }

    async create(createMesDto: CreateMesDto): Promise<Mes> {
        // Verificar que el trabajo existe
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: createMesDto.trabajoId },
        });

        if (!trabajo) {
            throw new NotFoundException(
                `Trabajo con id ${createMesDto.trabajoId} no encontrado`,
            );
        }

        // Verificar que no exista ya ese mes
        const existe = await this.mesRepository.findOne({
            where: {
                trabajoId: createMesDto.trabajoId,
                mes: createMesDto.mes,
            },
        });

        if (existe) {
            throw new ConflictException(
                `El mes ${createMesDto.mes} ya existe para este trabajo`,
            );
        }

        // Crear mes
        const mes = this.mesRepository.create(createMesDto);
        const mesGuardado = await this.mesRepository.save(mes);

        // Crear los 3 reportes mensuales vacíos
        const reportes = [
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: TipoReporteMensual.INGRESOS,
                datos: [],
            }),
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: TipoReporteMensual.INGRESOS_AUXILIAR,
                datos: [],
            }),
            this.reporteMensualRepository.create({
                mesId: mesGuardado.id,
                tipo: TipoReporteMensual.INGRESOS_MI_ADMIN,
                datos: [],
            }),
        ];

        await this.reporteMensualRepository.save(reportes);

        await this.actualizarEstadoAprobacionTrabajo(createMesDto.trabajoId);

        // Retornar mes con reportes
        return this.findOne(mesGuardado.id);
    }

    async findByTrabajo(trabajoId: string): Promise<Mes[]> {
        return this.mesRepository.find({
            where: { trabajoId },
            relations: ['reportes', 'enviadoRevisionPor', 'aprobadoPor'],
            order: {
                mes: 'ASC',
            },
        });
    }

    async findOne(id: string): Promise<Mes> {
        const mes = await this.mesRepository.findOne({
            where: { id },
            relations: ['reportes', 'trabajo', 'trabajo.miembroAsignado', 'enviadoRevisionPor', 'aprobadoPor'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${id} no encontrado`);
        }

        return mes;
    }

    async remove(id: string): Promise<void> {
        const mes = await this.findOne(id);

        // Si el mes está completado, actualizar el reporteBaseAnual
        if (mes.estado === EstadoMes.COMPLETADO) {
            await this.revertirReporteBase(mes);
        }

        await this.mesRepository.remove(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);
    }

    async reabrirMes(id: string): Promise<Mes> {
        const mes = await this.findOne(id);

        // Verificar que el mes esté completado
        if (mes.estado !== EstadoMes.COMPLETADO) {
            throw new ConflictException(
                `El mes ${mes.mes} no está completado, no se puede reabrir`,
            );
        }

        // Cambiar estado a EN_PROCESO y limpiar flujo de revisión
        mes.estado = EstadoMes.EN_PROCESO;
        mes.estadoRevision = EstadoRevisionMes.EN_EDICION;
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

    async enviarRevision(
        id: string,
        currentUser: CurrentUserPayload,
        comentario?: string,
    ): Promise<Mes> {
        const mes = await this.findOne(id);
        this.assertPuedeSolicitarRevision(mes, currentUser);

        if (mes.estado !== EstadoMes.COMPLETADO) {
            throw new ConflictException(
                'Debes procesar el mes antes de enviarlo a revisión.',
            );
        }

        if (mes.estadoRevision === EstadoRevisionMes.ENVIADO) {
            throw new ConflictException('El mes ya está en revisión.');
        }

        if (mes.estadoRevision === EstadoRevisionMes.APROBADO) {
            throw new ConflictException('El mes ya fue aprobado.');
        }

        mes.estadoRevision = EstadoRevisionMes.ENVIADO;
        mes.enviadoRevisionPorId = currentUser.userId;
        mes.fechaEnvioRevision = new Date();
        if (comentario) {
            mes.comentarioRevision = comentario;
        }

        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);

        return this.findOne(id);
    }

    async marcarComoCompletado(
        id: string,
        currentUser: CurrentUserPayload,
    ): Promise<Mes> {
        const mes = await this.findOne(id);
        this.assertPuedeSolicitarRevision(mes, currentUser);

        if (mes.estadoRevision === EstadoRevisionMes.ENVIADO) {
            throw new ConflictException(
                'El mes está en revisión; espera la respuesta del gestor antes de modificarlo.',
            );
        }

        if (mes.estadoRevision === EstadoRevisionMes.APROBADO) {
            throw new ConflictException('El mes ya fue aprobado.');
        }

        if (mes.estado === EstadoMes.COMPLETADO) {
            return mes;
        }

        mes.estado = EstadoMes.COMPLETADO;
        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);

        return this.findOne(id);
    }

    async aprobarMes(id: string, currentUser: CurrentUserPayload): Promise<Mes> {
        this.assertPuedeRevisar(currentUser);
        const mes = await this.findOne(id);

        if (mes.estadoRevision !== EstadoRevisionMes.ENVIADO) {
            throw new ConflictException('Solo puedes aprobar meses enviados a revisión.');
        }

        mes.estadoRevision = EstadoRevisionMes.APROBADO;
        mes.aprobadoPorId = currentUser.userId;
        mes.fechaAprobacion = new Date();
        mes.comentarioRevision = null;

        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);

        return this.findOne(id);
    }

    async solicitarCambios(
        id: string,
        currentUser: CurrentUserPayload,
        comentario?: string,
    ): Promise<Mes> {
        this.assertPuedeRevisar(currentUser);
        const mes = await this.findOne(id);

        if (mes.estadoRevision !== EstadoRevisionMes.ENVIADO) {
            throw new ConflictException('Solo puedes solicitar cambios para meses en revisión.');
        }

        if (!comentario || comentario.trim().length === 0) {
            throw new BadRequestException('Debes incluir un comentario para solicitar cambios.');
        }

        // Si el mes ya estaba completado, regresarlo a EN_PROCESO para permitir ajustes
        if (mes.estado === EstadoMes.COMPLETADO) {
            mes.estado = EstadoMes.EN_PROCESO;
            await this.revertirReporteBase(mes);
        }

        mes.estadoRevision = EstadoRevisionMes.CAMBIOS_SOLICITADOS;
        mes.aprobadoPorId = null;
        mes.fechaAprobacion = null;
        mes.comentarioRevision = comentario.trim();

        await this.mesRepository.save(mes);
        await this.actualizarEstadoAprobacionTrabajo(mes.trabajoId);

        return this.findOne(id);
    }

    private assertPuedeSolicitarRevision(mes: Mes, currentUser: CurrentUserPayload) {
        if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.GESTOR) {
            return;
        }

        if (
            currentUser.role === UserRole.MIEMBRO &&
            mes.trabajo?.miembroAsignadoId === currentUser.userId
        ) {
            return;
        }

        throw new ForbiddenException('No tienes permisos para enviar este mes a revisión.');
    }

    private assertPuedeRevisar(currentUser: CurrentUserPayload) {
        if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.GESTOR) {
            return;
        }
        throw new ForbiddenException('No tienes permisos para aprobar o rechazar meses.');
    }

    private async revertirReporteBase(mes: Mes): Promise<void> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: mes.trabajoId },
            relations: ['reporteBaseAnual'],
        });

        if (trabajo?.reporteBaseAnual) {
            const mesesCompletados = trabajo.reporteBaseAnual.mesesCompletados.filter(
                (m) => m !== mes.mes,
            );
            trabajo.reporteBaseAnual.mesesCompletados = mesesCompletados;
            await this.reporteBaseRepository.save(trabajo.reporteBaseAnual);
        }
    }

    private async actualizarEstadoAprobacionTrabajo(trabajoId: string): Promise<void> {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
            relations: ['meses'],
        });

        if (!trabajo) {
            return;
        }

        const meses = trabajo.meses ?? [];
        const hayEnRevision = meses.some((m) => m.estadoRevision === EstadoRevisionMes.ENVIADO);
        const hayCambios = meses.some((m) => m.estadoRevision === EstadoRevisionMes.CAMBIOS_SOLICITADOS);
        const todosAprobados = meses.length > 0 && meses.every((m) => m.estadoRevision === EstadoRevisionMes.APROBADO);

        if (hayEnRevision) {
            trabajo.estadoAprobacion = EstadoAprobacion.EN_REVISION;
        } else if (hayCambios) {
            trabajo.estadoAprobacion = EstadoAprobacion.REABIERTO;
        } else if (todosAprobados) {
            trabajo.estadoAprobacion = EstadoAprobacion.APROBADO;
        } else {
            trabajo.estadoAprobacion = EstadoAprobacion.EN_PROGRESO;
        }

        await this.trabajoRepository.save(trabajo);
    }
}
