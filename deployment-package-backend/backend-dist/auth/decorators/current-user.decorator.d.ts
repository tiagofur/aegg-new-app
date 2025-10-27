import { UserRole } from '../entities/user.entity';
export interface CurrentUserPayload {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    equipoId?: string | null;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
