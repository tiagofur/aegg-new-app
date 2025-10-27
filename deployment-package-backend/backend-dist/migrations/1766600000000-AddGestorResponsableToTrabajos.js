"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGestorResponsableToTrabajos1766600000000 = void 0;
class AddGestorResponsableToTrabajos1766600000000 {
    constructor() {
        this.name = 'AddGestorResponsableToTrabajos1766600000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "trabajos" ADD "gestor_responsable_id" uuid`);
        await queryRunner.query(`UPDATE "trabajos" SET "gestor_responsable_id" = COALESCE("aprobado_por_id", "miembroAsignadoId") WHERE "gestor_responsable_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_trabajos_gestor_responsable" FOREIGN KEY ("gestor_responsable_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_trabajos_gestor_responsable"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "gestor_responsable_id"`);
    }
}
exports.AddGestorResponsableToTrabajos1766600000000 = AddGestorResponsableToTrabajos1766600000000;
//# sourceMappingURL=1766600000000-AddGestorResponsableToTrabajos.js.map