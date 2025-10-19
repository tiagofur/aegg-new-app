import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ClientesService } from '../services/clientes.service';
import { CreateClienteDto, UpdateClienteDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GESTOR)
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Post()
    create(@Body() dto: CreateClienteDto, @Req() req: any) {
        const userId = req?.user?.userId;
        return this.clientesService.create(dto, userId);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('rfc') rfc?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNumber = page ? parseInt(page, 10) : undefined;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;

        return this.clientesService.findAll({
            search,
            rfc,
            page: pageNumber,
            limit: limitNumber,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clientesService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
        return this.clientesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clientesService.remove(id);
    }
}
