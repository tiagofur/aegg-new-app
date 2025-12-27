# 📚 Documentación - Sistema de Gestión de Trabajos Contables

**Versión**: 2.0.0  
**Fecha**: 27/12/2025  
**Estado**: ✅ Producción

---

## 🎯 ¿Qué es este proyecto?

Sistema profesional para gestión de trabajos contables con:
- ✅ Autenticación JWT segura
- ✅ Gestión de trabajos, clientes y usuarios
- ✅ 12 meses automáticos por trabajo
- ✅ 3 tipos de reportes mensuales (Excel)
- ✅ Reporte base anual con consolidación
- ✅ Flujo de aprobaciones completo
- ✅ Base de conocimiento
- ✅ Roles y permisos granulares

**Stack**: NestJS + React + PostgreSQL + Docker  
**Frontend**: https://aegg.creapolis.mx  
**Backend**: https://aegg-api.creapolis.mx  

---

## 📖 Documentación Simplificada (7 Archivos)

Todo está organizado en 7 archivos simples y claros:

| Archivo | Descripción | Para... |
|---------|-------------|---------|
| **[README.md](#)** | Este archivo | Índice principal |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deployment completo | Deploy a VPS o local |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Guía de desarrollo | Setup, stack, tests |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Arquitectura técnica | Database, API, frontend |
| **[FEATURES.md](FEATURES.md)** | Funcionalidades | Qué hace el sistema |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Solución de problemas | Debugging, errors |
| **[CHANGELOG.md](CHANGELOG.md)** | Historial de cambios | Versiones, features |

**Documentación antigua**: Ver `docs/archive/` (62 archivos archivados)

---

## 🚀 Inicio Rápido (5 minutos)

### Nuevo en el proyecto?

```bash
# 1. Clonar repositorio
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app

# 2. Iniciar servicios Docker
docker-compose up -d

# 3. Verificar que todo corra
docker ps
# Deberías ver: postgres, pgadmin

# 4. Abrir navegador
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### Credenciales por defecto (local)

- **Frontend**: Email en la BD (ver init-scripts/)
- **Backend**: JWT generado automáticamente
- **PostgreSQL**: `postgres` / `postgres`
- **pgAdmin**: `admin@aegg.com` / `admin`

**⚠️ IMPORTANTE**: Cambia las credenciales en producción

---

## 📊 Diagrama de Arquitectura

```
┌────────────────────────────────────────────────────┐
│         Navegador (Frontend)              │
│   React 18 + TypeScript + Vite           │
└──────────────┬───────────────────────────────┘
               │ HTTPS (443)
               ▼
┌────────────────────────────────────────────┐
│         Nginx (VPS Reverse Proxy)     │
│    https://aegg.creapolis.mx         │
└──────────┬───────────────┬───────────┘
           │ /api/*         │ Static files
           ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ NestJS Backend │  │ Frontend Build   │
│ Node.js 20     │  │ (dist/)         │
│ Port: 3000     │  │ /var/www/...    │
├─────────────────┤  └─────────────────┘
│ Auth (JWT)     │
│ Trabajos CRUD   │
│ Clientes CRUD   │
│ Reportes        │
└───────────┬─────┘
            │ TypeORM
            ▼
┌─────────────────┐
│  PostgreSQL   │
│   (Docker)    │
│   Port: 5440  │
└─────────────────┘
```

---

## 👨‍💻 Por Rol

### 👨‍💼 Usuario Final

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** → Si necesitas deploy
2. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** → Si tienes problemas
3. **[FEATURES.md](FEATURES.md)** → Para ver qué puede hacer

### 👨‍💻 Desarrollador Nuevo

1. **[DEVELOPMENT.md](DEVELOPMENT.md)** → Setup del proyecto
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** → Arquitectura y stack
3. **[FEATURES.md](FEATURES.md)** → Funcionalidades implementadas
4. **[CHANGELOG.md](CHANGELOG.md)** → Historial de cambios

### 🏗️ Arquitecto/Tech Lead

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** → Arquitectura completa
2. **[DEVELOPMENT.md](DEVELOPMENT.md)** → Stack y herramientas
3. **[CHANGELOG.md](CHANGELOG.md)** → Evolución técnica
4. Ver `docs/archive/` para historial de decisiones

---

## 🔍 Búsqueda Rápida

| Necesito... | Ver archivo |
|--------------|-------------|
| Deployar en VPS | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Setup inicial | [DEVELOPMENT.md](DEVELOPMENT.md#setup-inicial) |
| Entender arquitectura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Ver funcionalidades | [FEATURES.md](FEATURES.md) |
| Solucionar error | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Ver cambios recientes | [CHANGELOG.md](CHANGELOG.md#v200---27122025) |
| Ver historial completo | docs/archive/ (62 archivos) |

---

## 🏗️ Stack Tecnológico

### Backend

```
Framework:    NestJS 10.3.0
Lenguaje:     TypeScript 5.3.3
ORM:          TypeORM 0.3.20
Database:     PostgreSQL 15 (Docker)
Auth:         JWT (7 días expiración)
Excel:        ExcelJS 4.0.0 (sin vulnerabilidades)
Security:     Helmet + Rate Limiting + Sanitization
```

### Frontend

```
Framework:    React 18.2.0
Lenguaje:     TypeScript 5.3.3
Build Tool:   Vite 7.3.0
Styling:      Tailwind CSS 3.4.1
Icons:        Lucide React 0.545.0
HTTP Client:  Axios 1.6.5
State:        React Context + TanStack Query 5.90.2
Router:       React Router DOM 6.21.1
Testing:      Vitest 3.2.4 + Testing Library
Quality:      ESLint 8.57.0 + Prettier 3.7.4
```

### DevOps

```
Container:    Docker 20.10+
Compose:      Docker Compose 2.20+
Process Mgr:  PM2 (production)
CI/CD:        GitHub Actions (automático)
Version Ctrl:  Git 2.30+
```

---

## 🚀 Comandos Principales

### Desarrollo Local

```bash
# Iniciar todo (Docker)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Backend development
cd backend && npm run start:dev

# Frontend development
cd frontend && npm run dev
```

### Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Con coverage
npm test -- --coverage
```

### Build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Deployment

```bash
# Automático (GitHub Actions)
git push origin main

# Manual local
bash prepare-deployment.sh

# Ver [DEPLOYMENT.md](DEPLOYMENT.md) para más detalles
```

---

## 📊 Estado del Proyecto

### ✅ Completado (Fase 1-10, Mejoras 2025-12-27)

- ✅ Autenticación JWT segura
- ✅ CRUD de trabajos, clientes, usuarios
- ✅ 12 meses automáticos por trabajo
- ✅ 3 tipos de reportes mensuales
- ✅ Importación de reporte base anual
- ✅ Procesamiento automático con cálculos
- ✅ Flujo de aprobaciones (4 estados)
- ✅ Dashboard de aprobaciones
- ✅ Base de conocimiento
- ✅ **0 vulnerabilidades** (backend + frontend)
- ✅ **TypeScript strict mode**
- ✅ **GitHub Actions** (deployment automático)
- ✅ **Seguridad completa** (Helmet, Rate Limiting, Sanitization)
- ✅ **100% de tests pasando** (23/23)

### ⏳ Pendiente (Fase 11+)

- ⏳ Importación mejorada con drag & drop
- ⏳ Edición de celdas en la UI
- ⏳ Exportación a Excel/PDF
- ⏳ Gráficas y análisis
- ⏳ Navegación con teclado
- ⏳ Colaboración entre usuarios
- ⏳ Notificaciones push
- ⏳ Dashboard avanzado con KPIs
- ⏳ App móvil

**Ver lista completa**: [FEATURES.md](FEATURES.md#pendientes)

---

## 🛡️ Seguridad

### Implementado (v2.0.0)

```
✅ JWT Authentication (Bearer tokens)
✅ Role-based Access Control (RBAC)
✅ Rate Limiting (100 req/60s)
✅ Helmet Security Headers
✅ Input Sanitization (sanitize-html + dompurify)
✅ Password Hashing (bcrypt)
✅ File Upload Limits (1mb)
✅ Database Connection Pooling (5-20 conexiones)
✅ CORS (orígenes específicos)
✅ TypeScript Strict Mode
✅ 0 Vulnerabilidades (npm audit)
```

### Headers de Seguridad

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📈 Métricas de Calidad

### Código

```
Backend Tests:   ✅ Pasando
Frontend Tests:  ✅ 23/23 (100%)
TypeScript:       ✅ Strict mode habilitado
ESLint:          ✅ Configurado (backend + frontend)
Prettier:        ✅ Configurado
Vulnerabilidades: ✅ 0 en backend, 0 en frontend
```

### Documentación

```
Archivos principales:  7 (organizados y simples)
Archivos archivados:  62 (docs/archive/)
Cobertura:         Completa
Legibilidad:        Alta
```

---

## 📝 Workflow de Desarrollo

### 1. Pull from main
```bash
git checkout main
git pull origin main
```

### 2. Crear branch de feature
```bash
git checkout -b feat/nueva-funcionalidad
```

### 3. Hacer commits frecuentes
```bash
git add .
git commit -m "feat: agregar funcionalidad X"
```

### 4. Push y crear PR
```bash
git push origin feat/nueva-funcionalidad
# Crear PR en GitHub
```

### 5. Merge a main
```bash
# Después de aprobación del PR:
git checkout main
git pull
git branch -d feat/nueva-funcionalidad
```

**Deployment automático** al hacer push a main ✅

---

## 🐛 Reportar Bugs

Si encuentras un problema:

1. **Verificar primero**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Incluye en el issue**:
   - Descripción clara del problema
   - Pasos para reproducir
   - Mensaje de error completo
   - Logs del backend/frontend
   - Entorno (OS, Node.js versión, etc.)
3. **Crear issue en GitHub** con toda la información

---

## 📈 Roadmap

### v2.1.0 (Q1 2026)

- [ ] Importación mejorada con drag & drop
- [ ] Edición de celdas en la UI
- [ ] Exportación a Excel/PDF
- [ ] Gráficas y análisis de datos

### v2.2.0 (Q2 2026)

- [ ] Navegación con teclado
- [ ] Colaboración entre usuarios
- [ ] Notificaciones push
- [ ] Dashboard avanzado con KPIs

### v3.0.0 (Q3 2026)

- [ ] App móvil (React Native)
- [ ] Integración con otros sistemas contables
- [ ] API para terceros
- [ ] Webhooks

---

## 🔗 Enlaces Útiles

- **Frontend (Producción)**: https://aegg.creapolis.mx
- **Backend API (Producción)**: https://aegg-api.creapolis.mx
- **Repositorio**: https://github.com/tiagofur/aegg-new-app
- **GitHub Actions**: Ver Actions tab en el repositorio
- **Issues**: https://github.com/tiagofur/aegg-new-app/issues

---

## 💡 Tips

✅ **Empezar aquí**: Lee este README primero  
✅ **7 archivos principales**: Todo lo que necesitas  
✅ **DEPLOYMENT.md**: Para deployment automático y manual  
✅ **DEVELOPMENT.md**: Para setup y desarrollo  
✅ **FEATURES.md**: Para ver funcionalidades  
✅ **TROUBLESHOOTING.md**: Para solucionar problemas  
✅ **ARCHITECTURE.md**: Para entender la arquitectura  
✅ **docs/archive/**: Para historial completo (62 archivos)  

---

## 📞 Soporte

- **Issues en GitHub**: Para bugs y features
- **TROUBLESHOOTING.md**: Para problemas comunes
- **Equipo de desarrollo**: Para consultas técnicas

---

## 📄 Licencia

Este proyecto es privado y está bajo desarrollo activo.

---

**Última actualización**: 27/12/2025  
**Versión**: 2.0.0  
**Total de archivos**: 7 principales + 62 archivados  
**Estado**: ✅ Reorganizado, simplificado y actualizado

---

_Documentación simplificada y mantenida por el equipo de desarrollo_
