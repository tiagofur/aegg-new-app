"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrabajosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const XLSX = require("xlsx");
const entities_2 = require("../../clientes/entities");
const user_entity_1 = require("../../auth/entities/user.entity");
let TrabajosService = class TrabajosService {
    constructor(trabajoRepository, clienteRepository, reporteBaseRepository, mesRepository, reporteMensualRepository, userRepository, dataSource) {
        this.trabajoRepository = trabajoRepository;
        this.clienteRepository = clienteRepository;
        this.reporteBaseRepository = reporteBaseRepository;
        this.mesRepository = mesRepository;
        this.reporteMensualRepository = reporteMensualRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async create(createTrabajoDto, currentUser) {
        this.assertCanManage(currentUser);
        console.log('[TrabajosService] Iniciando creación de trabajo:', createTrabajoDto);
        if (!createTrabajoDto.clienteId) {
            throw new common_1.BadRequestException('clienteId es requerido para crear un trabajo.');
        }
        const cliente = await this.clienteRepository.findOne({
            where: { id: createTrabajoDto.clienteId },
        });
        if (!cliente) {
            throw new common_1.NotFoundException(`Cliente con id ${createTrabajoDto.clienteId} no encontrado`);
        }
        const gestorResponsableId = createTrabajoDto.gestorResponsableId ?? currentUser.userId;
        const gestorResponsable = await this.userRepository.findOne({ where: { id: gestorResponsableId } });
        if (!gestorResponsable) {
            throw new common_1.NotFoundException(`Usuario con id ${gestorResponsableId} no encontrado para asignar como gestor`);
        }
        if (gestorResponsable.role !== user_entity_1.UserRole.ADMIN && gestorResponsable.role !== user_entity_1.UserRole.GESTOR) {
            throw new common_1.BadRequestException('El gestor responsable debe tener rol de Admin o Gestor.');
        }
        if (currentUser.role === user_entity_1.UserRole.GESTOR &&
            currentUser.equipoId &&
            gestorResponsable.role === user_entity_1.UserRole.GESTOR &&
            gestorResponsable.equipoId &&
            gestorResponsable.equipoId !== currentUser.equipoId) {
            throw new common_1.ForbiddenException('Solo puedes asignar gestores de tu equipo.');
        }
        const miembroAsignadoId = createTrabajoDto.miembroAsignadoId ??
            createTrabajoDto.usuarioAsignadoId ??
            null;
        if (miembroAsignadoId) {
            const miembroAsignado = await this.userRepository.findOne({ where: { id: miembroAsignadoId } });
            if (!miembroAsignado) {
                throw new common_1.NotFoundException(`Usuario con id ${miembroAsignadoId} no encontrado para asignar al trabajo`);
            }
            if (currentUser.role === user_entity_1.UserRole.GESTOR &&
                currentUser.equipoId &&
                miembroAsignado.equipoId !== currentUser.equipoId) {
                throw new common_1.ForbiddenException('Solo puedes asignar miembros de tu equipo.');
            }
        }
        const existe = await this.trabajoRepository.findOne({
            where: {
                clienteId: createTrabajoDto.clienteId,
                anio: createTrabajoDto.anio,
            },
        });
        if (existe) {
            throw new common_1.ConflictException(`Ya existe un trabajo para el cliente ${cliente.nombre} en el año ${createTrabajoDto.anio}`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const trabajo = this.trabajoRepository.create({
                ...createTrabajoDto,
                clienteNombre: cliente.nombre,
                clienteRfc: cliente.rfc,
                estadoAprobacion: createTrabajoDto.estadoAprobacion ?? entities_1.EstadoAprobacion.EN_PROGRESO,
                miembroAsignadoId,
                gestorResponsableId: gestorResponsable.id,
            });
            trabajo.gestorResponsable = gestorResponsable;
            const trabajoGuardado = await queryRunner.manager.save(trabajo);
            console.log('[TrabajosService] Trabajo guardado:', trabajoGuardado.id);
            const reporteBase = this.reporteBaseRepository.create({
                trabajoId: trabajoGuardado.id,
                mesesCompletados: [],
                hojas: this.getHojasIniciales(),
            });
            await queryRunner.manager.save(reporteBase);
            console.log('[TrabajosService] Reporte base anual creado');
            console.log('[TrabajosService] Iniciando creación de meses automáticos...');
            await this.crearMesesAutomaticosEnTransaccion(trabajoGuardado.id, queryRunner);
            console.log('[TrabajosService] Meses automáticos creados');
            await queryRunner.commitTransaction();
            console.log('[TrabajosService] Transacción confirmada');
            const trabajoCompleto = await this.findOne(trabajoGuardado.id, currentUser);
            console.log('[TrabajosService] Trabajo completo con meses:', {
                id: trabajoCompleto.id,
                cantidadMeses: trabajoCompleto.meses?.length || 0,
            });
            return trabajoCompleto;
        }
        catch (error) {
            console.error('[TrabajosService] Error en transacción, revirtiendo:', error);
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(currentUser, usuarioId) {
        const whereCondition = this.buildListadoWhere(currentUser, usuarioId);
        const trabajos = await this.trabajoRepository.find({
            where: whereCondition,
            relations: [
                'reporteBaseAnual',
                'meses',
                'meses.reportes',
                'meses.enviadoRevisionPor',
                'meses.aprobadoPor',
                'miembroAsignado',
                'cliente',
                'aprobadoPor',
                'gestorResponsable',
            ],
            order: {
                fechaCreacion: 'DESC',
            },
        });
        return this.applyEquipoVisibility(trabajos, currentUser);
    }
    async findOne(id, currentUser) {
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);
        return trabajo;
    }
    async update(id, updateTrabajoDto, currentUser) {
        this.assertCanManage(currentUser);
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);
        if (updateTrabajoDto.clienteId && updateTrabajoDto.clienteId !== trabajo.clienteId) {
            const nuevoCliente = await this.clienteRepository.findOne({
                where: { id: updateTrabajoDto.clienteId },
            });
            if (!nuevoCliente) {
                throw new common_1.NotFoundException(`Cliente con id ${updateTrabajoDto.clienteId} no encontrado`);
            }
            trabajo.cliente = nuevoCliente;
            trabajo.clienteId = nuevoCliente.id;
            trabajo.clienteNombre = nuevoCliente.nombre;
            trabajo.clienteRfc = nuevoCliente.rfc;
        }
        const payload = { ...updateTrabajoDto };
        if (payload.gestorResponsableId &&
            payload.gestorResponsableId !== trabajo.gestorResponsableId) {
            const nuevoGestor = await this.userRepository.findOne({
                where: { id: payload.gestorResponsableId },
            });
            if (!nuevoGestor) {
                throw new common_1.NotFoundException(`Usuario con id ${payload.gestorResponsableId} no encontrado para asignar como gestor`);
            }
            if (nuevoGestor.role !== user_entity_1.UserRole.ADMIN && nuevoGestor.role !== user_entity_1.UserRole.GESTOR) {
                throw new common_1.BadRequestException('El gestor responsable debe tener rol de Admin o Gestor.');
            }
            if (currentUser.role === user_entity_1.UserRole.GESTOR &&
                currentUser.equipoId &&
                nuevoGestor.role === user_entity_1.UserRole.GESTOR &&
                nuevoGestor.equipoId &&
                nuevoGestor.equipoId !== currentUser.equipoId) {
                throw new common_1.ForbiddenException('Solo puedes asignar gestores de tu equipo.');
            }
            trabajo.gestorResponsable = nuevoGestor;
            trabajo.gestorResponsableId = nuevoGestor.id;
        }
        else if (payload.gestorResponsableId === null) {
            trabajo.gestorResponsable = null;
            trabajo.gestorResponsableId = null;
        }
        if (payload.usuarioAsignadoId && !payload.miembroAsignadoId) {
            payload.miembroAsignadoId = payload.usuarioAsignadoId;
        }
        if (payload.miembroAsignadoId &&
            payload.miembroAsignadoId !== trabajo.miembroAsignadoId) {
            const nuevoMiembro = await this.userRepository.findOne({
                where: { id: payload.miembroAsignadoId },
            });
            if (!nuevoMiembro) {
                throw new common_1.NotFoundException(`Usuario con id ${payload.miembroAsignadoId} no encontrado para asignar al trabajo`);
            }
            if (currentUser.role === user_entity_1.UserRole.GESTOR &&
                currentUser.equipoId &&
                nuevoMiembro.equipoId !== currentUser.equipoId) {
                throw new common_1.ForbiddenException('Solo puedes asignar miembros de tu equipo.');
            }
            trabajo.miembroAsignado = nuevoMiembro;
            trabajo.miembroAsignadoId = nuevoMiembro.id;
        }
        else if (payload.miembroAsignadoId === null) {
            trabajo.miembroAsignado = null;
            trabajo.miembroAsignadoId = null;
        }
        Object.assign(trabajo, payload);
        if (trabajo.cliente) {
            trabajo.clienteNombre = trabajo.cliente.nombre;
            trabajo.clienteRfc = trabajo.cliente.rfc;
        }
        await this.trabajoRepository.save(trabajo);
        return this.findOne(id, currentUser);
    }
    async remove(id, currentUser) {
        this.assertCanManage(currentUser);
        const trabajo = await this.getTrabajoOrThrow(id);
        this.assertCanAccess(trabajo, currentUser);
        await this.trabajoRepository.remove(trabajo);
    }
    async importarReporteBase(trabajoId, fileBuffer, currentUser) {
        this.assertCanManage(currentUser);
        const trabajo = await this.findOne(trabajoId, currentUser);
        if (!trabajo.reporteBaseAnual) {
            const nuevoReporteBase = this.reporteBaseRepository.create({
                trabajoId: trabajo.id,
                mesesCompletados: [],
                hojas: this.getHojasIniciales(),
            });
            trabajo.reporteBaseAnual = await this.reporteBaseRepository.save(nuevoReporteBase);
        }
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            if (workbook.SheetNames.length === 0) {
                throw new common_1.BadRequestException('El archivo Excel no contiene hojas');
            }
            const hojas = workbook.SheetNames.map((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                return {
                    nombre: sheetName,
                    datos: datos,
                };
            });
            trabajo.reporteBaseAnual.hojas = hojas;
            await this.reporteBaseRepository.save(trabajo.reporteBaseAnual);
            return trabajo.reporteBaseAnual;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error al procesar el archivo Excel: ${error.message}`);
        }
    }
    getHojasIniciales() {
        return [
            {
                nombre: 'Resumen Anual',
                datos: [],
            },
            {
                nombre: 'Ingresos Consolidados',
                datos: [],
            },
            {
                nombre: 'Comparativas',
                datos: [],
            },
        ];
    }
    async crearMesesAutomaticos(trabajoId) {
        console.log(`[TrabajosService] Creando meses automáticos para trabajo: ${trabajoId}`);
        const mesesCreados = [];
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }
        console.log(`[TrabajosService] ${mesesCreados.length} meses creados en memoria, guardando...`);
        const mesesGuardados = await this.mesRepository.save(mesesCreados);
        console.log(`[TrabajosService] ${mesesGuardados.length} meses guardados en BD`);
        const reportes = [];
        for (const mes of mesesGuardados) {
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS,
                datos: [],
            }));
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_AUXILIAR,
                datos: [],
            }));
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_MI_ADMIN,
                datos: [],
            }));
        }
        console.log(`[TrabajosService] ${reportes.length} reportes mensuales creados en memoria, guardando...`);
        await this.reporteMensualRepository.save(reportes);
        console.log(`[TrabajosService] Reportes mensuales guardados en BD`);
    }
    async crearMesesAutomaticosEnTransaccion(trabajoId, queryRunner) {
        console.log(`[TrabajosService] Creando meses automáticos para trabajo (con transacción): ${trabajoId}`);
        const mesesCreados = [];
        for (let mes = 1; mes <= 12; mes++) {
            const nuevoMes = this.mesRepository.create({
                trabajoId,
                mes,
            });
            mesesCreados.push(nuevoMes);
        }
        console.log(`[TrabajosService] ${mesesCreados.length} meses creados en memoria, guardando...`);
        const mesesGuardados = await queryRunner.manager.save(mesesCreados);
        console.log(`[TrabajosService] ${mesesGuardados.length} meses guardados en BD`);
        const reportes = [];
        for (const mes of mesesGuardados) {
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS,
                datos: [],
            }));
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_AUXILIAR,
                datos: [],
            }));
            reportes.push(this.reporteMensualRepository.create({
                mesId: mes.id,
                tipo: entities_1.TipoReporteMensual.INGRESOS_MI_ADMIN,
                datos: [],
            }));
        }
        console.log(`[TrabajosService] ${reportes.length} reportes mensuales creados en memoria, guardando...`);
        await queryRunner.manager.save(reportes);
        console.log(`[TrabajosService] Reportes mensuales guardados en BD`);
    }
    buildListadoWhere(currentUser, miembroFiltro) {
        if (currentUser.role === user_entity_1.UserRole.MIEMBRO) {
            return { miembroAsignadoId: currentUser.userId };
        }
        if (miembroFiltro) {
            return { miembroAsignadoId: miembroFiltro };
        }
        return {};
    }
    assertCanManage(currentUser) {
        if (currentUser.role === user_entity_1.UserRole.ADMIN || currentUser.role === user_entity_1.UserRole.GESTOR) {
            return;
        }
        throw new common_1.ForbiddenException('No tienes permisos para modificar trabajos.');
    }
    assertCanAccess(trabajo, currentUser) {
        if (currentUser.role === user_entity_1.UserRole.ADMIN) {
            return;
        }
        if (currentUser.role === user_entity_1.UserRole.GESTOR) {
            if (!trabajo.visibilidadEquipo) {
                return;
            }
            if (!currentUser.equipoId) {
                return;
            }
            if (trabajo.miembroAsignadoId === currentUser.userId) {
                return;
            }
            if (trabajo.gestorResponsableId === currentUser.userId) {
                return;
            }
            const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
            if (miembroEquipoId === currentUser.equipoId) {
                return;
            }
            if (trabajo.aprobadoPorId === currentUser.userId) {
                return;
            }
            if (!trabajo.miembroAsignadoId) {
                return;
            }
            throw new common_1.ForbiddenException('No tienes permisos para ver este trabajo.');
        }
        if (trabajo.miembroAsignadoId === currentUser.userId) {
            return;
        }
        throw new common_1.ForbiddenException('No tienes permisos para ver este trabajo.');
    }
    async getTrabajoOrThrow(id) {
        const trabajo = await this.trabajoRepository.findOne({
            where: { id },
            relations: [
                'reporteBaseAnual',
                'meses',
                'meses.reportes',
                'meses.enviadoRevisionPor',
                'meses.aprobadoPor',
                'miembroAsignado',
                'cliente',
                'aprobadoPor',
                'gestorResponsable',
            ],
        });
        if (!trabajo) {
            throw new common_1.NotFoundException(`Trabajo con id ${id} no encontrado`);
        }
        return trabajo;
    }
    applyEquipoVisibility(trabajos, currentUser) {
        if (currentUser.role !== user_entity_1.UserRole.GESTOR || !currentUser.equipoId) {
            return trabajos;
        }
        return trabajos.filter((trabajo) => {
            if (!trabajo.visibilidadEquipo) {
                return true;
            }
            if (!trabajo.miembroAsignadoId) {
                return true;
            }
            if (trabajo.miembroAsignadoId === currentUser.userId) {
                return true;
            }
            if (trabajo.gestorResponsableId === currentUser.userId) {
                return true;
            }
            const miembroEquipoId = trabajo.miembroAsignado?.equipoId ?? null;
            if (miembroEquipoId === currentUser.equipoId) {
                return true;
            }
            if (trabajo.aprobadoPorId === currentUser.userId) {
                return true;
            }
            return false;
        });
    }
    async actualizarVentasMensualesEnExcel(trabajoId, mes, ventas, currentUser) {
        if (mes < 1 || mes > 12) {
            throw new common_1.BadRequestException('Mes debe estar entre 1 y 12');
        }
        const trabajo = await this.trabajoRepository.findOne({
            where: { id: trabajoId },
            relations: ['reporteBaseAnual'],
        });
        if (!trabajo) {
            throw new common_1.NotFoundException(`Trabajo con ID ${trabajoId} no encontrado`);
        }
        if (!trabajo.reporteBaseAnual) {
            throw new common_1.NotFoundException('Reporte Base Anual no encontrado. Debe importar el Excel primero.');
        }
        const reporte = trabajo.reporteBaseAnual;
        if (!reporte.hojas || reporte.hojas.length === 0) {
            throw new common_1.BadRequestException('El Reporte Base Anual no contiene hojas');
        }
        console.log(`[TrabajosService] Reporte Base tiene ${reporte.hojas.length} hojas`);
        console.log(`[TrabajosService] Nombres de hojas:`, reporte.hojas.map(h => h.nombre));
        const hoja0 = reporte.hojas[0];
        if (!hoja0 || !hoja0.datos || hoja0.datos.length === 0) {
            throw new common_1.BadRequestException('La hoja 0 no contiene datos');
        }
        console.log(`[TrabajosService] Trabajando con hoja: "${hoja0.nombre}"`);
        console.log(`[TrabajosService] La hoja tiene ${hoja0.datos.length} filas`);
        const datos = hoja0.datos;
        const normalize = (text) => {
            if (!text)
                return '';
            return text
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '');
        };
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(datos.length, 20); i++) {
            const row = datos[i];
            if (Array.isArray(row)) {
                const rowText = row.map((cell) => normalize(cell)).join(' ');
                const mesesEncontrados = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ].filter(m => rowText.includes(m)).length;
                if (mesesEncontrados >= 3) {
                    headerRowIndex = i;
                    break;
                }
            }
        }
        if (headerRowIndex === -1) {
            console.log('[TrabajosService] ❌ No se encontró el encabezado. Mostrando primeras 10 filas:');
            for (let i = 0; i < Math.min(datos.length, 10); i++) {
                console.log(`Fila ${i}:`, datos[i]);
            }
            throw new common_1.BadRequestException('No se encontró la fila de encabezado con los nombres de los meses');
        }
        console.log(`[TrabajosService] ✅ Encabezado encontrado en fila ${headerRowIndex}`);
        const headerRow = datos[headerRowIndex];
        console.log(`[TrabajosService] Contenido del encabezado:`, headerRow);
        const mesesNombres = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        ];
        const mesNombre = mesesNombres[mes - 1];
        let mesColumnIndex = -1;
        for (let i = 0; i < headerRow.length; i++) {
            const cellNorm = normalize(headerRow[i]);
            if (cellNorm === mesNombre) {
                mesColumnIndex = i;
                break;
            }
        }
        if (mesColumnIndex === -1) {
            console.log('[TrabajosService] ❌ No se encontró la columna del mes');
            console.log(`[TrabajosService] Mes buscado: "${mesNombre}"`);
            console.log(`[TrabajosService] Columnas normalizadas:`, headerRow.map((c, i) => `[${i}]="${normalize(c)}"`));
            throw new common_1.BadRequestException(`No se encontró la columna del mes "${mesesNombres[mes - 1].toUpperCase()}"`);
        }
        console.log(`[TrabajosService] ✅ Columna del mes "${mesNombre.toUpperCase()}" encontrada en índice ${mesColumnIndex}`);
        let ventasRowIndex = -1;
        for (let i = headerRowIndex + 1; i < datos.length; i++) {
            const row = datos[i];
            if (Array.isArray(row) && row.length > 1) {
                const concepto = normalize(row[1]);
                if (concepto === 'ventas') {
                    ventasRowIndex = i;
                    break;
                }
            }
        }
        if (ventasRowIndex === -1) {
            console.log('[TrabajosService] ❌ No se encontró la fila de Ventas');
            console.log('[TrabajosService] Buscando filas después del encabezado:');
            for (let i = headerRowIndex + 1; i < Math.min(datos.length, headerRowIndex + 20); i++) {
                const row = datos[i];
                if (Array.isArray(row) && row.length > 1) {
                    console.log(`Fila ${i}: [0]="${normalize(row[0])}" [1]="${normalize(row[1])}"`);
                }
            }
            throw new common_1.BadRequestException('No se encontró la fila "( = ) Ventas" en la hoja');
        }
        console.log(`[TrabajosService] ✅ Fila de Ventas encontrada en índice ${ventasRowIndex}`);
        console.log(`[TrabajosService] Actualizando celda en Excel:`, {
            trabajoId,
            mes: mesesNombres[mes - 1],
            ventas,
            fila: ventasRowIndex,
            columna: mesColumnIndex,
            valorAnterior: datos[ventasRowIndex][mesColumnIndex],
        });
        datos[ventasRowIndex][mesColumnIndex] = ventas;
        hoja0.datos = datos;
        reporte.hojas[0] = hoja0;
        reporte.ultimaActualizacion = new Date();
        const reporteActualizado = await this.reporteBaseRepository.save(reporte);
        console.log(`[TrabajosService] ✅ Ventas actualizadas en Excel para ${mesesNombres[mes - 1]}`);
        return reporteActualizado;
    }
};
exports.TrabajosService = TrabajosService;
exports.TrabajosService = TrabajosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Trabajo)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_2.Cliente)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.ReporteBaseAnual)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Mes)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.ReporteMensual)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], TrabajosService);
//# sourceMappingURL=trabajos.service.js.map