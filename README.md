# 📊 Sistema de Gestión de Trabajos Contables V2

> **Sistema fullstack para gestión de trabajos contables con importación Excel, reportes mensuales y consolidación anual.**

**Versión**: 1.1.0 | **Stack**: NestJS + React + PostgreSQL + Docker

---

## ✨ Características Principales

- 🔐 **Autenticación JWT** - Login/registro seguro con roles (Admin, Gestor, Miembro)
- 📁 **Gestión de Trabajos** - CRUD completo para trabajos contables anuales
- 📅 **Gestión de Meses** - 12 meses automáticos por trabajo con estados
- 📄 **Reportes Mensuales** - 3 tipos: Ingresos, Auxiliar, MI Admin (Excel)
- 📤 **Importación Excel** - Soporte multi-hoja con validaciones
- 📊 **Reporte Base Anual** - 3 hojas consolidadas (Resumen, Ingresos, Comparativas)
- 👁️ **Visualización Completa** - Tabs, tablas responsive, contadores
- ✏️ **Edición de Trabajos** - Modificar cliente, RFC, estado
- 🔄 **Reabrir Meses** - Correcciones en meses completados
- 👥 **Roles y Permisos** - Admin, Gestor, Miembro con accesos granulares

---

## 🚀 Inicio Rápido (5 minutos)

### Requisitos Previos

- Docker Desktop instalado y corriendo
- Git

### 1. Clonar y Levantar

```bash
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app
docker-compose up -d
```

### 2. Acceder

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
PostgreSQL: localhost:5440
```

### 3. Crear Usuario

1. Ir a http://localhost:5173
2. Click "Registrarse"
3. Completar formulario
4. ¡Listo para usar!

---

## 📁 Estructura del Proyecto

```
aegg-new-app/
├── backend/           # NestJS Backend (TypeORM + PostgreSQL)
├── frontend/          # React + Vite Frontend
├── docs/             # 📚 Documentación completa
├── scripts/          # 🚀 Scripts de desarrollo y deployment
├── config/           # ⚙️ Configuraciones (PM2, etc.)
└── docker-compose.yml # PostgreSQL + pgAdmin
```

---

## 📖 Documentación Completa

Toda la documentación detallada está en [`docs/`](./docs/):

| Documento | Descripción |
|-----------|-------------|
| **[README](./docs/README.md)** | Índice completo de documentación |
| **[DEVELOPMENT](./docs/DEVELOPMENT.md)** | Guía de desarrollo (setup, stack, tests) |
| **[ARCHITECTURE](./docs/ARCHITECTURE.md)** | Arquitectura técnica (DB, API, frontend) |
| **[DEPLOYMENT](./docs/DEPLOYMENT.md)** | Deployment completo a VPS o local |
| **[FEATURES](./docs/FEATURES.md)** | Lista completa de funcionalidades |
| **[TROUBLESHOOTING](./docs/TROUBLESHOOTING.md)** | Solución de problemas |
| **[CHANGELOG](./docs/CHANGELOG.md)** | Historial de cambios y versiones |

---

## 🛠️ Comandos Útiles

### Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener todos
docker-compose down

# Reiniciar servicio específico
docker-compose restart backend
```

### Desarrollo

```bash
# Backend
cd backend
npm run start:dev     # Modo desarrollo con hot reload

# Frontend
cd frontend
npm run dev           # Modo desarrollo con hot reload
```

### Scripts Organizados

```powershell
# Iniciar todo (Windows)
.\scripts\start.ps1

# Iniciar solo base de datos
.\scripts\start-database.ps1

# Detener todo
.\scripts\stop.ps1
```

---

## 🌐 URLs de Producción

- **Frontend**: https://aegg.creapolis.mx
- **Backend API**: https://aegg-api.creapolis.mx

---

## 🏗️ Stack Tecnológico

### Backend

- NestJS 10.3.0
- TypeORM 0.3.20
- PostgreSQL 15
- JWT Authentication
- ExcelJS 4.0.0
- Class-validator

### Frontend

- React 18
- TypeScript
- Vite 5.4.20
- React Router DOM
- Axios + TanStack Query
- Tailwind CSS
- Lucide React Icons

---

## 📚 Flujo de Uso del Sistema

### 1. Crear Trabajo
```
Dashboard → Mis Trabajos → Nuevo Trabajo
→ Se crean automáticamente 12 meses + Reporte Base Anual
```

### 2. Agregar/Ver Meses
```
Detalle del Trabajo → Selector de meses (1-12)
→ Cada mes tiene 3 reportes mensuales
```

### 3. Importar Reportes
```
Mes → Reporte → Importar Excel
→ Validaciones automáticas (max 10MB, .xlsx/.xls)
```

### 4. Procesar Mes
```
Cuando los 3 reportes estén importados
→ Click "Procesar y Guardar Mes"
→ Backend consolida datos
→ Mes marcado como COMPLETADO
```

---

## 🔒 Seguridad

- ✅ JWT Authentication (Bearer tokens)
- ✅ Role-based Access Control (RBAC)
- ✅ Rate Limiting (100 req/60s)
- ✅ Helmet Security Headers
- ✅ CORS (orígenes específicos)
- ✅ Input Sanitization (sanitize-html)
- ✅ Password Hashing (bcrypt)
- ✅ File Upload Limits (1MB)

---

## 🐛 Troubleshooting

Ver [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) para solución detallada de problemas.

**Problemas comunes:**

```bash
# Backend no inicia
docker-compose logs backend --tail 50
docker-compose restart backend

# Frontend muestra pantalla en blanco
docker-compose logs frontend --tail 50

# Puerto ocupado (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Empezar de cero
docker-compose down -v
docker-compose up -d --build
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👥 Equipo

**Desarrollado por:** [Tiago Furquim](https://github.com/tiagofur)
**Repositorio:** https://github.com/tiagofur/aegg-new-app

---

**Estado actual:** ✅ Fase 1-10 completadas - Sistema completamente funcional
**Última actualización:** Diciembre 2025
**Versión:** 1.1.0
