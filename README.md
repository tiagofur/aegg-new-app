# � Sistema de Gestión de Reportes Contables

Sistema fullstack para importar, gestionar y visualizar reportes contables desde archivos Excel. Construido con NestJS, React, TypeScript y PostgreSQL.

## ✨ Características Principales

### ✅ **Implementado (FASE 1-3)**

- 🔐 **Autenticación JWT** - Login/registro seguro
- 📁 **Gestión de Trabajos** - CRUD completo con duplicación
- 📄 **Gestión de Reportes** - 9 tipos diferentes de reportes
- 📤 **Importación Excel** - Soporte multi-hoja y single-hoja
- 🎨 **UI/UX Profesional** - Tailwind CSS + Lucide Icons
- 💾 **Almacenamiento JSONB** - Flexible y escalable
- ✅ **Validaciones** - Tamaño, formato y estructura
- 🔄 **Drag & Drop** - Upload intuitivo de archivos

### 🚧 **Próximamente (FASE 4+)**

- 📊 Visualización de datos en tablas
- ✏️ Edición de celdas
- 🧮 Recálculo de fórmulas
- 📥 Exportación a Excel/PDF
- 🔍 Búsqueda y filtros avanzados

## 🏗️ Stack Tecnológico

### **Backend**

- NestJS 10
- TypeORM
- PostgreSQL 15
- JWT Authentication
- Multer (file upload)
- XLSX + ExcelJS

### **Frontend**

- React 18
- TypeScript
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React Icons
- Vite

### **DevOps**

- Docker Compose
- Docker Desktop

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

## 🎯 Flujo de Uso

### **1. Crear Trabajo**

```
Dashboard → Mis Trabajos → Nuevo Trabajo
```

### **2. Crear Reporte**

```
Abrir Trabajo → Nuevo Reporte → Seleccionar tipo
```

**Tipos de reportes disponibles:**

- **Mensual** ⭐ (soporta múltiples hojas)
- Balance
- Ingresos
- Gastos
- Flujo de Caja
- Proyecciones
- Comparativo
- Consolidado
- Personalizado

### **3. Importar Excel**

```
Seleccionar Reporte → Drag & Drop Excel → Importar
```

**Validaciones automáticas:**

- ✅ Máximo 10MB
- ✅ Solo .xlsx y .xls
- ✅ Estructura válida

### **4. Ver Resultado**

```
Success message con:
- Nombre del archivo
- Hojas importadas (si multi-hoja)
- Total filas/columnas
```

## 📡 API Endpoints

### **Autenticación**

```
POST   /auth/register              - Registrar usuario
POST   /auth/login                 - Login
```

### **Trabajos**

```
GET    /trabajos                   - Listar trabajos
GET    /trabajos/:id               - Obtener trabajo
POST   /trabajos                   - Crear trabajo
PATCH  /trabajos/:id               - Actualizar trabajo
DELETE /trabajos/:id               - Eliminar trabajo
POST   /trabajos/:id/duplicar      - Duplicar trabajo
```

### **Reportes**

```
GET    /trabajos/:trabajoId/reportes                      - Listar reportes
GET    /trabajos/:trabajoId/reportes/:id                  - Obtener reporte
POST   /trabajos/:trabajoId/reportes                      - Crear reporte
PATCH  /trabajos/:trabajoId/reportes/:id                  - Actualizar reporte
DELETE /trabajos/:trabajoId/reportes/:id                  - Eliminar reporte
POST   /trabajos/:trabajoId/reportes/:id/importar-excel   - Importar Excel
GET    /trabajos/:trabajoId/reportes/:id/datos            - Obtener datos (paginados)
GET    /trabajos/:trabajoId/reportes/:id/hojas            - Listar hojas
GET    /trabajos/:trabajoId/reportes/:id/estadisticas     - Obtener estadísticas
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

## 📚 Documentación Detallada

### **Para Desarrolladores**

- 📖 [`ESTADO-ACTUAL-DEL-PROYECTO.md`](./ESTADO-ACTUAL-DEL-PROYECTO.md) - Estado completo y detallado
- ⚡ [`INICIO-RAPIDO.md`](./INICIO-RAPIDO.md) - Guía de inicio en 5 minutos
- 🎯 [`PROXIMA-TAREA.md`](./PROXIMA-TAREA.md) - FASE 4: Visualización

### **Documentación de Fases**

- 📦 [`FASE-1-IMPORTACION-COMPLETADA.md`](./docs/FASE-1-IMPORTACION-COMPLETADA.md) - Backend import
- 📊 [`FASE-2-VISUALIZACION-COMPLETADA.md`](./docs/FASE-2-VISUALIZACION-COMPLETADA.md) - Backend endpoints
- 🎨 [`FASE-3-FRONTEND-IMPORTACION-COMPLETADA.md`](./docs/FASE-3-FRONTEND-IMPORTACION-COMPLETADA.md) - Frontend completo
- 🧪 [`GUIA-PRUEBAS-FASE-3.md`](./docs/GUIA-PRUEBAS-FASE-3.md) - Testing guide

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

### **✅ FASE 1-3: COMPLETADO**

- [x] Backend de importación
- [x] Endpoints de visualización
- [x] Frontend completo de importación
- [x] UI/UX profesional

### **🚧 FASE 4: En Planificación**

- [ ] Componente DataTable
- [ ] Navegación por hojas
- [ ] Paginación de datos
- [ ] Estadísticas visuales

### **📋 FASE 5: Futuro**

- [ ] Edición de celdas
- [ ] Recálculo de fórmulas
- [ ] Historial de cambios
- [ ] Exportación Excel/PDF

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

**Estado actual:** ✅ FASE 3 completada - Sistema de importación funcional  
**Siguiente paso:** 🎯 FASE 4 - Visualización de datos  
**Última actualización:** 6 de octubre, 2025
