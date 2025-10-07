import {
    Controller,
    Post,
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
}
