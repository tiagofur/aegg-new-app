"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClientes1760745600000 = void 0;
class CreateClientes1760745600000 {
    constructor() {
        this.name = 'CreateClientes1760745600000';
    }
    async up(queryRunner) {
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
        await queryRunner.query(`CREATE INDEX "IDX_clientes_nombre" ON "clientes" ("nombre")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_clientes_rfc" ON "clientes" ("rfc")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_clientes_rfc"`);
        await queryRunner.query(`DROP INDEX "IDX_clientes_nombre"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
    }
}
exports.CreateClientes1760745600000 = CreateClientes1760745600000;
//# sourceMappingURL=1760745600000-CreateClientes.js.map