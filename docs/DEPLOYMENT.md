# 🚀 Deployment - Guía Completa

**Última actualización**: 27/12/2025

## 📋 Índice

1. [🖥️ Deployment Local](#deployment-local)
2. [☁️ Deployment en Producción (VPS)](#deployment-en-producción-vps)
3. [🤖 Deployment Automático con GitHub Actions](#deployment-automático-con-github-actions)
4. [🛠️ Solución de Problemas](#solución-de-problemas)

---

## 🖥️ Deployment Local

### Requisitos
- Node.js 18+
- Docker & Docker Compose
- Git

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app

# 2. Configurar .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Iniciar servicios
docker-compose up -d

# 4. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 5. Iniciar desarrollo
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### URLs Locales
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5440
- pgAdmin: http://localhost:8080

---

## ☁️ Deployment en Producción (VPS)

### Arquitectura

```
┌─────────────────┐
│   VPS         │
│ 74.208.234.244│
├─────────────────┤
│ Backend API    │ → https://aegg-api.creapolis.mx
│ NestJS + PM2  │
├─────────────────┤
│ Frontend       │ → https://aegg.creapolis.mx
│ React + Nginx  │
├─────────────────┤
│ PostgreSQL     │ → Docker container
│ port: 5440     │
└─────────────────┘
```

### Rutas en el Servidor

```bash
/var/www/vhosts/creapolis.mx/aegg-api/
├── backend/
│   ├── dist/              # Código compilado
│   ├── node_modules/      # Dependencias
│   ├── package.json
│   ├── .env             # Variables de entorno
│   └── logs/            # Logs de PM2
└── ecosystem.config.js   # Configuración PM2

/var/www/vhosts/creapolis.mx/aegg/httpdocs/
└── (todo el frontend compilado)
```

### Deployment Manual

#### Paso 1: Build Local

```bash
# Backend
cd backend
npm ci --production
npm run build

# Frontend
cd ../frontend
npm ci
npm run build
```

#### Paso 2: Crear Paquete

```bash
mkdir -p deployment-package

# Copiar backend
cp -r backend/dist deployment-package/backend-dist
cp -r backend/node_modules deployment-package/backend-node_modules
cp backend/package.json deployment-package/
cp backend/.env.production deployment-package/.env
cp ecosystem.config.js deployment-package/

# Copiar frontend
cp -r frontend/dist/* deployment-package/frontend-dist/
```

#### Paso 3: Subir al Servidor

```bash
# SCP
scp -r deployment-package/ root@74.208.234.244:/tmp/

# O rsync
rsync -avz --delete deployment-package/ root@74.208.234.244:/tmp/deployment-package/
```

#### Paso 4: Deploy en Servidor

```bash
ssh root@74.208.234.244

# Variables
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"
TEMP_DIR="/tmp/deployment-package"

# Desplegar Backend
rm -rf $BACKEND_DIR/backend/dist
rm -rf $BACKEND_DIR/backend/node_modules
cp -r $TEMP_DIR/backend-dist $BACKEND_DIR/backend/dist
cp -r $TEMP_DIR/backend-node_modules $BACKEND_DIR/backend/node_modules
cp $TEMP_DIR/package.json $BACKEND_DIR/backend/
cp $TEMP_DIR/.env $BACKEND_DIR/backend/
cp $TEMP_DIR/ecosystem.config.js $BACKEND_DIR/

# Desplegar Frontend
rm -rf $FRONTEND_DIR/*
cp -r $TEMP_DIR/frontend-dist/* $FRONTEND_DIR/

# Configurar permisos
chown -R www-data:www-data $BACKEND_DIR
chown -R www-data:www-data $FRONTEND_DIR
chmod -R 755 $BACKEND_DIR
chmod -R 755 $FRONTEND_DIR

# Ejecutar migraciones
cd $BACKEND_DIR/backend
npm run migration:run || echo "No se ejecutaron migraciones"

# Reiniciar PM2
cd $BACKEND_DIR
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save
```

---

## 🤖 Deployment Automático con GitHub Actions

### Configuración Inicial

#### 1. Crear Secrets en GitHub

Ve a: `Repository Settings > Secrets and variables > Actions`

**Secrets Requeridos (10):**

```
# VPS/SSH
VPS_HOST         = 74.208.234.244
VPS_USER         = root
VPS_PORT         = 22
VPS_SSH_KEY      = (llave privada SSH completa)

# Base de Datos
DB_HOST          = localhost:5440
DB_PORT          = 5432
DB_USER          = postgres
DB_PASSWORD      = tu-password
DB_NAME          = appdb

# JWT
JWT_SECRET       = (mínimo 32 caracteres, generar con: openssl rand -base64 48)
```

#### 2. Verificar Servidor

```bash
ssh root@74.208.234.244

# Crear directorios
mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/{backend,logs}
mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Configurar permisos
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Verificar PM2
pm2 --version
# Si no está:
npm install -g pm2

# Verificar PostgreSQL
docker ps | grep postgres
docker exec aegg-postgres pg_isready -U postgres -d appdb
```

### Activar Deployment

#### Opción A: Automático (recomendado)

```bash
# Hacer push a main
git checkout main
git pull
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# ✅ Deployment automático se activa
```

#### Opción B: Manual desde GitHub

1. Ve a `Actions` tab
2. Selecciona `🚀 Deploy to Production (VPS)`
3. Clic en `Run workflow`
4. Selecciona rama `main`
5. Clic en `Run workflow`

### Flujo del Workflow

```
1. ✅ Checkout del código
2. ✅ Setup Node.js 20
3. ✅ Build backend (NestJS)
4. ✅ Build frontend (React + Vite)
5. ✅ Ejecutar tests
6. ✅ Crear paquete de deployment
7. ✅ Crear .env de producción
8. ✅ Subir a VPS (SCP)
9. ✅ Desplegar archivos
10. ✅ Ejecutar migraciones
11. ✅ Reiniciar PM2
12. ✅ Verificar estado
```

### Verificar Deployment

#### En GitHub Actions
```
Repository > Actions > Ver workflow > Ver pasos
```

#### En el Servidor

```bash
# Verificar PM2 status
pm2 status

# Ver logs
pm2 logs aegg-backend --lines 50

# Ver logs en archivos
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-error.log
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-out.log

# PM2 Dashboard
pm2 monit
```

---

## 🛠️ Solución de Problemas

### Error: "Permission denied"

```bash
# Corregir permisos
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs
```

### Error: "No such file or directory"

```bash
# Crear directorios manualmente
mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/{backend,logs}
mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs
```

### Error: "Database connection failed"

```bash
# Verificar PostgreSQL
docker ps | grep postgres
docker exec aegg-postgres pg_isready -U postgres -d appdb

# Verificar .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# Revisar logs
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-error.log
```

### Error: "PM2 command not found"

```bash
# Instalar PM2
npm install -g pm2
pm2 startup
pm2 save
```

### Error: "Port already in use"

```bash
# Ver qué usa el puerto
lsof -i :3000

# Matar proceso
pm2 stop aegg-backend
# O
fuser -k 3000/tcp
```

### Las migraciones no se ejecutan

```bash
# Ejecutar manualmente
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
npm run migration:run

# Verificar estado de migraciones
npm run migration:show
```

---

## 📊 Scripts Útiles

### Build y Deploy Local

```bash
# Script completo
#!/bin/bash

set -e

echo "🚀 Iniciando deployment..."

# Build Backend
echo "📦 Building backend..."
cd backend
npm ci --production
npm run build

# Build Frontend
echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

# Crear paquete
echo "📦 Creating deployment package..."
cd ..
mkdir -p deployment-package
cp -r backend/dist deployment-package/backend-dist
cp -r backend/node_modules deployment-package/backend-node_modules
cp backend/package.json deployment-package/
cp backend/.env.production deployment-package/.env
cp ecosystem.config.js deployment-package/
cp -r frontend/dist/* deployment-package/frontend-dist/

echo "✅ Deployment package creado en deployment-package/"
echo "📤 Sube al servidor: scp -r deployment-package/ root@74.208.234.244:/tmp/"
```

### Ver Logs en Tiempo Real

```bash
# Backend (PM2)
pm2 logs aegg-backend

# Backend (archivos)
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-error.log
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-out.log

# PostgreSQL
docker logs -f aegg-postgres
```

### Reiniciar Servicios

```bash
# Reiniciar PM2
pm2 reload aegg-backend
pm2 restart aegg-backend

# Reiniciar PostgreSQL
docker restart aegg-postgres

# Reiniciar todo
pm2 restart aegg-backend
docker restart aegg-postgres
docker restart aegg-pgadmin
```

---

## 🔐 Seguridad

### Configuración Recomendada

1. **HTTPS obligatorio** en producción
2. **Rate limiting** activo (100 req/60s)
3. **Helmet headers** configurados
4. **Sanitización de input** disponible
5. **JWT_SECRET** con mínimo 32 caracteres
6. **CORS** restringido a orígenes específicos

### Rotar Credenciales

```bash
# Generar nuevo JWT_SECRET cada 6 meses
openssl rand -base64 48

# Rotar contraseñas de BD cada 3 meses
# Actualizar en GitHub secrets
```

---

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [NestJS Production Guide](https://docs.nestjs.com/faq/production)
- [TypeORM Migrations](https://typeorm.io/#/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Última actualización**: 27/12/2025
**Estado**: ✅ Configurado y funcional
