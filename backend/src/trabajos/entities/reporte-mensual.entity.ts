import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Mes } from './mes.entity';

export enum TipoReporteMensual {
    INGRESOS = 'INGRESOS',
    INGRESOS_AUXILIAR = 'INGRESOS_AUXILIAR',
    INGRESOS_MI_ADMIN = 'INGRESOS_MI_ADMIN',
}

export enum EstadoReporte {
    SIN_IMPORTAR = 'SIN_IMPORTAR',
    IMPORTADO = 'IMPORTADO',
    PROCESADO = 'PROCESADO',
    ERROR = 'ERROR',
}

@Entity('reportes_mensuales')
@Index(['mesId', 'tipo'], { unique: true })
export class ReporteMensual {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    mesId: string;

    @Column({
        type: 'enum',
        enum: TipoReporteMensual,
    })
    tipo: TipoReporteMensual;

    @Column({ nullable: true })
    archivoOriginal: string;

    @Column('jsonb', { default: [] })
    datos: any[];

    @Column({
        type: 'enum',
        enum: EstadoReporte,
        default: EstadoReporte.SIN_IMPORTAR,
    })
    estado: EstadoReporte;

    @Column({ nullable: true })
    fechaImportacion: Date;

    @Column({ nullable: true })
    fechaProcesado: Date;

    @CreateDateColumn()
    fechaCreacion: Date;

    // Relación
    @ManyToOne(() => Mes, (mes) => mes.reportes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'mesId' })
    mes: Mes;
}
