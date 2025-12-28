import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Trabajo } from './trabajo.entity';
import { ReporteMensual } from './reporte-mensual.entity';
import { User } from '../../auth/entities/user.entity';

export enum EstadoMes {
    PENDIENTE = 'PENDIENTE',
    EN_PROCESO = 'EN_PROCESO',
    COMPLETADO = 'COMPLETADO',
}

export enum EstadoRevisionMes {
    EN_EDICION = 'EN_EDICION',
    ENVIADO = 'ENVIADO',
    APROBADO = 'APROBADO',
    CAMBIOS_SOLICITADOS = 'CAMBIOS_SOLICITADOS',
}

@Entity('meses')
@Index(['trabajoId', 'mes'], { unique: true })
export class Mes {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    trabajoId!: string;

    @Column('int')
    mes!: number; // 1-12

    @Column({
        type: 'enum',
        enum: EstadoMes,
        default: EstadoMes.PENDIENTE,
    })
    estado!: EstadoMes;

    @Column({
        type: 'enum',
        enum: EstadoRevisionMes,
        name: 'estado_revision',
        default: EstadoRevisionMes.EN_EDICION,
    })
    estadoRevision!: EstadoRevisionMes;

    @Column({ name: 'enviado_revision_por_id', type: 'uuid', nullable: true })
    enviadoRevisionPorId?: string | null;

    @Column({ name: 'fecha_envio_revision', type: 'timestamp', nullable: true })
    fechaEnvioRevision?: Date | null;

    @Column({ name: 'aprobado_por_id', type: 'uuid', nullable: true })
    aprobadoPorId?: string | null;

    @Column({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true })
    fechaAprobacion?: Date | null;

    @Column({ name: 'comentario_revision', type: 'text', nullable: true })
    comentarioRevision?: string | null;

    @CreateDateColumn()
    fechaCreacion!: Date;

    @UpdateDateColumn()
    fechaActualizacion!: Date;

    // Relaciones
    @ManyToOne(() => Trabajo, (trabajo) => trabajo.meses, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trabajoId' })
    trabajo!: Trabajo;

    @OneToMany(() => ReporteMensual, (reporte) => reporte.mes, {
        cascade: true,
        eager: false,
    })
    reportes!: ReporteMensual[];

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'enviado_revision_por_id' })
    enviadoRevisionPor?: User | null;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'aprobado_por_id' })
    aprobadoPor?: User | null;
}
