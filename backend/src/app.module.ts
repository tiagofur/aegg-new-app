import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
            skipIf: () => process.env.NODE_ENV === 'development',
        }]),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            username: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'appdb',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV !== 'production',
            extra: {
                max: process.env.NODE_ENV === 'production' ? 20 : 5,
                min: process.env.NODE_ENV === 'production' ? 5 : 2,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            },
        }),
        AuthModule,
        TrabajosModule,
        UsersModule,
        ClientesModule,
        KnowledgeBaseModule,
    ],
})
export class AppModule { }
