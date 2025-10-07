# FASE 7 - Sistema de Reporte Anual (Guardar en Base)

**Fecha de Creación**: 7 de Octubre, 2025  
**Estado**: ✅ FASE 5 COMPLETADA - Sistema Completo con Vista de Reporte Anual  
**Prioridad**: Alta

---

## 📋 Objetivo

Implementar el sistema de **Reporte Anual** que permite guardar los valores de ventas mensuales consolidados desde los reportes de Mi Admin Ingresos y Auxiliar Ingresos, replicando la funcionalidad del frontend-old pero con arquitectura mejorada.

---

## 🔍 Análisis del Sistema Original

### **Frontend-old (Redux + IndexedDB + WorkBook.js):**

```javascript
// Flujo identificado en frontend-old:
1. Usuario importa Auxiliar Ingresos + Mi Admin Ingresos
2. Sistema compara automáticamente por FOLIO
3. Cuando totales coinciden (diferencia < $0.10):
   - Se habilita botón "Guardar en Base"
4. Al guardar:
   - Toma totalSubtotalMXN de Mi Admin
   - Actualiza celda del mes en Excel Base (Reporte Anual)
   - Persiste en IndexedDB con WorkBook.js

// Estructura del Excel Base:
Hoja: "Ventas Mensuales"
| Mes       | Ventas        |
|-----------|---------------|
| Enero     | 1,234,567.89  |
| Febrero   | 0             |
| ...       | ...           |
```

### **Sistema Nuevo (NestJS + PostgreSQL + React Query):**

- ✅ Base de datos relacional en vez de IndexedDB
- ✅ API REST con validaciones
- ✅ Tracking de cambios y auditoría
- ✅ Cache invalidation automática
- ✅ Type safety con TypeScript

---

## 🎯 Scope Funcional

### ✅ Funcionalidades Core

#### 1. **Entidad ReporteAnual**

- **Campos:**
  - `id` (UUID)
  - `trabajoId` (FK a Trabajo)
  - `anio` (number)
  - `mes` (enum 1-12)
  - `ventas` (decimal) - Subtotal MXN de Mi Admin
  - `ventasAuxiliar` (decimal) - Referencia de Auxiliar
  - `diferencia` (decimal) - Diferencia entre ambos
  - `confirmado` (boolean) - Si diferencia <= $0.10
  - `fechaCreacion` (timestamp)
  - `fechaActualizacion` (timestamp)

#### 2. **Endpoints API**

```
GET    /trabajos/:trabajoId/reporte-anual/:anio
       → Obtener reporte completo (12 meses)

GET    /trabajos/:trabajoId/reporte-anual/:anio/resumen
       → Obtener resumen (total ventas, meses confirmados)

POST   /trabajos/:trabajoId/reporte-anual/actualizar-ventas
       Body: { anio, mes, ventas, ventasAuxiliar, diferencia }
       → Actualizar/crear registro de un mes
```

#### 3. **Lógica de Negocio**

- ✅ Creación automática de 12 meses al obtener reporte por primera vez
- ✅ Confirmación automática si diferencia <= $0.10
- ✅ Actualización solo de meses específicos
- ✅ Cálculo de totales anuales
- ✅ Tracking de última actualización

---

## 🏗️ Arquitectura

### **Backend Structure:**

```
backend/src/trabajos/
├── entities/
│   ├── trabajo.entity.ts           # Relación OneToMany agregada
│   └── reporte-anual.entity.ts     # ✨ NUEVA
├── services/
│   └── reporte-anual.service.ts    # ✨ NUEVA
├── controllers/
│   └── reporte-anual.controller.ts # ✨ NUEVA
├── dto/
│   └── actualizar-ventas.dto.ts    # ✨ NUEVA
└── trabajos.module.ts              # Actualizado
```

### **Frontend Structure:**

```
frontend/src/features/trabajos/reportes/
└── reporte-anual/
    ├── types/
    │   └── index.ts                # ✨ NUEVA
    ├── hooks/
    │   ├── useReporteAnualData.ts  # ✨ NUEVA
    │   └── useReporteAnualUpdate.ts # ✨ NUEVA
    ├── components/
    │   ├── GuardarEnBaseButton.tsx # ✨ NUEVA (Botón en Toolbar)
    │   └── ReporteAnualTable.tsx   # ✨ NUEVA (Vista completa)
    └── index.ts
```

---

## 📦 Implementación por Fases

### **FASE 1: Backend - Entidad y Servicio** ✅ COMPLETADA

#### Tareas:

- [x] Crear entidad `ReporteAnual`
- [x] Crear enum `MesEnum`
- [x] Crear DTO `ActualizarVentasDto`
- [x] Crear servicio `ReporteAnualService` con métodos:
  - `obtenerOCrearReporteAnual(trabajoId, anio)`
  - `actualizarVentas(dto)`
  - `obtenerReporteMensual(trabajoId, anio, mes)`
  - `obtenerResumenAnual(trabajoId, anio)`
  - `eliminarReportesAnio(trabajoId, anio)`
- [x] Crear controller `ReporteAnualController`
- [x] Actualizar `Trabajo` entity con relación OneToMany
- [x] Actualizar `TrabajosModule`
- [x] Crear migración de base de datos

**Archivos creados:**

- `backend/src/trabajos/entities/reporte-anual.entity.ts` ✅
- `backend/src/trabajos/services/reporte-anual.service.ts` ✅
- `backend/src/trabajos/controllers/reporte-anual.controller.ts` ✅
- `backend/src/migrations/1709999999999-CreateReporteAnual.ts` ✅

**Archivos actualizados:**

- `backend/src/trabajos/entities/trabajo.entity.ts` ✅
- `backend/src/trabajos/trabajos.module.ts` ✅

---

### **FASE 2: Frontend - Servicios y Hooks** ✅ COMPLETADA

#### Tareas:

- [x] Crear tipos TypeScript para Reporte Anual
- [x] Crear servicio API `reporteAnualService`
- [x] Crear hook `useReporteAnualData` (fetch con React Query)
- [x] Crear hook `useReporteAnualUpdate` (mutation)
- [x] Exportaciones centralizadas

**Archivos creados:**

- `frontend/src/features/trabajos/reportes/reporte-anual/types/index.ts` ✅
  - Tipos: ReporteAnual, ResumenAnual, ActualizarVentasDto, ActualizarVentasRequest
  - Enum MesEnum (1-12)
  - Constante NOMBRES_MESES para UI
- `frontend/src/services/reporte-anual.service.ts` ✅
  - obtenerReporteAnual(): GET todos los meses del año
  - obtenerResumenAnual(): GET resumen con totales
  - obtenerReporteMensual(): GET reporte de un mes
  - actualizarVentas(): POST guardar ventas
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/useReporteAnualData.ts` ✅
  - useReporteAnualData(): Hook para fetch de reportes anuales
  - useReporteAnualResumen(): Hook para fetch de resumen
  - useReporteMensual(): Hook para fetch de mes específico
  - Cache con staleTime de 5 min
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/useReporteAnualUpdate.ts` ✅
  - useReporteAnualUpdate(): Hook mutation para guardar ventas
  - Invalidación automática de cache (reportes, resumen, mes)
  - Callbacks onSuccess/onError
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/index.ts` ✅
- `frontend/src/features/trabajos/reportes/reporte-anual/index.ts` ✅

**Archivos actualizados:**

- `frontend/src/services/index.ts` ✅ (export reporteAnualService)

---

### **FASE 3: Frontend - Componente Botón** ✅ COMPLETADA

#### Tareas:

- [x] Crear componente `GuardarEnBaseButton`
- [x] Implementar diálogo de confirmación
- [x] Integrar con hooks de FASE 2
- [x] Manejo de estados (loading, success, error)

**Características implementadas:**

- ✅ Botón deshabilitado si totales no coinciden
- ✅ Badge visual de estado (Confirmado / Con diferencia)
- ✅ Confirmación con resumen de datos completo
- ✅ Advertencia si diferencia > $0.10
- ✅ Diálogo modal con:
  - Detalles del mes y año
  - Totales de Mi Admin y Auxiliar
  - Diferencia calculada
  - Estado de confirmación visual
  - Mensajes de éxito/error
- ✅ Validaciones:
  - Comparación debe estar activa
  - No debe haber cambios sin guardar
  - Diferencia debe ser < $0.10 para habilitar
- ✅ Integración con useReporteAnualUpdate hook
- ✅ Invalidación automática de cache

**Archivos creados:**

- `frontend/src/features/trabajos/reportes/reporte-anual/components/GuardarEnBaseButton.tsx` ✅
  - Componente completo con diálogo de confirmación
  - Validaciones y tooltips descriptivos
  - Formateo de moneda y fechas en español
  - Estados de loading, success, error
- `frontend/src/features/trabajos/reportes/reporte-anual/components/index.ts` ✅

**Archivos actualizados:**

- `frontend/src/features/trabajos/reportes/reporte-anual/index.ts` ✅ (export components)

---

### **FASE 4: Frontend - Integración** ✅ COMPLETADA

#### Tareas:

- [x] Integrar `GuardarEnBaseButton` en `MiAdminIngresosToolbar`
- [x] Pasar props necesarias (trabajoId, año, mes, totales)
- [x] Calcular totales de Auxiliar para comparación
- [x] Deshabilitar botón si hay cambios sin guardar
- [x] Flujo completo desde ReporteCard → MiAdminIngresosTable → Toolbar → Botón

**Características implementadas:**

- ✅ MiAdminIngresosTable recibe y pasa trabajoId, anio, mes
- ✅ MiAdminIngresosToolbar integra GuardarEnBaseButton
- ✅ Cálculo de totalAuxiliar desde totalesComparison.auxiliarTotal
- ✅ Validación: botón solo visible si hay trabajoId, anio, mes y auxiliarData
- ✅ Props correctas pasadas: totalMiAdmin, totalAuxiliar, isDirty, isComparisonActive
- ✅ Fix de bug: usar `match` en lugar de `isMatch` en TotalesComparison
- ✅ Botón aparece entre "Comparar con Auxiliar" y badges de estado

**Archivos modificados:**

- `frontend/src/features/trabajos/reportes/mi-admin-ingresos/components/MiAdminIngresosTable.tsx` ✅
  - Props: trabajoId?, anio?, mes?
  - Pasa props al Toolbar
- `frontend/src/features/trabajos/reportes/mi-admin-ingresos/components/MiAdminIngresosToolbar.tsx` ✅
  - Props: trabajoId?, anio?, mes?
  - Calcula totalAuxiliar desde totalesComparison
  - Renderiza GuardarEnBaseButton condicionalmente
  - Fix: totalesComparison.match (antes era .isMatch)
- `frontend/src/components/trabajos/ReporteCard.tsx` ✅
  - Pasa trabajoId, anio (trabajoYear), mes (mesNumber) a MiAdminIngresosTable

---

### **FASE 5: Frontend - Vista Reporte Anual** ✅

#### Tareas:

- [x] Crear componente `ReporteAnualTable`
- [x] Mostrar 12 meses con sus ventas
- [x] Card de resumen (total anual, meses confirmados)
- [x] Badges de estado (Pendiente, Confirmado, Con diferencia)
- [x] Agregar ruta en el sistema
- [x] Botón de acceso desde TrabajoDetail

#### Implementación:

**Archivos creados:**

1. `frontend/src/features/trabajos/reportes/reporte-anual/components/ReporteAnualTable.tsx` (267 líneas)

   - Componente principal de tabla con 12 meses
   - Cards de resumen (4 métricas)
   - Badges con colores según estado
   - Formateo de moneda MXN
   - Integración con hooks existentes

2. `frontend/src/pages/ReporteAnualPage.tsx` (95 líneas)

   - Wrapper page para la tabla
   - Validación de parámetros (trabajoId, año)
   - Navegación de vuelta a trabajos
   - Manejo de errores

3. `frontend/src/App.tsx` (actualizado)

   - Ruta: `/trabajos/:trabajoId/reporte-anual/:anio`
   - Protección con PrivateRoute

4. `frontend/src/components/trabajos/TrabajoDetail.tsx` (actualizado)
   - Botón "📊 Ver Reporte Anual" agregado
   - Navegación a la vista del reporte

**Características implementadas:**

- **Tabla de 12 meses**: Una fila por mes con todas las columnas
- **Columnas**: Mes, Ventas Mi Admin, Ventas Auxiliar, Diferencia, Estado
- **Cards de resumen**:
  - Total Ventas Mi Admin (azul)
  - Total Ventas Auxiliar (morado)
  - Diferencia Total (amarillo)
  - Meses Confirmados/12 (verde)
- **Badges de estado**:
  - ⚪ Pendiente (gris) - Sin datos
  - ✅ Confirmado (verde) - Diferencia < $0.10
  - ⚠️ Con diferencia (amarillo) - Con datos pero diferencia > $0.10
- **Botón Actualizar**: Refresca datos del servidor
- **Información contextual**: Footer con explicación de estados
- **Responsive**: Grid adaptable para móvil/desktop

---

## 🗄️ Modelo de Datos

### **Tabla: `reportes_anuales`**

```sql
CREATE TABLE reportes_anuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ventas DECIMAL(15,2),
  ventas_auxiliar DECIMAL(15,2),
  diferencia DECIMAL(15,2),
  confirmado BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),

  UNIQUE(trabajo_id, anio, mes)
);

CREATE INDEX idx_reportes_anuales_trabajo ON reportes_anuales(trabajo_id);
CREATE INDEX idx_reportes_anuales_anio ON reportes_anuales(anio);
```

---

## 🔄 Flujo de Usuario

### **1. Guardar Ventas en Base:**

```
Usuario en página de Mi Admin Ingresos (Enero 2025)
  ↓
Compara automáticamente con Auxiliar Ingresos
  ↓
Totales coinciden (diferencia < $0.10)
  ↓
Aparece botón "Guardar en Base Anual" (habilitado)
  ↓
Usuario hace clic
  ↓
Diálogo de confirmación:
  - Mes: Enero
  - Ventas Mi Admin: $1,234,567.89
  - Ventas Auxiliar: $1,234,567.89
  - Diferencia: $0.00
  ↓
Usuario confirma
  ↓
POST /trabajos/:id/reporte-anual/actualizar-ventas
  ↓
Se crea/actualiza registro en DB
  ↓
Cache invalidation automática
  ↓
✅ Mensaje: "Ventas guardadas correctamente"
```

### **2. Ver Reporte Anual:**

```
Usuario navega a "Reporte Anual 2025"
  ↓
GET /trabajos/:id/reporte-anual/2025
  ↓
Sistema muestra tabla con 12 meses:
  - Enero: $1,234,567.89 ✅ Confirmado
  - Febrero: - (Pendiente)
  - Marzo: - (Pendiente)
  - ...
  ↓
Card de resumen:
  - Total Ventas 2025: $1,234,567.89
  - Meses Confirmados: 1/12
  - Meses Pendientes: 11
```

---

## 📊 Métricas de Éxito

- ✅ Guardado exitoso en < 500ms
- ✅ Sin errores en cálculo de diferencias
- ✅ Invalidación de cache correcta
- ✅ Auditoría completa (fechas de actualización)
- ✅ Type safety en frontend y backend

---

## ⚠️ Consideraciones

### **Validaciones:**

- ✅ Año debe ser >= 2020
- ✅ Mes debe estar entre 1-12
- ✅ Ventas no pueden ser negativas
- ✅ Diferencia se calcula automáticamente
- ✅ Un solo registro por trabajo/año/mes (UNIQUE constraint)

### **Permisos:**

- ✅ Solo usuarios autenticados
- ✅ Solo usuarios asignados al trabajo pueden actualizar
- ✅ Admins pueden ver todos los reportes

### **Performance:**

- ✅ Índices en trabajo_id y anio
- ✅ Lazy loading en relaciones
- ✅ Cache de React Query (5 minutos)

---

## 🔮 Mejoras Futuras

- [ ] Exportar reporte anual a Excel
- [ ] Gráficas de evolución mensual
- [ ] Comparación año vs año
- [ ] Alertas si diferencia > umbral
- [ ] Histórico de cambios (audit log)
- [ ] Aprobación de gerencia para guardado

---

## ✅ Estado Actual

- [x] Análisis y documentación
- [x] ✅ FASE 1: Backend - Entidad y Servicio (COMPLETADA)
  - [x] ReporteAnual entity con todos los campos
  - [x] ReporteAnualService con lógica de negocio
  - [x] ReporteAnualController con endpoints REST
  - [x] Migración de base de datos
  - [x] Relación OneToMany en Trabajo entity
  - [x] Módulo actualizado con provider y controller
- [x] ✅ FASE 2: Frontend - Servicios y Hooks (COMPLETADA)
  - [x] Tipos TypeScript (ReporteAnual, ResumenAnual, MesEnum)
  - [x] reporteAnualService con 4 métodos API
  - [x] useReporteAnualData, useReporteAnualResumen, useReporteMensual
  - [x] useReporteAnualUpdate con invalidación de cache
  - [x] Exportaciones centralizadas
- [x] ✅ FASE 3: Frontend - Componente Botón (COMPLETADA)
  - [x] GuardarEnBaseButton con todas las validaciones
  - [x] Diálogo de confirmación con resumen completo
  - [x] Manejo de estados (loading, success, error)
  - [x] Integración con hooks de FASE 2
  - [x] Badges visuales y advertencias
- [x] ✅ FASE 4: Frontend - Integración (COMPLETADA)
  - [x] Integrado en MiAdminIngresosToolbar
  - [x] Props pasadas desde ReporteCard → Table → Toolbar → Botón
  - [x] Cálculo de totales de Auxiliar
  - [x] Validaciones completas de habilitación
  - [x] Fix de bugs pre-existentes (TotalesComparison.match)
- [x] ✅ FASE 5: Frontend - Vista Reporte Anual (COMPLETADA)
  - [x] Componente ReporteAnualTable con tabla de 12 meses
  - [x] Cards de resumen con 4 métricas principales
  - [x] Badges de estado (Pendiente/Confirmado/Con diferencia)
  - [x] Página wrapper con validaciones
  - [x] Ruta en App.tsx con protección
  - [x] Botón de acceso desde TrabajoDetail
  - [x] Formateo de moneda y nombres de meses
  - [x] Botón de actualización de datos
  - [x] Información contextual en footer

---

**Última Actualización**: 7 de Octubre, 2025 - FASE 5 Vista Completada - Sistema Completo con UI de Visualización ✅  
**Responsable**: Equipo de Desarrollo  
**Relacionado con**: FASE-6-MI-ADMIN-INGRESOS-MEJORADO
