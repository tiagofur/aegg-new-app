# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema de Gestión de Trabajos Contables V2** - A fullstack accounting work management system for managing clients, annual accounting jobs, monthly reports, and Excel file imports/consolidations.

**Tech Stack:**
- Backend: NestJS 10.3, TypeORM 0.3.20, PostgreSQL 15, JWT Auth, ExcelJS 4.0
- Frontend: React 18, TypeScript, Vite 7.3, React Router 6.21, Axios, TanStack Query, Tailwind CSS
- Database: PostgreSQL 15 in Docker

## Common Development Commands

### Starting the Project

```bash
# Start PostgreSQL in Docker (ports 5440:5432)
docker-compose up -d

# Backend (Terminal 1) - runs on port 3000
cd backend
npm install
npm run start:dev          # Hot reload development mode

# Frontend (Terminal 2) - runs on port 5173
cd frontend
npm install
npm run dev
```

### Docker Commands

```bash
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose restart backend          # Restart specific service
docker-compose logs -f backend          # View logs
docker-compose exec postgres psql -U postgres -d appdb  # Connect to DB
```

### Backend Commands

```bash
cd backend
npm run build              # Production build
npm run start:prod         # Run production build
npm run lint               # ESLint
npm run test               # Run tests
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
```

### Frontend Commands

```bash
cd frontend
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # ESLint
npm run format             # Prettier formatting
npm test                   # Run Vitest tests
```

## Architecture Overview

### Domain Model

The system manages **Trabajos** (Accounting Jobs) for **Clientes**. Each Trabajo represents one fiscal year for a client and contains:

- **12 Meses** (Months) - automatically created when Trabajo is created
- **3 ReportesMensuales per Mes** - INGRESOS, INGRESOS_AUXILIAR, INGRESOS_MI_ADMIN
- **1 ReporteBaseAnual** - consolidated annual report with 3 sheets
- **Multiple ReporteAnual** - per-year reports

#### Entity Relationships

```
Cliente (1) ──< (N) Trabajo
User (1) ────< (N) Trabajo (gestorResponsable)
User (1) ────< (N) Trabajo (miembroAsignado)

Trabajo (1) ───< (12) Mes
Trabajo (1) ───< (1) ReporteBaseAnual

Mes (1) ────< (3) ReporteMensual
```

#### User Roles

- **Admin** - Full access, can manage users and clientes
- **Gestor** - Can manage trabajos within their equipo (team)
- **Miembro** - Can view assigned trabajos

#### Key States

**Trabajo.estado**: ACTIVO, INACTIVO, COMPLETADO
**Trabajo.estadoAprobacion**: EN_PROGRESO, EN_REVISION, APROBADO, REABIERTO
**Mes.estado**: PENDIENTE, EN_PROCESO, COMPLETADO
**Mes.estadoRevision**: EN_EDICION, ENVIADO, APROBADO, CAMBIOS_SOLICITADOS

### Backend Structure

**Modular architecture** following NestJS conventions:

```
backend/src/
├── auth/                    # JWT Authentication
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── strategies/         # JWT Strategy
│   └── decorators/         # @CurrentUser(), @Roles()
├── clientes/               # Client CRUD
├── trabajos/               # Core business logic
│   ├── services/
│   │   ├── trabajos.service.ts
│   │   ├── meses.service.ts
│   │   ├── reportes-mensuales.service.ts
│   │   ├── excel-parser.service.ts    # ExcelJS parsing
│   │   ├── formula.service.ts         # Formula calculations
│   │   └── reporte-anual.service.ts
│   └── entities/          # Trabajo, Mes, ReporteMensual, etc.
├── users/                  # User management (Admin only)
├── knowledge-base/         # KB endpoints
└── common/                 # Helpers, decorators
```

**Key patterns:**
- TypeORM entities with decorators in `*/entities/`
- DTOs in `*/dto/` for validation with class-validator
- Services inject repositories via `@InjectRepository()`
- Controllers use `@UseGuards(JwtAuthGuard)` for protected routes
- `@Roles(UserRole.ADMIN, UserRole.GESTOR)` for role-based access
- `@CurrentUser()` decorator to get authenticated user

**Excel Processing:**
- `ExcelParserService` (exceljs) - parses multi-sheet Excel files
- `FormulaService` (hot-formula-parser) - evaluates spreadsheet formulas
- Report data stored as JSONB: `datos: any[][]` (array of arrays)
- File uploads limited to 1MB

### Frontend Structure

**Feature-based organization** with React Router 6:

```
frontend/src/
├── pages/                  # Route components
│   ├── Dashboard.tsx
│   ├── TrabajosPage.tsx    # Trabajos list + detail
│   ├── ReporteMensualPage.tsx
│   ├── ReporteBaseAnualPage.tsx
│   ├── ClientesPage.tsx    # Client management
│   └── AdminUsersPage.tsx  # User management
├── components/
│   ├── layout/             # Header, Sidebar
│   ├── trabajos/           # Trabajo-related components
│   └── clientes/           # Cliente-related components
├── services/
│   └── api.ts              # Axios instance with interceptors
├── context/
│   └── AuthContext.tsx     # Auth state management
└── types/                  # TypeScript definitions
```

**Key patterns:**
- `api.ts` - Axios instance with JWT interceptor (adds Bearer token)
- `AuthContext` - Manages auth state, token in localStorage
- `PrivateRoute` component - Route protection with role checks
- Services use `api.get/post/put/delete()` - auto-includes auth headers
- TanStack Query for data fetching (useQuery, useMutation)

**Routing:**
```
/trabajos                   # List trabajos (filtered by user role)
/trabajos/:trabajoId        # Trabajo detail with meses list
/trabajos/:trabajoId/reporte-mensual/:mesId/:reporteId/:tipo
/trabajos/:trabajoId/reporte-base-anual
/trabajos/aprobaciones      # Approval workflow (Gestor+)
/clientes                   # Client management (Admin/Gestor)
/admin/users               # User management (Admin only)
```

### Database Schema

**Important indexes and constraints:**

```sql
-- Unique: one trabajo per cliente-año
UNIQUE(clienteId, anio) ON trabajos

-- Unique: one mes per trabajo-mes (1-12)
UNIQUE(trabajoId, mes) ON meses

-- Cascade delete: deleting trabajo deletes its meses
ON DELETE CASCADE FROM meses
```

**Connection pooling (production):**
- Max connections: 20
- Min connections: 5
- Idle timeout: 30s
- Connection timeout: 2s

### Authentication & Authorization

**JWT Flow:**
1. POST /auth/login → returns `{ token, user }`
2. Frontend stores token in localStorage
3. Axios interceptor adds `Authorization: Bearer ${token}` to all requests
4. Backend JwtAuthGuard validates token
5. `@CurrentUser()` decorator provides user context in controllers

**Role-based access in controllers:**
```typescript
@Controller('trabajos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajosController {
    @Get()
    @Roles(UserRole.ADMIN, UserRole.GESTOR)
    findAll(@CurrentUser() user: CurrentUserPayload) { }
}
```

**Role checks in services:**
```typescript
async findAll(currentUser: CurrentUserPayload) {
    if (currentUser.role === UserRole.ADMIN) {
        return this.trabajoRepository.find();
    }
    // Filter by equipoId for Gestores, assigned trabajoId for Miembros
}
```

## Critical Business Logic

### Creating a Trabajo

When a Trabajo is created:
1. Validates cliente exists
2. Assigns gestorResponsable (defaults to current user)
3. Optionally assigns miembroAsignado
4. **Automatically creates 12 Meses** (mes: 1-12)
5. Creates 1 ReporteBaseAnual with empty hojas

### Monthly Report Workflow

1. **Import Excel** → POST /meses/:mesId/reportes/importar
   - Parses Excel with ExcelParserService
   - Stores parsed data in `reporte.datos` (JSONB)
   - Marks reporte as IMPORTADO

2. **Process & Save** → POST /meses/:mesId/reportes/procesar-y-guardar
   - Validates all 3 reportes are imported
   - Runs formulas with FormulaService
   - Consolidates into ReporteBaseAnual
   - Marks Mes as COMPLETADO

3. **Send to Review** → PUT /meses/:id/enviar-revision
   - Sets estadoRevision to ENVIADO
   - Records enviadoRevisionPor and fechaEnvioRevision

4. **Approve/Request Changes** → PUT /meses/:id/aprobar or /solicitar-cambios
   - Updates estadoRevision
   - Records aprobadoPor and fechaAprobacion (if approved)

### Team Visibility Rules

**Admin**: Can see all trabajos
**Gestor**: Can see trabajos where:
  - gestorResponsableId = own userId, OR
  - miembroAsignadoId = any user in their equipo, OR
  - visibilidadEquipo = true AND trabajo's gestor is in same equipo
**Miembro**: Can only see trabajos where miembroAsignadoId = own userId

## File Upload & Excel Processing

**Supported formats:** .xlsx, .xls (ExcelJS)
**Max file size:** 1MB
**Multi-sheet support:** Can parse all sheets or first sheet only

**Excel Parser Service** (`backend/src/trabajos/services/excel-parser.service.ts`):
- Returns `ResultadoParser` with `hojas: DatosHoja[]`
- Each `DatosHoja` contains: `nombre`, `headers: string[]`, `filas: any[][]`
- Limits: 10,000 rows, 100 columns
- Stores data as array of arrays in JSONB column

## Environment Variables

**Backend (.env):**
```
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=your-secret-key
DEV_ORIGINS=http://localhost:5173
ALLOWED_ORIGINS=https://aegg.creapolis.mx
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
```

## Deployment

**Production URLs:**
- Frontend: https://aegg.creapolis.mx
- Backend API: https://aegg-api.creapolis.mx

**See:** `docs/DEPLOYMENT.md` for detailed deployment instructions

## Important Notes

- **TypeORM synchronize**: Enabled in development, disabled in production
- **CORS**: Configured per environment (localhost in dev, production domain in prod)
- **Security**: Helmet headers, CSP, rate limiting (100 req/60s, disabled in dev)
- **Unique constraint**: Cannot create duplicate Trabajo for same cliente-año
- **Cascade delete**: Deleting Trabajo deletes all related Meses and Reportes
- **12 Meses auto-created**: When creating Trabajo, system automatically creates 12 Mes records
- **JSONB storage**: Excel data stored as JSONB for flexibility
