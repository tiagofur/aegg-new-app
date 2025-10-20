import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Patch,
} from '@nestjs/common';
import { MesesService } from '../services/meses.service';
import { CreateMesDto, EnviarRevisionMesDto, SolicitarCambiosMesDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrentUser, CurrentUserPayload } from '../../auth/decorators/current-user.decorator';

@Controller('meses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MesesController {
    constructor(private readonly mesesService: MesesService) { }

    @Post()
    create(@Body() createMesDto: CreateMesDto) {
        return this.mesesService.create(createMesDto);
    }

    @Get('trabajo/:trabajoId')
    findByTrabajo(@Param('trabajoId') trabajoId: string) {
        return this.mesesService.findByTrabajo(trabajoId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.mesesService.findOne(id);
    }

    @Patch(':id/reabrir')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    reabrirMes(@Param('id') id: string) {
        return this.mesesService.reabrirMes(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.mesesService.remove(id);
    }

    @Patch(':id/enviar-revision')
    enviarRevision(
        @Param('id') id: string,
        @Body() body: EnviarRevisionMesDto,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.mesesService.enviarRevision(id, currentUser, body?.comentario);
    }

    @Patch(':id/enviar-manual')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    enviarRevisionManual(
        @Param('id') id: string,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.mesesService.enviarRevisionManual(id, currentUser);
    }

    @Patch(':id/aprobar')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    aprobarMes(
        @Param('id') id: string,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.mesesService.aprobarMes(id, currentUser);
    }

    @Patch(':id/solicitar-cambios')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    solicitarCambios(
        @Param('id') id: string,
        @Body() body: SolicitarCambiosMesDto,
        @CurrentUser() currentUser: CurrentUserPayload,
    ) {
        return this.mesesService.solicitarCambios(id, currentUser, body?.comentario);
    }
}
