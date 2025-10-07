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
import { ReporteBaseAnual } from './reporte-base-anual.entity';
import { Mes } from './mes.entity';
import { ReporteAnual } from './reporte-anual.entity';

export enum EstadoTrabajo {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    COMPLETADO = 'COMPLETADO',
}

@Entity('trabajos')
// Unique constraint: un trabajo por cliente-año
@Index('IDX_165096a68be634ca21347c5651', ['clienteNombre', 'anio'], {
    unique: true,
})
export class Trabajo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clienteNombre: string;

    @Column({ length: 50, nullable: true })
    clienteRfc: string;

    @Column('int')
    anio: number;

    @Column()
    usuarioAsignadoId: string;

    @Column({
        type: 'enum',
        enum: EstadoTrabajo,
        default: EstadoTrabajo.ACTIVO,
    })
    estado: EstadoTrabajo;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;

    // Relaciones
    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'usuarioAsignadoId' })
    usuarioAsignado: User;

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
