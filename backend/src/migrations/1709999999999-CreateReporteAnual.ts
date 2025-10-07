import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReporteAnual1709999999999 implements MigrationInterface {
    name = 'CreateReporteAnual1709999999999';

    public async up(queryRunner: QueryRunner): Promise<void> {
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

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_reporte_anual_trabajo_anio_mes" 
            ON "reportes_anuales" ("trabajo_id", "anio", "mes")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_reporte_anual_trabajo" 
            ON "reportes_anuales" ("trabajo_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_reporte_anual_anio" 
            ON "reportes_anuales" ("anio")
        `);

        await queryRunner.query(`
            ALTER TABLE "reportes_anuales" 
            ADD CONSTRAINT "FK_reportes_anuales_trabajo" 
            FOREIGN KEY ("trabajo_id") 
            REFERENCES "trabajos"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "reportes_anuales" 
            DROP CONSTRAINT "FK_reportes_anuales_trabajo"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_reporte_anual_anio"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_reporte_anual_trabajo"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_reporte_anual_trabajo_anio_mes"
        `);

        await queryRunner.query(`
            DROP TABLE "reportes_anuales"
        `);
    }
}
