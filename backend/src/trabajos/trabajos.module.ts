import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Trabajo,
    ReporteBaseAnual,
    Mes,
    ReporteMensual,
} from './entities';
import { ReporteAnual } from './entities/reporte-anual.entity';
import {
    TrabajosService,
    MesesService,
    ReportesMensualesService,
    FormulaService,
    ExcelParserService,
} from './services';
import { ReporteAnualService } from './services/reporte-anual.service';
import {
    TrabajosController,
    MesesController,
    ReportesMensualesController,
} from './controllers';
import { ReporteAnualController } from './controllers/reporte-anual.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Trabajo,
            ReporteBaseAnual,
            Mes,
            ReporteMensual,
            ReporteAnual,
        ]),
    ],
    controllers: [
        TrabajosController,
        MesesController,
        ReportesMensualesController,
        ReporteAnualController,
    ],
    providers: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
        ReporteAnualService,
    ],
    exports: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
        ReporteAnualService,
    ],
})
export class TrabajosModule { }
