import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportesMensualesService } from '../services/reportes-mensuales.service';
import { ImportReporteMensualDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('reportes-mensuales')
@UseGuards(JwtAuthGuard)
export class ReportesMensualesController {
    constructor(private readonly reportesService: ReportesMensualesService) { }

    @Post('importar')
    @UseInterceptors(FileInterceptor('file'))
    importar(
        @Body() importDto: ImportReporteMensualDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.reportesService.importarReporte(
            importDto.mesId,
            importDto.tipo,
            file,
        );
    }

    @Post(':mesId/procesar')
    procesarYGuardar(@Param('mesId') mesId: string) {
        return this.reportesService.procesarYGuardar(mesId);
    }

    @Get(':mesId/:reporteId/datos')
    obtenerDatos(
        @Param('mesId') mesId: string,
        @Param('reporteId') reporteId: string,
    ) {
        return this.reportesService.obtenerDatos(mesId, reporteId);
    }

    @Put(':mesId/:reporteId/datos')
    actualizarDatos(
        @Param('mesId') mesId: string,
        @Param('reporteId') reporteId: string,
        @Body('datos') datos: any[][],
    ) {
        return this.reportesService.actualizarDatos(mesId, reporteId, datos);
    }

    @Delete(':mesId/:reporteId/datos')
    limpiarDatos(
        @Param('mesId') mesId: string,
        @Param('reporteId') reporteId: string,
    ) {
        return this.reportesService.limpiarDatosReporte(mesId, reporteId);
    }
}
