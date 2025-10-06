# 📋 Sistema de Trabajos y Reportes - Documentación

## ✅ Implementación Completa

### 🏗️ **Arquitectura Implementada: Opción 2 (Híbrida con JSONB)**

Se ha implementado exitosamente el sistema de gestión de trabajos y reportes contables utilizando una arquitectura híbrida que combina:

- **PostgreSQL** con tablas relacionales para metadatos
- **JSONB** para almacenar datos flexibles de reportes
- **Motor de fórmulas** integrado para cálculos dinámicos

---

## 📊 **Estructura de Base de Datos**

### Tabla: `trabajos`

```sql
CREATE TABLE trabajos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR NOT NULL,
  mes DATE NOT NULL,
  descripcion TEXT,
  usuario_id UUID NOT NULL REFERENCES users(id),
  estado VARCHAR DEFAULT 'activo', -- 'activo', 'archivado', 'completado'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `reportes`

```sql
CREATE TABLE reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  tipo_reporte ENUM('mensual', 'ingresos', 'auxiliar_ingresos',
                    'admin_ingresos', 'egresos', 'auxiliar_egresos',
                    'balance', 'resumen', 'otro'),
  archivo_original VARCHAR,

  -- JSONB para datos flexibles
  metadata JSONB,
  datos_originales JSONB,
  datos_modificados JSONB DEFAULT '{}',
  configuracion JSONB,

  estado VARCHAR DEFAULT 'pendiente', -- 'pendiente', 'importado', 'procesado', 'exportado'
  fecha_importacion TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 **Estructura JSONB Detallada**

### `datos_originales`:

```json
{
  "headers": ["Columna A", "Columna B", "Columna C"],
  "filas": [
    ["Valor 1A", "Valor 1B", "Valor 1C"],
    ["Valor 2A", "Valor 2B", "Valor 2C"]
  ],
  "metadata": {
    "total_filas": 100,
    "total_columnas": 10,
    "fecha_importacion": "2025-10-06T12:00:00Z",
    "nombre_hoja": "Hoja1"
  }
}
```

### `datos_modificados`:

```json
{
  "celdas": {
    "5,3": {
      "valor_original": 1000,
      "valor_nuevo": 1200,
      "tipo_modificacion": "edicion",
      "fecha_modificacion": "2025-10-06T12:30:00Z"
    }
  },
  "filas_nuevas": [
    {
      "index": 101,
      "datos": ["Nuevo concepto", 5000, "2025-10"],
      "tipo": "manual",
      "fecha_creacion": "2025-10-06T13:00:00Z"
    }
  ],
  "columnas_nuevas": [
    {
      "index": 11,
      "nombre": "Total con IVA",
      "tipo": "formula",
      "formula": "=C{fila}*1.21",
      "valores": {},
      "fecha_creacion": "2025-10-06T13:15:00Z"
    }
  ],
  "formulas": {
    "10,5": {
      "expresion": "=SUM(B5:B10)",
      "resultado": 45000,
      "dependencias": ["B5", "B6", "B7", "B8", "B9", "B10"],
      "ultima_evaluacion": "2025-10-06T13:20:00Z"
    }
  },
  "filas_eliminadas": [15, 20],
  "columnas_eliminadas": [7]
}
```

### `configuracion`:

```json
{
  "areas_editables": [
    {
      "inicio_fila": 5,
      "fin_fila": 50,
      "inicio_columna": 2,
      "fin_columna": 8,
      "permitir_agregar_filas": true,
      "permitir_formulas": true
    }
  ],
  "columnas_calculadas_auto": [
    {
      "columna": 10,
      "formula_template": "=B{fila}*1.21"
    }
  ],
  "permisos": {
    "puede_agregar_filas": true,
    "puede_agregar_columnas": true,
    "puede_eliminar_filas": false
  }
}
```

---

## 🌐 **API Endpoints**

### **Trabajos**

#### Crear trabajo

```http
POST /trabajos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Contabilidad Octubre 2025",
  "mes": "2025-10-01",
  "descripcion": "Reportes mensuales de octubre"
}
```

#### Listar trabajos del usuario

```http
GET /trabajos
Authorization: Bearer {token}
```

#### Obtener un trabajo específico

```http
GET /trabajos/:id
Authorization: Bearer {token}
```

#### Actualizar trabajo

```http
PATCH /trabajos/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Nuevo nombre",
  "estado": "completado"
}
```

#### Eliminar trabajo

```http
DELETE /trabajos/:id
Authorization: Bearer {token}
```

#### Duplicar trabajo

```http
POST /trabajos/:id/duplicar
Authorization: Bearer {token}
```

#### Obtener estadísticas

```http
GET /trabajos/estadisticas
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "total": 10,
  "activos": 7,
  "completados": 2,
  "archivados": 1,
  "total_reportes": 45
}
```

---

### **Reportes**

#### Crear reporte

```http
POST /trabajos/:trabajoId/reportes
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipoReporte": "mensual",
  "archivoOriginal": "reporte_octubre.xlsx",
  "configuracion": {
    "areas_editables": [...],
    "permisos": {...}
  }
}
```

#### Listar reportes de un trabajo

```http
GET /trabajos/:trabajoId/reportes
Authorization: Bearer {token}
```

#### Obtener un reporte específico

```http
GET /trabajos/:trabajoId/reportes/:id
Authorization: Bearer {token}
```

#### Importar datos al reporte

```http
POST /trabajos/:trabajoId/reportes/:id/importar
Authorization: Bearer {token}
Content-Type: application/json

{
  "headers": ["Col A", "Col B", "Col C"],
  "filas": [[1, 2, 3], [4, 5, 6]],
  "metadata": {
    "total_filas": 2,
    "total_columnas": 3,
    "fecha_importacion": "2025-10-06T12:00:00Z"
  }
}
```

#### Actualizar una celda

```http
PATCH /trabajos/:trabajoId/reportes/:id/celdas/:fila/:columna
Authorization: Bearer {token}
Content-Type: application/json

// Opción 1: Valor directo
{
  "valor": 1500
}

// Opción 2: Fórmula
{
  "formula": "=SUM(A1:A10)"
}
```

#### Agregar fila

```http
POST /trabajos/:trabajoId/reportes/:id/filas
Authorization: Bearer {token}
Content-Type: application/json

{
  "datos": ["Nuevo concepto", 5000, "2025-10-06"],
  "posicion": 10
}
```

#### Agregar columna

```http
POST /trabajos/:trabajoId/reportes/:id/columnas
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Total con IVA",
  "tipo": "formula",
  "formula": "=C{fila}*1.21",
  "posicion": 10
}
```

#### Vista previa de datos

```http
GET /trabajos/:trabajoId/reportes/:id/vista-previa
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "headers": ["Col A", "Col B", "Col C"],
  "filas": [
    [1, 2, 3],
    [4, 5, 6]
  ],
  "total_filas": 100,
  "tiene_mas": true
}
```

#### Eliminar reporte

```http
DELETE /trabajos/:trabajoId/reportes/:id
Authorization: Bearer {token}
```

---

## 🧮 **Motor de Fórmulas**

### Fórmulas Soportadas:

- **Aritméticas**: `=A1+B1`, `=C5*1.21`, `=D10/2`
- **Funciones**: `=SUM(A1:A10)`, `=AVG(B5:B20)`
- **Referencias de celdas**: `A1`, `B5`, `AA100`
- **Rangos**: `A1:A10`, `B5:D20`
- **Dinámicas**: `=B{fila}*1.21` (usa la fila actual)

### Ejemplos de Uso:

```javascript
// Suma de rango
formula: "=SUM(B5:B10)";
resultado: 45000;

// Cálculo con constante
formula: "=C10*1.21";
resultado: 12100;

// Fórmula dinámica (se aplica a cada fila)
formula: "=B{fila}*C{fila}";
// En fila 5: =B5*C5
// En fila 6: =B6*C6
```

---

## 📦 **Estructura de Archivos**

```
backend/src/
├── trabajos/
│   ├── entities/
│   │   ├── trabajo.entity.ts
│   │   └── reporte.entity.ts
│   ├── dto/
│   │   ├── trabajo.dto.ts
│   │   └── reporte.dto.ts
│   ├── services/
│   │   ├── trabajo.service.ts
│   │   ├── reporte.service.ts
│   │   └── formula.service.ts
│   ├── controllers/
│   │   ├── trabajo.controller.ts
│   │   └── reporte.controller.ts
│   └── trabajos.module.ts
├── auth/
│   └── ... (ya existente)
└── app.module.ts
```

---

## 🔒 **Seguridad**

- ✅ Todas las rutas están protegidas con `JwtAuthGuard`
- ✅ Verificación de propiedad (usuario solo ve sus trabajos)
- ✅ Validación de DTOs con `class-validator`
- ✅ Sanitización de fórmulas para evitar ejecución de código malicioso

---

## 🚀 **Próximos Pasos**

### Backend:

1. ✅ **Implementar servicio de importación de Excel** (usar `xlsx`)
2. ✅ **Implementar servicio de exportación de Excel**
3. ⚠️ Agregar validaciones adicionales
4. ⚠️ Implementar sistema de caché para reportes grandes
5. ⚠️ Agregar websockets para guardado en tiempo real

### Frontend:

1. ⚠️ Crear componente de lista de trabajos
2. ⚠️ Crear componente de creación/edición de trabajos
3. ⚠️ Crear componente de pestañas para reportes
4. ⚠️ Crear tabla editable para datos de reportes
5. ⚠️ Implementar importación de Excel desde el frontend
6. ⚠️ Implementar exportación de Excel
7. ⚠️ Agregar guardado automático

---

## 🧪 **Probar los Endpoints**

### 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Crear trabajo (con token)

```bash
curl -X POST http://localhost:3000/trabajos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Contabilidad Octubre 2025",
    "mes": "2025-10-01",
    "descripcion": "Reportes mensuales"
  }'
```

---

## 📈 **Ventajas de esta Implementación**

✅ **Flexibilidad Total**: JSONB permite agregar filas/columnas sin cambiar esquema  
✅ **Performance**: Queries rápidas con índices JSONB  
✅ **Escalabilidad**: Soporta múltiples usuarios y trabajos simultáneos  
✅ **Auditoría**: Guardado de valores originales y modificados  
✅ **Fórmulas Dinámicas**: Motor integrado para cálculos en tiempo real  
✅ **Versionado Implícito**: Guardado de fecha de modificación en cada cambio  
✅ **Tipo Safe**: TypeScript + TypeORM para máxima seguridad de tipos

---

## 🎯 **Estado Actual**

- ✅ Backend completamente funcional
- ✅ Tablas creadas en PostgreSQL
- ✅ Todos los endpoints disponibles
- ✅ Motor de fórmulas operativo
- ✅ Sistema de seguridad implementado
- ⚠️ Frontend pendiente de implementación
- ⚠️ Importación/Exportación de Excel pendiente

---

**Fecha de implementación**: 6 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: Sistema de IA + Usuario
