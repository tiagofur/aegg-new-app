import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        xssFilter: true,
        noSniff: true,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));

    app.use(json({ limit: '1mb' }));
    app.use(urlencoded({ limit: '1mb', extended: true }));

    // CORS configuration - improved with environment variable support
    const devOrigins = (process.env.DEV_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000,http://localhost:3100').split(',');
    // Allow wildcard in production for now to fix issues, then restrict. Or better, explicitly list the domains.
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['https://aegg.creapolis.mx', 'https://aegg-api.creapolis.mx', 'http://localhost:3100'];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    });

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    const PORT = process.env.PORT || 3101;
    await app.listen(PORT);
    logger.log(`🚀 Backend running on http://localhost:${PORT}`);
}
bootstrap();
