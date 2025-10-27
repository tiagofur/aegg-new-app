import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(json({ limit: '25mb' }));
    app.use(urlencoded({ limit: '25mb', extended: true }));

    // CORS configuration - includes production domains
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? ['https://aegg.creapolis.mx']
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    await app.listen(3000);
    console.log('🚀 Backend running on http://localhost:3000');
}
bootstrap();
