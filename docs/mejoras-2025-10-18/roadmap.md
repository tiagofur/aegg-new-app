# Roadmap de Implementacion (2025-10-18)

## Estado al 2025-10-18

- [x] Consolidar `ClienteFormModal` como componente compartido en los diálogos de trabajo con refresco del selector.
- [x] Levantar infraestructura de pruebas en frontend con Vitest + Testing Library y cubrir flujos críticos de cliente/trabajo.
- [x] Exponer los componentes del módulo `features/clientes` (`ClienteSelector`, `ClienteFormModal`, `ClientesTable`) conectados a `ClientesPage` y `CreateTrabajoDialog`.
- [x] Integrar permisos fine-grained en backend (`TrabajosController` ahora usa `JwtAuthGuard` + `RolesGuard`, valida ownership y visibilidad por equipo).
- [x] Desplegar dashboard de aprobaciones con datos reales (endpoint `/trabajos/aprobaciones/dashboard` disponible y agregaciones conectadas).
- [x] Sembrar usuario administrador base (`admin@example.com`), validar login contra backend en caliente y documentar el flujo de arranque.
- [ ] Alinear aprobaciones mensuales: diseño pactado (esta iteración) + backlog levantado para backend/frontend/QA.

## Próxima Iteración · Orden 1 → 2 → 3

1. **Migraciones aprobación mensual**
   - Preparar migración TypeORM `1761801600000-ExtendMesesWithRevision.ts` agregando columnas:
     - `estado_revision` (`varchar`, default `'EN_PROCESO'`, check enumerado).
     - `fecha_envio_revision` (`timestamp with time zone`, nullable).
     - `fecha_aprobacion` (`timestamp with time zone`, nullable).
     - `aprobado_por_id` (`uuid`, FK a `users.id`, `SET NULL`).
     - `comentario_gestor` (`text`, default `null`).
     - `bloqueado` (`boolean`, default `false`, virtual en código; no se materializa si basta con derived prop).
   - Crear tabla `mes_historial_estados` con columnas (`id`, `mes_id`, `estado_anterior`, `estado_nuevo`, `comentario`, `registrado_por`, `created_at`). Índices: FK `mes_id`, `registrado_por`, timestamp para auditoría.
   - Script de retrocarga:
     - Setear `estado_revision = 'APROBADO'` donde `trabajos.estado_aprobacion = 'APROBADO'` y el mes no está en progreso.
     - Caso contrario dejar `estado_revision = 'EN_PROCESO'` y `fecha_envio_revision = now()` si `estado = 'EN_PROCESO'`.
     - Insertar entrada inicial en `mes_historial_estados` con `estado_nuevo = estado_revision`.
   - Validaciones post migración: contar meses por estado, verificar FKs (`SELECT count(*) FROM meses WHERE aprobado_por_id IS NOT NULL AND NOT EXISTS ...`).
   - Plan de rollback: `migration:revert`, truncar `mes_historial_estados`, quitar columnas, restaurar dump. Coordinar feature flag `ff_trabajos_aprobacion` para aislar despliegue.
2. **Contratos FE/BE**
   - Especificar endpoints:
     - `PATCH /meses/:id/aprobar`
       - Body: `{ comentario: string }` (opcional pero se recomienda), server fija `estado_revision = 'APROBADO'`, `fecha_aprobacion = now()`, `aprobado_por_id` = usuario actual.
       - Respuesta 200: `{ id, estadoRevision, fechaAprobacion, aprobadoPor { id, nombre }, comentarioGestor }`.
       - Errores: `409` si el mes ya está aprobado, `403` si rol/ equipo inválido.
     - `PATCH /meses/:id/reabrir`
       - Body: `{ comentario: string }` obligatorio, cambia `estado_revision = 'REABIERTO'`, limpia `fecha_aprobacion`.
       - Respuesta 200 similar a aprobar, con `fechaAprobacion = null`.
     - `GET /meses/pendientes`
       - Query: `equipoId?`, `clienteId?`, `mes?`, `estado?`.
       - Respuesta: `{ items: [{ trabajoId, trabajoNombre, clienteNombre, mesNumero, estadoRevision, fechaEnvioRevision, miembroAsignado { id, nombre } }], meta: { total, filtros } }`.
   - Actualizar DTOs en backend (`backend/src/meses/dto/approve-mes.dto.ts`, `reopen-mes.dto.ts`, `pending-meses.dto.ts`) y contratos en frontend (`frontend/src/types/mes.ts`, `frontend/src/services/meses.service.ts`).
   - Documentar eventos de dominio: emitir `MesAprobadoEvent`, `MesReabiertoEvent` para logging/notificaciones.
   - Ajustar `trabajosService.getAprobacionesDashboard` para incluir arreglo `mesesPendientes` y `mesesAprobadosRecientes` alimentados por el nuevo endpoint.
3. **Plan de pruebas**
   - Unitarias backend:
     - `MesesService.aprobar` y `.reabrir` con mocks de repos para validar permisos, transiciones y registros en historial.
     - Guards `RolesGuard` + nueva policy `CanManageMesGuard` asegurando que el gestor corresponde al equipo.
     - Repositorio `MesHistorialEstadosRepository` creando y listando eventos.
   - Contract/API tests (Supertest): happy path aprobación/reapertura, errores 403/404/409, formato de respuesta.
   - Frontend unit/integration (Vitest): hooks `useAprobacionesDashboard`, `useMesActions` cubriendo estados loading/success/error.
   - E2E (Cypress/Playwright):
     - Miembro carga reporte → envía mes → se bloquea UI.
     - Gestor aprueba desde dashboard → verifica solo lectura y badge.
     - Gestor reabre con comentario → miembro ve mes editable, historial muestra evento.
   - Métricas de aceptación: todo mes aprobado en un trabajo dispara `estadoAprobacion` global, reapertura de un mes desbloquea únicamente ese periodo, historial conserva secuencia.

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
8. [ ] Extender entidad `Mes` con campos de aprobación (`estadoRevision`, `fechaEnvioRevision`, `fechaAprobacion`, `aprobadoPorId`, `comentarioGestor`) y crear tabla `mes_historial_estados` con migración/relleno inicial.
9. [ ] Publicar endpoints `PATCH /meses/:id/aprobar|reabrir`, `GET /meses/pendientes`, actualizar auditoría y sincronizar `TrabajosService` para que `estadoAprobacion` derive del consolidado de meses.

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
