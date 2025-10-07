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
import { TrabajoService } from '../services/trabajo.service';
import { CreateTrabajoDto, UpdateTrabajoDto } from '../dto/trabajo.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('trabajos')
@UseGuards(JwtAuthGuard)
export class TrabajoController {
    constructor(private readonly trabajoService: TrabajoService) { }

    @Post()
    create(@Body() createTrabajoDto: CreateTrabajoDto, @Request() req) {
        return this.trabajoService.create(createTrabajoDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.trabajoService.findAllByUser(req.user.userId);
    }

    @Get('estadisticas')
    getEstadisticas(@Request() req) {
        return this.trabajoService.getEstadisticas(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.trabajoService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateTrabajoDto: UpdateTrabajoDto,
        @Request() req,
    ) {
        return this.trabajoService.update(id, updateTrabajoDto, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.trabajoService.remove(id, req.user.userId);
    }

    @Post(':id/duplicar')
    duplicate(@Param('id') id: string, @Request() req) {
        return this.trabajoService.duplicate(id, req.user.userId);
    }
}
