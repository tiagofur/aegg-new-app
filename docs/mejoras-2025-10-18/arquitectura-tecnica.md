# Arquitectura Tecnica Propuesta

## Modelo de Datos

### Estado actual (2025-10-18)

**Tabla `users`**

- Columnas: `id` (uuid), `email` (único), `password`, `name`, `role` (`Admin`|`Gestor`|`Miembro`), `equipo_id` (uuid, nullable), `createdAt`, `updatedAt`.
- Restricciones: índice único sobre `email`; enum de roles en `auth/entities/user.entity.ts`; FK opcional `equipo_id → equipos.id` con `ON DELETE SET NULL`.
- Observaciones: JWT retorna `equipoId`; el servicio de usuarios valida existencia/estado del equipo antes de asignar.

**Tabla `equipos`**

- Columnas: `id` (uuid), `nombre`, `activo` (bool), `gestor_id` (uuid nullable), `created_at`, `updated_at`.
- Restricciones: PK en `id`; `gestor_id` referencial (pendiente de FK explícita si se requiere enforcement adicional).
- Observaciones: sirve como catálogo para visibilidad; resta construir servicios/UI de administración y asignación masiva de miembros.

**Tabla `clientes`**

- Columnas: `id`, `nombre`, `rfc`, `razon_social`, `direccion` (jsonb), `contacto_principal` (jsonb), `metadata` (jsonb, default `{}`), `created_by`, `created_at`, `updated_at`.
- Restricciones: índice por `nombre` y `rfc` único (`IDX_clientes_rfc`).
- Observaciones: los campos JSON permiten extensiones sin migraciones adicionales.

**Tabla `trabajos`**

- Columnas: `id`, `clienteNombre`, `clienteRfc`, `anio`, `clienteId` (uuid), `miembroAsignadoId` (uuid), `estado` (`ACTIVO`|`INACTIVO`|`COMPLETADO`), `estado_aprobacion` (`EN_PROGRESO`|`EN_REVISION`|`APROBADO`|`REABIERTO`), `fecha_aprobacion`, `aprobado_por_id`, `visibilidad_equipo` (bool), `fechaCreacion`, `fechaActualizacion`.
- Restricciones: índice único `IDX_trabajos_cliente_anio` sobre (`clienteId`, `anio`); FKs nuevas hacia `clientes.id` y `users.id` (`miembroAsignadoId`, `aprobado_por_id`) con `ON DELETE SET NULL`.
- Observaciones: `usuarioAsignadoId` fue reemplazado por `miembroAsignadoId`; la migración sólo copia valores, no introduce filtros por rol.

**Tabla `meses`**

- Columnas actuales: `id`, `trabajoId`, `mes`, `estado` (`PENDIENTE`|`EN_PROCESO`|`COMPLETADO`), `fechaCreacion`, `fechaActualizacion`.
- Extensiones planificadas: `estado_revision` (`EN_PROCESO`|`EN_REVISION`|`APROBADO`|`REABIERTO`), `fecha_envio_revision`, `fecha_aprobacion`, `aprobado_por_id`, `comentario_gestor` y bandera derivada `bloqueado`.
- Restricciones: índice único (`trabajoId`, `mes`); FK `trabajoId → trabajos.id` con `onDelete: CASCADE`; nueva FK `aprobado_por_id → users.id` con `SET NULL`.
- Observaciones: `estado_revision` controlará permisos de edición por periodo y permitirá calcular el estado global del trabajo.

**Tabla `reportes_base_anual`**

- Columnas: `id`, `trabajoId` (único), `archivoUrl?`, `mesesCompletados` (array int), `hojas` (jsonb), timestamps.
- Restricciones: FK `trabajoId → trabajos.id` con `onDelete: CASCADE`.

**Tabla `reportes_mensuales`**

- Columnas: `id`, `mesId`, `tipo`, `archivoOriginal?`, `datos` (jsonb), `estado`, fechas de importación/procesado, `fechaCreacion`.
- Restricciones: índice único (`mesId`, `tipo`); FK `mesId → meses.id` con `onDelete: CASCADE`.

**Tabla `reportes_anuales`**

- Columnas: `id`, `trabajoId`, `anio`, `mes`, `ventas?`, `ventasAuxiliar?`, `diferencia?`, `confirmado`, timestamps.
- Restricciones: índices en (`trabajoId`, `anio`, `mes`); FK `trabajoId → trabajos.id` con `onDelete: CASCADE`.

**Brechas identificadas para el roadmap**

- Falta migrar datos históricos de `trabajos` para poblar `clienteId` y eliminar dependencias en `clienteNombre`/`clienteRfc` libres.
- Aún no existe historial de aprobaciones/asignaciones; los estados se sobrescriben sin auditoría dedicada.
- Faltan endpoints para transicionar estados (aprobar, reabrir, comentar) y emitir eventos/notificaciones asociadas.
- No hay estado de aprobación a nivel de mes; edición y bloqueo siguen dependiendo del estado global del trabajo.
- Resta exponer servicios y UI para gestionar equipos (creación, activación, asignación masiva) y amarrar miembros a gestores.

### Nuevas Entidades y Relaciones

- `clientes` ✅
  - Ya disponible con índices por `nombre` y `rfc`; resta poblar `created_by` al integrar auditoría real.
- `trabajos` ✅ (actualización aplicada)
  - Incluye `clienteId`, `miembroAsignadoId`, `estado_aprobacion`, `aprobado_por_id` y `visibilidad_equipo`.
- `usuarios` ✅ (extensión aplicada)
  - `equipo_id` disponible con FK a `equipos`; JWT propaga el claim y `UsersService` permite asignarlo/quitarlo.
- `equipos` ✅ (estructura base lista)
  - Catálogo simple con `activo` y `gestor_id`; falta servicio/UI especializada para administrarlo.
- `trabajo_historial_estados` (nueva entidad pendiente)
  - Registrar cambios de estado/asignación con `usuario_id`, `comentario` y `timestamp`.
- `mes_historial_estados` (nueva entidad planificada)
  - Registrar transiciones de revisión mensual (envío, aprobación, reapertura) con comentario y usuario responsable.

### Migraciones

- ✅ `1760745600000-CreateClientes.ts`: tabla `clientes` con índices por `nombre` y `rfc`.
- ✅ `1760745602000-UpdateTrabajosAddClienteRelation.ts`: columnas `clienteId`, `miembroAsignadoId`, `estado_aprobacion`, `aprobado_por_id`, `visibilidad_equipo` y migración de `usuarioAsignadoId`.
- ✅ `1761264000000-CreateEquiposAndAssignUsers.ts`: crea tabla `equipos`, agrega `users.equipo_id` y FK opcional.
- ⏳ Script de datos para poblar `clienteId` en trabajos históricos y depurar registros duplicados/ambiguos.
- ⏳ Crear tabla `equipos` + FK `users.equipo_id`.
- ⏳ Crear tabla `trabajo_historial_estados` para auditoría de aprobaciones y asignaciones.
- ⏳ Migración para extender `meses` con columnas de aprobación y crear `mes_historial_estados` (con retrocarga de estados actuales).

### Plan de migracion historica y rollback (borrador 2025-10-18)

**Precondiciones**

- Congelar cambios manuales en `trabajos` durante la ventana de migracion.
- Respaldar tablas `trabajos`, `reportes_base_anual`, `reportes_mensuales`, `reportes_anuales`, `users` (dump SQL + snapshot de storage si aplica).
- Confirmar catalogo de usuarios (Gestores/Miembros) y su relacion actual con trabajos.

**Pasos propuestos**

1. Crear staging table `clientes_tmp` con columnas `nombre_normalizado`, `rfc_normalizado`, `cliente_id` para agrupar candidatos (la tabla `clientes` final ya existe).
2. Poblar `clientes_tmp` a partir de `trabajos` aplicando reglas:

- Si `clienteRfc` no es nulo → usar RFC normalizado (trim, mayusculas).
- Si `clienteRfc` es nulo → agrupar por `clienteNombre` normalizado; marcar registros ambiguos para revision manual.

3. Insertar en `clientes` desde `clientes_tmp`, generando nuevos UUID y guardando referencia a `cliente_id` temporal (solo para registros nuevos; respetar clientes ya creados manualmente).
4. Actualizar `trabajos`:

- Setear `cliente_id` usando mapping `clientes_tmp`.
- Renombrar `usuarioAsignadoId` → `miembro_asignado_id` (mantener valores existentes).
- Inicializar `estado_aprobacion` en `EN_PROGRESO` para trabajos activos; `COMPLETADO` → `APROBADO`.

5. Generar registros en `trabajo_historial_estados` con entrada inicial por trabajo (`estado_previo = null`, `estado_nuevo` igual al actual, `registrado_por = usuarioAsignadoId` cuando aplique) una vez exista la tabla.
6. Migrar equipos:

- Crear equipo por Gestor existente (`equipos`: `nombre` derivado del usuario, `gestor_id` = id).
- Actualizar `users` con `equipo_id` usando trabajos actuales como referencia (miembro pertenece al equipo del Gestor de su trabajo más reciente; en caso de conflicto, asignar manualmente).

7. Ejecutar validaciones: conteo de trabajos por cliente, comparación de totales con tabla previa, verificación de índice único (`cliente_id`, `anio`).

**Rollback (en caso de error)**

1. Desactivar feature flags o tráfico hacia endpoints nuevos.
2. Revertir migraciones TypeORM (`migration:revert`) para eliminar estructuras nuevas.
3. Restaurar backups de tablas afectadas (`trabajos`, `reportes_*`, `users`).
4. Limpiar datos residuales (`clientes`, `equipos`, `trabajo_historial_estados`).
5. Comunicar a DevOps/usuarios el estado y planificar nueva ventana.

**Validaciones posteriores**

- Consultas de verificación (`SELECT COUNT(*)` por cliente, comparación entre `clienteNombre` original y join con `clientes`).
- Pruebas de endpoints legacy para asegurar compatibilidad mientras se despliega frontend.
- Reporte resumido con clientes creados, trabajos reubicados y registros ambiguos pendientes de depurar.

## API Backend (NestJS)

### Endpoints Nuevos

- ✅ `POST /clientes`, `GET /clientes`, `GET /clientes/:id`, `PUT /clientes/:id`, `DELETE /clientes/:id` (Gestor/Admin).
- ⏳ `POST /equipos`, `PUT /equipos/:id/miembros` (no implementado).
- ✅ `GET /trabajos/aprobaciones/dashboard` (agregaciones por estado con filtros opcionales; se extenderá con métricas por mes y vínculos a acciones de transición).
- ⏳ `PATCH /meses/:id/aprobar`, `PATCH /meses/:id/reabrir` (comentario obligatorio, recalculo de estado global, publicación de evento `mes.aprobado`).
- ⏳ `GET /meses/pendientes` (consumido por dashboard para obtener backlog mensual por equipo/cliente).

### Endpoints Ajustados

- `POST /trabajos`: `TrabajosService` exige `clienteId`, valida duplicados y ahora solo permite crear a Admin/Gestor, verificando que el miembro asignado pertenezca al equipo del Gestor.
- `PATCH /trabajos/:id`: restringido a Admin/Gestor; valida reasignaciones dentro del equipo y mantiene sincronía de cliente/miembro asignado.
- `GET /trabajos`: aplica filtros por equipo/ownership para Gestores y miembros; soporta el query legacy `miembroId` pero se filtra según visibilidad.
- `POST /trabajos/:id/reporte-base/importar`: limitado a Admin/Gestor; reutiliza FileInterceptor con validación previa.

### Autorizacion y Guards

- `RolesGuard` se aplica en `/clientes`, `/trabajos`, `/trabajos/aprobaciones` y `/users`; `CurrentUser` propaga `equipoId` para los checks.
- `TrabajosService` implementa restricciones por rol, equipo y miembro asignado; falta extraer la política a un helper reutilizable y cubrirla con pruebas.
- Restan decorar/implementar endpoints de transición (aprobar, reabrir) y extender guards a módulos complementarios (`meses`, `reportes`) con validación de comentario requerido.

### Servicios y Casos de Uso

- `ClientesService`: concentra validaciones de RFC, duplicados y prepara el terreno para auditoría.
- `TrabajosService`: hoy expone `create`, `findAll`, `findOne`, `update`, `remove` e importación del reporte base; aún no implementa casos de uso específicos de aprobación ni reasignación dedicados.
- `EquiposService`: pendiente de creación junto con la entidad `equipos`.
- `AprobacionesService`: agrega datos del dashboard de aprobaciones respetando restricciones por equipo y estado.
- `MesesService` (plan): manejará `aprobar`, `reabrir`, persistir comentarios y sincronizar el estado global del trabajo con base en los periodos aprobados.

## Frontend (React + Vite)

### Avance al 2025-10-18 (iteración actual)

- `ClienteFormModal` se reutiliza en los diálogos de crear/editar trabajos con callbacks consistentes (`onSaved`, `onClose`) y refresco inmediato del selector compartido.
- `ClienteSelector` expone métodos `refresh`/`loadCliente` mediante `forwardRef`, habilitando búsquedas con debounce (`useClienteSearch`) y carga diferida de clientes.
- `TrabajosList` integra filtros persistentes (`useTrabajosFilters`), badges de estado y contadores por cliente; `TrabajoDetail` bloquea acciones en modo solo lectura cuando el trabajo está aprobado.
- `AprobacionesPage` y `AprobacionesDashboard` ya ofrecen UI interactiva con estados, pendientes y línea de tiempo; consumen el endpoint real y mantienen mocks en pruebas unitarias.
- Vitest + Testing Library cubren módulos clave: `ClientesTable`, `ClienteFormModal` embebido en diálogos de trabajo, `ClientesPage` y el hook `useAprobacionesDashboard`.

### Estructura actual (resumen)

```
frontend/src/features/
  clientes/
    components/
    hooks/
  trabajos/
    aprobaciones/
      components/
      __tests__/
    filters/
      __tests__/
    reportes/
  dashboard/
context/
components/trabajos/
pages/
  __tests__/
```

### Flujo de UI

1. Gestor ingresa a "Clientes" → crea cliente con Nombre/RFC.
2. Gestor crea trabajo → busca cliente por nombre/RFC → asigna miembro → trabajo visible solo para ambos.
3. Miembro actualiza progreso y envía el mes a revisión; el periodo queda bloqueado mientras espera respuesta.
4. Gestor ve en dashboard de aprobaciones los meses `EN_REVISION` → aprueba (mes pasa a solo lectura) o reabre con comentario → periodo vuelve a edición.
5. Cuando todos los meses están aprobados, el trabajo se marca como cerrado; reabrir un mes vuelve a habilitar las pantallas asociadas.

### Estado Global y Cache

- Usar React Query para sincronizar clientes, trabajos, equipos; cache invalidation cuando se creen/editen.
- Guardar filtros en `localStorage` con hook `usePersistentFilters`.

## Seguridad y Auditoria

- Registrar acciones clave en tabla de auditoria existente (`userId`, `accion`, `entidad`, `payload`) y reflejar aprobaciones mensuales (comentario, timestamp, usuario).
- Emitir eventos para integracion futura con notificaciones (email/slack).
- Revisar politicas de CORS/permisos para asegurar que solo roles autorizados puedan acceder a endpoints nuevos.

## Integracion con Reportes

- Actualizar queries de reportes que dependan de campos `clienteNombre`/`clienteRFC` para usar join con tabla `clientes`.
- Garantizar que reportes historicos sigan funcionando usando vistas materializadas o column alias.

## Plan de Feature Flags

- `ff_clientes_module`: controla visibilidad del modulo de clientes en frontend.
- `ff_trabajos_visibility`: habilita nuevo esquema de permisos y visibilidad por equipo.
- `ff_trabajos_aprobacion`: activa flujo de aprobación mensual (endpoints `meses/*`, UI jerárquica y bloqueo por periodo).

## Telemetria y Monitoreo

- Añadir metricas: conteo de clientes nuevos, trabajos asignados, tiempo promedio de aprobacion.
- Alertar si un trabajo permanece en `EN_REVISION` mas de X dias.
