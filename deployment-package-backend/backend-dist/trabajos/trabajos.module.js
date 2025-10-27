"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrabajosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
const reporte_anual_entity_1 = require("./entities/reporte-anual.entity");
const entities_2 = require("../clientes/entities");
const user_entity_1 = require("../auth/entities/user.entity");
const services_1 = require("./services");
const reporte_anual_service_1 = require("./services/reporte-anual.service");
const controllers_1 = require("./controllers");
const reporte_anual_controller_1 = require("./controllers/reporte-anual.controller");
let TrabajosModule = class TrabajosModule {
};
exports.TrabajosModule = TrabajosModule;
exports.TrabajosModule = TrabajosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.Trabajo,
                entities_1.ReporteBaseAnual,
                entities_1.Mes,
                entities_1.ReporteMensual,
                reporte_anual_entity_1.ReporteAnual,
                entities_2.Cliente,
                user_entity_1.User,
            ]),
        ],
        controllers: [
            controllers_1.TrabajosController,
            controllers_1.MesesController,
            controllers_1.ReportesMensualesController,
            controllers_1.AprobacionesController,
            reporte_anual_controller_1.ReporteAnualController,
        ],
        providers: [
            services_1.TrabajosService,
            services_1.MesesService,
            services_1.ReportesMensualesService,
            services_1.FormulaService,
            services_1.ExcelParserService,
            reporte_anual_service_1.ReporteAnualService,
            services_1.AprobacionesService,
        ],
        exports: [
            services_1.TrabajosService,
            services_1.MesesService,
            services_1.ReportesMensualesService,
            services_1.FormulaService,
            services_1.ExcelParserService,
            reporte_anual_service_1.ReporteAnualService,
            services_1.AprobacionesService,
        ],
    })
], TrabajosModule);
//# sourceMappingURL=trabajos.module.js.map