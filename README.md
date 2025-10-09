# 📊 Sistema de Gestión de Trabajos Contables V2

Sistema fullstack completo para importar, procesar, consolidar y visualizar reportes contables desde archivos Excel. Construido con NestJS, React, TypeScript y PostgreSQL.

> **🎉 Versión 1.1.0 - Nueva UX Implementada** ([Ver Release Notes](./docs/implementations/RELEASE-NOTES-V1.1.0.md))

## ✨ Características Principales

### ✅ **Implementado (Fases 1-10)**

- 🔐 **Autenticación JWT** - Login/registro seguro con bcrypt
- 📁 **Gestión de Trabajos** - CRUD completo (crear, editar, eliminar)
- 📅 **Gestión de Meses** - Automática: 12 meses pre-creados al crear trabajo
- 📄 **Reportes Mensuales** - 3 tipos automáticos por mes (Ingresos, Auxiliar, MI Admin)
- 📤 **Importación Excel** - Soporte multi-hoja con validaciones
- 🎨 **Nueva UX (Fase 10)** - Selector horizontal de meses con pills visuales
- 🎯 **Vista Enfocada** - Un mes a la vez, sin scroll innecesario
- 💾 **Almacenamiento JSONB** - Flexible y escalable en PostgreSQL
- 🔄 **Consolidación Automática** - Cálculos reales + estimación IVA
- 📊 **Reporte Base Anual** - 3 hojas consolidadas (Resumen, Ingresos, Comparativas)
- 👁️ **Visualización Completa** - Tabs, tablas responsive, contadores
- ✏️ **Edición de Trabajos** - Modificar cliente, RFC, estado
- 🔄 **Reabrir Meses** - Correcciones en meses completados
- 🗑️ **Eliminación Segura** - Confirmación doble para meses y proyectos
- 📈 **Progreso Visual** - Estados claros: ○ Pendiente, ⏳ En proceso, ✓ Completado

### 🚧 **Próximamente (Fase 11+)**

- 📥 Importación de reportes mensuales desde la nueva UI
- ✏️ Edición de celdas individuales
- 📥 Exportación a Excel/PDF
- 📈 Gráficas y análisis avanzado
- 👥 Colaboración entre usuarios
- 🔍 Búsqueda y filtros avanzados
- ⌨️ Navegación con teclado (← → entre meses)
- 🎬 Animaciones y transiciones suaves

## 🏗️ Stack Tecnológico

### **Backend**

- NestJS 10.3.0
- TypeORM 0.3.20
- PostgreSQL 15
- JWT Authentication
- XLSX 0.18.5
- Bcrypt
- Class-validator

### **Frontend**

- React 18
- TypeScript
- Vite 5.4.20
- React Router DOM
- Axios + React Query
- Tailwind CSS
- Lucide React Icons
- React Modal

### **DevOps**

- Docker Compose
- PostgreSQL Alpine
- Hot reload en desarrollo

## 🚀 Inicio Rápido (5 minutos)

### **Requisitos Previos**

- Docker Desktop instalado y corriendo
- Git

### **1. Clonar y Levantar**

```bash
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app
docker-compose up -d
```

### **2. Verificar**

```bash
docker-compose ps
```

Deberías ver 3 containers corriendo:

- `nestjs_backend` - Puerto 3001
- `postgres_db` - Puerto 5432
- `react_frontend` - Puerto 5173

### **3. Acceder**

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3001
```

### **4. Crear Usuario**

1. Ir a http://localhost:5173
2. Click "Registrarse"
3. Completar formulario
4. ¡Listo para usar!

## 📁 Estructura del Proyecto

```
new-app/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Autenticación JWT
│   │   ├── trabajos/          # Trabajos y Reportes
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── excel-parser.service.ts    # Parser Excel
│   │   │   │   ├── reporte.service.ts         # Lógica reportes
│   │   │   │   └── formula.service.ts         # Cálculos
│   │   │   └── entities/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx           # Drag & Drop
│   │   │   └── ImportExcel.tsx          # Importación
│   │   ├── pages/
│   │   │   ├── Trabajos.tsx             # Lista trabajos
│   │   │   ├── TrabajoDetail.tsx        # Detalle + Import
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/
│   │   │   └── api.ts                   # APIs
│   │   └── App.tsx
│   └── package.json
├── docs/                       # Documentación detallada
│   ├── FASE-1-IMPORTACION-COMPLETADA.md
│   ├── FASE-2-VISUALIZACION-COMPLETADA.md
│   ├── FASE-3-FRONTEND-IMPORTACION-COMPLETADA.md
│   ├── GUIA-PRUEBAS-FASE-3.md
│   └── RESUMEN-FASE-3.md
├── docker-compose.yml
├── ESTADO-ACTUAL-DEL-PROYECTO.md    # Estado detallado
├── INICIO-RAPIDO.md                 # Guía rápida
├── PROXIMA-TAREA.md                 # Siguiente fase
└── README.md                        # Este archivo
```

## 🎯 Flujo de Uso Completo

### **1. Crear Trabajo**

```
Dashboard → Mis Trabajos → Nuevo Trabajo
Complete: Nombre, Cliente, RFC, Año
→ Se crea automáticamente el Reporte Base Anual
```

### **2. Agregar Mes**

```
Detalle del Trabajo → Agregar Mes → Seleccionar mes (1-12)
→ Se crean automáticamente 3 reportes mensuales:
  - Ingresos
  - Ingresos Auxiliar
  - Ingresos Mi Admin
```

### **3. Importar Reportes del Mes**

```
Expandir Mes → Importar en cada reporte → Upload Excel
Validaciones:
- ✅ Máximo 10MB
- ✅ Solo .xlsx y .xls
- ✅ Formato válido
```

### **4. Procesar y Guardar Mes**

```
Cuando los 3 reportes estén importados:
→ Click "Procesar y Guardar Mes"
→ Backend consolida datos reales
→ Actualiza Reporte Base Anual (3 hojas)
→ Mes marcado como COMPLETADO
```

### **5. Ver Reporte Base Consolidado**

```
Click "Ver Reporte" en Reporte Base Anual
→ Navegación por tabs (3 hojas)
→ Tabla con datos consolidados
→ Comparativa mes vs mes
```

## 📡 API Endpoints

Ver documentación completa en [`docs/BACKEND-API.md`](./docs/BACKEND-API.md)

### **Principales Endpoints:**

```
# Autenticación
POST   /auth/register
POST   /auth/login

# Trabajos
GET    /trabajos
POST   /trabajos
PATCH  /trabajos/:id
DELETE /trabajos/:id

# Meses
POST   /trabajos/:trabajoId/meses
POST   /meses/:id/procesar
POST   /meses/:id/reabrir
DELETE /meses/:id

# Reportes Mensuales
POST   /trabajos/:trabajoId/reportes/:id/importar
GET    /trabajos/:trabajoId/reportes/:id/datos

# Reporte Base Anual
POST   /trabajos/:id/reporte-base/importar
GET    /trabajos/:id/reporte-base
```

## 🔧 Comandos Útiles

### **Docker**

```bash
# Iniciar todo
docker-compose up -d

# Detener todo
docker-compose down

# Reiniciar servicio específico
docker-compose restart backend
docker-compose restart frontend

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruir
docker-compose up -d --build

# Limpiar todo (⚠️ borra DB)
docker-compose down -v
```

### **Base de Datos**

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d nestjs_app

# Queries útiles
\dt                          # Listar tablas
SELECT * FROM trabajos;      # Ver trabajos
SELECT * FROM reportes;      # Ver reportes
\q                           # Salir
```

## 📚 Documentación

### **🎯 Empezar Aquí:**

- 📋 [`docs/INDICE.md`](./docs/INDICE.md) - **Índice completo de documentación**
- 📖 [`docs/FUNCIONALIDADES.md`](./docs/FUNCIONALIDADES.md) - Lista de todas las features
- ⚡ [`docs/INICIO-RAPIDO.md`](./docs/INICIO-RAPIDO.md) - Setup en 5 minutos
- 🔌 [`docs/BACKEND-API.md`](./docs/BACKEND-API.md) - Referencia de API

### **Para Desarrolladores:**

- 🏗️ [`docs/PLAN-SISTEMA-TRABAJOS-V2.md`](./docs/PLAN-SISTEMA-TRABAJOS-V2.md) - Arquitectura completa
- � [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) - Guía de commits
- 🐛 [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) - Solución de problemas
- 🔧 [`docs/soluctions/COMANDOS-RAPIDOS.md`](./docs/soluctions/COMANDOS-RAPIDOS.md) - Comandos útiles

### **Historial de Implementaciones:**

- [`docs/implementations/`](./docs/implementations/) - Documentación de Fases 1-9

## 🐛 Troubleshooting

### **Backend no inicia**

```bash
docker-compose logs backend --tail 50
docker-compose restart backend
```

### **Frontend muestra pantalla en blanco**

```bash
docker-compose logs frontend --tail 50
docker-compose restart frontend
```

### **Puerto ocupado**

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Cambiar puerto en docker-compose.yml si es necesario
```

### **Empezar de cero**

```bash
docker-compose down -v
docker-compose up -d --build
```

## 🎯 Roadmap

### **✅ Fases 1-9: COMPLETADO**

- [x] Backend de importación y procesamiento
- [x] Parser Excel multi-hoja
- [x] Endpoints API completos (16+)
- [x] Frontend completo de importación
- [x] Gestión de trabajos (CRUD + editar + eliminar)
- [x] Gestión de meses (crear, eliminar, reabrir, procesar)
- [x] Consolidación automática con cálculos reales
- [x] Reporte base anual con 3 hojas
- [x] Visualización completa de reportes
- [x] UI/UX profesional y responsive

### **📋 Fase 10+: Futuro**

- [ ] Edición de celdas individuales
- [ ] Exportación a Excel/PDF
- [ ] Gráficas y análisis (Chart.js)
- [ ] Colaboración y comentarios
- [ ] Sistema de roles y permisos
- [ ] Búsqueda y filtros avanzados
- [ ] Dark mode y personalización

## 👥 Equipo

**Desarrollado por:** [Tu Nombre]  
**Repositorio:** https://github.com/tiagofur/aegg-new-app

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🙏 Agradecimientos

Construido con:

- [NestJS](https://nestjs.com/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [TypeORM](https://typeorm.io/)

---

**Estado actual:** ✅ Fases 1-9 completadas - Sistema completamente funcional  
**Siguiente paso:** 🎯 Fase 10+ según necesidad del proyecto  
**Última actualización:** Octubre 2025  
**Versión:** 1.9.0
