"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserRole1712930400000 = void 0;
class AddUserRole1712930400000 {
    constructor() {
        this.name = 'AddUserRole1712930400000';
    }
    async up(queryRunner) {
        const hasRoleColumn = await queryRunner.hasColumn('users', 'role');
        if (!hasRoleColumn) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'
                    ) THEN
                        CREATE TYPE "public"."users_role_enum" AS ENUM('Admin','Gestor','Miembro');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                ALTER TABLE "users" ADD COLUMN "role" "public"."users_role_enum" NOT NULL DEFAULT 'Gestor'
            `);
            await queryRunner.query(`
                UPDATE "users" SET "role" = 'Admin' WHERE email = 'tiagofur@gmail.com'
            `);
        }
    }
    async down(queryRunner) {
        const hasRoleColumn = await queryRunner.hasColumn('users', 'role');
        if (hasRoleColumn) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'
                    ) THEN
                        DROP TYPE "public"."users_role_enum";
                    END IF;
                END
                $$;
            `);
        }
    }
}
exports.AddUserRole1712930400000 = AddUserRole1712930400000;
//# sourceMappingURL=1712930400000-AddUserRole.js.map