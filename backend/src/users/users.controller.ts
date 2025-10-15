import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService, UserResponse } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(): Promise<UserResponse[]> {
        return this.usersService.findAll();
    }

    @Post()
    async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
        return this.usersService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any): Promise<UserResponse> {
        return this.usersService.update(id, dto, req?.user?.userId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any): Promise<{ success: true }> {
        await this.usersService.remove(id, req?.user?.userId);
        return { success: true };
    }
}
