import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    canActivate(context: ExecutionContext) {
        this.logger.log('Checking JWT guard');
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
        if (err || !user) {
            const request = context.switchToHttp().getRequest();
            const authHeader = request?.headers?.authorization;
            this.logger.warn(
                `JWT guard rejected request. err=${err?.message ?? 'none'}, info=${info?.message ?? info}, header=${authHeader ?? 'missing'}`,
            );
        } else {
            this.logger.log(`JWT guard accepted user=${user.email ?? user.userId}`);
        }
        return super.handleRequest(err, user, info, context, status);
    }
}
