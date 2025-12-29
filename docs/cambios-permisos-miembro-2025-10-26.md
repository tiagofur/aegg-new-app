# Ajuste de Permisos para Usuario Miembro

**Fecha:** 26 de octubre de 2025  
**Objetivo:** Permitir que usuarios con rol Miembro puedan gestionar reportes mensuales

## 📋 Resumen de Cambios

Se actualizó el sistema de permisos para que los usuarios con rol **Miembro** puedan realizar todas las operaciones necesarias para gestionar reportes mensuales, manteniendo las restricciones apropiadas para operaciones críticas.

## ✅ Permisos OTORGADOS a Miembro

Los usuarios Miembro ahora pueden:

1. **Importar reportes mensuales**

   - Mi Admin Ingresos
   - Auxiliar Ingresos
   - Reporte Ingresos

2. **Editar datos en los reportes**

   - Modificar valores en las celdas editables
   - Cambiar Tipo de Cambio
   - Modificar Estado SAT

3. **Usar botones de automatización**

   - "Aplicar TC Sugerido a Todos"
   - "Cancelar Folios Únicos"

4. **Procesar y guardar meses**

   - Botón "Procesar y Guardar Mes"

5. **Enviar meses a revisión**

   - Botón "Enviar a revisión"

6. **Limpiar datos de reportes**

## ❌ Permisos NO OTORGADOS a Miembro

Los usuarios Miembro NO pueden:

1. **Importar Reporte Base Anual**

   - Solo Admin y Gestor pueden hacerlo
   - Protegido en backend con `@Roles(UserRole.ADMIN, UserRole.GESTOR)`

2. **Aprobar meses**

   - Solo Gestor responsable y Admin

3. **Solicitar cambios en meses**

   - Solo Gestor responsable y Admin

4. **Reabrir meses completados**

   - Solo Gestor responsable y Admin

5. **Crear, editar o eliminar trabajos**

   - Solo Admin y Gestor

6. **Crear, editar o eliminar clientes**
   - Solo Admin y Gestor

## 🔧 Archivos Modificados

### Frontend

1. **`frontend/src/pages/ReporteMensualPage.tsx`**

   - **Línea 38**: Actualizado `canManageReportes` para incluir rol Miembro

   ```typescript
   // Antes:
   const canManageReportes = user?.role === "Gestor" || user?.role === "Admin";

   // Después:
   const canManageReportes =
     user?.role === "Miembro" ||
     user?.role === "Gestor" ||
     user?.role === "Admin";
   ```

### Archivos Verificados (Sin cambios necesarios)

1. **`frontend/src/components/trabajos/ReporteMensualViewer.tsx`**

   - Ya usa correctamente `canManage` prop
   - Los botones de acción están controlados por `canManage && !isReadOnly`
   - Funciona correctamente para Miembros

2. **`frontend/src/components/trabajos/MesCard.tsx`**

   - Los botones de "Procesar y Guardar" y "Enviar a revisión" están disponibles para todos los usuarios cuando el mes no está bloqueado
   - Los botones de "Aprobar" y "Solicitar cambios" están correctamente restringidos a `puedeRevisar` (Admin/Gestor responsable)

3. **`frontend/src/components/trabajos/TrabajoDetail.tsx`**

   - El botón de importar reporte base anual está controlado por `canEdit`
   - `canEdit = canManage && !isAprobado && (isAdmin || esGestorResponsable)`
   - Funciona correctamente para mantener la restricción

4. **`backend/src/trabajos/controllers/trabajos.controller.ts`**

   - El endpoint `POST :id/reporte-base/importar` tiene `@Roles(UserRole.ADMIN, UserRole.GESTOR)`
   - Protección en backend confirmada

5. **`backend/src/trabajos/controllers/reportes-mensuales.controller.ts`**

   - Todos los endpoints solo tienen `@UseGuards(JwtAuthGuard)` sin restricción de roles
   - Permite que Miembro acceda a todas las operaciones de reportes mensuales

6. **`backend/src/trabajos/controllers/meses.controller.ts`**
   - Los endpoints de aprobación tienen `@Roles(UserRole.ADMIN, UserRole.GESTOR)`
   - Protección en backend confirmada

## 🎯 Flujo de Trabajo Completo

### Para Usuario MIEMBRO:

1. ✅ Accede al trabajo asignado
2. ✅ Selecciona un mes
3. ✅ Importa los 3 reportes mensuales (Mi Admin, Auxiliar, Ingresos)
4. ✅ Edita datos según necesite
5. ✅ Usa "Aplicar TC Sugerido a Todos" para sincronizar tipos de cambio
6. ✅ Usa "Cancelar Folios Únicos" para limpiar folios que no coinciden
7. ✅ Guarda los datos (auto-guardado o manual)
8. ✅ Procesa y guarda el mes cuando todos los reportes están listos
9. ✅ Envía el mes a revisión del gestor
10. ❌ NO puede aprobar (espera decisión del gestor)

### Para Usuario GESTOR:

1. ✅ Todo lo que puede hacer el Miembro
2. ✅ Importar Reporte Base Anual
3. ✅ Aprobar meses enviados a revisión
4. ✅ Solicitar cambios en meses
5. ✅ Crear y editar trabajos
6. ✅ Gestionar clientes

### Para Usuario ADMIN:

1. ✅ Todo lo que puede hacer el Gestor
2. ✅ Gestionar todos los trabajos (no solo los asignados)
3. ✅ Acceso completo sin restricciones

## 🧪 Pruebas Recomendadas

1. **Iniciar sesión como Miembro**

   - Verificar que puede importar reportes mensuales
   - Verificar que puede editar datos
   - Verificar que puede usar botones de automatización
   - Verificar que puede enviar a revisión
   - Verificar que NO aparece botón de importar base anual
   - Verificar que NO aparecen botones de aprobar/solicitar cambios

2. **Iniciar sesión como Gestor**
   - Verificar que puede hacer todo lo anterior
   - Verificar que SÍ aparece botón de importar base anual
   - Verificar que SÍ aparecen botones de aprobar/solicitar cambios

## 📝 Notas Técnicas

- El sistema usa un enfoque de permisos en capas: Frontend + Backend
- El frontend oculta botones para mejor UX
- El backend valida con guards de roles para seguridad
- Los estados de revisión (`ENVIADO`, `APROBADO`) bloquean ediciones para todos los usuarios
- Solo el Gestor responsable o Admin pueden desbloquear meses aprobados

## ✨ Mejoras Futuras Sugeridas

1. Considerar agregar un rol "Auditor" solo lectura
2. Agregar log de auditoría de cambios en reportes
3. Implementar notificaciones cuando un mes es enviado a revisión
4. Agregar panel de métricas para gestores (tiempos de revisión, etc.)
