# Scripts de Desarrollo

## 🚀 Scripts Principales

### Inicialización

- **`setup.ps1`** - Configura el entorno de desarrollo por primera vez
- **`start.ps1`** - Inicia todos los servicios (backend + frontend + base de datos)

### Base de Datos

- **`start-database.ps1`** - Inicia solo PostgreSQL en Docker
- **`start-backend-with-db.ps1`** - Inicia backend con la base de datos

### Backend

- **`start-backend.ps1`** - Inicia el servidor backend (NestJS) en modo desarrollo

### Frontend

- **`start-frontend.ps1`** - Inicia el servidor frontend (React + Vite) en modo desarrollo

### Detener Servicios

- **`stop.ps1`** - Detiene todos los servicios

## 📦 Scripts de Deployment

Ubicación: `scripts/deployment/`

- **`configure-docker-env.ps1`** - Configura variables de entorno para Docker
- **`prepare-deployment.ps1`** - Prepara el paquete de deployment para producción (Windows)
- **`prepare-deployment.sh`** - Prepara el paquete de deployment para producción (Linux)
- **`deploy-on-server.sh`** - Script de deployment en el servidor
- **`setup-github-secrets.sh`** - Configura secrets en GitHub Actions

## 💡 Uso

```powershell
# Inicializar entorno por primera vez
.\scripts\setup.ps1

# Iniciar todo (recomendado)
.\scripts\start.ps1

# Iniciar solo base de datos
.\scripts\start-database.ps1

# Iniciar backend y frontend por separado
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1

# Detener todo
.\scripts\stop.ps1
```

## 📝 Notas

- Todos los scripts están diseñados para Windows con PowerShell
- Los scripts `.sh` son para uso en servidores Linux
- Asegúrate de tener Docker Desktop corriendo antes de usar los scripts de base de datos
