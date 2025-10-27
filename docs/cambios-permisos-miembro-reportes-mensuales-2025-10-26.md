# Cambios de Permisos para Miembros - Reportes Mensuales

**Fecha**: 26 de octubre de 2025  
**Autor**: GitHub Copilot

## Resumen

Se han liberado los permisos de gestión de reportes mensuales para el rol **Miembro**, permitiéndoles importar, reimportar y limpiar datos de los reportes mensuales (MI Admin, Ingresos, Auxiliar Ingresos), pero manteniendo la restricción de **NO** poder importar el Reporte Base Anual.

## Cambios Realizados

### 1. `frontend/src/pages/TrabajosPage.tsx`

**Cambio**: Se agregó una nueva variable `canManageReportesMensuales` que incluye a los Miembros además de Gestores y Admins.

```typescript
// Los Miembros pueden gestionar reportes mensuales (importar, editar), pero no el Base Anual ni crear/eliminar trabajos
const canManageReportesMensuales =
  user?.role === "Miembro" || user?.role === "Gestor" || user?.role === "Admin";
```

Esta variable se pasa como prop al componente `TrabajoDetail`.

### 2. `frontend/src/components/trabajos/TrabajoDetail.tsx`

**Cambios**:

1. Se agregó la prop `canManageReportesMensuales` a la interfaz `TrabajoDetailProps`
2. Se creó la variable `puedeGestionarReportesMensuales` que verifica si el usuario tiene permisos y si el mes no está bloqueado
3. Se actualizó la variable `puedeEnviarMesManual` para usar `canManageReportesMensuales` (permitiendo a Miembros enviar a revisión)
4. Se cambió el handler `handleEnviarMesManual` para usar `mesesService.enviarRevision()` en lugar de `enviarRevisionManual()`
5. Se actualizaron los siguientes handlers para usar `puedeGestionarReportesMensuales`:
   - `handleImportarReporte()`
   - `handleReimportarReporte()`
   - `handleLimpiarDatos()`
6. Se actualizó el componente `ReporteMensualViewer` para usar `canManage={puedeGestionarReportesMensuales}`

## Permisos por Rol

### Miembro

- ✅ **Puede** importar reportes mensuales (MI Admin, Ingresos, Auxiliar Ingresos)
- ✅ **Puede** reimportar reportes mensuales
- ✅ **Puede** limpiar datos de reportes mensuales
- ✅ **Puede** editar datos en reportes mensuales (guardar cambios, tipo de cambio, etc.)
- ✅ **Puede** enviar meses a revisión (solo si es el miembro asignado al trabajo)
- ❌ **NO puede** importar/reimportar el Reporte Base Anual
- ❌ **NO puede** crear/editar/eliminar trabajos
- ❌ **NO puede** crear/eliminar meses
- ❌ **NO puede** aprobar o solicitar cambios en meses
- ⚠️ **Bloqueado** cuando el mes está en revisión (ENVIADO) o aprobado (APROBADO)

### Gestor/Admin

- ✅ Todos los permisos anteriores de Miembro
- ✅ **Puede** importar/reimportar el Reporte Base Anual
- ✅ **Puede** crear/editar/eliminar trabajos
- ✅ **Puede** crear/eliminar meses
- ✅ **Puede** enviar meses a revisión
- ✅ **Puede** aprobar o solicitar cambios en meses

## Validaciones

- Los permisos se verifican tanto en el frontend como en el backend
- Los meses en estado "ENVIADO" o "APROBADO" están bloqueados para todos los roles (excepto gestores para aprobar/solicitar cambios)
- Solo los Gestores responsables o Admins pueden importar el Reporte Base Anual

## Archivos Modificados

1. `frontend/src/pages/TrabajosPage.tsx`
2. `frontend/src/components/trabajos/TrabajoDetail.tsx`

## Notas Técnicas

- El permiso `canManageReportesMensuales` es independiente de `canManage` (que solo aplica para Gestores/Admins)
- La variable `puedeGestionarReportesMensuales` combina el permiso con el estado del mes (no bloqueado)
- Los componentes hijos como `ReporteMensualViewer`, `MiAdminIngresosTable` y `AuxiliarIngresosTable` ya tenían la lógica para manejar el permiso `canManage`, por lo que no fue necesario modificarlos

## Pruebas Recomendadas

1. Iniciar sesión como **Miembro** asignado a un trabajo y verificar que:

   - Puede ver los botones de "Importar archivo", "Actualizar archivo" y "Limpiar datos" en reportes mensuales
   - Puede importar/reimportar archivos Excel de reportes mensuales
   - Puede limpiar datos de reportes mensuales
   - Puede ver el botón "Enviar a revisión" y enviar el mes cuando termine
   - NO puede ver el botón de importar en el Reporte Base Anual
   - Los botones desaparecen cuando el mes está en revisión o aprobado

2. Iniciar sesión como **Miembro NO asignado** a un trabajo y verificar que:

   - NO puede enviar el mes a revisión (solo el miembro asignado puede)

3. Iniciar sesión como **Gestor** y verificar que:

   - Mantiene todos los permisos anteriores
   - Puede importar el Reporte Base Anual
   - Puede aprobar o solicitar cambios en meses enviados a revisión

4. Verificar el flujo de aprobación completo:
   - Miembro importa y edita reportes mensuales
   - Miembro envía el mes a revisión (el mes se bloquea)
   - Gestor recibe notificación y puede ver el mes en estado "ENVIADO"
   - Gestor puede aprobar (mes queda en APROBADO permanentemente)
   - O Gestor puede solicitar cambios (mes vuelve a EN_EDICION para que el Miembro lo edite)
