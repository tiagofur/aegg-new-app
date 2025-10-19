# Arquitectura Tecnica Propuesta

## Modelo de Datos

### Estado actual (2025-10-18)

**Tabla `users`**

- Campos: `id` (uuid), `email` (único), `password`, `name`, `role` (`Admin`|`Gestor`|`Miembro`), `createdAt`, `updatedAt`.
- Restricciones: índice único sobre `email`; enum de roles definido en `auth/entities/user.entity.ts`; sin referencia a equipos ni claims adicionales.

**Tabla `trabajos`**

- Campos: `id` (uuid), `clienteNombre`, `clienteRfc?`, `anio`, `usuarioAsignadoId`, `estado` (`ACTIVO`|`INACTIVO`|`COMPLETADO`), `fechaCreacion`, `fechaActualizacion`.
- Restricciones: índice único `IDX_165096a68be634ca21347c5651` en (`clienteNombre`, `anio`); FK implícita `usuarioAsignadoId → users.id` sin `onDelete` específico.
- Observaciones: la información de cliente reside como texto (sin entidad dedicada); el usuario asignado es obligatorio desde la creación.

**Tabla `meses`**

- Campos: `id`, `trabajoId`, `mes`, `estado` (`PENDIENTE`|`EN_PROCESO`|`COMPLETADO`), `fechaCreacion`, `fechaActualizacion`.
- Restricciones: índice único (`trabajoId`, `mes`); FK `trabajoId → trabajos.id` con `onDelete: CASCADE`.

**Tabla `reportes_base_anual`**

- Campos: `id`, `trabajoId` (único), `archivoUrl?`, `mesesCompletados` (array int), `hojas` (jsonb), timestamps.
- Restricciones: FK `trabajoId → trabajos.id` con `onDelete: CASCADE`.

**Tabla `reportes_mensuales`**

- Campos: `id`, `mesId`, `tipo`, `archivoOriginal?`, `datos` (jsonb), `estado`, fechas de importación/procesado, `fechaCreacion`.
- Restricciones: índice único (`mesId`, `tipo`); FK `mesId → meses.id` con `onDelete: CASCADE`.

**Tabla `reportes_anuales`**

- Campos: `id`, `trabajoId`, `anio`, `mes`, `ventas?`, `ventasAuxiliar?`, `diferencia?`, `confirmado`, timestamps.
- Restricciones: índices en (`trabajoId`, `anio`, `mes`); FK `trabajoId → trabajos.id` con `onDelete: CASCADE`.

**Brechas identificadas para el roadmap**

- No existe entidad `clientes`; los campos actuales deben migrarse de `trabajos` y normalizar RFCs.
- No hay tabla `equipos` ni columna `equipoId` en `users`; será necesaria para visibilidad basada en equipo.
- Los estados de trabajos no contemplan aprobaciones (`EN_REVISION`, `APROBADO`, `REABIERTO`) ni se maneja historial.
- `usuarioAsignadoId` es obligatorio y único campo de relación; se tendrá que revisar nullable/renombrado a `miembroAsignadoId` para permitir configuraciones posteriores.
- Auditoría y eventos dependen de extensiones futuras; actualmente solo timestamps automáticos.

### Nuevas Entidades y Relaciones

- `clientes`
  - `id` (uuid)
  - `nombre` (string, required)
  - `rfc` (string, required, unique, normalizado en mayusculas)
  - `razon_social` (string, opcional)
  - `direccion` (jsonb o campos compuestos opcionales)
  - `contacto_principal` (jsonb opcional con nombre, correo, telefono)
  - `metadata` (jsonb para extensiones futuras)
  - `created_at`, `updated_at`, `created_by`
- `equipos`
  - `id` (uuid)
  - `nombre` (string)
  - `gestor_id` (fk usuarios)
  - `activo` (bool)
  - `created_at`, `updated_at`
- `usuarios`
  - Agregar `equipo_id` (fk equipos, nullable para Admin)
  - Campo `rol` normalizado (enum: `ADMIN`, `GESTOR`, `MIEMBRO`)
- `trabajos`
  - Agregar `cliente_id` (fk clientes, not null tras migracion)
  - Agregar `miembro_asignado_id` (fk usuarios, nullable hasta asignacion inicial)
  - Agregar `estado_aprobacion` (enum: `EN_PROGRESO`, `EN_REVISION`, `APROBADO`, `REABIERTO`)
  - Agregar `fecha_aprobacion` y `aprobado_por`
  - Agregar `visibilidad_equipo` (bool) si se requiere futuras expansiones
- `trabajo_historial_estados`
  - Mantener tracking de asignaciones y cambios de estado (gestor, miembro, timestamp, comentario)

### Migraciones

1. Crear tabla `clientes` y migrar datos iniciales desde trabajos existentes (agrupacion por RFC/nombre para evitar duplicados).
2. Agregar columnas a `trabajos`, poblar `cliente_id` con los nuevos registros y `miembro_asignado_id` (valor por defecto null).
3. Crear tabla `equipos` y asociar Gestores actuales; actualizar usuarios miembros con su equipo.
4. Generar tabla `trabajo_historial_estados` para trazabilidad.

### Plan de migracion historica y rollback (borrador 2025-10-18)

**Precondiciones**

- Congelar cambios manuales en `trabajos` durante la ventana de migracion.
- Respaldar tablas `trabajos`, `reportes_base_anual`, `reportes_mensuales`, `reportes_anuales`, `users` (dump SQL + snapshot de storage si aplica).
- Confirmar catalogo de usuarios (Gestores/Miembros) y su relacion actual con trabajos.

**Pasos propuestos**

1. Crear staging table `clientes_tmp` con columnas `nombre_normalizado`, `rfc_normalizado`, `cliente_id` para agrupar candidatos.
2. Poblar `clientes_tmp` a partir de `trabajos` aplicando reglas:

- Si `clienteRfc` no es nulo → usar RFC normalizado (trim, mayusculas).
- Si `clienteRfc` es nulo → agrupar por `clienteNombre` normalizado; marcar registros ambiguos para revision manual.

3. Insertar en `clientes` desde `clientes_tmp`, generando nuevos UUID y guardando referencia a `cliente_id` temporal.
4. Actualizar `trabajos`:

- Setear `cliente_id` usando mapping `clientes_tmp`.
- Renombrar `usuarioAsignadoId` → `miembro_asignado_id` (mantener valores existentes).
- Inicializar `estado_aprobacion` en `EN_PROGRESO` para trabajos activos; `COMPLETADO` → `APROBADO`.

5. Generar registros en `trabajo_historial_estados` con entrada inicial por trabajo (`estado_previo = null`, `estado_nuevo` igual al actual, `registrado_por = usuarioAsignadoId` cuando aplique).
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

- `POST /clientes`
- `GET /clientes` (paginacion, filtros `search`, `rfc`, `page`, `limit`)
- `GET /clientes/:id`
- `PUT /clientes/:id`
- `DELETE /clientes/:id` (soft delete recomendado)
- `POST /equipos`
- `PUT /equipos/:id/miembros`
- `GET /trabajos/aprobaciones?mes=YYYY-MM`

### Endpoints Ajustados

- `POST /trabajos`: requiere `clienteId`, `miembroAsignadoId`, valida rol Gestor.
- `PUT /trabajos/:id`: valida visibilidad y rol. Solo Gestor puede reabrir o cambiar estado a `EN_REVISION`/`APROBADO`.
- `GET /trabajos`: filtros `anio`, `clienteId`, `search`. Limitar resultados a gestor creador o miembro asignado.
- `PATCH /trabajos/:id/completar`: accesible al miembro asignado.
- `PATCH /trabajos/:id/aprobar`: accesible al gestor creador.

### Autorizacion y Guards

- Crear `RolesGuard` extendido para manejar permisos combinados (rol + ownership/assignment).
- Introducir `VisibilityPolicy` reutilizable para trabajos, invocada en cada servicio.
- Ajustar decoradores personalizados (`@Roles('GESTOR')`) y aplicarlos en controladores afectados.

### Servicios y Casos de Uso

- `ClientesService`: validaciones centralizadas (RFC, duplicados, auditoria).
- `TrabajosService`: metodos `asignarMiembro`, `marcarCompletado`, `aprobar`, `reabrir` con transacciones.
- `EquiposService`: manejo de miembros y notificaciones.

## Frontend (React + Vite)

### Estructura Propuesta

```
frontend/src/features/
  clientes/
    components/
      ClienteForm.tsx
      ClienteList.tsx
      ClienteSelector.tsx
    hooks/
      useClienteSearch.ts
      useClienteForm.ts
    pages/
      ClientesDashboard.tsx
  trabajos/
    components/
      TrabajoForm.tsx
      TrabajoFilters.tsx
      TrabajoApprovalCard.tsx
    hooks/
      useTrabajoFilters.ts
      useTrabajoPermissions.ts
    pages/
      TrabajosList.tsx
      TrabajoAprobaciones.tsx
  equipos/
    components/
      EquipoMembersForm.tsx
    hooks/
      useEquipo.ts
common/
  hooks/
    useDebouncedValue.ts
    useAuthorization.ts
  utils/
    rfc.ts
    formValidators.ts
  context/
    AuthContext.tsx (extender para rol/equipo)
```

### Flujo de UI

1. Gestor ingresa a "Clientes" → crea cliente con Nombre/RFC.
2. Gestor crea trabajo → busca cliente por nombre/RFC → asigna miembro → trabajo visible solo para ambos.
3. Miembro actualiza progreso y marca completado.
4. Gestor ve en dashboard de aprobaciones los trabajos `EN_REVISION` del mes → revisa → aprueba → trabajo pasa a modo lectura.
5. Si requiere cambios, Gestor reabre trabajo → vuelve a estado editable.

### Estado Global y Cache

- Usar React Query para sincronizar clientes, trabajos, equipos; cache invalidation cuando se creen/editen.
- Guardar filtros en `localStorage` con hook `usePersistentFilters`.

## Seguridad y Auditoria

- Registrar acciones clave en tabla de auditoria existente (`userId`, `accion`, `entidad`, `payload`).
- Emitir eventos para integracion futura con notificaciones (email/slack).
- Revisar politicas de CORS/permisos para asegurar que solo roles autorizados puedan acceder a endpoints nuevos.

## Integracion con Reportes

- Actualizar queries de reportes que dependan de campos `clienteNombre`/`clienteRFC` para usar join con tabla `clientes`.
- Garantizar que reportes historicos sigan funcionando usando vistas materializadas o column alias.

## Plan de Feature Flags

- `ff_clientes_module`: controla visibilidad del modulo de clientes en frontend.
- `ff_trabajos_visibility`: habilita nuevo esquema de permisos y visibilidad por equipo.
- `ff_trabajos_aprobacion`: activa flujo de aprobacion mensual.

## Telemetria y Monitoreo

- Añadir metricas: conteo de clientes nuevos, trabajos asignados, tiempo promedio de aprobacion.
- Alertar si un trabajo permanece en `EN_REVISION` mas de X dias.
