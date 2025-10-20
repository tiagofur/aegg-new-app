# Roadmap de Implementacion (2025-10-18)

## Estado al 2025-10-18

- [x] Consolidar `ClienteFormModal` como componente compartido en los diálogos de trabajo con refresco del selector.
- [x] Levantar infraestructura de pruebas en frontend con Vitest + Testing Library y cubrir flujos críticos de cliente/trabajo.
- [x] Exponer los componentes del módulo `features/clientes` (`ClienteSelector`, `ClienteFormModal`, `ClientesTable`) conectados a `ClientesPage` y `CreateTrabajoDialog`.
- [x] Integrar permisos fine-grained en backend (`TrabajosController` ahora usa `JwtAuthGuard` + `RolesGuard`, valida ownership y visibilidad por equipo).
- [x] Desplegar dashboard de aprobaciones con datos reales (endpoint `/trabajos/aprobaciones/dashboard` disponible y agregaciones conectadas).
- [x] Sembrar usuario administrador base (`admin@example.com`), validar login contra backend en caliente y documentar el flujo de arranque.
- [ ] Alinear aprobaciones mensuales: diseño pactado (esta iteración) + backlog levantado para backend/frontend/QA.

## Fase 0 · Descubrimiento y Preparacion

1. Analizar modelo de datos actual de trabajos y usuarios; validar restricciones de claves foraneas y roles existentes.
2. Inventariar endpoints y componentes afectados (trabajos, usuarios, reportes) para dimensionar impactos.
3. Diseñar mockups de pantalla de clientes, selector de clientes en trabajos y dashboard de aprobaciones junto al equipo de UX.
4. Definir plan de migracion de datos y estrategia de rollback para asociar trabajos con clientes.

## Fase 1 · Backend Fundacional

1. [x] Crear entidad `Cliente` con migración (`1760745600000-CreateClientes.ts`) y normalización de RFC.
2. [x] Actualizar entidad `Trabajo` para referenciar `clienteId`, `miembroAsignadoId` y estados extendidos (`EN_REVISION`, `APROBADO`, `REABIERTO`).
3. [x] Implementar servicios REST para clientes (`/clientes`) con `JwtAuthGuard` + `RolesGuard` (Admin/Gestor).
4. [x] Ajustar servicios de trabajos para usar `clienteId` y filtrar por visibilidad basada en rol (RolesGuard activo, filtros por equipo y asignación aplicados).
5. [x] Agregar relación `Equipo` ↔ `Usuario` (gestor propietario, miembros). Actualizar DTOs y repositorios.
6. [ ] Emitir eventos de dominio / logs cuando se creen clientes, se cambie asignación de trabajos o estado.
7. [x] Actualizar autenticación (JWT claims) para incluir `rol` y `equipoId`; `AuthContext` y servicios frontend ya lo consumen.
8. [ ] Extender entidad `Mes` con campos de aprobación (`estadoRevision`, `fechaAprobacion`, `aprobadoPorId`, `comentarioGestor`) y servicios `PATCH /meses/:id/aprobar|reabrir` con auditoría.
9. [ ] Sincronizar `TrabajosService` para que `estadoAprobacion` agregue el estado global (todo aprobado) derivado de los meses; mover lógica de solo lectura a nivel de mes desde el backend.

## Fase 2 · Frontend Funcional

1. [x] Construir módulo `features/clientes` con rutas, lista y formulario reutilizando componentes existentes.
2. [x] Crear hook `useClienteSearch` con debounce y exponer `ClienteSelector` reusable.
3. [x] Actualizar flujo de creación/edición de trabajo para usar `ClienteSelector` y asignación de miembro.
4. [x] Implementar permisos en UI: ocultar acciones de crear/editar clientes y trabajos a usuarios sin rol Gestor/Admin.
5. [x] Generar dashboard de aprobaciones para Gestores (`features/trabajos/aprobaciones`) conectado al endpoint real con filtros opcionales.
6. [x] Añadir filtros por año/cliente/texto en listado de trabajos con persistencia de preferencias (`useTrabajosFilters`).
7. [x] Aplicar estados de solo lectura cuando el trabajo esté `APROBADO`, permitiendo reapertura controlada desde `TrabajoDetail`.
8. [x] Simplificar encabezado del reporte mensual y condicionar acciones según coincidencia de totales.
9. [x] Exponer totales consolidados del reporte base anual (Mi Admin, Auxiliar y diferencia) en el encabezado (`ReporteAnualHeader`).
10. [ ] Ajustar `TrabajoDetail`/`ReporteMensualViewer` para bloquear importaciones/edición por mes según `estadoRevision` y mostrar historiales de aprobación.
11. [ ] Incorporar panel de control en `AprobacionesDashboard` para listar meses pendientes/aprobados y acciones rápidas (`aprobar`, `reabrir`).
12. [ ] Añadir feedback en UI (badges, tooltips) diferenciando bloqueos por mes vs. trabajo completo y permitir reabrir periodos con comentario obligatorio.

## Fase 3 · QA y Migracion

1. [ ] Desarrollar pruebas unitarias para servicios backend (clientes, visibilidad, permisos, transiciones de estado).
2. [ ] Extender pruebas E2E (Cypress/Playwright) cubriendo flujos: create cliente, asignar trabajo, completar, aprobar.
3. [ ] Cubrir transición mensual en pruebas E2E: miembro entrega mes → gestor aprueba → mes se bloquea; validar reapertura con comentario.
4. [ ] Preparar script de migracion de datos históricos (solo necesario si se cargan datos legados; actualmente el entorno es de desarrollo).
5. [ ] Ejecutar migracion en staging, validar integridad, ajustar reportes y dashboards.
6. [ ] Coordinar pruebas de regresion en reportes consolidados para garantizar no hay impactos.

## Fase 4 · Lanzamiento y Seguimiento

1. Planificar despliegue con feature flags para nuevos permisos y visibilidad.
2. Comunicar cambios a usuarios Gestores y Miembros, entregar manual rapido.
3. Monitorear logs/auditoria las primeras semanas; ajustar alertas si se detectan errores de permisos.
4. Recopilar feedback y priorizar mejoras incrementales (p. ej. campos adicionales de cliente, reportes por equipo).

## Entregables Clave

- Migraciones backend + endpoints actualizados.
- Nuevos modulos frontend (clientes, aprobaciones, filtros de trabajos).
- Flujos de aprobación mensual con UI actualizada y bloqueos de edición por periodo.
- Documentacion de esquemas y roles actualizada.
- Scripts de migracion + plan de contingencia.
- Suite de pruebas automatizadas ampliada.

## Dependencias

- Coordinacion con equipo de datos para migracion de trabajos.
- Aprobacion de UX para diseños de pantallas.
- Disponibilidad del equipo DevOps para ajustes de despliegue/feature flags.
