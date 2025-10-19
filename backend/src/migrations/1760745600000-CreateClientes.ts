import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientes1760745600000 implements MigrationInterface {
    name = 'CreateClientes1760745600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "clientes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying(150) NOT NULL,
                "rfc" character varying(13) NOT NULL,
                "razon_social" character varying(200),
                "direccion" jsonb,
                "contacto_principal" jsonb,
                "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "created_by" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_clientes_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(
            `CREATE INDEX "IDX_clientes_nombre" ON "clientes" ("nombre")`
        );

        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_clientes_rfc" ON "clientes" ("rfc")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_clientes_rfc"`);
        await queryRunner.query(`DROP INDEX "IDX_clientes_nombre"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
    }
}
