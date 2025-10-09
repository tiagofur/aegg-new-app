import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Patch,
} from '@nestjs/common';
import { MesesService } from '../services/meses.service';
import { CreateMesDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('meses')
@UseGuards(JwtAuthGuard)
export class MesesController {
    constructor(private readonly mesesService: MesesService) { }

    @Post()
    create(@Body() createMesDto: CreateMesDto) {
        return this.mesesService.create(createMesDto);
    }

    @Get('trabajo/:trabajoId')
    findByTrabajo(@Param('trabajoId') trabajoId: string) {
        return this.mesesService.findByTrabajo(trabajoId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.mesesService.findOne(id);
    }

    @Patch(':id/reabrir')
    reabrirMes(@Param('id') id: string) {
        return this.mesesService.reabrirMes(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.mesesService.remove(id);
    }
}
