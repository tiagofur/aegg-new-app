import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Trabajo } from './trabajo.entity';

export enum MesEnum {
    ENERO = 1,
    FEBRERO = 2,
    MARZO = 3,
    ABRIL = 4,
    MAYO = 5,
    JUNIO = 6,
    JULIO = 7,
    AGOSTO = 8,
    SEPTIEMBRE = 9,
    OCTUBRE = 10,
    NOVIEMBRE = 11,
    DICIEMBRE = 12,
}

@Entity('reportes_anuales')
@Index(['trabajoId', 'anio', 'mes'], { unique: true })
@Index(['trabajoId'])
@Index(['anio'])
export class ReporteAnual {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'trabajo_id' })
    trabajoId!: string;

    @ManyToOne(() => Trabajo, (trabajo) => trabajo.reportesAnuales, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trabajo_id' })
    trabajo!: Trabajo;

    @Column({ type: 'int' })
    anio!: number;

    @Column({ type: 'int' })
    mes!: number;

    @Column({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'ventas',
    })
    ventas!: number | null;

    @Column({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'ventas_auxiliar',
    })
    ventasAuxiliar!: number | null;

    @Column({
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
        name: 'diferencia',
    })
    diferencia!: number | null;

    @Column({ type: 'boolean', default: false })
    confirmado!: boolean;

    @CreateDateColumn({ name: 'fecha_creacion' })
    fechaCreacion!: Date;

    @UpdateDateColumn({ name: 'fecha_actualizacion' })
    fechaActualizacion!: Date;
}
