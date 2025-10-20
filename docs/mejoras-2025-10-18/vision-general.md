# Vision General de las Mejoras (2025-10-18)

## Objetivos del Release

- Habilitar la gestion integral de clientes empresariales con registro minimo (Nombre, RFC) y campos opcionales extensibles.
- Simplificar la creacion de trabajos mediante la asociacion directa con clientes existentes y filtros avanzados de busqueda, podiendo tener solamente un trabajo por año para cada cliente.
- Restringir la gestion de clientes y trabajos a usuarios con rol Gestor o Admin, con jerarquia clara de permisos y responsabilidades.
- Permitir la asignacion dinamica de un miembro ejecutor por trabajo, controlando la visibilidad de la informacion segun roles.
- Establecer un flujo de aprobacion mensual donde el Gestor valida trabajos finalizados por su equipo antes de cerrar definitvamente el periodo.
- Ampliar el modelo de usuarios para soportar equipos gestionados por Gestores y un Admin con privilegios completos.
- Mejorar la usabilidad del modulo de trabajos con filtros por año, cliente y texto libre.

## Avances recientes (2025-10-18)

- Backend consolidado para clientes: `backend/src/clientes` expone entidad, DTOs y controlador protegidos por `JwtAuthGuard` + `RolesGuard`, con migraciones `1760745600000-CreateClientes.ts` y `1760745602000-UpdateTrabajosAddClienteRelation.ts` activas.
- `TrabajosService.create` ahora exige `clienteId`, normaliza RFC y garantiza un trabajo por cliente/año mientras genera los 12 meses y reportes base dentro de una transacción.
- Frontend integra catálogo de clientes y selector reusable: `ClientesPage`, `ClientesTable`, `ClienteFormModal` y `ClienteSelector` comparten callbacks y refresco inmediato desde los diálogos de trabajo.
- `TrabajosList` incorpora filtros persistentes (`useTrabajosFilters`) y badges de estado; el dashboard de aprobaciones (`AprobacionesPage` + `AprobacionesDashboard`) ya opera sobre el endpoint real y se validó end-to-end con datos del backend.
- Se definió el backlog para la aprobación mensual (migraciones en `meses`, endpoints `PATCH /meses/:id/aprobar|reabrir`, ajustes de UI y pruebas) y se documentó en roadmap/arquitectura.
- Vitest + Testing Library cubren escenarios críticos en `clientes` y `trabajos`, incluyendo integración de modales y hooks (`ClientesTable.test.tsx`, `CreateTrabajoDialog.test.tsx`, `useAprobacionesDashboard.test.ts`).
- `TrabajosController` ahora aplica `RolesGuard` y delega las verificaciones de ownership/visibilidad a `TrabajosService`, que filtra resultados según equipo y miembro asignado.
- Se aprovisionó un usuario administrador base (`admin@example.com` / `Admin123!`) para acelerar smoke tests y validar el flujo de autenticación en ambientes limpios.
- Se añadió `AprobacionesController` con el endpoint `GET /trabajos/aprobaciones/dashboard`, respaldado por `AprobacionesService` para generar métricas en tiempo real respetando la visibilidad por equipo.
- El modelo de usuarios incorpora `equipoId` y la nueva entidad `Equipo`; JWT y respuestas de autenticación propagan el claim para que frontend y guards consuman la pertenencia a equipo.

## Principios de Diseño

- **Componentizacion**: las vistas clave se construyen con componentes reutilizables en `frontend/src/features` y `frontend/src/components`, evitando lógica duplicada entre clientes y trabajos.
- **DRY**: formularios comparten utilidades como `useClienteSearch`, normalizadores de RFC y payloads tipados en `frontend/src/types`.
- **Escalabilidad**: mantener DTOs y contratos versionados en `backend/src/clientes|trabajos/dto` y `frontend/src/types` para extender funcionalidades sin romper consumidores.
- **Mantenibilidad**: documentar esquemas y flujos en `docs/tecnica` y respaldar funcionalidades con pruebas automatizadas (Vitest) que cubran casos críticos.
- **Seguridad y Roles**: aprovechar guards en backend (`JwtAuthGuard`, `RolesGuard`) y `PrivateRoute` en frontend mientras se endurecen validaciones pendientes (trabajos, equipos).
- **Observabilidad**: incluir eventos de auditoria para altas/ediciones de clientes y cambios de estado en trabajos, integrando con la infraestructura de logging ya disponible.

## Mockups y acuerdos UX preliminares (2025-10-18)

- **Gestión de clientes**: listado tipo tabla con buscador global, paginación y botones "Crear cliente"/"Editar" visibles sólo a Gestores/Admin; formulario en panel lateral reutilizable.
- **Selector de cliente en trabajos**: campo de autocompletado con resultados resaltando coincidencias por nombre/RFC, accesible vía teclado; fallback “Crear nuevo cliente” cuando el usuario tiene permisos.
- **Dashboard de aprobaciones**: vista en tarjetas o tabla compacta con filtros por mes/año, badges de estado y acciones “Aprobar”/“Reabrir” disponibles únicamente para Gestores; próxima iteración agrega jerarquía trabajo ↔ mes, comentarios visibles y botones inline.
- Estados de solo lectura deben sombrear inputs y mostrar mensaje contextual (“Trabajo aprobado – solo lectura. Solicita reapertura al Gestor.”).
- Se acordó documentar componentes clave en Storybook o guía de estilo ligera una vez definidos los diseños finales.

## Alcance Funcional

1. **Registro básico de cliente — ✅ entregado**

   - CRUD disponible vía `ClientesController`, validaciones de RFC en `CreateClienteDto` y normalización en la entidad `Cliente`.
   - Frontend expone formulario modal y tabla paginada con búsqueda (`ClientesTable`).

2. **Integración Clientes ↔ Trabajos — ✅ entregado (migración de datos pendiente)**

   - `TrabajosService` almacena `clienteId`, `clienteNombre`, `clienteRfc` y bloquea duplicados por año (`IDX_trabajos_cliente_anio`).
   - Diálogos de creación/edición consumen `ClienteSelector` con refresco tras alta/edición.
   - Falta orquestar migración de trabajos legados para poblar `clienteId`.

3. **Permisos por rol — ✅ entregado**

   - `ClientesController` y `TrabajosController` usan `@Roles` + `RolesGuard`; el servicio de trabajos rechaza accesos fuera de equipo o sin ownership.
   - El frontend mantiene ocultas las acciones según rol y aprovecha la sesión con `equipoId`.

4. **Asignación y visibilidad de trabajos — ⚠️ parcial**

   - Modelo incluye `miembroAsignadoId`, `visibilidadEquipo` y `EstadoAprobacion` con flujos de re-asignación básica.
   - Filtros de backend limitan a gestores al equipo asignado cuando `visibilidadEquipo` es verdadera; persiste la ausencia de auditoría/historial.

5. **Flujo de aprobación mensual — ⚠️ parcial**

   - UI del dashboard (`AprobacionesDashboard`) lista con filtros y métricas.
   - Endpoint `GET /trabajos/aprobaciones/dashboard` devuelve conteos, pendientes y actividad reciente; aún faltan endpoints para transiciones/aprobaciones y trail de comentarios.
   - Plan activo: extender `meses` con campos de revisión, emitir `PATCH /meses/:id/aprobar|reabrir`, bloquear edición por periodo y recalcular el estado global del trabajo cuando todos los meses estén aprobados.

6. **Equipos de Gestores — ⚠️ parcial**

   - Tabla `equipos` y columna `users.equipo_id` disponibles con migración `1761264000000-CreateEquiposAndAssignUsers.ts` y exposición en DTOs.
   - Sigue pendiente exponer UI/servicios dedicados para crear equipos, asignar gestores y sincronizar miembros automáticamente.

7. **Mejoras UI de trabajos — ✅ entregado**
   - Filtros por año/cliente/estado + persistencia (`useTrabajosFilters`) y badges de estado en `TrabajosList`.
   - `TrabajoDetail` aplica modo solo lectura al quedar `APROBADO`, con opción de reapertura controlada.

## Riesgos Identificados

- Migracion de trabajos antiguos hacia `clienteId` sigue pendiente (opcional mientras no exista data legada), pero conviene validar el script antes de poblar ambientes productivos.
- No existe historial o auditoría específica para aprobaciones/asignaciones; los cambios de estado siguen sobrescribiendo valores.
- Falta implementar endpoints de transición (aprobar, reabrir, comentar) que completen el flujo de aprobaciones y validen concurrencia.
- Riesgo de integridad hasta que el bloqueo mensual esté activo: miembros podrían modificar periodos ya revisados; urge desplegar la nueva iteración antes de liberar a producción.
- Cobertura de pruebas backend todavía es limitada para los nuevos guards y agregadores.

## Dependencias y Supuestos

- Usuarios y JWT ya exponen `equipoId`; resta definir catálogo/gestión de equipos desde UI.
- Frontend basado en React/Vite con hooks reutilizables facilita integración de nuevos guards/contextos.
- La infraestructura de migraciones TypeORM está activa; requiere plan de datos si se decide importar trabajos legacy.
- Auditoría/logging sigue dependiente de módulos existentes; conviene centralizar eventos al extender aprobaciones.
