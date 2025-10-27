"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMesRevisionWorkflow1766438400000 = void 0;
class AddMesRevisionWorkflow1766438400000 {
    constructor() {
        this.name = 'AddMesRevisionWorkflow1766438400000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."meses_estado_revision_enum" AS ENUM('EN_EDICION','ENVIADO','APROBADO','CAMBIOS_SOLICITADOS')`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "estado_revision" "public"."meses_estado_revision_enum" NOT NULL DEFAULT 'EN_EDICION'`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "enviado_revision_por_id" uuid`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "fecha_envio_revision" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "aprobado_por_id" uuid`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "fecha_aprobacion" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "meses" ADD "comentario_revision" text`);
        await queryRunner.query(`UPDATE "meses" SET "estado_revision" = 'EN_EDICION' WHERE "estado_revision" IS NULL`);
        await queryRunner.query(`ALTER TABLE "meses" ADD CONSTRAINT "FK_meses_enviado_revision_por" FOREIGN KEY ("enviado_revision_por_id") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "meses" ADD CONSTRAINT "FK_meses_aprobado_por" FOREIGN KEY ("aprobado_por_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meses" DROP CONSTRAINT "FK_meses_aprobado_por"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP CONSTRAINT "FK_meses_enviado_revision_por"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "comentario_revision"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "fecha_aprobacion"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "aprobado_por_id"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "fecha_envio_revision"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "enviado_revision_por_id"`);
        await queryRunner.query(`ALTER TABLE "meses" DROP COLUMN "estado_revision"`);
        await queryRunner.query(`DROP TYPE "public"."meses_estado_revision_enum"`);
    }
}
exports.AddMesRevisionWorkflow1766438400000 = AddMesRevisionWorkflow1766438400000;
//# sourceMappingURL=1766438400000-AddMesRevisionWorkflow.js.map