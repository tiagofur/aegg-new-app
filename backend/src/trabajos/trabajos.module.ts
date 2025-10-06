import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trabajo } from './entities/trabajo.entity';
import { Reporte } from './entities/reporte.entity';
import { TrabajoService } from './services/trabajo.service';
import { ReporteService } from './services/reporte.service';
import { FormulaService } from './services/formula.service';
import { ExcelParserService } from './services/excel-parser.service';
import { TrabajoController } from './controllers/trabajo.controller';
import { ReporteController } from './controllers/reporte.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Trabajo, Reporte])],
    controllers: [TrabajoController, ReporteController],
    providers: [TrabajoService, ReporteService, FormulaService, ExcelParserService],
    exports: [TrabajoService, ReporteService, FormulaService, ExcelParserService],
})
export class TrabajosModule { }
