# Diagnóstico: Problema de Visualización de Mi Admin Ingresos

**Fecha**: 9 de octubre de 2025  
**Estado**: 🔍 **EN DIAGNÓSTICO**

---

## 🐛 Problema Identificado

La tabla de **Mi Admin Ingresos** está mostrando **todas las columnas del Excel crudo** en lugar de las columnas procesadas y editables definidas en el componente `MiAdminIngresosTable`.

### Columnas que se VEN (incorrectas):

- Verificado o Asoc
- Estado SAT
- CfdiRelacionados
- UUID
- Serie
- Folio
- Version
- TipoComprobante
- FechaTimbradoXML
- FechaEmision

### Columnas que DEBERÍAN verse (correctas):

- Folio
- Fecha
- RFC
- Razón Social
- Subtotal
- Moneda
- Tipo Cambio (editable)
- Subtotal AUX
- Subtotal MXN
- TC Sugerido
- Estado SAT (editable)
- Comparación (si está activa)

---

## 🔍 Diagnóstico

El problema indica que el componente está usando **`ReporteViewer`** (visor genérico de Excel) en lugar de **`MiAdminIngresosTable`** (componente especializado).

### Código de Renderizado

```tsx
{reporte.tipo === "INGRESOS_AUXILIAR" ? (
    <AuxiliarIngresosTable ... />
) : reporte.tipo === "INGRESOS_MI_ADMIN" ? (
    <MiAdminIngresosTable ... />
) : (
    <ReporteViewer ... />  // ← Se está ejecutando este
)}
```

### Posibles Causas

1. **El tipo del reporte no es exactamente "INGRESOS_MI_ADMIN"**

   - Puede tener espacios extra
   - Puede estar en minúsculas
   - Puede ser "INGRESOS" en lugar de "INGRESOS_MI_ADMIN"

2. **El componente MiAdminIngresosTable está lanzando un error**

   - React captura el error y renderiza null
   - Cae en el else y muestra ReporteViewer

3. **Problema con verDatos o tieneDatos**
   - Si alguno es false, no se renderiza nada
   - Poco probable ya que la imagen muestra datos

---

## 🔧 Soluciones Implementadas

### 1. Agregar Debug Logs

Se agregaron logs en `ReporteCard.tsx` para diagnosticar:

```tsx
console.log("🔍 ReporteCard - Tipo de reporte:", reporte.tipo);
console.log("🔍 ReporteCard - Comparación:", {
  tipo: reporte.tipo,
  esAuxiliar: reporte.tipo === "INGRESOS_AUXILIAR",
  esMiAdmin: reporte.tipo === "INGRESOS_MI_ADMIN",
});
```

### 2. Agregar Mensaje Visual de Debug

Se agregó un banner amarillo cuando se usa ReporteViewer:

```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2 text-sm">
  <strong>⚠️ DEBUG:</strong> Tipo de reporte "{reporte.tipo}" - Usando
  ReporteViewer genérico
</div>
```

---

## 📋 Pasos para Diagnosticar

### Paso 1: Verificar el Mensaje de Debug

1. Refrescar la página del reporte Mi Admin
2. Buscar el banner amarillo en la parte superior de la tabla
3. Leer el tipo de reporte que se muestra

**Si el banner aparece**: El tipo no es "INGRESOS_MI_ADMIN"
**Si el banner NO aparece**: El componente MiAdminIngresosTable se está renderizando

### Paso 2: Revisar la Consola del Navegador

1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Buscar logs que empiecen con `🔍 ReporteCard`
4. Ver el valor exacto de `reporte.tipo`

### Paso 3: Verificar Errores

1. En la consola, buscar errores en rojo
2. Si hay errores relacionados con MiAdminIngresosTable, el componente está fallando
3. Copiar el stack trace completo del error

---

## 🚀 Soluciones Propuestas

### Solución 1: Normalizar el Tipo de Reporte

Si el tipo es "INGRESOS" en lugar de "INGRESOS_MI_ADMIN":

```tsx
// En ReporteCard.tsx
const tipoNormalizado = reporte.tipo === "INGRESOS"
    ? "INGRESOS_MI_ADMIN"
    : reporte.tipo;

{tipoNormalizado === "INGRESOS_AUXILIAR" ? (
    <AuxiliarIngresosTable ... />
) : tipoNormalizado === "INGRESOS_MI_ADMIN" ? (
    <MiAdminIngresosTable ... />
) : (
    <ReporteViewer ... />
)}
```

### Solución 2: Usar Case-Insensitive Comparison

Si el problema es capitalización:

```tsx
const tipoUpper = reporte.tipo?.toUpperCase();

{tipoUpper === "INGRESOS_AUXILIAR" ? (
    <AuxiliarIngresosTable ... />
) : tipoUpper === "INGRESOS_MI_ADMIN" ? (
    <MiAdminIngresosTable ... />
) : (
    <ReporteViewer ... />
)}
```

### Solución 3: Agregar Error Boundary

Si el componente está fallando silenciosamente:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

// Dentro del render
{reporte.tipo === "INGRESOS_MI_ADMIN" ? (
    <ErrorBoundary
        fallback={
            <div className="bg-red-50 p-4 rounded">
                Error al cargar Mi Admin Ingresos. Usando visor genérico.
            </div>
        }
        onError={(error) => console.error('❌ Error en MiAdminIngresosTable:', error)}
    >
        <MiAdminIngresosTable ... />
    </ErrorBoundary>
) : ...}
```

### Solución 4: Actualizar el Tipo en Base de Datos

Si los reportes existentes tienen el tipo incorrecto:

```sql
-- Backend: Actualizar reportes existentes
UPDATE reporte_mensual
SET tipo = 'INGRESOS_MI_ADMIN'
WHERE tipo = 'INGRESOS'
AND archivo_original LIKE '%mi_admin%' OR archivo_original LIKE '%miadmin%';
```

---

## 📊 Información Adicional

### Tipos de Reporte Válidos

```typescript
export enum TipoReporteMensual {
  INGRESOS = "INGRESOS", // ← Reporte base (genérico)
  INGRESOS_AUXILIAR = "INGRESOS_AUXILIAR",
  INGRESOS_MI_ADMIN = "INGRESOS_MI_ADMIN",
}
```

### Mapeo de Nombres

```typescript
export const TIPOS_REPORTE_NOMBRES = {
  INGRESOS: "Reporte Ingresos",
  INGRESOS_AUXILIAR: "Reporte Ingresos Auxiliar",
  INGRESOS_MI_ADMIN: "Reporte MI Admin",
};
```

---

## ✅ Checklist de Verificación

- [ ] Verificar mensaje de debug amarillo
- [ ] Revisar consola del navegador
- [ ] Identificar el tipo exacto del reporte
- [ ] Verificar si hay errores de React
- [ ] Confirmar que el archivo es "mi-admin-ingresos.xlsx"
- [ ] Verificar que el reporte fue importado correctamente

---

## 👤 Autor

**GitHub Copilot**  
Fecha: 9 de octubre de 2025

## 📌 Próximo Paso

**Por favor, refrescar la página y reportar:**

1. Si aparece el banner amarillo de debug
2. Qué tipo de reporte muestra en el banner
3. Qué aparece en la consola del navegador (logs con 🔍)
