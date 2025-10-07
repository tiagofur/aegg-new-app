import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrabajosService } from '../services/trabajos.service';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('trabajos')
@UseGuards(JwtAuthGuard)
export class TrabajosController {
    constructor(private readonly trabajosService: TrabajosService) { }

    @Post()
    create(@Body() createTrabajoDto: CreateTrabajoDto) {
        return this.trabajosService.create(createTrabajoDto);
    }

    @Get()
    findAll(@Query('usuarioId') usuarioId?: string) {
        return this.trabajosService.findAll(usuarioId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.trabajosService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTrabajoDto: UpdateTrabajoDto) {
        return this.trabajosService.update(id, updateTrabajoDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.trabajosService.remove(id);
    }

    @Post(':id/reporte-base/importar')
    @UseInterceptors(FileInterceptor('file'))
    async importarReporteBase(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        return this.trabajosService.importarReporteBase(id, file.buffer);
    }
}
