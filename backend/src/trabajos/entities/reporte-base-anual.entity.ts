import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Trabajo } from './trabajo.entity';

export interface HojaReporteBase {
    nombre: string;
    datos: any[];
}

@Entity('reportes_base_anual')
export class ReporteBaseAnual {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    trabajoId: string;

    @Column({ nullable: true })
    archivoUrl: string;

    @Column('int', { array: true, default: [] })
    mesesCompletados: number[];

    @Column('jsonb')
    hojas: HojaReporteBase[];

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    ultimaActualizacion: Date;

    // Relación
    @OneToOne(() => Trabajo, (trabajo) => trabajo.reporteBaseAnual, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trabajoId' })
    trabajo: Trabajo;
}
