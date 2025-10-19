import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
@Index('IDX_clientes_nombre', ['nombre'])
@Index('IDX_clientes_rfc', ['rfc'], { unique: true })
export class Cliente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 150 })
    nombre: string;

    @Column({ length: 13 })
    rfc: string;

    @Column({ name: 'razon_social', length: 200, nullable: true })
    razonSocial?: string | null;

    @Column({ type: 'jsonb', nullable: true })
    direccion?: Record<string, unknown> | null;

    @Column({ name: 'contacto_principal', type: 'jsonb', nullable: true })
    contactoPrincipal?: Record<string, unknown> | null;

    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    metadata: Record<string, unknown>;

    @Column({ name: 'created_by', type: 'uuid', nullable: true })
    createdBy?: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    normalizeFields(): void {
        if (this.nombre) {
            this.nombre = this.nombre.trim();
        }

        if (this.rfc) {
            this.rfc = this.rfc.trim().toUpperCase();
        }

        if (this.razonSocial) {
            this.razonSocial = this.razonSocial.trim();
        }
    }
}
