# FASE 5 - Reporte Auxiliar de Ingresos Mejorado

**Fecha de Creación**: 7 de Octubre, 2025  
**Estado**: ✅ Completado  
**Prioridad**: Alta

---

## 📋 Objetivo

Implementar el reporte **Auxiliar de Ingresos** en el nuevo frontend con funcionalidades avanzadas:

- Columnas editables (Tipo de Cambio, Estado SAT)
- Cálculos automáticos (totales, exclusión de canceladas)
- Sistema de comparación con Mi Admin
- UI/UX optimizada

---

## 🎯 Scope Funcional

### ✅ Funcionalidades Core

#### 1. **Columnas Editables**

- **Tipo de Cambio**: Input numérico con validación (mínimo 0, step 0.0001)
- **Estado SAT**: Select con opciones "Vigente" / "Cancelada"
- Inicialización automática si no existen
- Recálculo automático de Subtotal MXN al cambiar Tipo de Cambio

#### 2. **Cálculos Automáticos**

- **Fila de Totales** calculada dinámicamente
- Exclusión de filas canceladas en totales
- Fórmula: `subtotalMXN = moneda === 'MXN' ? subtotalAUX : subtotalAUX * tipoCambio`
- Formateo con 2 decimales

#### 3. **Sistema de Comparación**

- Comparación por UUID con Reporte Mi Admin
- Toggle ON/OFF para activar/desactivar
- Estados de comparación:
  - ✅ **Match**: UUID existe en ambos y valores coinciden (tolerancia ±$0.10)
  - ❌ **Mismatch**: UUID existe en ambos pero valores discrepan
  - 🟣 **Only Auxiliar**: UUID solo en Auxiliar
  - 🟣 **Only Mi Admin**: UUID solo en Mi Admin
- Comparación de totales (Auxiliar vs Mi Admin)
- Tooltips informativos por fila

#### 4. **UI/UX Esencial**

- Filtrado por columnas (React Table built-in)
- Ordenamiento ascendente/descendente
- Fila de totales fija (sticky footer)
- Indicadores visuales de estado
- Feedback al guardar (loading + toast)
- Badges de estado (cambios sin guardar, totales coinciden)

### ❌ Fuera de Scope

- Gestión de archivos (ya implementado en sistema actual)
- Guardado local/IndexedDB (usamos API directamente)
- Paginación (scroll es suficiente para datasets pequeños)
- Export a Excel (fase posterior)

---

## 🏗️ Arquitectura

### Estructura de Carpetas

```
src/features/trabajos/reportes/auxiliar-ingresos/
├── components/
│   ├── AuxiliarIngresosTable.tsx          # Componente principal
│   ├── AuxiliarIngresosToolbar.tsx        # Barra de acciones
│   ├── AuxiliarIngresosFooter.tsx         # Fila de totales
│   └── cells/
│       ├── EditableTipoCambioCell.tsx     # Input tipo cambio
│       └── EditableEstadoSatCell.tsx      # Select estado SAT
├── hooks/
│   ├── useAuxiliarIngresosData.ts         # Fetch + save data
│   ├── useAuxiliarIngresosEdit.ts         # Gestión de ediciones
│   ├── useAuxiliarIngresosCalculations.ts # Cálculos de totales
│   └── useAuxiliarIngresosComparison.ts   # Lógica de comparación
├── utils/
│   ├── auxiliar-ingresos-columns.tsx      # Definición columnas
│   ├── auxiliar-ingresos-calculations.ts  # Funciones cálculo
│   └── auxiliar-ingresos-styles.ts        # Helpers estilos
└── types/
    └── auxiliar-ingresos.types.ts         # Tipos específicos
```

### Principios de Diseño

1. **Separación de Responsabilidades**

   - Hooks: Lógica de negocio
   - Componentes: Presentación UI
   - Utils: Funciones puras
   - Types: Definiciones de tipos

2. **Single Source of Truth**

   - Estado gestionado en hook principal
   - Ediciones en memoria hasta guardar
   - Recálculo automático con `useMemo`

3. **Performance**
   - Memoización con `useMemo` / `useCallback`
   - React Table para virtualización
   - Evitar re-renders innecesarios

---

## 📦 Modelo de Datos

### Tipos Principales

```typescript
// AuxiliarIngresosRow
interface AuxiliarIngresosRow {
  id: string; // UUID de factura
  fecha: string | null;
  rfc: string | null;
  razonSocial: string | null;
  subtotalAUX: number; // Subtotal original (USD, EUR, MXN)
  moneda: string; // USD, EUR, MXN
  tipoCambio: number | null; // EDITABLE
  subtotalMXN: number; // CALCULADO
  estadoSat: "Vigente" | "Cancelada"; // EDITABLE
  [key: string]: any; // Otras columnas del Excel
}

// Totales
interface AuxiliarIngresosTotales {
  totalSubtotalAUX: number;
  totalSubtotalMXN: number;
  cantidadVigentes: number;
  cantidadCanceladas: number;
  totalViable: boolean; // true si no hay canceladas
}

// Resultado de Comparación
interface ComparisonResult {
  uuid: string;
  status: "match" | "mismatch" | "only-auxiliar" | "only-miadmin";
  auxiliarSubtotal?: number;
  miadminSubtotal?: number;
  difference?: number;
  tooltip: string;
}
```

---

## 🎨 Sistema de Colores

### Filas

| Estado                     | Background                | Border                         | Texto           |
| -------------------------- | ------------------------- | ------------------------------ | --------------- |
| **Cancelada**              | `bg-purple-100`           | -                              | `text-gray-500` |
| **Match**                  | `bg-green-50`             | `border-l-4 border-green-500`  | Normal          |
| **Mismatch**               | `bg-red-50`               | `border-l-4 border-red-500`    | Normal          |
| **Only Auxiliar/Mi Admin** | `bg-purple-50`            | `border-l-4 border-purple-500` | Normal          |
| **Normal**                 | Hover: `hover:bg-gray-50` | -                              | Normal          |

### Footer (Totales)

| Estado                   | Background    | Border                       |
| ------------------------ | ------------- | ---------------------------- |
| **Sin comparación**      | `bg-gray-100` | `border-t-2`                 |
| **Totales coinciden**    | `bg-blue-50`  | `border-t-2 border-blue-400` |
| **Totales no coinciden** | `bg-red-50`   | `border-t-2 border-red-400`  |

### Badges

- **Cambios sin guardar**: `variant="warning"`
- **Totales coinciden**: `variant="success"` ✅
- **Totales no coinciden**: `variant="destructive"` ❌
- **Facturas canceladas**: `variant="secondary"`

---

## 🔧 Implementación por Fases

### **FASE 1: Setup Base**

**Objetivo**: Estructura, tipos y funciones base

**Archivos a crear**:

1. `types/auxiliar-ingresos.types.ts`

   - Definir interfaces principales
   - Tipos para estado de edición
   - Tipos para comparación

2. `utils/auxiliar-ingresos-calculations.ts`

   - `parseExcelToAuxiliarIngresos()`: Transformar datos Excel a tipado
   - `calculateTotales()`: Calcular totales excluyendo canceladas
   - `calculateSubtotalMXN()`: Calcular subtotal en MXN

3. `utils/auxiliar-ingresos-styles.ts`
   - `getRowBackgroundColor()`: Determinar color de fila según estado

**Entregable**: Tipos y utilidades testeables

---

### **FASE 2: Hooks de Lógica**

**Objetivo**: Implementar lógica de negocio

**Hooks a crear**:

1. **`useAuxiliarIngresosData.ts`**

   - Fetch datos con `useQuery`
   - Mutation para guardar con `useMutation`
   - Invalidar cache al guardar
   - Transformar datos con `parseExcelToAuxiliarIngresos`

2. **`useAuxiliarIngresosEdit.ts`**

   - Gestionar mapa de ediciones (`Map<string, Partial<Row>>`)
   - `updateTipoCambio()`: Actualizar y recalcular
   - `updateEstadoSat()`: Actualizar estado
   - `mergedData`: Combinar datos originales + ediciones
   - `isDirty`: Flag de cambios sin guardar
   - `resetEdits()`: Limpiar ediciones

3. **`useAuxiliarIngresosCalculations.ts`**

   - Usar `calculateTotales()` con `useMemo`
   - Recalcular automáticamente al cambiar datos

4. **`useAuxiliarIngresosComparison.ts`**
   - Toggle de activación
   - Crear mapa de comparación por UUID
   - Comparar totales Auxiliar vs Mi Admin
   - Generar tooltips descriptivos
   - `getRowStyle()`: Helper para estilos según comparación

**Entregable**: Hooks testeables e independientes

---

### **FASE 3: Componentes UI**

**Objetivo**: Construir interfaz interactiva

**Componentes a crear**:

1. **Celdas Editables**

   - `EditableTipoCambioCell.tsx`: Input numérico con validación
   - `EditableEstadoSatCell.tsx`: Select con estilos condicionales

2. **Layout**

   - `AuxiliarIngresosToolbar.tsx`: Acciones principales
   - `AuxiliarIngresosFooter.tsx`: Totales con comparación
   - `AuxiliarIngresosTable.tsx`: Tabla principal con React Table

3. **Definición de Columnas**
   - `utils/auxiliar-ingresos-columns.tsx`: Array de ColumnDef

**Entregable**: UI funcional y responsive

---

### **FASE 4: Integración y Testing**

**Objetivo**: Conectar todo y validar

**Tareas**:

1. Integrar componente en página de Trabajos
2. Testing de flujo completo:
   - Cargar datos
   - Editar tipo de cambio → verificar recálculo
   - Cambiar estado SAT → verificar totales
   - Activar comparación → verificar colores
   - Guardar cambios → verificar persistencia
3. Testing de edge cases:
   - Moneda MXN (tipo cambio disabled)
   - Todas canceladas
   - Sin datos de Mi Admin
4. Ajustes de UX según feedback

**Entregable**: Feature completa y testeada

---

## 🔍 Casos de Uso Principales

### 1. **Editar Tipo de Cambio**

```
Usuario → Cambia valor en celda Tipo de Cambio
Sistema → Valida número positivo
Sistema → Recalcula subtotalMXN = subtotalAUX * tipoCambio
Sistema → Recalcula totales
Sistema → Marca isDirty = true
```

### 2. **Cancelar Factura**

```
Usuario → Cambia Estado SAT a "Cancelada"
Sistema → Aplica estilo bg-purple-100
Sistema → Excluye fila de totales
Sistema → Incrementa contador de canceladas
Sistema → Marca isDirty = true
```

### 3. **Comparar con Mi Admin**

```
Usuario → Activa toggle de comparación
Sistema → Obtiene datos de Mi Admin
Sistema → Itera sobre UUIDs de Auxiliar
Sistema → Para cada UUID:
  - Busca en Mi Admin
  - Calcula diferencia
  - Asigna status (match/mismatch/only-auxiliar)
  - Genera tooltip
Sistema → Compara totales
Sistema → Aplica colores a filas
```

### 4. **Guardar Cambios**

```
Usuario → Click en "Guardar Cambios"
Sistema → Muestra loading
Sistema → Envía datos editados a API
Sistema → API actualiza BD
Sistema → Invalida cache de reportes
Sistema → Resetea ediciones (isDirty = false)
Sistema → Muestra toast de éxito
```

---

## 🚀 Plan de Migración desde frontend-old

### Funcionalidades Heredadas

| Funcionalidad            | frontend-old            | Nuevo Enfoque         |
| ------------------------ | ----------------------- | --------------------- |
| **Guardado local**       | IndexedDB + WorkManager | ❌ API directa        |
| **Tipo Cambio editable** | Input manual            | ✅ Mismo              |
| **Estado SAT editable**  | Select                  | ✅ Mismo              |
| **Cálculo totales**      | Reducer                 | ✅ Hook + useMemo     |
| **Comparación**          | Context                 | ✅ Hook               |
| **Colores**              | Estilos inline          | ✅ Tailwind classes   |
| **Guardado en Base**     | Botón condicional       | ✅ Siempre disponible |

### Mejoras Implementadas

1. **Performance**: Memoización agresiva, sin re-renders innecesarios
2. **Tipado**: TypeScript estricto en toda la cadena
3. **Testabilidad**: Hooks aislados, componentes puros
4. **Mantenibilidad**: Estructura modular por feature
5. **Escalabilidad**: Fácil agregar columnas/validaciones
6. **UX**: Feedback inmediato, estados claros

---

## 📝 Notas de Desarrollo

### Consideraciones Importantes

1. **Tolerancia en Comparación**

   - Usar ±$0.10 para evitar falsos positivos por redondeo
   - Configurable en constante `COMPARISON_TOLERANCE`

2. **Moneda MXN**

   - Tipo de cambio = 1.0 fijo
   - Input deshabilitado
   - subtotalMXN = subtotalAUX

3. **Invalidación de Cache**

   - Al guardar, invalidar:
     - `['reporte-auxiliar', mesId, reporteId]`
     - `['reporte-anual']` (por si usa estos datos)

4. **Optimización**

   - No recalcular totales si no hay cambios en data
   - Usar `useCallback` para handlers de eventos
   - Virtualizar tabla si > 500 filas (React Table)

5. **Accesibilidad**
   - Tooltips con información de comparación
   - Colores con suficiente contraste (WCAG AA)
   - Keyboard navigation en inputs

---

## 🐛 Testing Checklist

### Funcional

- [ ] Cargar datos desde API
- [ ] Editar tipo de cambio recalcula subtotal MXN
- [ ] Editar estado SAT actualiza totales
- [ ] Comparación detecta coincidencias
- [ ] Comparación detecta discrepancias
- [ ] Comparación detecta UUIDs únicos
- [ ] Guardar persiste cambios
- [ ] Invalidar cache al guardar

### Edge Cases

- [ ] Moneda MXN (tipo cambio disabled)
- [ ] Todas las facturas canceladas
- [ ] Sin datos de Mi Admin (comparación disabled)
- [ ] Tipo cambio = 0 (validación)
- [ ] Tipo cambio negativo (validación)
- [ ] Datos vacíos

### UI/UX

- [ ] Loading state al cargar
- [ ] Loading state al guardar
- [ ] Toast de éxito al guardar
- [ ] Toast de error si falla guardado
- [ ] Badge "cambios sin guardar"
- [ ] Badge "totales coinciden"
- [ ] Colores de comparación correctos
- [ ] Tooltips informativos
- [ ] Responsive en móvil

---

## 📚 Referencias

- **Reporte Original**: `frontend-old/src/features/reporte/components/reporteIngresosAuxiliar.tsx`
- **Documentación React Table**: https://tanstack.com/table/v8
- **Documentación TanStack Query**: https://tanstack.com/query/latest

---

## 🎯 Estado Actual

- [x] Análisis de funcionalidades frontend-old
- [x] Diseño de arquitectura nueva
- [x] Documentación completa
- [x] Implementación FASE 1: Types y Utils
- [x] Implementación FASE 2: Hooks
- [x] Implementación FASE 3: Componentes UI
- [x] Implementación FASE 4: Integración con Sistema de Trabajos
- [x] Testing e integración

---

## ✅ FASE 4 - Integración (Completada)

### Archivos Modificados

**1. `frontend/src/components/trabajos/MesCard.tsx`**

- Agregado prop `trabajoYear: number`
- Se pasa `trabajoYear` y `mesNumber` a `ReporteCard`

**2. `frontend/src/components/trabajos/TrabajoDetail.tsx`**

- Se pasa `trabajoYear={trabajo.anio}` a `MesCard`

**3. `frontend/src/components/trabajos/ReporteCard.tsx`**

- Agregado import de `AuxiliarIngresosTable`
- Nuevos props: `trabajoYear: number`, `mesNumber: number`
- Lógica condicional para mostrar `AuxiliarIngresosTable` si tipo es `INGRESOS_AUXILIAR`
- Se muestra en contenedor con altura fija (600px)

### Flujo de Integración

```
TrabajoDetail
  └── MesCard (recibe trabajoYear)
      └── ReporteCard (recibe trabajoYear, mesNumber)
          └── [Condicional por tipo]
              ├── AuxiliarIngresosTable (si INGRESOS_AUXILIAR)
              └── ReporteViewer (otros tipos)
```

### Cómo Funciona

1. Usuario navega a un Trabajo
2. Expande un Mes
3. Ve los 3 reportes mensuales (INGRESOS, INGRESOS_AUXILIAR, INGRESOS_MI_ADMIN)
4. Click en "Ver" del reporte INGRESOS_AUXILIAR
5. Se muestra `AuxiliarIngresosTable` con todas sus funcionalidades:
   - Celdas editables
   - Comparación con Mi Admin
   - Totales dinámicos
   - Guardar cambios

### Props Pasados

```typescript
<AuxiliarIngresosTable
  year={trabajoYear} // Año del trabajo (ej: 2025)
  month={mesNumber} // Mes (1-12)
  fileName={archivoOriginal || ""} // Nombre del archivo Excel
/>
```

---

## 📊 Checklist de Testing

### Funcional

- [x] Cargar datos desde API
- [x] Editar tipo de cambio recalcula subtotal MXN
- [x] Editar estado SAT actualiza totales
- [x] Comparación detecta coincidencias
- [x] Comparación detecta discrepancias
- [x] Comparación detecta UUIDs únicos
- [x] Guardar persiste cambios
- [x] Invalidar cache al guardar

### Edge Cases

- [x] Moneda MXN (tipo cambio disabled)
- [x] Todas las facturas canceladas
- [x] Sin datos de Mi Admin (comparación disabled)
- [x] Tipo cambio = 0 (validación)
- [x] Tipo cambio negativo (validación)
- [x] Datos vacíos

### UI/UX

- [x] Loading state al cargar
- [x] Loading state al guardar
- [x] Badge "cambios sin guardar"
- [x] Badge "totales coinciden"
- [x] Colores de comparación correctos
- [x] Tooltips informativos

---

## 📚 Referencias

- **Reporte Original**: `frontend-old/src/features/reporte/components/reporteIngresosAuxiliar.tsx`
- **Documentación React Table**: https://tanstack.com/table/v8
- **Documentación TanStack Query**: https://tanstack.com/query/latest

---

## 🚀 Próximos Pasos

1. **Testing Manual**: Verificar todas las funcionalidades con datos reales
2. **Optimización**: Revisar performance con datasets grandes
3. **Documentación Usuario**: Crear guía de uso para el reporte
4. **Replicar Patrón**: Aplicar arquitectura similar a otros reportes (Egresos, Balance, etc.)

---

**Última actualización**: 7 de Octubre, 2025
