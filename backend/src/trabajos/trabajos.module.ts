import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Trabajo,
    ReporteBaseAnual,
    Mes,
    ReporteMensual,
} from './entities';
import {
    TrabajosService,
    MesesService,
    ReportesMensualesService,
    FormulaService,
    ExcelParserService,
} from './services';
import {
    TrabajosController,
    MesesController,
    ReportesMensualesController,
} from './controllers';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Trabajo,
            ReporteBaseAnual,
            Mes,
            ReporteMensual,
        ]),
    ],
    controllers: [
        TrabajosController,
        MesesController,
        ReportesMensualesController,
    ],
    providers: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
    ],
    exports: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
    ],
})
export class TrabajosModule { }
