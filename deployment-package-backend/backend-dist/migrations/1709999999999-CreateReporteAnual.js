"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReporteAnual1709999999999 = void 0;
class CreateReporteAnual1709999999999 {
    constructor() {
        this.name = 'CreateReporteAnual1709999999999';
    }
    async up(queryRunner) {
        const exists = await queryRunner.hasTable('reportes_anuales');
        if (!exists) {
            await queryRunner.query(`
                CREATE TABLE "reportes_anuales" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "trabajo_id" uuid NOT NULL,
                    "anio" integer NOT NULL,
                    "mes" integer NOT NULL,
                    "ventas" numeric(15,2),
                    "ventas_auxiliar" numeric(15,2),
                    "diferencia" numeric(15,2),
                    "confirmado" boolean NOT NULL DEFAULT false,
                    "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
                    "fecha_actualizacion" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_reportes_anuales" PRIMARY KEY ("id")
                )
            `);
        }
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reporte_anual_trabajo_anio_mes" 
            ON "reportes_anuales" ("trabajo_id", "anio", "mes")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_reporte_anual_trabajo" 
            ON "reportes_anuales" ("trabajo_id")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_reporte_anual_anio" 
            ON "reportes_anuales" ("anio")
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                ALTER TABLE "reportes_anuales"
                ADD CONSTRAINT "FK_reportes_anuales_trabajo"
                FOREIGN KEY ("trabajo_id")
                REFERENCES "trabajos"("id")
                ON DELETE CASCADE
                ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END
            $$;
        `);
    }
    async down(queryRunner) {
        const exists = await queryRunner.hasTable('reportes_anuales');
        if (exists) {
            await queryRunner.query(`
                ALTER TABLE "reportes_anuales" 
                DROP CONSTRAINT IF EXISTS "FK_reportes_anuales_trabajo"
            `);
            await queryRunner.query(`
                DROP INDEX IF EXISTS "IDX_reporte_anual_anio"
            `);
            await queryRunner.query(`
                DROP INDEX IF EXISTS "IDX_reporte_anual_trabajo"
            `);
            await queryRunner.query(`
                DROP INDEX IF EXISTS "IDX_reporte_anual_trabajo_anio_mes"
            `);
            await queryRunner.query(`
                DROP TABLE IF EXISTS "reportes_anuales"
            `);
        }
    }
}
exports.CreateReporteAnual1709999999999 = CreateReporteAnual1709999999999;
//# sourceMappingURL=1709999999999-CreateReporteAnual.js.map