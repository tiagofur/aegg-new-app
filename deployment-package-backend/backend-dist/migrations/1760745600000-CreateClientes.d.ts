import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateClientes1760745600000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
