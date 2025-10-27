import { Repository } from 'typeorm';
import { Trabajo } from '../entities';
import { AprobacionesDashboardQueryDto, AprobacionesDashboardResponseDto } from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
export declare class AprobacionesService {
    private readonly trabajoRepository;
    constructor(trabajoRepository: Repository<Trabajo>);
    getDashboard(currentUser: CurrentUserPayload, filters?: AprobacionesDashboardQueryDto): Promise<AprobacionesDashboardResponseDto>;
    private buildAccessWhere;
    private expandMeses;
    private buildResumen;
    private applyFilters;
    private buildPendientes;
    private buildRecientes;
    private mapMesResumen;
    private mapActividad;
    private describeEstadoRevision;
    private mapEstadoRevision;
    private mapUser;
    private applyEquipoVisibility;
    private getNombreMes;
}
