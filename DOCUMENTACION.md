# 📚 Guía de Documentación Rápida

**Versión**: 2.0.0 - Documentación Reorganizada  
**Fecha**: 27/12/2025

---

## 🎯 Documentación Simplificada: 7 Archivos Principales

La documentación se ha reorganizado de **62 archivos dispersos** a **7 archivos simples y organizados**.

---

## 📖 Archivos Principales (En `docs/`)

### 1. [README.md](docs/README.md) - Índice Principal

**Contenido**:
- ✅ Descripción general del proyecto
- ✅ Stack tecnológico
- ✅ Diagrama de arquitectura
- ✅ Guía de inicio rápido
- ✅ Búsqueda rápida por rol

**Para quién**: Todos (punto de entrada)

---

### 2. [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment Completo

**Contenido**:
- ✅ Deployment local (5 min setup)
- ✅ Deployment en VPS (manual)
- ✅ **Deployment automático con GitHub Actions** ⭐
- ✅ Scripts útiles
- ✅ Solución de problemas de deployment

**Para quién**: DevOps, SysAdmin, Desarrolladores

**Qué encontrarás**:
- Cómo deployar localmente
- Cómo deployar en tu VPS manualmente
- Cómo configurar deployment automático
- Configuración de GitHub Actions (10 secrets)
- Scripts de build y deploy

---

### 3. [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Guía de Desarrollo

**Contenido**:
- ✅ Setup inicial (requisitos, clonar, instalar)
- ✅ Entorno de desarrollo (comandos)
- ✅ Estructura del proyecto
- ✅ Git workflow
- ✅ Autenticación y roles
- ✅ Database (migraciones, seed)
- ✅ Tests (backend y frontend)
- ✅ Conveniones de código
- ✅ Debugging
- ✅ Pull requests

**Para quién**: Desarrolladores nuevos y existentes

**Qué encontrarás**:
- Cómo levantar el proyecto
- Comandos de desarrollo diarios
- Estructura de archivos y carpetas
- Cómo hacer commits
- Cómo escribir tests
- Cómo debuggear

---

### 4. [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura Técnica

**Contenido**:
- ✅ Diagrama general de arquitectura
- ✅ Stack tecnológico completo
- ✅ Base de datos (tablas, relaciones, schema)
- ✅ Backend API (módulos, endpoints)
- ✅ Frontend (módulos, rutas, servicios)
- ✅ Seguridad implementada
- ✅ Dependencias principales

**Para quién**: Arquitectos, Tech Leads, Desarrolladores senior

**Qué encontrarás**:
- Diagrama completo del sistema
- Todas las tablas de la base de datos
- Todos los endpoints del API
- Estructura de módulos frontend/backend
- Configuración de seguridad

---

### 5. [FEATURES.md](docs/FEATURES.md) - Funcionalidades del Sistema

**Contenido**:
- ✅ Gestión de usuarios (roles, equipos)
- ✅ Clientes (CRUD completo)
- ✅ Trabajos contables (CRUD, meses, aprobaciones)
- ✅ Reportes base anual (importación Excel)
- ✅ Reportes mensuales (3 tipos, cálculos automáticos)
- ✅ Flujo de aprobaciones (4 estados, roles)
- ✅ Base de conocimiento
- ✅ Funcionalidades pendientes (roadmap)

**Para quién**: Todos (usuarios, stakeholders, desarrolladores)

**Qué encontrarás**:
- Qué hace el sistema en detalle
- Qué está implementado vs pendiente
- Flujo completo de aprobaciones
- Roadmap de funcionalidades futuras

---

### 6. [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Solución de Problemas

**Contenido**:
- ✅ Setup inicial (Docker, módulos, permisos)
- ✅ Database (conexión, migraciones, esquema)
- ✅ Backend (JWT, módulos, PM2)
- ✅ Frontend (módulos, tests, hot reload)
- ✅ Deployment (GitHub Actions, VPS, permisos)
- ✅ Seguridad (vulnerabilidades, JWT_SECRET)
- ✅ Dependencias (npm install, locks)
- ✅ Debugging general (logs, debugging)

**Para quién**: Todos (cuando algo no funciona)

**Qué encontrarás**:
- Cómo solucionar problemas comunes
- Logs importantes y dónde encontrarlos
- Comandos de diagnóstico
- Pasos para debuggear

---

### 7. [CHANGELOG.md](docs/CHANGELOG.md) - Historial de Cambios

**Contenido**:
- ✅ v2.0.0 (27/12/2025) - Actual
- ✅ v1.1.0 (Octubre 2025)
- ✅ v1.0.0 (Septiembre 2025)
- ✅ Métricas del proyecto
- ✅ Próximos pasos (roadmap)

**Para quién**: Todos (ver qué cambió en cada versión)

**Qué encontrarás**:
- Historial de versiones
- Features agregadas por versión
- Correcciones por versión
- Métricas de calidad del código

---

## 📦 Documentación Archivada (En `docs/archive/`)

### Qué contiene `docs/archive/`

```
docs/archive/
├── deployment/        (7 archivos)
├── desarrollo/         (18 archivos)
├── guias/             (3 archivos)
├── mejoras-2025-10-18/  (5 archivos)
├── mejoras-2025-12-27/  (4 archivos)
├── root-md/          (5 archivos)
├── soluciones/          (5 archivos)
├── tecnica/           (3 archivos)
└── ...                (archivos sueltos)
```

**Total**: 61 archivos archivados

**¿Cuándo usar la documentación archivada?**
- Cuando necesitas información histórica muy específica
- Cuando estás buscando decisiones de arquitectura antiguas
- Cuando quieres ver el historial de implementación detallada

**Recomendación**: Empezar siempre con los 7 archivos principales

---

## 🎯 Por Rol

### 👨‍💼 Usuario Final (Uso del sistema)

1. **[docs/README.md](docs/README.md)** - Para entender qué es el sistema
2. **[docs/FEATURES.md](docs/FEATURES.md)** - Para ver qué puedes hacer
3. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Si tienes problemas

**No necesitas leer**: ARCHITECTURE.md, DEVELOPMENT.md, CHANGELOG.md

---

### 👨‍💻 Desarrollador Nuevo (Empezando)

1. **[docs/README.md](docs/README.md)** - Para entender el proyecto
2. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Para setup inicial
3. **[docs/FEATURES.md](docs/FEATURES.md)** - Para ver funcionalidades
4. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Para entender arquitectura

**Opcional**: docs/archive/ (para contexto histórico)

---

### 👨‍💻 Desarrollador Experienciado (Adding Features)

1. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Conveniones y workflow
2. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura para implementar
3. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Solución de problemas
4. **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Ver cambios recientes

**Opcional**: docs/archive/ (para contexto histórico)

---

### 🏗️ Arquitecto/Tech Lead

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura completa
2. **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Stack y herramientas
3. **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Evolución técnica
4. **[docs/FEATURES.md](docs/FEATURES.md)** - Roadmap y pendientes

**Opcional**: docs/archive/ (para historial de decisiones)

---

### 🛠️ DevOps/SysAdmin

1. **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment completo
2. **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Solución de problemas
3. **[docs/README.md](docs/README.md)** - Para entender el sistema
4. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura para deploy

**Opcional**: docs/archive/ (para configuración histórica)

---

## 🔍 Búsqueda por Tarea

| Tarea | Archivo a leer |
|-------|----------------|
| Deployar en VPS | [DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Configurar GitHub Actions | [DEPLOYMENT.md](docs/DEPLOYMENT.md#deployment-automático-con-github-actions) |
| Setup del proyecto | [DEVELOPMENT.md](docs/DEVELOPMENT.md#setup-inicial) |
| Ver endpoints del API | [ARCHITECTURE.md](docs/ARCHITECTURE.md#backend-api) |
| Ver schema de BD | [ARCHITECTURE.md](docs/ARCHITECTURE.md#base-de-datos) |
| Agregar nueva feature | [DEVELOPMENT.md](docs/DEVELOPMENT.md#pull-requests) |
| Solucionar error de Docker | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#setup-inicial) |
| Solucionar error de BD | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#database) |
| Solucionar error de JWT | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#backend) |
| Ver qué se implementó | [FEATURES.md](docs/FEATURES.md) |
| Ver qué falta por implementar | [FEATURES.md](docs/FEATURES.md#pendientes) |
| Ver cambios recientes | [CHANGELOG.md](docs/CHANGELOG.md) |

---

## 📊 Antes vs Después

### Antes (62 archivos dispersos)

```
❌ Documentación confusa
❌ Duplicados y redundante
❌ Difícil de encontrar información
❌ Múltiples archivos para el mismo tema
❌ No se sabe por dónde empezar
❌ Cambios dispersos en muchos archivos
❌ Estructura desorganizada
```

**Ejemplo de archivos confusos**:
- `DEPLOYMENT-CHECKLIST.md`
- `DEPLOYMENT-GIT.md`
- `DEPLOYMENT-GUIDE.md`
- `DEPLOYMENT-QUICK.md`
- `DEPLOYMENT-README.md`
- `DEPLOYMENT-RESUMEN.md`
- `DEPLOYMENT-UTILS.md`
- `PLESK-QUICK-START.md`
- ... y 54 más archivos

### Después (7 archivos simples + archive)

```
✅ Documentación clara y simple
✅ Cada archivo tiene un propósito específico
✅ Fácil de encontrar información
✅ Sin duplicados
✅ Punto de entrada claro (README.md)
✅ Búsqueda rápida por rol y tarea
✅ Historial archivado (docs/archive/)
✅ Todo relevante en 7 archivos principales
```

**Ejemplo de estructura simple**:
```
docs/
├── README.md              # Índice principal
├── DEPLOYMENT.md          # Todo sobre deployment
├── DEVELOPMENT.md          # Guía de desarrollo
├── ARCHITECTURE.md        # Arquitectura técnica
├── FEATURES.md             # Funcionalidades
├── TROUBLESHOOTING.md     # Solución de problemas
├── CHANGELOG.md            # Historial de cambios
└── archive/               # 61 archivos antiguos
```

---

## 🚀 Workflow Recomendado

### Nuevo en el Proyecto

1. Lee **[docs/README.md](docs/README.md)** (5 min)
2. Ejecuta setup en **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#setup-inicial)** (10 min)
3. Explora **[docs/FEATURES.md](docs/FEATURES.md)** (10 min)
4. Listo para desarrollar!

### Hacer Cambios

1. Desarrolla feature
2. Lee **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** para conveniones
3. Commit y push
4. Deployment automático a main ✅

### Tener Problemas

1. Busca en **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**
2. Si no encuentras solución, crear issue en GitHub
3. Incluye logs y pasos para reproducir

### Deployar en Producción

1. Configura secrets en GitHub (ver **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**)
2. Haz push a main
3. Deployment automático se activa ✅
4. Verifica en el VPS

---

## 💡 Tips

✅ **Empezar siempre con docs/README.md** - Es el índice principal  
✅ **Usar tabla de búsqueda rápida** - Encuentra lo que necesitas rápido  
✅ **Lee solo lo que necesitas** - Por rol y tarea específica  
✅ **Ver docs/archive/ solo si es necesario** - Historial, decisiones antiguas  
✅ **Documentar tus cambios** - Actualiza FEATURES.md y CHANGELOG.md  
✅ **Usar TROUBLESHOOTING.md primero** - Antes de crear issue  
✅ **La documentación está viva** - Mantenla actualizada con tus cambios  

---

## 📞 Necesitas Ayuda?

### Por Tipo de Ayuda

**Setup inicial**:
- [docs/README.md](docs/README.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#setup-inicial)

**Problema específico**:
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

**Deployment**:
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

**Entender arquitectura**:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

**Ver funcionalidades**:
- [docs/FEATURES.md](docs/FEATURES.md)

### Si nada funciona:

1. Revisa [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Revisa logs del backend/frontend
3. Crea issue en GitHub con toda la información:
   - Descripción del problema
   - Pasos para reproducir
   - Logs completos
   - Entorno (OS, Node.js, etc.)

---

## 📚 Resumen

**Antes**: 62 archivos dispersos y confusos  
**Después**: 7 archivos simples + archive/ (61 archivados)

**Mejoras**:
- ✅ Simplificación completa
- ✅ Organización clara
- ✅ Sin duplicados
- ✅ Fácil de encontrar información
- ✅ Histórico preservado
- ✅ Búsqueda rápida por rol
- ✅ Flujo de trabajo claro

**Principio**: Un lugar para cada tipo de documentación

---

**Última actualización**: 27/12/2025  
**Versión**: 2.0.0  
**Estado**: ✅ Reorganizado, simplificado y listo para usar

---

_Documentación simplificada por el equipo de desarrollo_
