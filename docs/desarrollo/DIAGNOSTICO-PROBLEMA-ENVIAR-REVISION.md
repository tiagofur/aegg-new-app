# 🔍 Diagnóstico: Problema al Enviar Mes a Revisión

**Fecha:** 25 de octubre de 2025  
**Trabajo afectado:** Creapolis Dev - Enero 2025  
**Síntomas:**

- ✅ El dashboard de aprobaciones SÍ muestra el mes como "En revisión"
- ❌ Al entrar al trabajo, el mes sigue mostrándose como "En edición"
- ❌ Los reportes siguen siendo editables (botones visibles)
- ❌ No aparecen los botones de Aprobar/Rechazar
- ❌ No aparece el banner ámbar de "🔒 Mes en Revisión"

## 📊 Análisis del Problema

### Evidencia de las imágenes:

1. **Dashboard de Aprobaciones (`/aprobaciones`):**

   - Muestra "Creapolis Dev - 2025 - Mes Enero"
   - Badge naranja: "En revisión"
   - Estado: "0 días en revisión"
   - Botón "Revisar" visible
   - **✅ Esto indica que el backend SÍ tiene el mes en estado ENVIADO**

2. **Vista del Trabajo (`/trabajos/[id]`):**
   - Mes Enero muestra badge gris "En edición"
   - Los botones de "Ver Base Importada", "Ver Reporte Anual", etc. están activos
   - NO aparece el banner ámbar de bloqueo
   - NO aparecen los botones verde (Aprobar) y rojo (Rechazar)
   - **❌ Esto indica que el frontend tiene datos desactualizados**

### Causa Raíz Identificada:

**El problema es que después de enviar a revisión, los datos del trabajo NO se están recargando en el componente `TrabajoDetail`**.

La secuencia es:

1. Usuario clica "Enviar a Revisión" en `MesCard.tsx`
2. Se llama `mesesService.enviarRevision(mes.id)` ✅
3. Backend actualiza el mes a `ENVIADO` ✅
4. Se llama `onMesUpdated?.()` ✅
5. **PROBLEMA:** Los datos del prop `trabajo` en `TrabajoDetail` NO se actualizan ❌
6. `MesCard` sigue mostrando el mes con `estadoRevision: "EN_EDICION"` ❌

## 🔧 Solución

### Opción 1: Recargar trabajo completo después de actualizar mes (RECOMENDADA)

En el componente `TrabajoDetail`, cuando se llama `onReload()` después de actualizar un mes, debe refetch el trabajo completo incluyendo todos los meses con sus estados actualizados.

**Archivo a modificar:** `frontend/src/components/trabajos/TrabajoDetail.tsx`

El callback `onMesUpdated` debe disparar un `onReload()` que refresque TODO el objeto `trabajo`.

### Opción 2: Actualizar estado local del mes

Después de enviar a revisión, actualizar el estado local del mes en el componente padre:

```typescript
const handleMesUpdated = async () => {
  await onReload(); // Recargar trabajo completo
};
```

### Opción 3: Usar React Query o similar

Implementar un sistema de cache más robusto que invalide automáticamente los datos cuando cambian.

## ✅ Verificación Paso a Paso

Para confirmar el diagnóstico:

1. **Abrir DevTools (F12)** → Pestaña Console
2. **Navegar a Creapolis Dev** → Expandir Enero 2025
3. **Buscar el log:** `🔍 MesCard DEBUG:`
4. **Verificar campo:** `estadoRevision`

**Resultado esperado (problema confirmado):**

```javascript
{
  mesNombre: "Enero",
  estadoRevision: "EN_EDICION",  // ❌ Debería ser "ENVIADO"
  puedeRevisar: true,
  deberianMostrarseLosBotones: false  // ❌ Debería ser true
}
```

**Resultado esperado (después de fix):**

```javascript
{
  mesNombre: "Enero",
  estadoRevision: "ENVIADO",  // ✅ Correcto
  puedeRevisar: true,
  deberianMostrarseLosBotones: true  // ✅ Correcto
}
```

## 🎯 Siguiente Acción

1. Confirmar el diagnóstico revisando el log en la consola
2. Implementar Opción 1 (recarga completa del trabajo)
3. Verificar que después de "Enviar a Revisión" se actualiza la UI
4. Confirmar que aparecen los botones y el banner ámbar
