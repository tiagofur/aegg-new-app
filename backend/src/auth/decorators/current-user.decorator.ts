import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export interface CurrentUserPayload {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    equipoId?: string | null;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as CurrentUserPayload;
    },
);
