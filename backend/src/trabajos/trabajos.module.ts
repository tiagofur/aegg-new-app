import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Trabajo,
    ReporteBaseAnual,
    Mes,
    ReporteMensual,
} from './entities';
import { ReporteAnual } from './entities/reporte-anual.entity';
import { Cliente } from '../clientes/entities';
import { User } from '../auth/entities/user.entity';
import {
    TrabajosService,
    MesesService,
    ReportesMensualesService,
    FormulaService,
    ExcelParserService,
    AprobacionesService,
} from './services';
import { ReporteAnualService } from './services/reporte-anual.service';
import {
    TrabajosController,
    MesesController,
    ReportesMensualesController,
    AprobacionesController,
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
            Cliente,
            User,
        ]),
    ],
    controllers: [
        TrabajosController,
        MesesController,
        ReportesMensualesController,
        AprobacionesController,
        ReporteAnualController,
    ],
    providers: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
        ReporteAnualService,
        AprobacionesService,
    ],
    exports: [
        TrabajosService,
        MesesService,
        ReportesMensualesService,
        FormulaService,
        ExcelParserService,
        ReporteAnualService,
        AprobacionesService,
    ],
})
export class TrabajosModule { }
