import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1712930400000 implements MigrationInterface {
    name = 'AddUserRole1712930400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
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
