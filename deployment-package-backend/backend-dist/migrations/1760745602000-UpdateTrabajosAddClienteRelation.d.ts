import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class UpdateTrabajosAddClienteRelation1760745602000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
