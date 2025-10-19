# Dashboard de Aprobaciones

## Objetivo

Proveer a los Gestores una vista centralizada del estado de aprobación de trabajos, destacando pendientes críticos y movimientos recientes.

## Estructura del módulo

- **Hook `useAprobacionesDashboard`** (`frontend/src/features/trabajos/aprobaciones/useAprobacionesDashboard.ts`)

  - Gestiona filtros, estado de carga y captura de errores.
  - Consume `trabajosService.getAprobacionesDashboard` con filtros opcionales (`estado`, `search`, `equipoId`).
  - Devuelve los datos para el tablero (resumen por estado, pendientes y línea de tiempo), además de `updateFilters` y `refetch`.

- **Componente `AprobacionesDashboard`** (`frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`)

  - Renderiza tarjetas de resumen, tabla de pendientes y línea de tiempo.
  - Muestra estados de carga, error y mensajes vacíos.
  - Soporta filtrado por estado y recarga manual.

- **Página `AprobacionesPage`** (`frontend/src/pages/AprobacionesPage.tsx`)

  - Protegida para roles `Gestor` y `Admin` a través de rutas anidadas en `/trabajos/aprobaciones`.
  - Usa `AppShell` con breadcrumbs compartidos y botón de recarga.
  - Incluye introducción contextual según el rol del usuario.

- **Atajos desde Dashboard** (`frontend/src/pages/Dashboard.tsx`)
  - Los usuarios Gestores tienen una acción rápida “Revisar aprobaciones” que redirige al tablero.

## Dependencias y API

- Servicio `trabajosService.getAprobacionesDashboard` consulta `/trabajos/aprobaciones/dashboard` (resta alinear con backend).
- Nuevos tipos definidos en `frontend/src/types/aprobaciones.ts` y exportados desde el índice de tipos.

## Estado de pruebas

- Hook cubierto por `useAprobacionesDashboard.test.ts`, validando carga inicial, filtros, manejo de errores y `refetch`.
- Suite general verificada con `pnpm vitest run`.

## Siguiente paso sugerido

Implementar los filtros persistentes del listado de trabajos (roadmap punto 6), reutilizando patrón de hooks y manteniendo preferencia en `localStorage` para cada usuario.
