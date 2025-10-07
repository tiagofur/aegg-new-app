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

export enum EstadoMes {
    PENDIENTE = 'PENDIENTE',
    EN_PROCESO = 'EN_PROCESO',
    COMPLETADO = 'COMPLETADO',
}

@Entity('meses')
@Index(['trabajoId', 'mes'], { unique: true })
export class Mes {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    trabajoId: string;

    @Column('int')
    mes: number; // 1-12

    @Column({
        type: 'enum',
        enum: EstadoMes,
        default: EstadoMes.PENDIENTE,
    })
    estado: EstadoMes;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    // Relaciones
    @ManyToOne(() => Trabajo, (trabajo) => trabajo.meses, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trabajoId' })
    trabajo: Trabajo;

    @OneToMany(() => ReporteMensual, (reporte) => reporte.mes, {
        cascade: true,
        eager: false,
    })
    reportes: ReporteMensual[];
}
