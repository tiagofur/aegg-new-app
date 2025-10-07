import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mes, ReporteMensual, Trabajo, TipoReporteMensual } from '../entities';
import { CreateMesDto } from '../dto';

@Injectable()
export class MesesService {
    constructor(
        @InjectRepository(Mes)
        private mesRepository: Repository<Mes>,
        @InjectRepository(ReporteMensual)
        private reporteMensualRepository: Repository<ReporteMensual>,
        @InjectRepository(Trabajo)
        private trabajoRepository: Repository<Trabajo>,
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

        // Retornar mes con reportes
        return this.findOne(mesGuardado.id);
    }

    async findByTrabajo(trabajoId: string): Promise<Mes[]> {
        return this.mesRepository.find({
            where: { trabajoId },
            relations: ['reportes'],
            order: {
                mes: 'ASC',
            },
        });
    }

    async findOne(id: string): Promise<Mes> {
        const mes = await this.mesRepository.findOne({
            where: { id },
            relations: ['reportes', 'trabajo'],
        });

        if (!mes) {
            throw new NotFoundException(`Mes con id ${id} no encontrado`);
        }

        return mes;
    }

    async remove(id: string): Promise<void> {
        const mes = await this.findOne(id);
        await this.mesRepository.remove(mes);
    }
}
