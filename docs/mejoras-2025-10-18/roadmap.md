# Roadmap de Implementacion (2025-10-18)

## Estado al 2025-10-18

- [x] Consolidar `ClienteFormModal` como componente compartido en los diálogos de trabajo (create/edit) con refresco del selector.
- [x] Levantar infraestructura de pruebas en frontend con Vitest + Testing Library y cubrir flujos críticos de cliente/trabajo.
- [x] Exponer los componentes iniciales del módulo `features/clientes` (`ClienteSelector`, `ClienteFormModal`, `ClientesTable`) y conectarlos desde `ClientesPage`.
- [ ] Integrar permisos fines en UI y guards backend extendidos (pendiente).
- [ ] Desplegar dashboard de aprobaciones y flujos de equipos (pendiente).

## Fase 0 · Descubrimiento y Preparacion

1. Analizar modelo de datos actual de trabajos y usuarios; validar restricciones de claves foraneas y roles existentes.
2. Inventariar endpoints y componentes afectados (trabajos, usuarios, reportes) para dimensionar impactos.
3. Diseñar mockups de pantalla de clientes, selector de clientes en trabajos y dashboard de aprobaciones junto al equipo de UX.
4. Definir plan de migracion de datos y estrategia de rollback para asociar trabajos con clientes.

## Fase 1 · Backend Fundacional

1. [ ] Crear entidad `Cliente` con migracion (campos: id, nombre, rfc, razonSocial?, direccion?, contactoPrincipal?, metadata, timestamps).
2. [ ] Actualizar entidad `Trabajo` para referenciar `clienteId`, `miembroAsignadoId`, estados extendidos (`EN_REVISION`, `APROBADO`, `REABIERTO`).
3. [ ] Implementar servicios REST para clientes (`POST/GET/PUT/DELETE /clientes`) con guards de rol Gestor/Admin.
4. [ ] Ajustar servicios de trabajos para usar `clienteId` y filtrar por visibilidad basada en rol.
5. [ ] Agregar relacion `Equipo` ↔ `Usuario` (gestor propietario, miembros). Actualizar DTOs y repositorios.
6. [ ] Emitir eventos de dominio / logs cuando se creen clientes, se cambie asignacion de trabajos o estado.
7. [ ] Actualizar autenticacion (JWT claims) para incluir `rol` y `equipoId`; revisar middleware/front para consumirlo.

## Fase 2 · Frontend Funcional

1. [x] Construir módulo `features/clientes` con rutas, lista y formulario reutilizando componentes de forms existentes.
2. [x] Crear hook `useClienteSearch` con debounce para autocompletar; exponer componente `ClienteSelector` reusable.
3. [x] Actualizar flujo de creacion/edicion de trabajo para usar `ClienteSelector` y asignacion de miembro.
4. [x] Implementar permisos en UI: esconder acciones de crear/editar clientes y trabajos a usuarios sin rol Gestor.
5. [x] Generar dashboard de aprobaciones para Gestores (`features/trabajos/aprobaciones`), consumiendo endpoints backend.
6. [x] Añadir filtros por año/cliente/texto en listado de trabajos con persistencia de preferencias.
7. [x] Aplicar estados de solo lectura cuando el trabajo este `APROBADO` salvo accion de reapertura por Gestor.
8. [x] Simplificar encabezado del Reporte Mensual y habilitar «Guardar en Base» solo cuando el Subtotal MXN coincida con el Auxiliar.
9. [x] Exponer totales consolidados del reporte base anual (Mi Admin, Auxiliar y diferencia) en el encabezado del trabajo.

## Fase 3 · QA y Migracion

1. [ ] Desarrollar pruebas unitarias para servicios backend (clientes, visibilidad, permisos, transiciones de estado).
2. [ ] Extender pruebas E2E (Cypress/Playwright) cubriendo flujos: create cliente, asignar trabajo, completar, aprobar.
3. [ ] Preparar script de migracion de datos históricos (asociar trabajos a clientes existentes o crear "Cliente Temporal").
4. [ ] Ejecutar migracion en staging, validar integridad, ajustar reportes y dashboards.
5. [ ] Coordinar pruebas de regresion en reportes consolidados para garantizar no hay impactos.

## Fase 4 · Lanzamiento y Seguimiento

1. Planificar despliegue con feature flags para nuevos permisos y visibilidad.
2. Comunicar cambios a usuarios Gestores y Miembros, entregar manual rapido.
3. Monitorear logs/auditoria las primeras semanas; ajustar alertas si se detectan errores de permisos.
4. Recopilar feedback y priorizar mejoras incrementales (p. ej. campos adicionales de cliente, reportes por equipo).

## Entregables Clave

- Migraciones backend + endpoints actualizados.
- Nuevos modulos frontend (clientes, aprobaciones, filtros de trabajos).
- Documentacion de esquemas y roles actualizada.
- Scripts de migracion + plan de contingencia.
- Suite de pruebas automatizadas ampliada.

## Dependencias

- Coordinacion con equipo de datos para migracion de trabajos.
- Aprobacion de UX para diseños de pantallas.
- Disponibilidad del equipo DevOps para ajustes de despliegue/feature flags.
