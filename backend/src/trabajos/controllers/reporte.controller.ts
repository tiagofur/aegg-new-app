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
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

    @Post(':id/importar-excel')
    @UseInterceptors(FileInterceptor('file'))
    async importarExcel(
        @Param('id') id: string,
        @Param('trabajoId') trabajoId: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        return this.reporteService.importarDesdeExcel(
            id,
            trabajoId,
            file.buffer,
            file.originalname,
            req.user.userId,
        );
    }

    @Post(':id/info-excel')
    @UseInterceptors(FileInterceptor('file'))
    async obtenerInfoExcel(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        return this.reporteService.obtenerInfoExcel(file.buffer);
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

    /**
     * FASE 2: ENDPOINTS DE VISUALIZACIÓN
     */

    @Get(':id/datos')
    obtenerDatosVisualizacion(
        @Param('id') id: string,
        @Query('hoja') hoja: string,
        @Query('pagina') pagina: string,
        @Query('porPagina') porPagina: string,
        @Query('incluirModificaciones') incluirModificaciones: string,
        @Request() req,
    ) {
        return this.reporteService.obtenerDatosVisualizacion(id, req.user.userId, {
            hoja,
            pagina: pagina ? parseInt(pagina) : 1,
            porPagina: porPagina ? parseInt(porPagina) : 100,
            incluirModificaciones: incluirModificaciones !== 'false',
        });
    }

    @Get(':id/hojas')
    obtenerHojasDisponibles(@Param('id') id: string, @Request() req) {
        return this.reporteService.obtenerHojasDisponibles(id, req.user.userId);
    }

    @Get(':id/estadisticas')
    obtenerEstadisticas(@Param('id') id: string, @Request() req) {
        return this.reporteService.obtenerEstadisticas(id, req.user.userId);
    }

    @Get(':id/rango')
    obtenerRangoDatos(
        @Param('id') id: string,
        @Query('hoja') hoja: string,
        @Query('filaInicio') filaInicio: string,
        @Query('filaFin') filaFin: string,
        @Query('incluirHeaders') incluirHeaders: string,
        @Request() req,
    ) {
        return this.reporteService.obtenerRangoDatos(id, req.user.userId, {
            hoja,
            filaInicio: parseInt(filaInicio),
            filaFin: parseInt(filaFin),
            incluirHeaders: incluirHeaders === 'true',
        });
    }
}
