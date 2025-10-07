# FASE 7 - Sistema de Reporte Anual (Guardar en Base)

**Fecha de Creación**: 7 de Octubre, 2025  
**Estado**: ✅ FASE 1 COMPLETADA - Backend Implementado  
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

### **FASE 2: Frontend - Servicios y Hooks**

#### Tareas:
- [ ] Crear tipos TypeScript para Reporte Anual
- [ ] Crear servicio API `reporteAnualService`
- [ ] Crear hook `useReporteAnualData` (fetch con React Query)
- [ ] Crear hook `useReporteAnualUpdate` (mutation)
- [ ] Exportaciones centralizadas

**Archivos a crear:**
- `frontend/src/features/trabajos/reportes/reporte-anual/types/index.ts`
- `frontend/src/services/reporte-anual.service.ts`
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/useReporteAnualData.ts`
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/useReporteAnualUpdate.ts`

---

### **FASE 3: Frontend - Componente Botón**

#### Tareas:
- [ ] Crear componente `GuardarEnBaseButton`
- [ ] Implementar diálogo de confirmación
- [ ] Integrar con hooks de FASE 2
- [ ] Manejo de estados (loading, success, error)

**Características:**
- Botón deshabilitado si totales no coinciden
- Badge visual de estado
- Confirmación con resumen de datos
- Advertencia si diferencia > $0.10

---

### **FASE 4: Frontend - Integración**

#### Tareas:
- [ ] Integrar `GuardarEnBaseButton` en `MiAdminIngresosToolbar`
- [ ] Pasar props necesarias (trabajoId, año, mes, totales)
- [ ] Calcular totales de Auxiliar para comparación
- [ ] Deshabilitar botón si hay cambios sin guardar

---

### **FASE 5: Frontend - Vista Reporte Anual**

#### Tareas:
- [ ] Crear componente `ReporteAnualTable`
- [ ] Mostrar 12 meses con sus ventas
- [ ] Card de resumen (total anual, meses confirmados)
- [ ] Badges de estado (Pendiente, Confirmado, Con diferencia)
- [ ] Agregar ruta en el sistema

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
- [ ] FASE 2: Frontend - Servicios y Hooks
- [ ] FASE 3: Frontend - Componente Botón
- [ ] FASE 4: Frontend - Integración
- [ ] FASE 5: Frontend - Vista Reporte Anual

---

**Última Actualización**: 7 de Octubre, 2025 - FASE 1 Backend Completada  
**Responsable**: Equipo de Desarrollo  
**Relacionado con**: FASE-6-MI-ADMIN-INGRESOS-MEJORADO
