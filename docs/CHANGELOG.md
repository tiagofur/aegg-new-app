# 📋 CHANGELOG

Todos los cambios notables del proyecto.

---

## [v2.0.0] - 27/12/2025

### ✨ Nuevas Funcionalidades

#### Mejoras de Seguridad (CRÍTICAS)
- ✅ Eliminado fallback inseguro de JWT_SECRET
- ✅ Validación estricta de JWT_SECRET (mínimo 32 caracteres)
- ✅ Actualizado dependencias vulnerables:
  - xlsx → exceljs@4.0.0 (arregla 3 vulnerabilidades HIGH)
  - vite 5.x → vite 7.3.0 (arregla 2 vulnerabilidades)
  - glob 10.x → glob 10.5.0
- ✅ Habilitado TypeScript strict mode en backend
- ✅ Rate limiting implementado (100 req/60s)
- ✅ Helmet headers configurados (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Sanitización de input disponible (sanitize-html + dompurify)
- ✅ Database connection pooling configurado (5-20 conexiones)
- ✅ File upload limits reducidos (25mb → 1mb)

#### GitHub Actions (Nuevo)
- ✅ Workflow de deployment automático creado
- ✅ Trigger al hacer push a `main`
- ✅ Trigger manual desde GitHub UI
- ✅ Build y test automáticos
- ✅ Deployment a VPS (SCP)
- ✅ Migraciones automáticas de base de datos
- ✅ Reinicio automático de PM2

#### Frontend Improvements
- ✅ Bundle size optimization (chunks separados)
- ✅ ESLint configurado (rules de linting)
- ✅ Prettier configurado (formateo de código)
- ✅ Scripts `npm run lint` y `npm run format` agregados
- ✅ Tests de TrabajoDetail arreglados (2 tests pasando)

#### Docker Compose
- ✅ Agregado servicio `backend` con health check
- ✅ Agregado servicio `frontend` con dependencias

### 🔧 Correcciones

#### Backend
- 🔧 Corregido tipo de `error` en trabajos.service.ts (unknown → Error)
- 🔧 Corregido tipo de `sheetName` en map (string)
- 🔧 Corregido tipo de `h` en map (any)
- 🔧 Corregido tipo de `error` en excel-parser.service.ts (unknown)
- 🔧 Agregado tag `@deprecated` a función no usada
- 🔧 Prefijado parámetro no usado (`_currentUser`)
- 🔧 Logging condicional (solo en development)
- 🔧 Scripts de migraciones agregados a package.json

#### Frontend
- 🔧 Cambiado `interface` vacía a `type` en UpdateClientePayload
- 🔧 Cambiado `any[]` a `unknown[][]` en tipos de Excel
- 🔧 Mock corregido en tests de TrabajoDetail

### 📚 Documentación

#### Reorganización Completa
- 📚 **Documentación consolidada de 62 archivos a 7 archivos principales**:
  - `README.md` (índice principal)
  - `DEPLOYMENT.md` (todo sobre deployment)
  - `DEVELOPMENT.md` (guía de desarrollo)
  - `ARCHITECTURE.md` (arquitectura técnica)
  - `FEATURES.md` (funcionalidades)
  - `TROUBLESHOOTING.md` (solución de problemas)
  - `CHANGELOG.md` (este archivo)
- 📚 Documentación antigua movida a `docs/archive/`

#### Nueva Documentación
- 📝 `DEPLOYMENT-GITHUB-ACTIONS.md` (guía de deployment con GitHub Actions)
- 📝 `.github/workflows/README.md` (documentación detallada de GitHub Actions)
- 📝 `setup-github-secrets.sh` (script para configurar secrets)

### ⚡ Performance

- ✅ Backend build optimizado con TypeScript strict mode
- ✅ Frontend build con chunks separados para mejor caching
- ✅ Database connection pool configurado (5-20 conexiones)
- ✅ File upload limits reducidos (mejora contra DoS)

### 🛡️ Seguridad

- ✅ 0 vulnerabilidades en backend (npm audit)
- ✅ 0 vulnerabilidades en frontend (npm audit)
- ✅ JWT_SECRET validado obligatoriamente
- ✅ Rate limiting activo
- ✅ Headers de seguridad completos (Helmet)
- ✅ Sanitización de input disponible
- ✅ Protección contra Prototype Pollution (xlsx → exceljs)
- ✅ Protección contra ReDoS attacks (xlsx → exceljs)
- ✅ Protección contra DoS (file upload limits reducidos)

### 🧪 Tests

- ✅ Frontend: 23/23 tests pasando (100%)
- ✅ TrabajoDetail tests arreglados (2 tests previamente fallando)
- ✅ Tests de componentes (TrabajosList, ClientesTable, etc.)
- ✅ Tests de hooks (useTrabajosFilters, useClienteSearch, etc.)

---

## [v1.1.0] - Octubre 2025

### ✨ Nuevas Funcionalidades

#### Sistema de Trabajos Contables
- ✅ Gestión de trabajos contables (CRUD completo)
- ✅ Clientes asignados a trabajos
- ✅ Gestión de meses (12 meses automáticos por trabajo)
- ✅ 3 tipos de reportes mensuales por mes:
  - INGRESOS
  - INGRESOS_AUXILIAR
  - INGRESOS_MI_ADMIN
- ✅ Importación de reporte base anual (Excel)
- ✅ Procesamiento automático de reportes con cálculos
- ✅ Actualización de ventas mensuales en reporte base anual

#### Aprobaciones
- ✅ Flujo de aprobaciones con 4 estados:
  - EN_EDICION
  - ENVIADO
  - APROBADO
  - CAMBIOS_SOLICITADOS
- ✅ Indicadores visuales por estado (badges de colores)
- ✅ Comentarios al aprobar/solicitar cambios
- ✅ Dashboard de aprobaciones para Gestores

#### Equipos
- ✅ Creación de equipos
- ✅ Asignación de usuarios a equipos
- ✅ Visibilidad de trabajos por equipo
- ✅ Gestores pueden ver trabajos de su equipo

#### UX Mejorada
- ✅ Nueva UX con selector horizontal de meses
- ✅ Vista enfocada por mes
- ✅ Indicador de tiempo (tiempo desde última edición)
- ✅ Badges de menú según estado del mes

### 🔧 Correcciones

- ✅ Navegación entre trabajos y detalle mejorada
- ✅ Visualización de reportes optimizada
- ✅ Cálculos automáticos corregidos
- ✅ Validaciones mejoradas en forms

### 📚 Documentación

- ✅ Documentación de arquitectura completa
- ✅ Guías de uso por rol
- ✅ Documentación de API endpoints
- ✅ Guía de desarrollo local

---

## [v1.0.0] - Septiembre 2025

### ✨ Versión Inicial

#### Autenticación y Usuarios
- ✅ Login con email y password
- ✅ Registro de usuarios
- ✅ Roles: Admin, Gestor, Miembro
- ✅ JWT tokens (7 días de expiración)

#### Clientes
- ✅ CRUD completo de clientes
- ✅ Búsqueda en tiempo real
- ✅ RFC único por cliente
- ✅ Metadatos flexibles (JSON)

#### Sistema de Trabajos
- ✅ CRUD de trabajos contables
- ✅ Asignación de clientes a trabajos
- ✅ Año fiscal
- ✅ Estados de trabajo (ACTIVO, INACTIVO, COMPLETADO)
- ✅ Visibilidad (equipo/privado)

#### Reportes Mensuales
- ✅ 3 tipos de reportes por mes
- ✅ Importación de Excel por reporte
- ✅ Almacenamiento en base de datos
- ✅ Visualización de datos

#### Base de Conocimiento
- ✅ CRUD de artículos
- ✅ Categorías
- ✅ Etiquetas
- ✅ Búsqueda

### 🧪 Stack Tecnológico

**Backend:**
- NestJS 10.3.0
- TypeScript 5.3.3
- TypeORM 0.3.20
- PostgreSQL 15 (Docker)
- JWT Authentication
- xlsx 0.18.5

**Frontend:**
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.4.20
- Tailwind CSS 3.4.1
- React Router DOM 6.21.1
- Axios 1.6.5

**DevOps:**
- Docker Compose
- PM2 para producción

---

## 📈 Estadísticas

### Versión Actual
**v2.0.0** (27/12/2025)

### Métricas del Proyecto

| Métrica | v1.0.0 | v1.1.0 | v2.0.0 |
|---------|----------|----------|----------|
| Funcionalidades principales | 5 | 15 | 25+ |
| Tests pasando | - | 21/23 | 23/23 (100%) |
| Vulnerabilidades (backend) | 13 | 10 | 0 |
| Vulnerabilidades (frontend) | 3 | 2 | 0 |
| Archivos de documentación | ~60 | ~55 | 7 |
| Documentación organizada | ❌ | ⚠️ | ✅ |

### Logro Importante

🎉 **De 16 vulnerabilidades en v1.0.0 → 0 vulnerabilidades en v2.0.0**

### Próximos Pasos (v2.1.0)

- [ ] Importación mejorada con drag & drop
- [ ] Edición de celdas directamente en la UI
- [ ] Exportación a Excel y PDF
- [ ] Gráficas y análisis de datos
- [ ] Navegación con teclado
- [ ] Colaboración entre usuarios
- [ ] Dashboard avanzado con KPIs
- [ ] App móvil

---

**Última actualización**: 27/12/2025
**Versión actual**: v2.0.0
**Próxima versión planeada**: v2.1.0 (Q1 2026)
