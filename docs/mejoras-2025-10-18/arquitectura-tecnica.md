# Arquitectura Tecnica Propuesta

## Modelo de Datos

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
