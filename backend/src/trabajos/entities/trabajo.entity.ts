import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Reporte } from './reporte.entity';

@Entity('trabajos')
export class Trabajo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column({ type: 'date' })
    mes: Date;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'usuario_id' })
    usuario: User;

    @Column({ name: 'usuario_id' })
    usuarioId: string;

    @OneToMany(() => Reporte, (reporte) => reporte.trabajo, {
        cascade: true,
        eager: false,
    })
    reportes: Reporte[];

    @Column({ type: 'varchar', default: 'activo' })
    estado: string; // 'activo', 'archivado', 'completado'

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
