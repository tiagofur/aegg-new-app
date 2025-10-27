import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    private configService;
    private readonly logger;
    constructor(authService: AuthService, configService: ConfigService);
    validate(payload: any): Promise<{
        userId: string;
        email: string;
        name: string;
        role: import("../entities/user.entity").UserRole;
        equipoId: string;
    }>;
}
export {};
