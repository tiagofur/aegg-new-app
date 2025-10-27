import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { AprobacionesService } from '../services/aprobaciones.service';
import { AprobacionesDashboardQueryDto } from '../dto';
export declare class AprobacionesController {
    private readonly aprobacionesService;
    constructor(aprobacionesService: AprobacionesService);
    getDashboard(currentUser: CurrentUserPayload, query: AprobacionesDashboardQueryDto): Promise<import("../dto").AprobacionesDashboardResponseDto>;
}
