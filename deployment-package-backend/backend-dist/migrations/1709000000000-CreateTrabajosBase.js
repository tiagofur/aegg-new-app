"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTrabajosBase1709000000000 = void 0;
class CreateTrabajosBase1709000000000 {
    constructor() {
        this.name = 'CreateTrabajosBase1709000000000';
    }
    async up(queryRunner) {
        const trabajosExists = await queryRunner.hasTable('trabajos');
        if (!trabajosExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'trabajos_estado_enum'
                    ) THEN
                        CREATE TYPE "public"."trabajos_estado_enum" AS ENUM('ACTIVO','INACTIVO','COMPLETADO');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                CREATE TABLE "trabajos" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "clienteNombre" character varying,
                    "clienteRfc" character varying(50),
                    "anio" integer NOT NULL,
                    "usuarioAsignadoId" uuid,
                    "estado" "public"."trabajos_estado_enum" NOT NULL DEFAULT 'ACTIVO',
                    "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
                    "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_trabajos_id" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_165096a68be634ca21347c5651"
                ON "trabajos" ("clienteNombre", "anio")
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "trabajos"
                    ADD CONSTRAINT "FK_trabajos_usuario"
                    FOREIGN KEY ("usuarioAsignadoId")
                    REFERENCES "users"("id")
                    ON DELETE SET NULL
                    ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END
                $$;
            `);
        }
        const mesesExists = await queryRunner.hasTable('meses');
        if (!mesesExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'meses_estado_enum'
                    ) THEN
                        CREATE TYPE "public"."meses_estado_enum" AS ENUM('PENDIENTE','EN_PROCESO','COMPLETADO');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                CREATE TABLE "meses" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "trabajoId" uuid NOT NULL,
                    "mes" integer NOT NULL,
                    "estado" "public"."meses_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
                    "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
                    "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_meses_id" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_meses_trabajo_mes"
                ON "meses" ("trabajoId", "mes")
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "meses"
                    ADD CONSTRAINT "FK_meses_trabajo"
                    FOREIGN KEY ("trabajoId")
                    REFERENCES "trabajos"("id")
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END
                $$;
            `);
        }
        const reportesBaseExists = await queryRunner.hasTable('reportes_base_anual');
        if (!reportesBaseExists) {
            await queryRunner.query(`
                CREATE TABLE "reportes_base_anual" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "trabajoId" uuid NOT NULL,
                    "archivoUrl" character varying,
                    "mesesCompletados" integer[] NOT NULL DEFAULT '{}'::integer[],
                    "hojas" jsonb NOT NULL,
                    "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
                    "ultimaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_reportes_base_anual" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_reportes_base_trabajo" UNIQUE ("trabajoId")
                )
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "reportes_base_anual"
                    ADD CONSTRAINT "FK_reportes_base_trabajo"
                    FOREIGN KEY ("trabajoId")
                    REFERENCES "trabajos"("id")
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END
                $$;
            `);
        }
        const reportesMensualesExists = await queryRunner.hasTable('reportes_mensuales');
        if (!reportesMensualesExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'reportes_mensuales_tipo_enum'
                    ) THEN
                        CREATE TYPE "public"."reportes_mensuales_tipo_enum" AS ENUM('INGRESOS','INGRESOS_AUXILIAR','INGRESOS_MI_ADMIN');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'reportes_mensuales_estado_enum'
                    ) THEN
                        CREATE TYPE "public"."reportes_mensuales_estado_enum" AS ENUM('SIN_IMPORTAR','IMPORTADO','PROCESADO','ERROR');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                CREATE TABLE "reportes_mensuales" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "mesId" uuid NOT NULL,
                    "tipo" "public"."reportes_mensuales_tipo_enum" NOT NULL,
                    "archivoOriginal" character varying,
                    "datos" jsonb NOT NULL DEFAULT '[]'::jsonb,
                    "estado" "public"."reportes_mensuales_estado_enum" NOT NULL DEFAULT 'SIN_IMPORTAR',
                    "fechaImportacion" TIMESTAMP,
                    "fechaProcesado" TIMESTAMP,
                    "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_reportes_mensuales" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reportes_mensuales_mes_tipo"
                ON "reportes_mensuales" ("mesId", "tipo")
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "reportes_mensuales"
                    ADD CONSTRAINT "FK_reportes_mensuales_mes"
                    FOREIGN KEY ("mesId")
                    REFERENCES "meses"("id")
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END
                $$;
            `);
        }
    }
    async down(queryRunner) {
        const reportesMensualesExists = await queryRunner.hasTable('reportes_mensuales');
        if (reportesMensualesExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "reportes_mensuales"
                    DROP CONSTRAINT IF EXISTS "FK_reportes_mensuales_mes";
                END
                $$;
            `);
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reportes_mensuales_mes_tipo"`);
            await queryRunner.query(`DROP TABLE "reportes_mensuales"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."reportes_mensuales_estado_enum"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."reportes_mensuales_tipo_enum"`);
        }
        const reportesBaseExists = await queryRunner.hasTable('reportes_base_anual');
        if (reportesBaseExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "reportes_base_anual"
                    DROP CONSTRAINT IF EXISTS "FK_reportes_base_trabajo";
                END
                $$;
            `);
            await queryRunner.query(`DROP TABLE "reportes_base_anual"`);
        }
        const mesesExists = await queryRunner.hasTable('meses');
        if (mesesExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "meses"
                    DROP CONSTRAINT IF EXISTS "FK_meses_trabajo";
                END
                $$;
            `);
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_meses_trabajo_mes"`);
            await queryRunner.query(`DROP TABLE "meses"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."meses_estado_enum"`);
        }
        const trabajosExists = await queryRunner.hasTable('trabajos');
        if (trabajosExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    ALTER TABLE "trabajos"
                    DROP CONSTRAINT IF EXISTS "FK_trabajos_usuario";
                END
                $$;
            `);
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_165096a68be634ca21347c5651"`);
            await queryRunner.query(`DROP TABLE "trabajos"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."trabajos_estado_enum"`);
        }
    }
}
exports.CreateTrabajosBase1709000000000 = CreateTrabajosBase1709000000000;
//# sourceMappingURL=1709000000000-CreateTrabajosBase.js.map