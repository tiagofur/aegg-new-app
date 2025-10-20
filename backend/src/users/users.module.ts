import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Equipo } from '../auth/entities/equipo.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
    imports: [TypeOrmModule.forFeature([User, Equipo])],
    providers: [UsersService, RolesGuard],
    controllers: [UsersController],
})
export class UsersModule { }
