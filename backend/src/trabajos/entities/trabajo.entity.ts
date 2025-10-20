import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Cliente } from '../../clientes/entities';
import { ReporteBaseAnual } from './reporte-base-anual.entity';
import { Mes } from './mes.entity';
import { ReporteAnual } from './reporte-anual.entity';

export enum EstadoTrabajo {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    COMPLETADO = 'COMPLETADO',
}

export enum EstadoAprobacion {
    EN_PROGRESO = 'EN_PROGRESO',
    EN_REVISION = 'EN_REVISION',
    APROBADO = 'APROBADO',
    REABIERTO = 'REABIERTO',
}

@Entity('trabajos')
// Unique constraint: un trabajo por cliente-año (nueva relación)
@Index('IDX_trabajos_cliente_anio', ['clienteId', 'anio'], { unique: true })
export class Trabajo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    clienteNombre: string;

    @Column({ length: 50, nullable: true })
    clienteRfc: string;

    @Column('int')
    anio: number;

    @Column({ name: 'clienteId', type: 'uuid', nullable: true })
    clienteId: string | null;

    @Column({ name: 'miembroAsignadoId', type: 'uuid', nullable: true })
    miembroAsignadoId: string | null;

    @Column({ name: 'gestor_responsable_id', type: 'uuid', nullable: true })
    gestorResponsableId: string | null;

    @Column({
        type: 'enum',
        enum: EstadoTrabajo,
        default: EstadoTrabajo.ACTIVO,
    })
    estado: EstadoTrabajo;

    @Column({
        type: 'enum',
        enum: EstadoAprobacion,
        name: 'estado_aprobacion',
        default: EstadoAprobacion.EN_PROGRESO,
    })
    estadoAprobacion: EstadoAprobacion;

    @Column({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true })
    fechaAprobacion?: Date | null;

    @Column({ name: 'aprobado_por_id', type: 'uuid', nullable: true })
    aprobadoPorId?: string | null;

    @Column({ name: 'visibilidad_equipo', type: 'boolean', default: true })
    visibilidadEquipo: boolean;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    // Relaciones
    @ManyToOne(() => Cliente, { eager: false })
    @JoinColumn({ name: 'clienteId' })
    cliente?: Cliente | null;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'miembroAsignadoId' })
    miembroAsignado?: User | null;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'gestor_responsable_id' })
    gestorResponsable?: User | null;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'aprobado_por_id' })
    aprobadoPor?: User | null;

    @OneToOne(() => ReporteBaseAnual, (reporte) => reporte.trabajo, {
        cascade: true,
        eager: false,
    })
    reporteBaseAnual: ReporteBaseAnual;

    @OneToMany(() => Mes, (mes) => mes.trabajo, {
        cascade: true,
        eager: false,
    })
    meses: Mes[];

    @OneToMany(() => ReporteAnual, (reporte) => reporte.trabajo, {
        cascade: true,
        eager: false,
    })
    reportesAnuales: ReporteAnual[];
}
