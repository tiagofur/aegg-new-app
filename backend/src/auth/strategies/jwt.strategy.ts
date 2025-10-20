import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(private authService: AuthService, private configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        this.logger.log(`Validating JWT for sub=${payload.sub}`);
        const user = await this.authService.validateUser(payload.sub);
        if (!user) {
            this.logger.warn(`User not found for sub=${payload.sub}`);
            throw new UnauthorizedException();
        }
        // Retornar el objeto con userId para usar en los controladores
        this.logger.log(`JWT validated for user=${user.email}`);
        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            equipoId: user.equipoId ?? null,
        };
    }
}
