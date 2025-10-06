import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReporteService } from '../services/reporte.service';
import {
    CreateReporteDto,
    UpdateReporteDto,
    ActualizarCeldaDto,
    AgregarFilaDto,
    AgregarColumnaDto,
} from '../dto/reporte.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DatosOriginales } from '../entities/reporte.entity';

@Controller('trabajos/:trabajoId/reportes')
@UseGuards(JwtAuthGuard)
export class ReporteController {
    constructor(private readonly reporteService: ReporteService) { }

    @Post()
    create(
        @Param('trabajoId') trabajoId: string,
        @Body() createReporteDto: CreateReporteDto,
        @Request() req,
    ) {
        return this.reporteService.create(
            trabajoId,
            createReporteDto,
            req.user.userId,
        );
    }

    @Get()
    findAll(@Param('trabajoId') trabajoId: string, @Request() req) {
        return this.reporteService.findAllByTrabajo(
            trabajoId,
            req.user.userId,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.reporteService.findOne(id, req.user.userId);
    }

    @Get(':id/vista-previa')
    getVistaPrevia(@Param('id') id: string, @Request() req) {
        return this.reporteService.getVistaPrevia(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateReporteDto: UpdateReporteDto,
        @Request() req,
    ) {
        return this.reporteService.update(id, updateReporteDto, req.user.userId);
    }

    @Post(':id/importar')
    importarDatos(
        @Param('id') id: string,
        @Body() datosOriginales: DatosOriginales,
        @Request() req,
    ) {
        return this.reporteService.importarDatos(
            id,
            datosOriginales,
            req.user.userId,
        );
    }

    @Patch(':id/celdas/:fila/:columna')
    actualizarCelda(
        @Param('id') id: string,
        @Param('fila') fila: string,
        @Param('columna') columna: string,
        @Body() dto: ActualizarCeldaDto,
        @Request() req,
    ) {
        return this.reporteService.actualizarCelda(
            id,
            parseInt(fila),
            parseInt(columna),
            dto,
            req.user.userId,
        );
    }

    @Post(':id/filas')
    agregarFila(
        @Param('id') id: string,
        @Body() dto: AgregarFilaDto,
        @Request() req,
    ) {
        return this.reporteService.agregarFila(id, dto, req.user.userId);
    }

    @Post(':id/columnas')
    agregarColumna(
        @Param('id') id: string,
        @Body() dto: AgregarColumnaDto,
        @Request() req,
    ) {
        return this.reporteService.agregarColumna(id, dto, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.reporteService.remove(id, req.user.userId);
    }
}
