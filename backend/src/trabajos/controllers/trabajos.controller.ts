import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrabajosService } from '../services/trabajos.service';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrentUser, CurrentUserPayload } from '../../auth/decorators/current-user.decorator';

@Controller('trabajos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajosController {
    constructor(private readonly trabajosService: TrabajosService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    create(
        @Body() createTrabajoDto: CreateTrabajoDto,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.trabajosService.create(createTrabajoDto, currentUser);
    }

    @Get()
    findAll(
        @CurrentUser() currentUser: CurrentUserPayload,
        @Query('miembroId') miembroId?: string,
        @Query('usuarioId') usuarioIdLegacy?: string,
    ) {
        const filtro = miembroId ?? usuarioIdLegacy;
        return this.trabajosService.findAll(currentUser, filtro);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.trabajosService.findOne(id, currentUser);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    update(
        @Param('id') id: string,
        @Body() updateTrabajoDto: UpdateTrabajoDto,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.trabajosService.update(id, updateTrabajoDto, currentUser);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    remove(
        @Param('id') id: string,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.trabajosService.remove(id, currentUser);
    }

    @Post(':id/reporte-base/importar')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    @UseInterceptors(FileInterceptor('file'))
    async importarReporteBase(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        return this.trabajosService.importarReporteBase(id, file.buffer, currentUser);
    }

    @Post(':id/reporte-base/actualizar-ventas-mes')
    @Roles(UserRole.ADMIN, UserRole.GESTOR, UserRole.MIEMBRO)
    async actualizarVentasMes(
        @Param('id') trabajoId: string,
        @Body() body: { mes: number; ventas: number },
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        const { mes, ventas } = body;

        if (mes === undefined || ventas === undefined) {
            throw new BadRequestException('Los campos "mes" y "ventas" son requeridos');
        }

        return this.trabajosService.actualizarVentasMensualesEnExcel(
            trabajoId,
            mes,
            ventas,
            currentUser,
        );
    }
}
