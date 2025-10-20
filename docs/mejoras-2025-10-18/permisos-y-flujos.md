# Permisos y Flujos Operativos

## Matriz de Roles

| Accion                         | Admin                       | Gestor                                                                             | Miembro                       |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| Crear/editar clientes          | ✔️                          | ✔️                                                                                 | ❌                            |
| Eliminar clientes              | ✔️ (si no tiene trabajos)   | ✔️ (si no tiene trabajos)                                                          | ❌                            |
| Ver todos los clientes         | ✔️                          | ✔️ (sin limitar por equipo)                                                        | ❌                            |
| Crear trabajos                 | ✔️                          | ✔️                                                                                 | ❌                            |
| Editar trabajos                | ✔️                          | ✔️ (UI restringe por creador)                                                      | ✔️ (solo campos de ejecución) |
| Reabrir trabajos               | ✔️                          | ✔️ (UI restringe por creador)                                                      | ❌                            |
| Asignar miembro a trabajo      | ✔️                          | ✔️ (UI restringe por creador)                                                      | ❌                            |
| Ver trabajos del equipo        | ✔️ (todos)                  | ✔️ (su equipo cuando `visibilidadEquipo` es true; global si el trabajo es público) | ✔️ (solo asignados)           |
| Marcar trabajo como completado | ✔️                          | ✔️ (si asignado)                                                                   | ✔️ (si asignado)              |
| Aprobar trabajo                | ✔️                          | ✔️ (UI restringe por creador)                                                      | ❌                            |
| Aprobar mes (plan)             | ✔️ (cuando se active flujo) | ✔️ (cuando se active flujo; limitado por equipo)                                   | ❌                            |
| Reabrir mes (plan)             | ✔️ (cuando se active flujo) | ✔️ (cuando se active flujo; requiere comentario)                                   | ❌                            |
| Gestionar equipos              | ❌ (pendiente implementar)  | ❌ (pendiente implementar)                                                         | ❌                            |
| Crear miembros                 | ✔️                          | ❌                                                                                 | ❌                            |

> **Nota:** `TrabajosController` ya aplica `RolesGuard` y las verificaciones en `TrabajosService`; sigue pendiente instrumentar auditoría y endpoints específicos para aprobar/reabrir trabajos. El nuevo flujo mensual añadirá endpoints `PATCH /meses/:id/aprobar` y `PATCH /meses/:id/reabrir` con historial y comentarios obligatorios.

## Inventario actual (2025-10-18)

**Backend – endpoints NestJS**

- `POST /auth/register`, `POST /auth/login` (sin guards, devuelven JWT básico con `userId`).
- `GET|POST|PATCH|DELETE /users` (protegidos por `JwtAuthGuard` + `RolesGuard`; solo `Admin`).
- `GET|POST|PUT|DELETE /clientes` (`JwtAuthGuard` + `RolesGuard`, roles `Admin`/`Gestor`), con validaciones de RFC y bloqueo de eliminación si existen trabajos vinculados.
- `POST /trabajos`, `GET /trabajos`, `GET /trabajos/:id`, `PATCH /trabajos/:id`, `DELETE /trabajos/:id` (`JwtAuthGuard` + `RolesGuard`; `TrabajosService` restringe accesos según rol, equipo y miembro asignado, además de exigir `clienteId`).
- `POST /trabajos/:id/reporte-base/importar` (subida de archivo usando `FileInterceptor`; disponible solo para Admin/Gestor).
- `GET /trabajos/:trabajoId/reporte-anual/:anio`, `/resumen`, `/mes/:mes`, `POST /trabajos/:trabajoId/reporte-anual/actualizar-ventas` (operativos con nuevo esquema).
- `POST /meses`, `GET /meses/trabajo/:trabajoId`, `GET /meses/:id`, `PATCH /meses/:id/reabrir`, `DELETE /meses/:id` (se ampliará con `PATCH /meses/:id/aprobar` y bloqueo automático cuando `estadoRevision === "APROBADO"`).
- `POST /reportes-mensuales/importar`, `POST /reportes-mensuales/:mesId/procesar`, `GET|PUT|DELETE /reportes-mensuales/:mesId/:reporteId/datos`, `POST /reportes-mensuales/:mesId/:reporteId/reprocesar-estado-sat`.
- Endpoints “legacy” (`reporte.controller.old.ts`, `trabajo.controller.old.ts`) siguen en el repo pero no se exponen; conviene limpiar durante la siguiente refactorización.
- `GET /trabajos/aprobaciones/dashboard` (agregaciones de estados, pendientes y actividad con filtros por equipo/estado; se extenderá para listar periodos pendientes y disparar aprobaciones/reaperturas por mes).

**Frontend – componentes/páginas en uso**

- Páginas principales: `TrabajosPage`, `TrabajoDetail`, `ReporteAnualPage`, `ReporteMensualPage`, `ReporteBaseAnualPage`, `ClientesPage`, `Dashboard`, `AdminUsersPage`, `Login`, `Register`.
- Módulo clientes consolidado en `features/clientes` con `ClienteFormModal`, `ClienteSelector`, `ClientesTable` y pruebas en `ClientesTable.test.tsx`/`ClientesPage.test.tsx`.
- `TrabajosList` agrega filtros persistentes (`useTrabajosFilters`) y badges; `CreateTrabajoDialog`/`EditTrabajoDialog` comparten modal de cliente y validan selección obligatoria.
- `features/trabajos/aprobaciones` ofrece hook `useAprobacionesDashboard` y componentes ya enlazados al endpoint real `GET /trabajos/aprobaciones/dashboard`.
- Servicios API actualizados: `clientes.service.ts`, `trabajos.service.ts` (nuevo método `getAprobacionesDashboard`), `meses.service.ts`, `reportes-mensuales.service.ts`, `reporte-anual.service.ts`, `users.ts`, `services/api.ts` con axios e interceptores.
- `AuthContext` normaliza rol y ahora conserva `equipoId` en sesión/localStorage para filtros futuros.
- Vitest + Testing Library cubren diálogos, páginas y hooks críticos (`CreateTrabajoDialog.test.tsx`, `EditTrabajoDialog.test.tsx`, `TrabajosList.test.tsx`, `useAprobacionesDashboard.test.ts`).
- Scripts de soporte (PowerShell/JS en raíz) siguen apuntando a endpoints legacy (`debug-auth.html`, `debug-jwt.js`); deberán revisarse cuando se agreguen nuevos claims/guards.

**Impactos clave detectados**

- Se requiere historial/auditoría dedicada para cambios de estado y aprobaciones, además de endpoints de transición para completar el flujo.
- Falta exponer gestión de equipos (crear, activar/inactivar, asignar miembros) desde UI y servicios específicos.
- Los filtros legacy (`miembroId`/`usuarioId`) en frontend deben migrarse hacia criterios de equipo y ownership cuando se habiliten los nuevos endpoints.

## Flujos Clave

### 1. Creacion de Cliente

1. Gestor accede a modulo de clientes.
2. Completa formulario con Nombre y RFC (obligatorios) + opcionales.
3. Backend valida RFC, evita duplicados, registra auditoria.
4. Lista se actualiza con nuevo cliente y se invalida cache en frontend.

### 2. Creacion de Trabajo

1. Gestor abre formulario de trabajo.
2. Selecciona cliente mediante `ClienteSelector` (busqueda por nombre/RFC).
3. Define miembro responsable (solo miembros de su equipo).
4. El sistema valida que no exista otro trabajo activo para la combinacion cliente + año seleccionado; si existe, bloquea la creacion y sugiere reutilizar el trabajo vigente.
5. Guarda → backend crea registro con estado `EN_PROGRESO`, genera contenedores mensuales (12 periodos) y fija visibilidad restringida.
6. Gestor y miembro reciben notificacion inicial (email y dashboard: trabajos abiertos para el miembro, trabajos por revisar para el gestor).

### 3. Ejecucion y Finalizacion

1. Miembro actualiza progreso mensual (campos editables limitados: notas, archivos, checklist) dentro del periodo correspondiente al mes en curso.
2. Al completar tareas, miembro envía el mes a revisión (`estadoRevision` pasa de `EN_PROCESO` a `EN_REVISION`).
3. Backend registra fecha de envío, bloquea ediciones salvo comentarios y notifica al Gestor.

### 4. Aprobacion Mensual

1. Gestor visualiza dashboard de aprobaciones filtrado por mes y equipo.
2. Revisa detalles del trabajo (solo lectura) con opción de comentarios y registra observaciones desde el mismo panel.
3. Si aprueba → estado del mes pasa a `APROBADO`, se registran `fechaAprobacion`, `aprobadoPorId` y `comentarioGestor`; ese periodo queda en solo lectura.
4. Si requiere cambios → reabre (`REABIERTO`) el periodo, deja comentario obligatorio y el mes vuelve a editarse únicamente por el miembro asignado.
5. Cuando todos los meses de un trabajo están `APROBADO`, el estado global del trabajo se actualiza automáticamente y permanece bloqueado hasta que se reabra al menos un mes.

### 5. Gestion de Equipos

1. Admin crea Gestor y define equipo inicial.
2. Gestor agrega miembros via interfaz (usuarios existentes o nuevos).
3. Cambios de equipo actualizan `equipoId` en usuarios, revalidando acceso a trabajos.

## Consideraciones de UX

- Mostrar etiquetas clarificando estados (`En progreso`, `En revisión`, `Aprobado`, `Reabierto`).
- Deshabilitar botones/inputs segun permisos con mensajes de ayuda.
- Incluir buscador global en selector de clientes con resaltado de coincidencias.
- Resumen en dashboard del Gestor: conteo de trabajos en revision por mes y recordatorios de periodos pendientes por aprobar.
- Dashboard del miembro: lista de trabajos abiertos por mes con indicador de actualizacion requerida.
- Diferenciar visualmente mes bloqueado vs editable (badges, tooltips) y mostrar el comentario del Gestor junto al sello de aprobación.

## Integracion con Notificaciones (Opcional)

- Webhooks/eventos emitidos al crear cliente, asignar miembro, completar trabajo, aprobar trabajo.
- Futuro: integrar email/SMS para avisos criticos (pendiente de aprobacion > 3 dias).
- Evaluar integracion con notificaciones dentro de la app (badges, toast) para complementar los correos y mantener a gestores y miembros sincronizados.
