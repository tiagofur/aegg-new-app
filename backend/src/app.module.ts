import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TrabajosModule } from './trabajos/trabajos.module';
import { UsersModule } from './users/users.module';
import { ClientesModule } from './clientes';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USERNAME || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'appdb',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV !== 'production', // false en producción
            logging: process.env.NODE_ENV !== 'production',
        }),
        AuthModule,
        TrabajosModule,
        UsersModule,
        ClientesModule,
        KnowledgeBaseModule,
    ],
})
export class AppModule { }
