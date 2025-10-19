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

- Primer versión del módulo de clientes en frontend utiliza `ClientesTable`, `ClienteFormModal` y `ClienteSelector`, integrados en `ClientesPage` con `AppShell` y estrategias de refresco posteriores al guardado.
- Los diálogos de trabajos (`CreateTrabajoDialog`, `EditTrabajoDialog`) comparten el modal de clientes y exponen callbacks consistentes, habilitando crear/editar clientes sin salir del flujo.
- Se configuró Vitest + Testing Library como base de QA en frontend, con pruebas que validan la apertura del modal, la selección de clientes mock y el refresco de datos luego de guardar.
- Se mantiene pendiente la ampliación de permisos fine-grained y los dashboards de aprobaciones/equipos, programados para iteraciones siguientes.

## Principios de Diseño

- **Componentizacion**: cada nueva vista (registro de clientes, seleccion de cliente en trabajos, dashboard de aprobaciones) se construye con componentes reutilizables en `frontend/src/components`, evitando logica duplicada.
- **DRY**: los formularios de clientes y trabajos compartiran hooks y utilidades comunes (`useFormField`, validadores RFC, formateadores) alojados en `frontend/src/features/common`.
- **Escalabilidad**: definir interfaces y DTOs versionados dentro de `backend/src/types` y `frontend/src/types` para facilitar futuras extensiones sin romper clientes existentes.
- **Mantenibilidad**: documentar esquemas y flujos en `docs/tecnica` y actualizar pruebas automatizadas para cubrir escenarios criticos (permisos, visibilidad, flujos de aprobacion).
- **Seguridad y Roles**: centralizar logica de autorizacion en guards del backend (`backend/src/auth/guards`) y hooks del frontend (`useAuthorization`) asegurando consistencia entre cliente y servidor.
- **Observabilidad**: incluir eventos de auditoria para altas/ediciones de clientes y cambios de estado en trabajos, integrando con la infraestructura de logging ya disponible.

## Mockups y acuerdos UX preliminares (2025-10-18)

- **Gestión de clientes**: listado tipo tabla con buscador global, paginación y botones "Crear cliente"/"Editar" visibles sólo a Gestores/Admin; formulario en panel lateral reutilizable.
- **Selector de cliente en trabajos**: campo de autocompletado con resultados resaltando coincidencias por nombre/RFC, accesible vía teclado; fallback “Crear nuevo cliente” cuando el usuario tiene permisos.
- **Dashboard de aprobaciones**: vista en tarjetas o tabla compacta con filtros por mes/año, badges de estado y acciones “Aprobar”/“Reabrir” disponibles únicamente para Gestores.
- Estados de solo lectura deben sombrear inputs y mostrar mensaje contextual (“Trabajo aprobado – solo lectura. Solicita reapertura al Gestor.”).
- Se acordó documentar componentes clave en Storybook o guía de estilo ligera una vez definidos los diseños finales.

## Alcance Funcional

1. **Registro Basico de Cliente**

   - Formulario con campos minimos obligatorios (Nombre, RFC) y campos opcionales (razon social, direccion, contactos, notas).
   - Validacion de RFC empresarial y normalizacion almacenada en DB.
   - API REST para CRUD con autenticacion y autorizacion basada en rol Gestor.
   - Listado con soporte de busqueda incremental y paginacion.

2. **Integracion Clientes ↔ Trabajos**

   - Reemplazo de campos manuales de cliente en trabajos por selector/buscador de cliente.
   - Autocompletado con fuzzy search en frontend y endpoints optimizados (`GET /clientes?search=`).
   - Migracion de datos existentes para asociar trabajos a entidades cliente.

3. **Permisos por Rol**

   - Gestores: crear/editar clientes y trabajos, gestionar equipo y aprobar trabajos.
   - Miembros: ver trabajos asignados, actualizar progreso, marcar completado.
   - Admin: administrar todos los usuarios, reasignar gestores, ver todo.

4. **Asignacion y Visibilidad de Trabajos**

   - Campo obligatorio `miembroAsignadoId` con historial de cambios.
   - Politica de visibilidad: solo gestor creador + miembro asignado (y Admin).
   - Notificaciones para cambios de asignacion y estados.

5. **Flujo de Aprobacion Mensual**

   - Estados adicionales: `EN_REVISION`, `APROBADO`, `REABIERTO`, aplicados a nivel de periodo mensual dentro de cada trabajo.
   - Dashboard Gestor con bandeja de trabajos pendientes de revision.
   - Cada trabajo se compone de 12 periodos mensuales; al aprobar un mes, ese periodo queda bloqueado (solo lectura) hasta reapertura manual, manteniendo editables los meses restantes.

6. **Equipos de Gestores**

   - Tabla/entidad `Equipo` vinculada a Gestor; miembros pertenecen a exactamente un equipo.
   - CRUD de miembros limitado al Gestor de su equipo; Admin puede reasignar.
   - Backend actualiza endpoints de usuarios para filtrar por equipo.

7. **Mejoras UI de Trabajos**
   - Filtro por año preseleccionado al actual con opcion de cambiar.
   - Filtro por cliente y busqueda por texto libre.
   - Persistencia de preferencias de filtros por usuario (local storage / API).

## Riesgos Identificados

- Migracion de datos de trabajos antiguos sin entidad cliente: hoy el riesgo es bajo porque aun no hay datos en produccion; podemos limpiar y regenerar la base si es necesario, aunque conviene ensayar una migracion realista para preparar el entorno futuro.
- Ajustes de permisos pueden afectar endpoints existentes: revisar impacto en reportes y automatizaciones.
- Cambios de estado y visibilidad requieren actualizar pruebas E2E y QA manual.
- Creacion de equipos implica actualizacion de autenticacion y claims JWT.

## Dependencias y Supuestos

- El modelo actual de usuarios soporta roles; se asumira extension sin romper autenticacion.
- El frontend utiliza React con Vite y puede incorporar nuevos contextos/hooks sin reescrituras masivas.
- Existe infraestructura de migraciones (TypeORM/Nest) para evolucionar el esquema.
- Auditoria y logging se pueden ampliar mediante modulos existentes sin nueva plataforma.
