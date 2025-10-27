import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddMesRevisionWorkflow1766438400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
