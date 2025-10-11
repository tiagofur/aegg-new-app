# 🔌 Backend API - Referencia Técnica

**Sistema de Gestión de Trabajos Contables V2**

---

## 📋 Resumen

API REST completa para gestión de trabajos contables con importación y procesamiento de reportes Excel.

**Base URL:** `http://localhost:3001`  
**Autenticación:** JWT Bearer Token  
**Base de Datos:** PostgreSQL con JSONB

---

## 🔐 Autenticación

### Registro

```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "name": "Usuario Ejemplo"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc...", "userId": "uuid", "email": "...", "name": "..." }
```

---

## 📊 Trabajos

### Crear Trabajo

```http
POST /trabajos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Contabilidad Empresa ABC",
  "clienteNombre": "Empresa ABC SA",
  "clienteRFC": "ABC123456789",
  "anio": 2025,
  "descripcion": "Reportes mensuales 2025"
}
```

### Listar Trabajos

```http
GET /trabajos
Authorization: Bearer {token}

Response: Array de trabajos con meses y reportes incluidos
```

### Obtener Trabajo

```http
GET /trabajos/:id
Authorization: Bearer {token}
```

### Actualizar Trabajo

```http
PATCH /trabajos/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "clienteNombre": "Nuevo Nombre",
  "clienteRFC": "NUEVO123456",
  "estado": "ACTIVO" | "INACTIVO" | "COMPLETADO"
}
```

### Eliminar Trabajo

```http
DELETE /trabajos/:id
Authorization: Bearer {token}
```

---

## 📅 Meses

### Agregar Mes

```http
POST /trabajos/:trabajoId/meses
Authorization: Bearer {token}
Content-Type: application/json

{
  "numeroMes": 1  // 1-12
}
```

### Obtener Mes

```http
GET /meses/:id
Authorization: Bearer {token}
```

### Procesar y Guardar Mes

```http
POST /meses/:id/procesar
Authorization: Bearer {token}

Acción:
- Valida que los 3 reportes estén importados
- Calcula totales reales de cada reporte
- Consolida los 3 reportes
- Actualiza reporte base anual (3 hojas)
- Marca mes como COMPLETADO
```

### Reabrir Mes

```http
POST /meses/:id/reabrir
Authorization: Bearer {token}

Cambia estado de COMPLETADO a EN_PROCESO
```

### Eliminar Mes

```http
DELETE /meses/:id
Authorization: Bearer {token}
```

---

## 📄 Reportes Mensuales

### Crear Reporte

```http
POST /trabajos/:trabajoId/reportes
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipoReporte": "INGRESOS" | "INGRESOS_AUXILIAR" | "INGRESOS_MI_ADMIN"
}
```

### Importar Excel

```http
POST /trabajos/:trabajoId/reportes/:id/importar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: archivo.xlsx
```

### Obtener Datos

```http
GET /trabajos/:trabajoId/reportes/:id/datos
Authorization: Bearer {token}

Response: { hojas: [{ nombre: "...", datos: [[...], [...]] }] }
```

---

## 📊 Reporte Base Anual

### Importar Reporte Base

```http
POST /trabajos/:id/reporte-base/importar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: reporte-base.xlsx
```

### Obtener Reporte Base

```http
GET /trabajos/:id/reporte-base
Authorization: Bearer {token}

Response incluye:
- mesesCompletados: [1, 2, 3, ...]
- hojas: [{ nombre: "...", datos: [[...]] }]
- ultimaActualizacion
```

---

## 🗂️ Estructura de Datos

### JSONB: Reporte Mensual

```json
{
  "hojas": [
    {
      "nombre": "Hoja1",
      "datos": [
        ["Header1", "Header2", "Header3"],
        ["Valor1", 1000, 2000],
        ["Valor2", 1500, 2500]
      ]
    }
  ]
}
```

### JSONB: Reporte Base Anual

```json
{
  "hojas": [
    {
      "nombre": "Resumen Anual",
      "datos": [
        ["Mes", "Ingresos", "IVA", "Subtotal", "Fecha"],
        ["Enero", 150000, 24000, 126000, "2025-01-31"]
      ]
    },
    {
      "nombre": "Ingresos Consolidados",
      "datos": [
        ["Mes", "Reporte 1", "Reporte 2", "Reporte 3", "Total"],
        ["Enero", 100000, 30000, 20000, 150000]
      ]
    },
    {
      "nombre": "Comparativas",
      "datos": [
        ["Mes", "Actual", "Anterior", "Variación %"],
        ["Enero", 150000, 0, "N/A"],
        ["Febrero", 180000, 150000, "20.0%"]
      ]
    }
  ]
}
```

---

## 📊 Schema de Base de Datos

```sql
-- users
id UUID PRIMARY KEY
email VARCHAR UNIQUE
password VARCHAR (hash bcrypt)
name VARCHAR
created_at TIMESTAMP

-- trabajos
id UUID PRIMARY KEY
nombre VARCHAR
cliente_nombre VARCHAR
cliente_rfc VARCHAR(13)
anio INTEGER
descripcion TEXT
usuario_id UUID → users(id)
estado VARCHAR ('ACTIVO', 'INACTIVO', 'COMPLETADO')
created_at, updated_at TIMESTAMP

-- meses
id UUID PRIMARY KEY
trabajo_id UUID → trabajos(id) CASCADE
numero_mes INTEGER (1-12)
estado VARCHAR ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO')
created_at, updated_at TIMESTAMP

-- reportes_mensuales
id UUID PRIMARY KEY
mes_id UUID → meses(id) CASCADE
tipo_reporte VARCHAR ('INGRESOS', 'INGRESOS_AUXILIAR', 'INGRESOS_MI_ADMIN')
archivo_nombre VARCHAR
datos JSONB
estado VARCHAR ('SIN_IMPORTAR', 'IMPORTADO', 'PROCESADO')
fecha_importacion TIMESTAMP
created_at, updated_at TIMESTAMP

-- reportes_base_anual
id UUID PRIMARY KEY
trabajo_id UUID → trabajos(id) CASCADE
hojas JSONB
meses_completados INTEGER[]
ultima_actualizacion TIMESTAMP
created_at, updated_at TIMESTAMP
```

---

## 🔧 Lógica de Consolidación

### calcularTotalesReporte()

```typescript
// Suma todos los valores numéricos del Excel
// Estima IVA si no está explícito (16%)
return { totalIngresos, totalIVA, subtotal };
```

### consolidarReportes()

```typescript
// Consolida 3 reportes mensuales
const rep1 = calcularTotalesReporte(reporte1);
const rep2 = calcularTotalesReporte(reporte2);
const rep3 = calcularTotalesReporte(reporte3);

return {
  totalConsolidado: rep1.total + rep2.total + rep3.total,
  porReporte: [rep1, rep2, rep3],
};
```

### actualizarReporteBase()

```typescript
// Actualiza 3 hojas del reporte base:
1. Resumen Anual: [mes, ingresos, iva, subtotal, fecha]
2. Ingresos Consolidados: [mes, rep1, rep2, rep3, total]
3. Comparativas: [mes, actual, anterior, variación%]
```

---

## ⚡ Performance

- **JSONB Indexing**: Queries rápidas en datos
- **Eager Loading**: Joins optimizados con TypeORM
- **Cascade Delete**: Eliminación automática de relaciones
- **Timestamps**: Auditoría completa de cambios

---

## 🔒 Seguridad

- JWT con expiración configurable
- Bcrypt para passwords (salt rounds: 10)
- Validación de propiedad de recursos
- Guards en todas las rutas protegidas
- Class-validator para DTOs

---

## 📦 Stack Técnico

- **Framework**: NestJS 10.3.0
- **ORM**: TypeORM 0.3.20
- **Database**: PostgreSQL 15
- **Excel Parser**: XLSX 0.18.5
- **Auth**: @nestjs/jwt + bcrypt
- **Validation**: class-validator

---

## 🚀 Comandos Útiles

```powershell
# Levantar backend
cd backend
npm run start:dev

# Ver logs
docker-compose logs -f backend

# Conectar a DB
docker exec -it new-app-postgres-1 psql -U postgres -d contabilidad

# Reiniciar servicios
docker-compose restart backend
```

---

## 📝 Notas Importantes

1. **Año fiscal no modificable**: Integridad de datos
2. **3 reportes por mes**: Estructura fija
3. **JSONB para flexibilidad**: Estructura de Excel variable
4. **Consolidación real**: Cálculos basados en datos del Excel
5. **Comparación mes anterior**: Wrap-around Enero→Diciembre

---

**Última actualización:** Octubre 2025  
**Versión API:** 1.0  
**Estado:** ✅ Producción
