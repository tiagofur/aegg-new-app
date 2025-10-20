import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrentUser, CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { AprobacionesService } from '../services/aprobaciones.service';
import { AprobacionesDashboardQueryDto } from '../dto';

@Controller('trabajos/aprobaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AprobacionesController {
    constructor(private readonly aprobacionesService: AprobacionesService) { }

    @Get('dashboard')
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    getDashboard(
        @CurrentUser() currentUser: CurrentUserPayload,
        @Query() query: AprobacionesDashboardQueryDto,
    ) {
        return this.aprobacionesService.getDashboard(currentUser, query);
    }
}
