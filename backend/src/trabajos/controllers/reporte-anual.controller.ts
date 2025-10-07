import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseUUIDPipe,
    ParseIntPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
    ReporteAnualService,
    ActualizarVentasDto,
    ResumenAnual,
} from '../services/reporte-anual.service';
import { ReporteAnual } from '../entities/reporte-anual.entity';

@Controller('trabajos/:trabajoId/reporte-anual')
@UseGuards(JwtAuthGuard)
export class ReporteAnualController {
    constructor(
        private readonly reporteAnualService: ReporteAnualService,
    ) { }

    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio
     * Obtiene todos los reportes mensuales para un año
     * Crea automáticamente los 12 meses si no existen
     */
    @Get(':anio')
    async obtenerReporteAnual(
        @Param('trabajoId', ParseUUIDPipe) trabajoId: string,
        @Param('anio', ParseIntPipe) anio: number,
    ): Promise<ReporteAnual[]> {
        return this.reporteAnualService.obtenerOCrearReporteAnual(
            trabajoId,
            anio,
        );
    }

    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio/resumen
     * Obtiene el resumen anual con totales y estadísticas
     */
    @Get(':anio/resumen')
    async obtenerResumenAnual(
        @Param('trabajoId', ParseUUIDPipe) trabajoId: string,
        @Param('anio', ParseIntPipe) anio: number,
    ): Promise<ResumenAnual> {
        return this.reporteAnualService.obtenerResumenAnual(
            trabajoId,
            anio,
        );
    }

    /**
     * GET /trabajos/:trabajoId/reporte-anual/:anio/mes/:mes
     * Obtiene el reporte de un mes específico
     */
    @Get(':anio/mes/:mes')
    async obtenerReporteMensual(
        @Param('trabajoId', ParseUUIDPipe) trabajoId: string,
        @Param('anio', ParseIntPipe) anio: number,
        @Param('mes', ParseIntPipe) mes: number,
    ): Promise<ReporteAnual> {
        return this.reporteAnualService.obtenerReporteMensual(
            trabajoId,
            anio,
            mes,
        );
    }

    /**
     * POST /trabajos/:trabajoId/reporte-anual/actualizar-ventas
     * Actualiza o crea el registro de ventas para un mes específico
     * Body: { anio, mes, ventas, ventasAuxiliar }
     */
    @Post('actualizar-ventas')
    @HttpCode(HttpStatus.OK)
    async actualizarVentas(
        @Param('trabajoId', ParseUUIDPipe) trabajoId: string,
        @Body() body: Omit<ActualizarVentasDto, 'trabajoId'>,
    ): Promise<ReporteAnual> {
        return this.reporteAnualService.actualizarVentas({
            trabajoId,
            ...body,
        });
    }
}
