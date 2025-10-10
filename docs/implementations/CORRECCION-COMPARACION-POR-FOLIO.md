# Corrección: Comparación por Folio (No por UUID)

**Fecha**: 9 de octubre de 2025  
**Estado**: ✅ **COMPLETADO**

---

## 📋 Descripción del Problema

El sistema de comparación entre **Mi Admin Ingresos** y **Auxiliar Ingresos** estaba usando **UUID** para comparar las filas entre ambos reportes. Sin embargo, la comparación correcta debe hacerse por **FOLIO**, que es el identificador fiscal de las facturas.

### Problema Identificado

- **`useMiAdminIngresosComparison`**: ✅ Ya usaba FOLIO correctamente
- **`useAuxiliarIngresosComparison`**: ❌ Usaba UUID en lugar de FOLIO

---

## 🔧 Cambios Realizados

### 1. Hook de Comparación de Auxiliar Ingresos

**Archivo**: `frontend/src/features/trabajos/reportes/auxiliar-ingresos/hooks/useAuxiliarIngresosComparison.ts`

#### Cambios:

```typescript
// ❌ ANTES: Comparación por UUID
const miadminLookup = new Map(
  miadminData!.map((row) => [row.uuid, row.subtotal])
);

auxiliarData.forEach((auxRow) => {
  const miadminSubtotal = miadminLookup.get(auxRow.id); // ❌ Busca por UUID
  // ...
});

// ✅ DESPUÉS: Comparación por FOLIO
const miadminLookup = new Map(
  miadminData!
    .filter((row) => row.estadoSat === "Vigente")
    .map((row) => [row.folio, { subtotal: row.subtotal, uuid: row.uuid }])
);

auxiliarData.forEach((auxRow) => {
  if (!auxRow.folio) {
    // Manejo de filas sin folio
    return;
  }
  const miadminRow = miadminLookup.get(auxRow.folio); // ✅ Busca por FOLIO
  // ...
});
```

#### Mejoras Implementadas:

1. **Comparación por FOLIO**: Ahora se compara usando `row.folio` en lugar de `row.uuid`
2. **Filtro de Estado SAT**: Solo se incluyen facturas vigentes de Mi Admin en el lookup
3. **Manejo de Folios Vacíos**: Se detectan y reportan facturas de Auxiliar sin folio
4. **Tooltips Mejorados**: Los mensajes ahora incluyen el número de folio para mejor identificación
5. **UUID como Fallback**: Se mantiene el UUID para renderizado en el Map

---

### 2. Tipos Actualizados

**Archivo**: `frontend/src/features/trabajos/reportes/auxiliar-ingresos/types/index.ts`

#### Cambios en `MiAdminIngresosRow`:

```typescript
// ❌ ANTES
export interface MiAdminIngresosRow {
  uuid: string;
  subtotalMXN: number;
  [key: string]: any;
}

// ✅ DESPUÉS
export interface MiAdminIngresosRow {
  uuid: string;
  folio: string; // ✅ Agregado para comparación
  estadoSat: "Vigente" | "Cancelada"; // ✅ Agregado para filtrado
  subtotal: number; // ✅ Renombrado de subtotalMXN
  [key: string]: any;
}
```

---

## 🎯 Funcionalidad Actualizada

### Flujo de Comparación

```
1. Mi Admin Ingresos carga datos
   ↓
2. Se crea un Map por FOLIO (solo vigentes):
   Map<folio, { subtotal, uuid }>
   ↓
3. Auxiliar Ingresos itera sus filas:
   - Si tiene folio → busca en Map por folio
   - Si no tiene folio → marca como "sin folio"
   ↓
4. Casos detectados:
   ✅ Match: FOLIO existe en ambos y valores coinciden
   ❌ Mismatch: FOLIO existe en ambos pero valores difieren
   🔵 Only Auxiliar: FOLIO solo en Auxiliar
   🟣 Only Mi Admin: FOLIO solo en Mi Admin (vigentes)
```

### Comparación de Totales

- **Total Auxiliar**: Suma de subtotales de facturas vigentes
- **Total Mi Admin**: Suma de subtotales de facturas vigentes
- **Diferencia**: Valor absoluto entre ambos totales
- **Match**: Si diferencia ≤ 0.10 (tolerancia)

---

## 📊 Beneficios

1. **Comparación Correcta**: Ahora se compara por el identificador fiscal real (folio)
2. **Mejor Trazabilidad**: Los tooltips muestran el folio para fácil identificación
3. **Filtrado Inteligente**: Solo se comparan facturas vigentes
4. **Detección de Anomalías**: Se identifican facturas sin folio
5. **Consistencia**: Ambos reportes (Mi Admin y Auxiliar) usan el mismo criterio

---

## 🔍 Verificación

### Casos de Prueba

1. **Facturas Coincidentes**:

   - Folio existe en ambos reportes
   - Diferencia en subtotales ≤ $0.10
   - Resultado: ✅ Match

2. **Facturas con Discrepancia**:

   - Folio existe en ambos reportes
   - Diferencia en subtotales > $0.10
   - Resultado: ❌ Mismatch

3. **Facturas Solo en Auxiliar**:

   - Folio existe en Auxiliar pero no en Mi Admin
   - Resultado: 🔵 Only Auxiliar

4. **Facturas Solo en Mi Admin**:

   - Folio existe en Mi Admin (vigente) pero no en Auxiliar
   - Resultado: 🟣 Only Mi Admin

5. **Facturas sin Folio**:

   - Fila en Auxiliar sin folio
   - Resultado: 🔵 Only Auxiliar (sin folio)

6. **Facturas Canceladas**:
   - No se incluyen en la comparación
   - No afectan los totales

---

## 📝 Notas Técnicas

### Estructura de Datos

#### Mi Admin Ingresos Row

```typescript
{
  id: string; // UUID interno
  folio: string; // Folio fiscal (para comparación)
  fecha: string | null;
  rfc: string | null;
  subtotal: number; // En moneda original
  moneda: string; // USD, EUR, MXN
  tipoCambio: number | null;
  estadoSat: "Vigente" | "Cancelada";
  subtotalMXN: number; // Calculado
  // ...
}
```

#### Auxiliar Ingresos Row

```typescript
{
  id: string; // UUID interno
  folio: string | null; // Folio fiscal (puede ser null)
  fecha: string | null;
  rfc: string | null;
  subtotal: number; // Ya en MXN
  moneda: string; // Informativo
  tipoCambio: number | null; // Informativo
  estadoSat: "Vigente" | "Cancelada";
  // ...
}
```

### Constantes de Configuración

```typescript
// Tolerancia para comparación ($0.10 MXN)
AUXILIAR_INGRESOS_CONFIG.COMPARISON_TOLERANCE = 0.1;
MI_ADMIN_INGRESOS_CONFIG.COMPARISON_TOLERANCE = 0.1;
```

---

## ✅ Estado Final

- [x] Corregido hook de comparación de Auxiliar
- [x] Actualizado tipo MiAdminIngresosRow
- [x] Agregado filtro por estado SAT
- [x] Mejorados tooltips con información de folio
- [x] Implementado manejo de folios vacíos
- [x] Documentación actualizada

---

## 🚀 Próximos Pasos (Opcionales)

1. **Integración en ReporteCard**: Pasar datos de Mi Admin a Auxiliar para comparación bidireccional
2. **UI de Comparación**: Agregar panel visual de comparación con estadísticas
3. **Exportación de Discrepancias**: Permitir exportar reporte de diferencias
4. **Alertas Automáticas**: Notificar automáticamente cuando hay discrepancias mayores

---

## 👤 Autor

**GitHub Copilot**  
Fecha: 9 de octubre de 2025
