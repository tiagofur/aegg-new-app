import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TrabajosModule } from './trabajos/trabajos.module';
import { UsersModule } from './users/users.module';
import { ClientesModule } from './clientes';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'appdb',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // ⚠️ Cambiar a false en producción
            logging: true,
        }),
        AuthModule,
        TrabajosModule,
        UsersModule,
        ClientesModule,
    ],
})
export class AppModule { }
