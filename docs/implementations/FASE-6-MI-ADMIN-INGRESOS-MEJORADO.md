# FASE 6 - Reporte Mi Admin Ingresos Mejorado

**Fecha de Creación**: 7 de Octubre, 2025  
**Estado**: En Desarrollo - FASE 2 COMPLETADA ✅  
**Prioridad**: Alta

---

## 📋 Objetivo

Implementar el reporte **Mi Admin Ingresos** en el nuevo frontend con funcionalidades avanzadas:

- Columnas editables (Tipo de Cambio, Estado SAT)
- Cálculo de **TC Sugerido** basado en Auxiliar Ingresos
- Cálculos automáticos (Subtotal MXN, totales)
- Sistema de comparación con Auxiliar Ingresos **por FOLIO**
- Botones de acción especiales (Aplicar TC Sugerido, Cancelar Folios Únicos)
- UI/UX optimizada

---

## 🎯 Scope Funcional

### ✅ Funcionalidades Core

#### 1. **Columnas del Reporte**

##### Columnas Originales del Excel:

- **Folio** (String) - CLAVE PARA COMPARACIÓN
- **Fecha** (Date)
- **RFC** (String)
- **Razón Social** (String)
- **Subtotal** (Number) - Original de Mi Admin
- **IVA** (Number)
- **Total** (Number)
- **Moneda** (String) - USD, EUR, MXN
- **Estado SAT** (String) - Vigente/Cancelada (EDITABLE)
- **Tipo de Cambio** (Number) - EDITABLE

##### Columnas Calculadas/Agregadas:

- **SUBTOTAL AUX** (Number) - Copiado desde Auxiliar Ingresos (por Folio)
- **SUBTOTAL MXN** (Number) - CALCULADO:
  ```typescript
  if (moneda === "MXN") {
    subtotalMXN = subtotal;
  } else {
    subtotalMXN = subtotal * tipoCambio;
  }
  ```
- **TC SUGERIDO** (Number) - CALCULADO:
  ```typescript
  if (subtotalAUX && subtotal && subtotal !== 0) {
    tcSugerido = subtotalAUX / subtotal;
  }
  ```

#### 2. **Campos Editables**

- **Tipo de Cambio**: Input numérico con validación (mínimo 0, step 0.0001)
  - Disabled si moneda === 'MXN'
  - Al cambiar: Recalcula **Subtotal MXN**
- **Estado SAT**: Select con opciones "Vigente" / "Cancelada"
  - Al cambiar: Afecta totales (excluye canceladas)
  - Afecta comparación (solo vigentes se comparan)

#### 3. **Botones de Acción Especiales**

##### **3.1 Botón "Aplicar TC Sugerido" (Individual)**

- **Ubicación**: En cada fila, columna Tipo de Cambio
- **Condición**: Se muestra solo si `tipoCambio !== tcSugerido`
- **Acción**: Aplica `tcSugerido` al `tipoCambio` y recalcula `subtotalMXN`

##### **3.2 Botón "Aplicar TC Sugerido a Todos"**

- **Ubicación**: Toolbar
- **Acción**:
  ```typescript
  Para todas las filas donde tipoCambio !== tcSugerido:
    tipoCambio = tcSugerido
    Recalcular subtotalMXN
  ```

##### **3.3 Botón "Cancelar Folios Únicos"**

- **Ubicación**: Toolbar
- **Acción**:
  ```typescript
  Para todas las filas que solo existen en Mi Admin (no en Auxiliar):
    estadoSat = 'Cancelada'
  ```

#### 4. **Sistema de Comparación con Auxiliar Ingresos**

##### **Comparación por FOLIO** (no UUID):

```typescript
// Lookup de Auxiliar Ingresos por FOLIO
const auxiliarLookup = new Map(
  auxiliarData
    .filter((row) => row.estadoSat === "Vigente") // Solo vigentes
    .map((row) => [row.folio, row.subtotalMXN])
);

miAdminData.forEach((miAdminRow) => {
  // Ignorar canceladas
  if (miAdminRow.estadoSat === "Cancelada") return;

  const auxiliarSubtotal = auxiliarLookup.get(miAdminRow.folio);

  if (!auxiliarSubtotal) {
    // Solo en Mi Admin
    status = "only-miadmin";
  } else {
    const diff = Math.abs(miAdminRow.subtotalMXN - auxiliarSubtotal);
    if (diff <= 0.1) {
      status = "match"; // ✅ Coincide
    } else {
      status = "mismatch"; // ❌ Discrepancia
    }
  }
});
```

##### **Estados de Comparación**:

- ✅ **Match**: Folio existe en ambos y valores coinciden (tolerancia ±$0.10)
- ❌ **Mismatch**: Folio existe en ambos pero valores discrepan
- 🟣 **Only Mi Admin**: Folio solo en Mi Admin
- 🟣 **Only Auxiliar**: Folio solo en Auxiliar

##### **Colores de Fila**:

```typescript
const ROW_COLORS = {
  match: "bg-green-50 border-l-4 border-green-500",
  mismatch: "bg-red-50 border-l-4 border-red-500",
  onlyMiAdmin: "bg-purple-50 border-l-4 border-purple-500",
  onlyAuxiliar: "bg-purple-50 border-l-4 border-purple-500",
  cancelada: "bg-gray-100 text-gray-500", // Prioridad alta
};
```

##### **Comparación de Totales**:

```typescript
const miAdminTotal = sum(vigentes.subtotalMXN);
const auxiliarTotal = sum(auxiliar.vigentes.subtotalMXN);
const match = Math.abs(miAdminTotal - auxiliarTotal) <= 0.1;
```

#### 5. **Cálculo de Totales**

```typescript
// EXCLUIR CANCELADAS de los totales
const vigentes = data.filter((row) => row.estadoSat === "Vigente");

const totales = {
  totalSubtotal: sum(vigentes.subtotal),
  totalSubtotalAUX: sum(vigentes.subtotalAUX),
  totalSubtotalMXN: sum(vigentes.subtotalMXN),
  cantidadVigentes: vigentes.length,
  cantidadCanceladas: data.filter((row) => row.estadoSat === "Cancelada")
    .length,
};
```

#### 6. **UI/UX Esencial**

##### **Toolbar**:

- Botón "Guardar Cambios" (disabled si no hay cambios)
- Toggle "Comparar con Auxiliar"
- Botón "Aplicar TC Sugerido a Todos"
- Botón "Cancelar Folios Únicos"
- Badges de estado (cambios sin guardar, totales coinciden, canceladas)

##### **Tabla**:

- Columnas ordenables y filtrables
- Celdas editables con validación
- Colores condicionales según comparación
- Tooltips informativos
- Loading states
- Error handling

##### **Footer**:

- Fila sticky con totales
- Colores según comparación de totales
- Estadísticas (vigentes, canceladas)
- Comparación con Auxiliar (si activa)

---

## 🏗️ Arquitectura Propuesta

```
src/
  features/
    trabajos/
      reportes/
        mi-admin-ingresos/
          components/
            MiAdminIngresosTable.tsx           # Componente principal
            MiAdminIngresosToolbar.tsx         # Toolbar con acciones
            MiAdminIngresosFooter.tsx          # Fila de totales
            cells/
              TCSugeridoCell.tsx               # Nueva: TC Sugerido + botón
          hooks/
            useMiAdminIngresosData.ts          # Gestión de datos
            useMiAdminIngresosEdit.ts          # Lógica de edición
            useMiAdminIngresosCalculations.ts  # Cálculos
            useMiAdminIngresosComparison.ts    # Comparación
          utils/
            mi-admin-ingresos-calculations.ts  # Funciones de cálculo
            mi-admin-ingresos-styles.ts        # Helpers de estilos
          types/
            index.ts                           # Tipos específicos
          index.ts                             # Exportaciones públicas
```

### Reutilización de Componentes:

- ✅ `EditableTipoCambioCell` (de Auxiliar Ingresos)
- ✅ `EditableEstadoSatCell` (de Auxiliar Ingresos)

---

## 📦 Modelo de Datos

```typescript
// types/index.ts

export interface MiAdminIngresosRow {
  id: string; // ID único interno
  folio: string; // FOLIO (clave para comparación)
  fecha: string | null;
  rfc: string | null;
  razonSocial: string | null;

  // Valores originales de Mi Admin
  subtotal: number;
  iva: number;
  total: number;
  moneda: string; // USD, EUR, MXN

  // Valores editables
  tipoCambio: number | null; // EDITABLE (null si moneda === 'MXN')
  estadoSat: "Vigente" | "Cancelada"; // EDITABLE

  // Valores calculados/copiados
  subtotalAUX: number | null; // Copiado desde Auxiliar (por folio)
  subtotalMXN: number; // CALCULADO: subtotal * tipoCambio
  tcSugerido: number | null; // CALCULADO: subtotalAUX / subtotal

  [key: string]: any; // Columnas adicionales del Excel
}

export interface MiAdminIngresosTotales {
  totalSubtotal: number;
  totalSubtotalAUX: number;
  totalSubtotalMXN: number;
  cantidadVigentes: number;
  cantidadCanceladas: number;
}

export interface MiAdminIngresosComparisonResult {
  folio: string;
  status: "match" | "mismatch" | "only-miadmin" | "only-auxiliar";
  miAdminSubtotal?: number;
  auxiliarSubtotal?: number;
  difference?: number;
  tooltip: string;
}

export const MI_ADMIN_INGRESOS_CONFIG = {
  COMPARISON_TOLERANCE: 0.1, // $0.10 centavos
  CURRENCY_DECIMALS: 2,
  TC_DECIMALS: 4,
} as const;
```

---

## 🎯 Plan de Implementación (4 Fases)

### **FASE 1: Tipos y Utilidades Base** ✅ COMPLETADA

#### Archivos creados:

- ✅ `types/index.ts` - Tipos TypeScript completos
- ✅ `utils/mi-admin-ingresos-calculations.ts` - Funciones de cálculo
- ✅ `utils/mi-admin-ingresos-styles.ts` - Helpers de estilos
- ✅ `utils/index.ts` - Índice de exportación
- ✅ `index.ts` - Exportaciones públicas del feature

#### Funciones implementadas:

```typescript
// Parsing y transformación
parseExcelToMiAdminIngresos(excelData, auxiliarData);

// Cálculos
calculateSubtotalMXN(subtotal, moneda, tipoCambio);
calculateTCSugerido(subtotalAUX, subtotal);
calculateTotales(data);

// Helpers de formato
formatCurrency(value);
formatTipoCambio(value);
formatDate(date);
isValidTipoCambio(value);
```

#### Estadísticas FASE 1:

- **Archivos creados**: 5
- **Líneas de código**: ~550
- **Estado**: ✅ Sin errores TypeScript
- **Commit**: `feat(frontend): FASE-1 Mi Admin Ingresos - tipos y utilidades base`

---

### **FASE 2: Hooks de Lógica** ✅ COMPLETADA

#### Archivos creados:

- ✅ `hooks/useMiAdminIngresosData.ts` - Fetch y guardado con React Query
- ✅ `hooks/useMiAdminIngresosEdit.ts` - Edición in-memory con Map
- ✅ `hooks/useMiAdminIngresosCalculations.ts` - Cálculos memoizados
- ✅ `hooks/useMiAdminIngresosComparison.ts` - Comparación con Auxiliar por FOLIO

#### Funcionalidades implementadas:

```typescript
// Data fetching
const { data, isLoading, error, refetch, handleSave } = useMiAdminIngresosData(
  trabajoId,
  auxiliarData
);

// Edición
const {
  editedData,
  hasUnsavedChanges,
  updateTipoCambio,
  updateEstadoSat,
  aplicarTCSugerido,
  aplicarTCSugeridoATodos,
  cancelarFoliosUnicos,
  resetChanges,
} = useMiAdminIngresosEdit(data, auxiliarData);

// Cálculos
const { totales } = useMiAdminIngresosCalculations(editedData);

// Comparación
const {
  comparisonMap,
  comparisonStats,
  totalesComparison,
  isComparisonActive,
  toggleComparison,
} = useMiAdminIngresosComparison(editedData, auxiliarData);
```

#### Estadísticas FASE 2:

- **Archivos creados**: 4
- **Líneas de código**: ~408
- **Estado**: ✅ Sin errores TypeScript
- **Commit**: Ya completado en iteración anterior

---

### **FASE 3: Componentes UI** ⏳ SIGUIENTE

1. `hooks/useMiAdminIngresosData.ts`
2. `hooks/useMiAdminIngresosEdit.ts`
3. `hooks/useMiAdminIngresosCalculations.ts`
4. `hooks/useMiAdminIngresosComparison.ts`
5. `hooks/index.ts`

#### Funcionalidades:

##### **useMiAdminIngresosData**:

- Query con React Query para fetch
- Mutation para save
- Parsing automático con `parseExcelToMiAdminIngresos`
- Integración con datos de Auxiliar Ingresos
- Invalidación de queries

##### **useMiAdminIngresosEdit**:

- Map de ediciones por folio
- `updateTipoCambio(folio, value)`
- `updateEstadoSat(folio, value)`
- `aplicarTCSugerido(folio)`
- `aplicarTCSugeridoATodos()`
- `cancelarFoliosUnicos(comparisonMap)`
- Recálculo automático de subtotalMXN
- Estado `isDirty`

##### **useMiAdminIngresosCalculations**:

- `totales` calculados con `useMemo`
- Excluye canceladas
- Performance optimizado

##### **useMiAdminIngresosComparison**:

- Toggle de activación
- Comparación por FOLIO
- Map de resultados por folio
- Comparación de totales
- Detección de coincidencias/discrepancias

---

### **FASE 3: Componentes UI** ⏳ PENDIENTE

#### Componentes a crear:

1. `components/cells/TCSugeridoCell.tsx` - Nueva celda especializada
2. `components/MiAdminIngresosToolbar.tsx` - Toolbar con botones
3. `components/MiAdminIngresosFooter.tsx` - Fila de totales
4. `components/MiAdminIngresosTable.tsx` - Componente principal
5. `components/index.ts` - Exportaciones

#### Componentes reutilizados:

- ✅ `EditableTipoCambioCell` (de auxiliar-ingresos)
- ✅ `EditableEstadoSatCell` (de auxiliar-ingresos)

---

### **FASE 4: Integración** ⏳ PENDIENTE

#### Modificaciones necesarias:

1. **`ReporteCard.tsx`**: Detectar tipo `INGRESOS_MI_ADMIN` y renderizar componente
2. **Obtener datos de Auxiliar**: Query para pasar como prop
3. **Pruebas de integración**: Verificar flujo completo

---

## 🔄 Diferencias Clave con Auxiliar Ingresos

| Característica           | Auxiliar Ingresos        | Mi Admin Ingresos                                                |
| ------------------------ | ------------------------ | ---------------------------------------------------------------- |
| **Clave de comparación** | Folio                    | Folio                                                            |
| **Columnas editables**   | Tipo Cambio + Estado SAT | Tipo Cambio + Estado SAT                                         |
| **Columnas calculadas**  | Subtotal MXN             | Subtotal AUX + Subtotal MXN + TC Sugerido                        |
| **Canceladas**           | Sí (Estado SAT)          | Sí (Estado SAT)                                                  |
| **Totales**              | Excluye canceladas       | Excluye canceladas                                               |
| **Botones especiales**   | Ninguno                  | Aplicar TC Sugerido (individual y todos), Cancelar Folios Únicos |
| **Comparación**          | Es comparado (secondary) | Es comparador (primary)                                          |
| **Rol en sistema**       | Base de datos            | Comparación y ajuste                                             |

---

## 📊 Sistema de Colores

```typescript
// Colores de Fila según Comparación y Estado
const getRowBackgroundColor = (row, comparison, isComparisonActive) => {
  // Prioridad 1: Canceladas (siempre gris)
  if (row.estadoSat === "Cancelada") {
    return "bg-gray-100 text-gray-500";
  }

  // Prioridad 2: Comparación (si está activa)
  if (isComparisonActive && comparison) {
    switch (comparison.status) {
      case "match":
        return "bg-green-50 border-l-4 border-green-500 hover:bg-green-100";
      case "mismatch":
        return "bg-red-50 border-l-4 border-red-500 hover:bg-red-100";
      case "only-miadmin":
      case "only-auxiliar":
        return "bg-purple-50 border-l-4 border-purple-500 hover:bg-purple-100";
    }
  }

  // Default: Normal
  return "hover:bg-gray-50 transition-colors";
};

// Colores de Footer según Comparación de Totales
const getFooterBackgroundColor = (totalesMatch) => {
  if (totalesMatch === null) {
    return "bg-gray-100"; // Sin comparación
  }
  return totalesMatch
    ? "bg-blue-50 border-blue-400" // Coinciden
    : "bg-red-50 border-red-400"; // Discrepan
};
```

---

## 🧪 Checklist de Testing

### Funcional

- [ ] Cargar datos desde API
- [ ] Integrar con datos de Auxiliar Ingresos
- [ ] Copiar SUBTOTAL AUX desde Auxiliar (por folio)
- [ ] Calcular TC SUGERIDO correctamente
- [ ] Calcular SUBTOTAL MXN correctamente
- [ ] Editar Tipo de Cambio recalcula SUBTOTAL MXN
- [ ] Editar Estado SAT actualiza totales
- [ ] Botón "Aplicar TC Sugerido" individual funciona
- [ ] Botón "Aplicar TC Sugerido a Todos" funciona
- [ ] Botón "Cancelar Folios Únicos" funciona
- [ ] Comparación por FOLIO detecta coincidencias
- [ ] Comparación detecta discrepancias
- [ ] Comparación detecta folios únicos (Mi Admin y Auxiliar)
- [ ] Totales excluyen canceladas
- [ ] Guardar persiste cambios
- [ ] Invalidar cache al guardar

### Edge Cases

- [ ] Moneda MXN (tipo cambio disabled)
- [ ] Subtotal = 0 (TC Sugerido null)
- [ ] Sin SUBTOTAL AUX (no existe en Auxiliar)
- [ ] Todas las facturas canceladas
- [ ] Sin datos de Auxiliar (comparación disabled)
- [ ] Tipo cambio = 0 (validación)
- [ ] Tipo cambio negativo (validación)
- [ ] Datos vacíos

### UI/UX

- [ ] Loading state al cargar
- [ ] Loading state al guardar
- [ ] Badge "cambios sin guardar"
- [ ] Badge "totales coinciden"
- [ ] Badge "totales no coinciden"
- [ ] Badge "X canceladas"
- [ ] Colores de comparación correctos
- [ ] Tooltips informativos
- [ ] Botones disabled cuando corresponde
- [ ] Estados de loading en botones

---

## 📚 Referencias

- **Reporte Original**: `frontend-old/src/features/reporte/components/reporteIngresosMiAdmin.tsx`
- **Context Original**: `frontend-old/src/features/reporte/context/ReportComparisonContext.tsx`
- **Redux Original**: `frontend-old/src/features/reporte/redux/reporteIngresosMiAdminSlice.ts`
- **Documentación React Table**: https://tanstack.com/table/v8
- **Documentación TanStack Query**: https://tanstack.com/query/latest

---

## 🚀 Próximos Pasos

### Inmediatos:

1. ✅ Completar FASE 1 (Tipos y Utilidades)
2. ⏳ Implementar FASE 2 (Hooks)
3. ⏳ Implementar FASE 3 (Componentes UI)
4. ⏳ Implementar FASE 4 (Integración)

### Futuros:

1. **Testing Manual**: Verificar todas las funcionalidades con datos reales
2. **Optimización**: Revisar performance con datasets grandes
3. **Documentación Usuario**: Crear guía de uso para el reporte
4. **Sincronización Bidireccional**: Mejorar comparación entre Auxiliar y Mi Admin

---

## 📝 Notas de Implementación

### Dependencias con Auxiliar Ingresos:

- Mi Admin necesita datos de Auxiliar para:
  1. Copiar **SUBTOTAL AUX**
  2. Calcular **TC SUGERIDO**
  3. Sistema de **Comparación**

### Orden de Carga:

```
1. Cargar Auxiliar Ingresos
2. Cargar Mi Admin Ingresos (con datos de Auxiliar)
3. Activar comparación
```

### Performance:

- Usar `useMemo` para cálculos pesados
- Usar `useCallback` para funciones de edición
- Map lookup para comparación (O(1))

---

## ✅ Estado Actual

- [x] Análisis de funcionalidades frontend-old
- [x] Diseño de arquitectura nueva
- [x] Documentación completa
- [x] **FASE 1: Tipos y Utilidades Base** ✅ COMPLETADA
  - [x] types/index.ts (175 líneas)
  - [x] utils/mi-admin-ingresos-calculations.ts (253 líneas)
  - [x] utils/mi-admin-ingresos-styles.ts (138 líneas)
  - [x] utils/index.ts (29 líneas)
  - [x] index.ts (44 líneas)
  - **Total**: 5 archivos, ~639 líneas de código
  - **Validación**: ✅ Sin errores TypeScript
- [x] **FASE 2: Hooks de Lógica** ✅ COMPLETADA
  - [x] hooks/useMiAdminIngresosData.ts (82 líneas) - Fetch y save con React Query
  - [x] hooks/useMiAdminIngresosEdit.ts (171 líneas) - Edición in-memory con Map
  - [x] hooks/useMiAdminIngresosCalculations.ts (24 líneas) - Cálculos memoizados
  - [x] hooks/useMiAdminIngresosComparison.ts (173 líneas) - Comparación por FOLIO
  - [x] hooks/index.ts (8 líneas) - Exportaciones
  - **Total**: 5 archivos, ~458 líneas de código
  - **Validación**: ✅ Sin errores TypeScript
- [ ] FASE 3: Componentes UI (siguiente)
- [ ] FASE 4: Integración
- [ ] Testing e integración

---

**Última Actualización**: 7 de Octubre, 2025 - FASE 2 Completada ✅  
**Responsable**: Equipo de Desarrollo  
**Revisión**: Pendiente
