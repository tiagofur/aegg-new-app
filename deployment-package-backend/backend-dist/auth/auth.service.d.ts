import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './entities/user.entity';
import { Equipo } from './entities/equipo.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private userRepository;
    private equipoRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, equipoRepository: Repository<Equipo>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            equipoId: string;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            equipoId: string;
        };
        token: string;
    }>;
    private generateToken;
    private buildAuthUser;
    validateUser(userId: string): Promise<User>;
}
