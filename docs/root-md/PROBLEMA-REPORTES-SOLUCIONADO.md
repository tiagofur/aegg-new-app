# 🔧 Problema de Reportes - Análisis y Solución

## 📋 Problema Reportado

El usuario informó que:

1. **No se ven los cálculos y columnas nuevas** en Mi Admin Ingresos
2. **No se puede editar Estado SAT ni Tipo Cambio**
3. **Todas las filas quedan en ROJO** porque falta el `Subtotal MXN` para comparar con Auxiliar
4. Sospecha de archivos duplicados o uso de componentes incorrectos

## 🔍 Diagnóstico Realizado

### Análisis del Flujo de Datos

```
ReporteCard (src/components/trabajos/)
  ↓
  [PROBLEMA ENCONTRADO: auxiliarReporteId vacío]
  ↓
MiAdminIngresosTable (src/features/trabajos/reportes/mi-admin-ingresos/)
  ↓
  useMiAdminIngresosData()
    ↓
    parseExcelToMiAdminIngresos() ← ⚠️ Recibe auxiliarData vacío
      ↓
      NO puede calcular:
      - subtotalAUX (null)
      - tcSugerido (null)
      - subtotalMXN (incorrecto sin TC)
```

### Causa Raíz Identificada

**En `ReporteCard.tsx` líneas 31-34:**

```typescript
const { data: auxiliarData } = useAuxiliarIngresosData({
  mesId: mesId,
  reporteId: "", // ❌ PROBLEMA: reporteId vacío!
  enabled: reporte.tipo === "INGRESOS_MI_ADMIN" && verDatos,
});
```

**Consecuencias:**

- ❌ El hook `useAuxiliarIngresosData` recibe `reporteId: ""` vacío
- ❌ No carga datos del Auxiliar del mismo mes
- ❌ `auxiliarData` llega como `[]` (array vacío) a Mi Admin
- ❌ `parseExcelToMiAdminIngresos()` no puede buscar:
  - `subtotalAUX` por UUID
  - `tipoCambio` correcto para USD/EUR
  - `tcSugerido` para sugerir correcciones
- ❌ Sin `subtotalMXN` válido, la comparación siempre falla (ROJO)

## ✅ Solución Implementada

### 1. Modificar `ReporteCard.tsx`

**Añadido prop para recibir el ID del reporte Auxiliar:**

```typescript
interface ReporteCardProps {
  // ... props existentes
  /** ID del reporte Auxiliar del mismo mes (para integración en Mi Admin) */
  auxiliarReporteId?: string;
}
```

**Actualizado hook para usar el ID correcto:**

```typescript
const { data: auxiliarData } = useAuxiliarIngresosData({
  mesId: mesId,
  reporteId: auxiliarReporteId || "", // ✅ Usa el ID real del Auxiliar
  enabled:
    (reporte.tipo === "INGRESOS_MI_ADMIN" || reporte.tipo === "INGRESOS") &&
    verDatos &&
    !!auxiliarReporteId, // Solo cargar si existe el ID
});
```

### 2. Modificar `MesCard.tsx`

**Buscar el reporte Auxiliar del mes y pasarlo a cada ReporteCard:**

```typescript
<div className="space-y-2 mb-3">
  {mes.reportes.map((reporte) => {
    // 🔥 CRITICAL: Find the Auxiliar report ID for Mi Admin integration
    const auxiliarReporte = mes.reportes.find(
      (r) => r.tipo === "INGRESOS_AUXILIAR"
    );
    const auxiliarReporteId = auxiliarReporte?.id;

    return (
      <ReporteCard
        key={reporte.id}
        reporte={reporte}
        mesId={mes.id}
        trabajoId={trabajoId}
        trabajoYear={trabajoYear}
        mesNumber={mes.mes}
        auxiliarReporteId={auxiliarReporteId} // ✅ Pasar el ID
      />
    );
  })}
</div>
```

## 🎯 Resultados Esperados

Con este fix, el flujo ahora funciona correctamente:

```
MesCard
  ↓ Busca el reporte Auxiliar del mes
  ↓ Obtiene su ID
  ↓
ReporteCard
  ↓ Recibe auxiliarReporteId
  ↓ Carga datos del Auxiliar con useAuxiliarIngresosData
  ↓
MiAdminIngresosTable
  ↓ Recibe auxiliarData con datos reales
  ↓
parseExcelToMiAdminIngresos()
  ✅ auxiliarLookup contiene registros por UUID
  ✅ Busca subtotalAUX para cada factura
  ✅ Corrige TC=1.0 con datos del Auxiliar
  ✅ Calcula tcSugerido correctamente
  ✅ Genera subtotalMXN = subtotal * tipoCambio
  ↓
MiAdminIngresosTable muestra:
  ✅ Columna "Subtotal AUX" con valores reales
  ✅ Columna "Subtotal MXN" calculado correctamente
  ✅ Columna "TC Sugerido" con valores reales
  ✅ Estado SAT editable
  ✅ Tipo Cambio editable
  ✅ Comparación con Auxiliar funcional (colores correctos)
```

## 📊 Verificación del Código de Parsing

El código de parsing **YA ESTABA CORRECTO** en `mi-admin-ingresos-calculations.ts`:

```typescript
// ✅ Buscar subtotalAUX desde Auxiliar (ya viene en MXN)
const auxiliarRow = auxiliarLookup.get(uuid);
const subtotalAUX = auxiliarRow?.subtotal || null;

// ✅ Calcular subtotal MXN
const subtotalMXN = calculateSubtotalMXN(subtotal, moneda, tipoCambio);

// ✅ Calcular TC Sugerido
const tcSugerido = calculateTCSugerido(subtotalAUX, subtotal);

// ✅ Crear el objeto de fila con TODAS las columnas
rows.push({
  id: uuid,
  folio: folio,
  fecha,
  rfc,
  razonSocial,
  subtotal,
  iva,
  total,
  moneda,
  tipoCambio,
  estadoSat,
  subtotalAUX, // ✅ Columna nueva
  subtotalMXN, // ✅ Columna calculada
  tcSugerido, // ✅ Columna calculada
});
```

**El problema NO era el código de parsing, sino que nunca recibía los datos del Auxiliar.**

## 🧪 Pruebas a Realizar

1. ✅ Compilación: `npm run build` en frontend → **EXITOSO**
2. ⏳ Cargar un trabajo con:
   - Reporte Auxiliar importado
   - Reporte Mi Admin importado
3. ⏳ Abrir el mes y verificar Mi Admin:
   - Ver columna "Subtotal AUX" con valores
   - Ver columna "Subtotal MXN" calculada
   - Ver columna "TC Sugerido"
   - Editar Estado SAT
   - Editar Tipo Cambio
   - Verificar colores de comparación

## 📝 Archivos Modificados

- ✅ `frontend/src/components/trabajos/ReporteCard.tsx`
- ✅ `frontend/src/components/trabajos/MesCard.tsx`

## 🚀 Estado

- ✅ Build compilado correctamente
- ⏳ Pendiente: Pruebas en runtime con datos reales

---

**Fecha:** 2025-10-12  
**Diagnóstico:** Falta de carga de datos del Auxiliar para Mi Admin  
**Solución:** Pasar `auxiliarReporteId` desde MesCard → ReporteCard → hooks
