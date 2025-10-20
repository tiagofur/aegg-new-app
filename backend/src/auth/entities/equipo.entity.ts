import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('equipos')
export class Equipo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 120 })
    nombre: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ name: 'gestor_id', type: 'uuid', nullable: true })
    gestorId?: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => User, (user) => user.equipo)
    miembros: User[];
}
