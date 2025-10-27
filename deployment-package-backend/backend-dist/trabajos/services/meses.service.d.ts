import { Repository } from 'typeorm';
import { Mes, ReporteMensual, Trabajo, ReporteBaseAnual } from '../entities';
import { CreateMesDto } from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
export declare class MesesService {
    private mesRepository;
    private reporteMensualRepository;
    private trabajoRepository;
    private reporteBaseRepository;
    constructor(mesRepository: Repository<Mes>, reporteMensualRepository: Repository<ReporteMensual>, trabajoRepository: Repository<Trabajo>, reporteBaseRepository: Repository<ReporteBaseAnual>);
    create(createMesDto: CreateMesDto): Promise<Mes>;
    findByTrabajo(trabajoId: string): Promise<Mes[]>;
    findOne(id: string): Promise<Mes>;
    remove(id: string): Promise<void>;
    reabrirMes(id: string): Promise<Mes>;
    enviarRevision(id: string, currentUser: CurrentUserPayload, comentario?: string): Promise<Mes>;
    enviarRevisionManual(id: string, currentUser: CurrentUserPayload): Promise<Mes>;
    aprobarMes(id: string, currentUser: CurrentUserPayload): Promise<Mes>;
    solicitarCambios(id: string, currentUser: CurrentUserPayload, comentario?: string): Promise<Mes>;
    private assertPuedeSolicitarRevision;
    private assertPuedeEnviarManual;
    private assertPuedeRevisar;
    private revertirReporteBase;
    private actualizarEstadoAprobacionTrabajo;
}
