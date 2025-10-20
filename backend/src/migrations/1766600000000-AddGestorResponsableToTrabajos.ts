import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGestorResponsableToTrabajos1766600000000 implements MigrationInterface {
    name = 'AddGestorResponsableToTrabajos1766600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "gestor_responsable_id" uuid`);
        await queryRunner.query(`UPDATE "trabajos" SET "gestor_responsable_id" = COALESCE("aprobado_por_id", "miembroAsignadoId") WHERE "gestor_responsable_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_trabajos_gestor_responsable" FOREIGN KEY ("gestor_responsable_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_trabajos_gestor_responsable"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "gestor_responsable_id"`);
    }
}
