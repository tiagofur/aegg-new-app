# Permisos y Flujos Operativos

## Matriz de Roles

| Accion                         | Admin | Gestor                               | Miembro                       |
| ------------------------------ | ----- | ------------------------------------ | ----------------------------- |
| Crear/editar clientes          | ✔️    | ✔️                                   | ❌                            |
| Eliminar clientes              | ✔️    | ✔️ (solo propios)                    | ❌                            |
| Ver todos los clientes         | ✔️    | ✔️ (equipo)                          | ❌                            |
| Crear trabajos                 | ✔️    | ✔️                                   | ❌                            |
| Editar trabajos                | ✔️    | ✔️ (si creador)                      | ✔️ (solo campos de ejecucion) |
| Reabrir trabajos               | ✔️    | ✔️ (si creador)                      | ❌                            |
| Asignar miembro a trabajo      | ✔️    | ✔️ (si creador)                      | ❌                            |
| Ver trabajos del equipo        | ✔️    | ✔️ (propios y asignados a su equipo) | ✔️ (solo asignados)           |
| Marcar trabajo como completado | ✔️    | ✔️ (si asignado)                     | ✔️ (si asignado)              |
| Aprobar trabajo                | ✔️    | ✔️ (si creador)                      | ❌                            |
| Gestionar equipos              | ✔️    | ✔️ (solo su equipo)                  | ❌                            |
| Crear miembros                 | ✔️    | ✔️ (dentro de su equipo)             | ❌                            |

## Inventario actual (2025-10-18)

**Backend – endpoints NestJS**

- `POST /auth/register`, `POST /auth/login` (sin guards, devuelven JWT básico con `userId`).
- `GET|POST|PATCH|DELETE /users` (protegidos por `JwtAuthGuard` + `RolesGuard`; solo `Admin`).
- `POST /trabajos`, `GET /trabajos?usuarioId=`, `GET /trabajos/:id`, `PATCH /trabajos/:id`, `DELETE /trabajos/:id` (solo `JwtAuthGuard`).
- `POST /trabajos/:id/reporte-base/importar` (subida de archivo usando `FileInterceptor`).
- `GET /trabajos/:trabajoId/reporte-anual/:anio`, `/resumen`, `/mes/:mes`, `POST /trabajos/:trabajoId/reporte-anual/actualizar-ventas`.
- `POST /meses`, `GET /meses/trabajo/:trabajoId`, `GET /meses/:id`, `PATCH /meses/:id/reabrir`, `DELETE /meses/:id`.
- `POST /reportes-mensuales/importar`, `POST /reportes-mensuales/:mesId/procesar`, `GET|PUT|DELETE /reportes-mensuales/:mesId/:reporteId/datos`, `POST /reportes-mensuales/:mesId/:reporteId/reprocesar-estado-sat`.
- Endpoints “old” (`reporte.controller.old.ts`, `trabajo.controller.old.ts`) permanecen en código pero no se referenced desde rutas actuales; confirmar si pueden retirarse durante refactor.

**Frontend – componentes/páginas en uso**

- Páginas: `pages/TrabajosPage.tsx`, `pages/TrabajoDetail.tsx`, `pages/ReporteAnualPage.tsx`, `pages/ReporteMensualPage.tsx`, `pages/ReporteBaseAnualPage.tsx`, `pages/AdminUsersPage.tsx`, `pages/Dashboard.tsx`, `pages/Login.tsx`, `pages/Register.tsx`.
- Servicios API: `services/trabajos.service.ts`, `meses.service.ts`, `reportes-mensuales.service.ts`, `reporte-anual.service.ts`, `users.ts`, `services/api.ts` (axios + interceptores).
- Hooks/contexto: `context/AuthContext.tsx` gestiona JWT sin claims de rol/equipo; `features/dashboard` consume trabajos agregados.
- UI existente para trabajos se ubica en `pages` y `features/trabajos/reportes` (reportes anual/mensual). No existe módulo dedicado a clientes ni componentes reutilizables para selector/autocomplete.
- Scripts de soporte (PowerShell/JS en raíz) interactúan con endpoints actuales para debugging (`debug-auth.html`, `debug-jwt.js`). Evaluar actualización tras cambios de claims.

**Impactos clave detectados**

- Todos los endpoints expuestos bajo `JwtAuthGuard` carecen de granularidad por rol, por lo que los guards y DTO deberán revisarse antes de introducir visibilidad por cliente/equipo.
- Los servicios frontend asumen campos `clienteNombre`/`clienteRfc`; el backlog de la Fase 1 exige sincronizar nuevos DTO (`clienteId`, `miembroAsignadoId`).
- La UI usa `usuarioId` como filtro en `/trabajos`; este query se deberá reemplazar por reglas de visibilidad basadas en rol y equipo.

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
2. Al completar tareas, miembro marca `Marcar como completado`.
3. Backend cambia estado a `EN_REVISION`, registra fecha y notifica al Gestor.

### 4. Aprobacion Mensual

1. Gestor visualiza dashboard de aprobaciones filtrado por mes.
2. Revisa detalles del trabajo (solo lectura) con opcion de comentarios.
3. Si aprueba → estado del mes pasa a `APROBADO`, se registran `fecha_aprobacion` y `aprobado_por`; los meses restantes permanecen editables.
4. Si requiere cambios → reabre (`REABIERTO`) el periodo, que vuelve a ser editable para el miembro asignado.

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

## Integracion con Notificaciones (Opcional)

- Webhooks/eventos emitidos al crear cliente, asignar miembro, completar trabajo, aprobar trabajo.
- Futuro: integrar email/SMS para avisos criticos (pendiente de aprobacion > 3 dias).
- Evaluar integracion con notificaciones dentro de la app (badges, toast) para complementar los correos y mantener a gestores y miembros sincronizados.
