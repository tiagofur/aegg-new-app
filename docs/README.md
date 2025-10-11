# 📚 Documentación - Sistema de Gestión de Trabajos Contables V2

**Versión:** 1.1.0  
**Fecha:** Octubre 2025  
**Estado:** ✅ Producción

---

## 🎯 Inicio Rápido (5 minutos)

¿Nuevo en el proyecto? Empieza aquí:

```bash
# 1. Clonar repositorio
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app

# 2. Iniciar servicios
docker-compose up -d

# 3. Abrir navegador
# http://localhost:5173
```

📖 **Guía completa:** [`guias/INICIO-RAPIDO.md`](./guias/INICIO-RAPIDO.md)

---

## 📂 Estructura de Documentación

### 📘 Guías de Uso

Para empezar a usar el sistema:

- **[INICIO-RAPIDO.md](./guias/INICIO-RAPIDO.md)** - Setup y primera ejecución (10 min)
- **[COMANDOS-RAPIDOS.md](./guias/COMANDOS-RAPIDOS.md)** - Comandos Docker, Git, PostgreSQL
- **[GIT-WORKFLOW.md](./guias/GIT-WORKFLOW.md)** - Cómo hacer commits y push

### 🔧 Documentación Técnica

Para desarrolladores y arquitectura:

- **[BACKEND-API.md](./tecnica/BACKEND-API.md)** - Referencia completa de endpoints (20+ endpoints)
- **[SCHEMA-BASE-DATOS.md](./tecnica/SCHEMA-BASE-DATOS.md)** - Estructura de PostgreSQL (6 tablas)
- **[PLAN-SISTEMA-TRABAJOS-V2.md](./tecnica/PLAN-SISTEMA-TRABAJOS-V2.md)** - Arquitectura completa del sistema

### 💻 Desarrollo

Para contribuir y desarrollar:

- **[FUNCIONALIDADES.md](./desarrollo/FUNCIONALIDADES.md)** - Features implementadas y pendientes
- **[HISTORIAL-FASES.md](./desarrollo/HISTORIAL-FASES.md)** - Historia completa (Fase 1-10)
- **[TROUBLESHOOTING.md](./desarrollo/TROUBLESHOOTING.md)** - Solución de problemas comunes

### 🛠️ Soluciones

Fixes y mejoras implementadas:

- **[FIXES-Y-MEJORAS.md](./soluciones/FIXES-Y-MEJORAS.md)** - Todos los bugs corregidos y optimizaciones

---

## ✨ ¿Qué hace el sistema?

Sistema profesional para gestión de trabajos contables con:

✅ **Autenticación JWT** - Login seguro  
✅ **Gestión de Trabajos** - CRUD completo de proyectos contables  
✅ **Gestión de Meses** - 12 meses automáticos por trabajo  
✅ **Importación Excel** - 3 tipos de reportes por mes  
✅ **Consolidación Automática** - Cálculos en tiempo real  
✅ **Reporte Base Anual** - 3 hojas con datos consolidados  
✅ **Nueva UX** - Selector horizontal, vista enfocada

**📊 Ver detalles:** [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md)

---

## 🏗️ Stack Tecnológico

### Backend

- **NestJS** 10.3.0 - Framework Node.js
- **TypeORM** 0.3.20 - ORM para PostgreSQL
- **PostgreSQL** 15 - Base de datos
- **JWT** - Autenticación
- **XLSX** 0.18.5 - Parser de Excel

### Frontend

- **React** 18 - Librería UI
- **TypeScript** - Type safety
- **Vite** 5.4 - Build tool
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Iconos

### DevOps

- **Docker Compose** - Orquestación de servicios
- Hot reload en desarrollo

---

## 🚀 Comandos Principales

```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Reinicio completo (borra datos)
docker-compose down -v && docker-compose up -d
```

**📖 Más comandos:** [`guias/COMANDOS-RAPIDOS.md`](./guias/COMANDOS-RAPIDOS.md)

---

## 📋 Guía de Lectura por Rol

### 👨‍💼 Usuario Final

1. Lee [`guias/INICIO-RAPIDO.md`](./guias/INICIO-RAPIDO.md) para levantar el sistema
2. Explora [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md) para ver qué puedes hacer
3. Consulta [`desarrollo/TROUBLESHOOTING.md`](./desarrollo/TROUBLESHOOTING.md) si algo no funciona

### 👨‍💻 Desarrollador Nuevo

**Primer día:**

1. [`guias/INICIO-RAPIDO.md`](./guias/INICIO-RAPIDO.md) - Setup del proyecto
2. [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md) - Qué hace el sistema
3. [`tecnica/BACKEND-API.md`](./tecnica/BACKEND-API.md) - Explora los endpoints

**Primera semana:**

1. [`tecnica/PLAN-SISTEMA-TRABAJOS-V2.md`](./tecnica/PLAN-SISTEMA-TRABAJOS-V2.md) - Arquitectura completa
2. [`desarrollo/HISTORIAL-FASES.md`](./desarrollo/HISTORIAL-FASES.md) - Evolución del proyecto
3. [`guias/GIT-WORKFLOW.md`](./guias/GIT-WORKFLOW.md) - Workflow de commits

### 🏗️ Arquitecto/Tech Lead

1. [`tecnica/PLAN-SISTEMA-TRABAJOS-V2.md`](./tecnica/PLAN-SISTEMA-TRABAJOS-V2.md) - Arquitectura y decisiones
2. [`tecnica/SCHEMA-BASE-DATOS.md`](./tecnica/SCHEMA-BASE-DATOS.md) - Modelo de datos
3. [`desarrollo/HISTORIAL-FASES.md`](./desarrollo/HISTORIAL-FASES.md) - Historia técnica
4. [`soluciones/FIXES-Y-MEJORAS.md`](./soluciones/FIXES-Y-MEJORAS.md) - Lecciones aprendidas

---

## 🔍 Buscar Información Rápida

| Necesito...             | Ver documento...                                                               |
| ----------------------- | ------------------------------------------------------------------------------ |
| Levantar el proyecto    | [`guias/INICIO-RAPIDO.md`](./guias/INICIO-RAPIDO.md)                           |
| Ver un endpoint         | [`tecnica/BACKEND-API.md`](./tecnica/BACKEND-API.md)                           |
| Entender una feature    | [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md)             |
| Saber qué falta         | [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md) (Pendiente) |
| Hacer un commit         | [`guias/GIT-WORKFLOW.md`](./guias/GIT-WORKFLOW.md)                             |
| Solucionar error        | [`desarrollo/TROUBLESHOOTING.md`](./desarrollo/TROUBLESHOOTING.md)             |
| Ver arquitectura DB     | [`tecnica/SCHEMA-BASE-DATOS.md`](./tecnica/SCHEMA-BASE-DATOS.md)               |
| Ver historial           | [`desarrollo/HISTORIAL-FASES.md`](./desarrollo/HISTORIAL-FASES.md)             |
| Ver fixes implementados | [`soluciones/FIXES-Y-MEJORAS.md`](./soluciones/FIXES-Y-MEJORAS.md)             |

---

## 📊 Estado del Proyecto

### ✅ Completado (Fase 1-10)

- Autenticación JWT
- CRUD completo de trabajos
- Gestión avanzada de meses (crear, editar, eliminar, reabrir)
- Importación de 3 tipos de reportes Excel
- Consolidación automática con cálculos reales
- Reporte base anual con 3 hojas
- Visualización completa de reportes
- Nueva UX con selector horizontal
- Creación automática de 12 meses
- Vista enfocada por mes

### ⏳ Pendiente (Fase 11+)

- Importación desde nueva UI
- Edición de celdas en reportes
- Exportación a Excel/PDF
- Gráficas y análisis
- Navegación con teclado
- Colaboración entre usuarios

**📊 Ver lista completa:** [`desarrollo/FUNCIONALIDADES.md`](./desarrollo/FUNCIONALIDADES.md)

---

## 🎓 Contribuir al Proyecto

### Workflow Recomendado

1. **Pull del main:**

   ```bash
   git pull origin main
   ```

2. **Trabajar en features:**

   - Hacer commit después de cada funcionalidad completada
   - Mensajes descriptivos: `feat: agregar X`, `fix: corregir Y`

3. **Push al final del día:**
   ```bash
   git push origin main
   ```

**📖 Guía completa:** [`guias/GIT-WORKFLOW.md`](./guias/GIT-WORKFLOW.md)

---

## 🐛 Reportar Bugs

Si encuentras un problema:

1. **Verifica primero:** [`desarrollo/TROUBLESHOOTING.md`](./desarrollo/TROUBLESHOOTING.md)
2. **Incluye:**
   - Descripción clara del problema
   - Pasos para reproducir
   - Mensaje de error completo
   - Logs del backend/frontend
3. **Crea issue en GitHub** con toda la información

---

## 📈 Versiones

### v1.1.0 (Actual) - Octubre 2025

- ✨ Nueva UX con selector horizontal
- ✨ Creación automática de 12 meses
- ✨ Vista enfocada por mes
- 🔧 Múltiples optimizaciones

### v1.0.0 - Octubre 2025

- 🎉 Release inicial
- ✅ Fases 1-9 completadas

**📋 Historial completo:** [`desarrollo/HISTORIAL-FASES.md`](./desarrollo/HISTORIAL-FASES.md)

---

## 🔗 Enlaces Útiles

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **Repositorio:** https://github.com/tiagofur/aegg-new-app

---

## 💡 Tips

✅ **No leer todo de una vez** - Usa este índice según necesidad  
✅ **FUNCIONALIDADES.md es tu mapa** - Consulta frecuentemente  
✅ **HISTORIAL-FASES.md es referencia** - No modificar, solo consultar  
✅ **Commitea frecuente** - Sigue GIT-WORKFLOW.md  
✅ **Documenta tus cambios** - Actualiza FUNCIONALIDADES.md si agregas features

---

## 📞 Soporte

- **Issues en GitHub:** Para bugs y features
- **TROUBLESHOOTING.md:** Para problemas comunes
- **Equipo de desarrollo:** Para consultas técnicas

---

## 📄 Licencia

Este proyecto es privado y está bajo desarrollo activo.

---

**Última actualización:** Octubre 2025  
**Versión:** 1.1.0  
**Total de documentos:** 10 archivos principales  
**Estado:** ✅ Organizado y actualizado

---

_Documentación generada y mantenida por el equipo de desarrollo_
