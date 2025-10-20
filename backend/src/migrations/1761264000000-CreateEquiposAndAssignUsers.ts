import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquiposAndAssignUsers1761264000000 implements MigrationInterface {
    name = 'CreateEquiposAndAssignUsers1761264000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasEquipos = await queryRunner.hasTable('equipos');

        if (!hasEquipos) {
            await queryRunner.query(`
                CREATE TABLE "equipos" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "nombre" character varying(120) NOT NULL,
                    "activo" boolean NOT NULL DEFAULT true,
                    "gestor_id" uuid,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_equipos_id" PRIMARY KEY ("id")
                )
            `);
        }

        const hasEquipoColumn = await queryRunner.hasColumn('users', 'equipo_id');
        if (!hasEquipoColumn) {
            await queryRunner.query(`ALTER TABLE "users" ADD "equipo_id" uuid`);
        }

        await queryRunner.query(`
            DO $$
            BEGIN
                ALTER TABLE "users"
                ADD CONSTRAINT "FK_users_equipo"
                FOREIGN KEY ("equipo_id")
                REFERENCES "equipos"("id")
                ON DELETE SET NULL
                ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                ALTER TABLE "users"
                DROP CONSTRAINT IF EXISTS "FK_users_equipo";
            END
            $$;
        `);

        const hasEquipoColumn = await queryRunner.hasColumn('users', 'equipo_id');
        if (hasEquipoColumn) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "equipo_id"`);
        }

        const hasEquipos = await queryRunner.hasTable('equipos');
        if (hasEquipos) {
            await queryRunner.query(`DROP TABLE "equipos"`);
        }
    }
}
