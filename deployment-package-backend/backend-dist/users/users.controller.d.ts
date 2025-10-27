import { UsersService, UserResponse } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<UserResponse[]>;
    create(dto: CreateUserDto): Promise<UserResponse>;
    update(id: string, dto: UpdateUserDto, req: any): Promise<UserResponse>;
    remove(id: string, req: any): Promise<{
        success: true;
    }>;
}
