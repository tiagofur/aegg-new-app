# Dashboard de Aprobaciones

## Objetivo

Proveer a los Gestores una vista centralizada del estado de aprobación de trabajos y meses, destacando pendientes críticos, movimientos recientes y comentarios de revisión.

## Estructura del módulo

- **Hook `useAprobacionesDashboard`** (`frontend/src/features/trabajos/aprobaciones/useAprobacionesDashboard.ts`)

  - Gestiona filtros, estado de carga y captura de errores.
  - Consume `trabajosService.getAprobacionesDashboard` con filtros opcionales (`estado`, `search`, `equipoId`).
  - Próxima iteración: delegar a `mesesService.getPendientes` para obtener periodos por aprobar y combinar métricas por trabajo/mes.
  - Devuelve los datos para el tablero (resumen por estado, pendientes y línea de tiempo), además de `updateFilters` y `refetch`.

- **Componente `AprobacionesDashboard`** (`frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`)

  - Renderiza tarjetas de resumen, tabla de pendientes y línea de tiempo.
  - Muestra estados de carga, error y mensajes vacíos.
  - Soporta filtrado por estado y recarga manual.
  - Próxima iteración: añadir vista jerárquica trabajo/mes, acciones inline (`aprobar`, `reabrir`, `ver comentario`) y badges de bloqueo.

- **Página `AprobacionesPage`** (`frontend/src/pages/AprobacionesPage.tsx`)

  - Protegida para roles `Gestor` y `Admin` a través de rutas anidadas en `/trabajos/aprobaciones`.
  - Usa `AppShell` con breadcrumbs compartidos y botón de recarga.
  - Incluye introducción contextual según el rol del usuario.

- **Atajos desde Dashboard** (`frontend/src/pages/Dashboard.tsx`)
  - Los usuarios Gestores tienen una acción rápida “Revisar aprobaciones” que redirige al tablero.

## Dependencias y API

- Servicio `trabajosService.getAprobacionesDashboard` apunta a `/trabajos/aprobaciones/dashboard`, ya disponible con filtros (`estado`, `search`, `equipoId`) y validaciones por rol/equipo.
- Nuevos tipos definidos en `frontend/src/types/aprobaciones.ts` y exportados desde el índice de tipos.
- Plan: exponer `mesesService.aprobar`, `mesesService.reabrir` y `mesesService.getPendientes` contra endpoints `PATCH /meses/:id/aprobar|reabrir` y `GET /meses/pendientes`.

## Estado de pruebas

- Hook cubierto por `useAprobacionesDashboard.test.ts`; los tests siguen mockeando la API para validar estados de carga/errores.
- La suite se ejecuta con `pnpm vitest run`; los escenarios reales ahora dependen del endpoint productivo, por lo que conviene añadir pruebas de integración/backend.
- Próxima iteración: tests contractuales para `mesesService.aprobar|reabrir` y snapshots de la tabla jerárquica con fixtures de meses.

## Siguiente paso sugerido

Agregar endpoints de transición (aprobar, reabrir, comentar) y auditoría de eventos para completar el flujo mensual, además de pruebas unitarias/integración que cubran filtros por equipo y estados.

## Extensiones planificadas (Aprobación mensual)

- Backend: `GET /trabajos/aprobaciones/dashboard` incorporará métricas por mes y consumirá nuevas vistas materializadas; se añadirá `GET /meses/pendientes`.
- Frontend: tabla de pendientes mostrará filas por trabajo y subfilas por mes con acciones rápidas, y `AprobacionesPage` tendrá filtro combinado (mes, trimestre, cliente).
- Seguridad: `RolesGuard` validará que solo Gestor/Admin del equipo pueda transicionar el mes; se persistirá `comentarioGestor` en cada acción.
- Auditoría: cada aprobación/reapertura registrará evento con `usuarioId`, `mesId`, comentario y marcas de tiempo para reportes posteriores.
