import { TrabajosService } from '../services/trabajos.service';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
export declare class TrabajosController {
    private readonly trabajosService;
    constructor(trabajosService: TrabajosService);
    create(createTrabajoDto: CreateTrabajoDto, currentUser: CurrentUserPayload): Promise<import("../entities").Trabajo>;
    findAll(currentUser: CurrentUserPayload, miembroId?: string, usuarioIdLegacy?: string): Promise<import("../entities").Trabajo[]>;
    findOne(id: string, currentUser: CurrentUserPayload): Promise<import("../entities").Trabajo>;
    update(id: string, updateTrabajoDto: UpdateTrabajoDto, currentUser: CurrentUserPayload): Promise<import("../entities").Trabajo>;
    remove(id: string, currentUser: CurrentUserPayload): Promise<void>;
    importarReporteBase(id: string, file: Express.Multer.File, currentUser: CurrentUserPayload): Promise<import("../entities").ReporteBaseAnual>;
    actualizarVentasMes(trabajoId: string, body: {
        mes: number;
        ventas: number;
    }, currentUser: CurrentUserPayload): Promise<import("../entities").ReporteBaseAnual>;
}
