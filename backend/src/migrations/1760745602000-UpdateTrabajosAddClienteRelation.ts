import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTrabajosAddClienteRelation1760745602000 implements MigrationInterface {
    name = 'UpdateTrabajosAddClienteRelation1760745602000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "clienteId" uuid`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "miembroAsignadoId" uuid`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'trabajos_estado_aprobacion_enum'
                ) THEN
                    CREATE TYPE "public"."trabajos_estado_aprobacion_enum" AS ENUM('EN_PROGRESO','EN_REVISION','APROBADO','REABIERTO');
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "estado_aprobacion" "public"."trabajos_estado_aprobacion_enum" NOT NULL DEFAULT 'EN_PROGRESO'`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "fecha_aprobacion" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "aprobado_por_id" uuid`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "visibilidad_equipo" boolean NOT NULL DEFAULT true`);

        // Migrar valores existentes de usuarioAsignadoId a miembroAsignadoId
        await queryRunner.query(`UPDATE "trabajos" SET "miembroAsignadoId" = "usuarioAsignadoId" WHERE "usuarioAsignadoId" IS NOT NULL`);

        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "usuarioAsignadoId"`);

        await queryRunner.query(`CREATE INDEX "IDX_trabajos_cliente_anio" ON "trabajos" ("clienteId", "anio")`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_165096a68be634ca21347c5651"`);

        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_trabajos_cliente" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_trabajos_miembro" FOREIGN KEY ("miembroAsignadoId") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_trabajos_aprobador" FOREIGN KEY ("aprobado_por_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_trabajos_aprobador"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_trabajos_miembro"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_trabajos_cliente"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trabajos_cliente_anio"`);

        await queryRunner.query(`ALTER TABLE "trabajos" ADD "usuarioAsignadoId" uuid`);
        await queryRunner.query(`UPDATE "trabajos" SET "usuarioAsignadoId" = "miembroAsignadoId" WHERE "miembroAsignadoId" IS NOT NULL`);

        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "visibilidad_equipo"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "aprobado_por_id"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "fecha_aprobacion"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "estado_aprobacion"`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'trabajos_estado_aprobacion_enum'
                ) THEN
                    DROP TYPE "public"."trabajos_estado_aprobacion_enum";
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "miembroAsignadoId"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "clienteId"`);

        await queryRunner.query(`CREATE INDEX "IDX_165096a68be634ca21347c5651" ON "trabajos" ("clienteNombre", "anio")`);
    }
}
