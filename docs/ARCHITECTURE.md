# 🏗️ Arquitectura Técnica

**Última actualización**: 27/12/2025

## 📋 Índice

1. [📊 Diagrama General](#diagrama-general)
2. [🔧 Stack Tecnológico](#stack-tecnológico)
3. [💾 Base de Datos](#base-de-datos)
4. [🔌 Backend API](#backend-api)
5. [💻 Frontend](#frontend)
6. [🛡️ Seguridad](#seguridad)
7. [📦 Dependencias](#dependencias)

---

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Navegador                          │
│              (React + TypeScript + Tailwind)                   │
└──────────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Nginx (VPS)                            │
│         https://aegg.creapolis.mx (Frontend)                │
│         https://aegg-api.creapolis.mx (Backend)              │
└──────────┬────────────────────────────────────┬───────────────────┘
           │                                    │
           │ Forward /api/*                    │ Static files
           ▼                                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  NestJS Backend (PM2)     │    │   Frontend Build           │
│  Node.js 20                │    │   (dist/)                 │
│  - Auth (JWT)              │    │   /var/www/.../httpdocs/ │
│  - Trabajos CRUD           │    └───────────────────────────────┘
│  - Clientes CRUD           │
│  - Reportes Mensuales       │
│  - Excel Parser             │
│  - Migrations              │
└──────────┬─────────────────────┘
           │ TypeORM
           │ PostgreSQL
           ▼
┌──────────────────────────────┐
│   PostgreSQL (Docker)      │
│   - users                  │
│   - clientes               │
│   - trabajos               │
│   - meses                  │
│   - reportes_mensuales     │
│   - reportes_base_anual    │
└──────────────────────────────┘
```

---

## 🔧 Stack Tecnológico

### Backend

```
Framework:    NestJS 10.3.0
Lenguaje:     TypeScript 5.3.3
ORM:          TypeORM 0.3.20
Database:     PostgreSQL 15 (Docker)
Auth:         JWT + Passport
Excel:        ExcelJS 4.0.0 (reemplaza xlsx)
Rate Limit:    @nestjs/throttler
Security:      Helmet 8.1.0
Sanitize:      sanitize-html 2.17.0
```

### Frontend

```
Framework:    React 18.2.0
Lenguaje:     TypeScript 5.3.3
Build Tool:   Vite 7.3.0
Styling:      Tailwind CSS 3.4.1
Icons:        Lucide React 0.545.0
HTTP Client:  Axios 1.6.5
State:        React Context + TanStack Query
Router:       React Router DOM 6.21.1
Testing:      Vitest 3.2.4 + Testing Library
```

### DevOps

```
Container:    Docker 20.10+
Compose:      Docker Compose 2.20+
Process Mgr:  PM2 (production)
CI/CD:        GitHub Actions
Version Ctrl:  Git
```

---

## 💾 Base de Datos

### Tablas Principales

```sql
-- 1. Users (Usuarios)
users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    name VARCHAR,
    role VARCHAR NOT NULL, -- Admin, Gestor, Miembro
    equipo_id UUID REFERENCES equipos(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. Clientes (Clientes)
clientes (
    id UUID PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    rfc VARCHAR UNIQUE NOT NULL,
    razon_social VARCHAR,
    direccion JSONB,
    contacto_principal JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP
);

-- 3. Equipos (Equipos)
equipos (
    id UUID PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP
);

-- 4. Trabajos (Trabajos Contables)
trabajos (
    id UUID PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id),
    anio INTEGER NOT NULL,
    estado VARCHAR NOT NULL, -- ACTIVO, INACTIVO, COMPLETADO
    estado_aprobacion VARCHAR, -- EN_PROGRESO, EN_REVISION, APROBADO, REABIERTO
    fecha_aprobacion TIMESTAMP,
    aprobado_por_id UUID REFERENCES users(id),
    visibilidad_equipo BOOLEAN DEFAULT false,
    miembro_asignado_id UUID REFERENCES users(id),
    gestor_responsable_id UUID REFERENCES users(id),
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- 5. Meses (12 meses por trabajo)
meses (
    id UUID PRIMARY KEY,
    trabajo_id UUID REFERENCES trabajos(id),
    mes INTEGER NOT NULL, -- 1-12
    estado VARCHAR NOT NULL, -- PENDIENTE, EN_PROCESO, COMPLETADO
    estado_revision VARCHAR, -- EN_EDICION, ENVIADO, APROBADO, CAMBIOS_SOLICITADOS
    fecha_envio_revision TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    comentario_revision TEXT,
    enviado_revision_por_id UUID REFERENCES users(id),
    aprobado_por_id UUID REFERENCES users(id),
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- 6. Reportes Mensuales (3 tipos por mes)
reportes_mensuales (
    id UUID PRIMARY KEY,
    mes_id UUID REFERENCES meses(id),
    tipo VARCHAR NOT NULL, -- INGRESOS, INGRESOS_AUXILIAR, INGRESOS_MI_ADMIN
    archivo_original VARCHAR,
    datos JSONB NOT NULL, -- Array de arrays (celdas Excel)
    estado VARCHAR, -- SIN_IMPORTAR, IMPORTADO, PROCESADO, ERROR
    fecha_importacion TIMESTAMP,
    fecha_procesado TIMESTAMP,
    fecha_creacion TIMESTAMP
);

-- 7. Reporte Base Anual (reporte consolidado)
reportes_base_anual (
    id UUID PRIMARY KEY,
    trabajo_id UUID REFERENCES trabajos(id),
    archivo_url VARCHAR,
    meses_completados INTEGER[], -- [1, 2, 3, ...]
    hojas JSONB NOT NULL, -- [{ nombre, datos: [][] }, ...]
    ultima_actualizacion TIMESTAMP
);
```

### Relaciones

```
Users (1) ───< (N) Trabajos (gestor_responsable)
Users (1) ───< (N) Trabajos (miembro_asignado)
Users (1) ───< (N) Equipos
Equipos (1) ───< (N) Users

Clientes (1) ───< (N) Trabajos

Trabajos (1) ───< (12) Meses
Meses (1) ───< (3) ReportesMensuales

Trabajos (1) ───< (1) ReportesBaseAnual

Users (1) ───< (N) Meses (enviado_revision_por)
Users (1) ───< (N) Meses (aprobado_por)
Users (1) ───< (N) Trabajos (aprobado_por)
```

---

## 🔌 Backend API

### Estructura de Módulos

```
backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── strategies/
│       └── jwt.strategy.ts
│
├── clientes/
│   ├── clientes.module.ts
│   ├── services/
│   │   └── clientes.service.ts
│   ├── controllers/
│   │   └── clientes.controller.ts
│   ├── entities/
│   │   └── cliente.entity.ts
│   └── dto/
│       ├── create-cliente.dto.ts
│       └── update-cliente.dto.ts
│
├── trabajos/
│   ├── trabajos.module.ts
│   ├── services/
│   │   ├── trabajos.service.ts
│   │   ├── excel-parser.service.ts
│   │   └── reportes-mensuales.service.ts
│   ├── controllers/
│   │   ├── trabajos.controller.ts
│   │   ├── meses.controller.ts
│   │   └── reportes-mensuales.controller.ts
│   ├── entities/
│   │   ├── trabajo.entity.ts
│   │   ├── mes.entity.ts
│   │   └── reporte-mensual.entity.ts
│   └── dto/
│       ├── create-trabajo.dto.ts
│       └── update-trabajo.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── services/
│   │   └── users.service.ts
│   ├── controllers/
│   │   └── users.controller.ts
│   └── entities/
│       └── user.entity.ts
│
├── common/
│   ├── helpers/
│   │   └── sanitize.helper.ts
│   └── decorators/
│
├── knowledge-base/
│   └── knowledge-base.controller.ts
│
├── migrations/
│   └── *.migration.ts
│
├── types/
│   └── *.d.ts
│
├── data-source.ts
├── main.ts
└── app.module.ts
```

### Endpoints Principales

```
POST   /auth/register          # Registro de usuario
POST   /auth/login             # Login (retorna JWT)
GET    /auth/profile           # Perfil del usuario actual

# Trabajos
GET    /trabajos              # Listar trabajos (con filtros por rol)
POST   /trabajos              # Crear trabajo
GET    /trabajos/:id          # Obtener trabajo por ID
PUT    /trabajos/:id          # Actualizar trabajo
DELETE /trabajos/:id          # Eliminar trabajo
POST   /trabajos/:id/importar  # Importar reporte base anual
PUT    /trabajos/:id/ventas/:mes  # Actualizar ventas mensuales

# Meses
GET    /trabajos/:trabajoId/meses          # Listar meses
POST   /trabajos/:trabajoId/meses          # Crear mes
PUT    /meses/:id/enviar-revision           # Enviar a revisión
PUT    /meses/:id/aprobar                   # Aprobar mes
PUT    /meses/:id/solicitar-cambios        # Solicitar cambios

# Reportes Mensuales
POST   /meses/:mesId/reportes/importar     # Importar Excel
DELETE /meses/:mesId/reportes/:reporteId/datos  # Limpiar datos
POST   /meses/:mesId/reportes/procesar-y-guardar  # Guardar en BD

# Clientes
GET    /clientes              # Listar clientes (búsqueda)
POST   /clientes              # Crear cliente
GET    /clientes/:id          # Obtener cliente
PUT    /clientes/:id          # Actualizar cliente
DELETE /clientes/:id          # Eliminar cliente

# Usuarios (solo Admin)
GET    /users                 # Listar usuarios
POST   /users                 # Crear usuario
PUT    /users/:id           # Actualizar usuario
DELETE /users/:id           # Eliminar usuario
```

---

## 💻 Frontend

### Estructura de Módulos

```
frontend/src/
├── components/                # Componentes reutilizables
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── trabajos/
│   │   ├── TrabajosList.tsx
│   │   ├── TrabajoDetail.tsx
│   │   ├── CreateTrabajoDialog.tsx
│   │   └── EditTrabajoDialog.tsx
│   └── clientes/
│       ├── ClientesTable.tsx
│       └── ClienteDialog.tsx
│
├── features/                 # Funcionalidades por feature
│   ├── trabajos/
│   │   ├── filters/
│   │   ├── aprobaciones/
│   │   └── reportes/
│   │       └── reporte-anual/
│   ├── clientes/
│   │   └── hooks/
│   └── aprobaciones/
│
├── pages/                    # Páginas principales
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── Trabajos.tsx
│   ├── TrabajoDetail.tsx
│   ├── ReporteAnualPage.tsx
│   ├── ReporteMensualPage.tsx
│   └── ClientesPage.tsx
│
├── services/                 # API clients
│   ├── api.ts               # Axios instance
│   ├── auth.service.ts
│   ├── trabajos.service.ts
│   ├── clientes.service.ts
│   └── reportes.service.ts
│
├── types/                   # Tipos TypeScript
│   ├── trabajo.ts
│   ├── cliente.ts
│   ├── user.ts
│   └── aprobaciones.ts
│
├── context/                 # Context API
│   └── AuthContext.tsx
│
└── App.tsx
```

### Rutas (React Router)

```
/                          # Login
/dashboard                  # Dashboard de trabajos
/trabajos                  # Lista de trabajos
/trabajos/:id              # Detalle de trabajo
/trabajos/:id/reporte-anual/:anio  # Reporte base anual
/reportes-mensuales/:mesId  # Reporte mensual
/clientes                  # Gestión de clientes (Admin)
```

---

## 🛡️ Seguridad

### Implementado

```
✅ JWT Authentication (Bearer tokens)
✅ Role-based Access Control (RBAC)
✅ Rate Limiting (100 req/60s, deshabilitado en dev)
✅ Helmet Security Headers (CSP, HSTS, X-Frame-Options)
✅ CORS (orígenes específicos)
✅ Input Sanitization (sanitize-html + dompurify)
✅ Password Hashing (bcrypt)
✅ File Upload Limits (1mb)
✅ Database Connection Pooling (5-20 conexiones)
✅ TypeScript Strict Mode
✅ ESLint + Prettier
```

### Headers de Seguridad

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📦 Dependencias Principales

### Backend

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/typeorm": "^10.0.1",
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/throttler": "^6.5.0",
  "typeorm": "^0.3.20",
  "pg": "^8.11.3",
  "exceljs": "^4.0.0",
  "helmet": "^8.1.0",
  "sanitize-html": "^2.17.0",
  "bcrypt": "^5.1.1",
  "passport-jwt": "^4.0.1"
}
```

### Frontend

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.1",
  "axios": "^1.6.5",
  "@tanstack/react-query": "^5.90.2",
  "lucide-react": "^0.545.0",
  "dompurify": "^3.3.1"
}
```

---

**Última actualización**: 27/12/2025
**Versión**: 2.0.0
**Estado**: ✅ Actualizado y consolidado
