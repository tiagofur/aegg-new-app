import { MesesService } from '../services/meses.service';
import { CreateMesDto, EnviarRevisionMesDto, SolicitarCambiosMesDto } from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
export declare class MesesController {
    private readonly mesesService;
    constructor(mesesService: MesesService);
    create(createMesDto: CreateMesDto): Promise<import("../entities").Mes>;
    findByTrabajo(trabajoId: string): Promise<import("../entities").Mes[]>;
    findOne(id: string): Promise<import("../entities").Mes>;
    reabrirMes(id: string): Promise<import("../entities").Mes>;
    remove(id: string): Promise<void>;
    enviarRevision(id: string, body: EnviarRevisionMesDto, currentUser: CurrentUserPayload): Promise<import("../entities").Mes>;
    enviarRevisionManual(id: string, currentUser: CurrentUserPayload): Promise<import("../entities").Mes>;
    aprobarMes(id: string, currentUser: CurrentUserPayload): Promise<import("../entities").Mes>;
    solicitarCambios(id: string, body: SolicitarCambiosMesDto, currentUser: CurrentUserPayload): Promise<import("../entities").Mes>;
}
