import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Equipo } from './equipo.entity';

export enum UserRole {
    ADMIN = 'Admin',
    GESTOR = 'Gestor',
    MIEMBRO = 'Miembro',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.GESTOR,
    })
    role: UserRole;

    @Column({ name: 'equipo_id', type: 'uuid', nullable: true })
    equipoId?: string | null;

    @ManyToOne(() => Equipo, (equipo) => equipo.miembros, { nullable: true })
    @JoinColumn({ name: 'equipo_id' })
    equipo?: Equipo | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
