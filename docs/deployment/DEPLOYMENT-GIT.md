# 🔄 Deployment con Git - Alternativa Avanzada

## 📋 Ventajas de usar Git para Deployment

✅ **Trazabilidad completa** - Cada deployment está versionado  
✅ **Rollback instantáneo** - `git checkout` a versión anterior  
✅ **Deployment más rápido** - Solo se transfieren cambios (delta)  
✅ **CI/CD friendly** - Fácil integración con pipelines  
✅ **Colaboración** - Múltiples developers pueden deployar

## 🚀 Método 1: Git Pull en Servidor

### Setup Inicial (Una sola vez)

#### 1. En el Servidor (SSH)

```bash
# Conectar al servidor
ssh root@74.208.234.244

# Instalar Git si no está
dnf install -y git

# Configurar Git
git config --global user.name "AEGG Server"
git config --global user.email "server@aegg.com"

# Crear directorios
mkdir -p /var/www/vhosts/creapolis.mx/aegg-api
mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Clonar el repositorio
cd /var/www/vhosts/creapolis.mx/
git clone https://github.com/tiagofur/aegg-new-app.git aegg-source

# O si es privado (con token):
# git clone https://TOKEN@github.com/tiagofur/aegg-new-app.git aegg-source
```

#### 2. Configurar Variables de Entorno

```bash
cd /var/www/vhosts/creapolis.mx/aegg-source

# Crear .env de producción
nano backend/.env

# Pegar configuración:
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=aegg_user
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=aegg_db
JWT_SECRET=TU_JWT_SECRET_AQUI
JWT_EXPIRATION=7d
CORS_ORIGIN=https://aegg.creapolis.mx

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Crear .env para frontend
nano frontend/.env.production
VITE_API_URL=https://aegg-api.creapolis.mx
```

#### 3. Build Inicial

```bash
cd /var/www/vhosts/creapolis.mx/aegg-source

# Backend
cd backend
npm install --production
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# Crear symlinks
ln -s /var/www/vhosts/creapolis.mx/aegg-source/backend /var/www/vhosts/creapolis.mx/aegg-api/backend
ln -s /var/www/vhosts/creapolis.mx/aegg-source/frontend/dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/

# O copiar en lugar de symlink:
cp -r /var/www/vhosts/creapolis.mx/aegg-source/frontend/dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

#### 4. Configurar PM2

```bash
cd /var/www/vhosts/creapolis.mx/aegg-source
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Deployment Subsecuente

#### Opción A: Deployment Manual (SSH)

```bash
# Script: deploy.sh
#!/bin/bash
cd /var/www/vhosts/creapolis.mx/aegg-source

echo "🔄 Pulling latest changes..."
git pull origin mejoras-2025-10-18

echo "📦 Building backend..."
cd backend
npm install --production
npm run build

echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build

echo "📁 Updating frontend files..."
rm -rf /var/www/vhosts/creapolis.mx/aegg/httpdocs/*
cp -r dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/

echo "🔄 Restarting backend..."
pm2 reload aegg-backend

echo "✅ Deployment completed!"
pm2 logs aegg-backend --lines 20
```

Usar:

```bash
ssh root@74.208.234.244 'bash /var/www/vhosts/creapolis.mx/aegg-source/deploy.sh'
```

#### Opción B: Deployment desde Local (PowerShell)

```powershell
# deploy-remote.ps1
$SERVER = "root@74.208.234.244"
$DEPLOY_SCRIPT = "/var/www/vhosts/creapolis.mx/aegg-source/deploy.sh"

Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan

# Push cambios primero
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin mejoras-2025-10-18

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error pushing to GitHub" -ForegroundColor Red
    exit 1
}

# Ejecutar deployment en servidor
Write-Host "🔄 Running deployment on server..." -ForegroundColor Yellow
ssh $SERVER "bash $DEPLOY_SCRIPT"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Frontend: https://aegg.creapolis.mx" -ForegroundColor Cyan
    Write-Host "🌐 Backend: https://aegg-api.creapolis.mx" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
```

---

## 🤖 Método 2: GitHub Actions (CI/CD Automatizado)

### Ventajas

- ✅ Deployment automático al hacer push
- ✅ Tests antes de deploy
- ✅ Notificaciones en errores
- ✅ Zero downtime con PM2 reload

### Setup

#### 1. Crear GitHub Action

Crear archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - mejoras-2025-10-18
  workflow_dispatch: # Permite deployment manual

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/vhosts/creapolis.mx/aegg-source

            # Pull latest
            git pull origin mejoras-2025-10-18

            # Backend
            cd backend
            npm install --production
            npm run build

            # Frontend
            cd ../frontend
            npm install
            npm run build
            rm -rf /var/www/vhosts/creapolis.mx/aegg/httpdocs/*
            cp -r dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/

            # Restart
            pm2 reload aegg-backend

            echo "✅ Deployment completed!"
```

#### 2. Configurar Secrets en GitHub

1. Ir a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agregar secrets:
   - `VPS_HOST`: `74.208.234.244`
   - `VPS_USER`: `root`
   - `VPS_SSH_KEY`: Tu clave SSH privada

#### 3. Generar SSH Key para GitHub Actions

```bash
# En el servidor
ssh-keygen -t rsa -b 4096 -C "github-actions@aegg.com" -f ~/.ssh/github-actions

# Agregar a authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Copiar la clave privada
cat ~/.ssh/github-actions
# Copiar TODO el contenido (incluyendo BEGIN y END)
# Pegar en GitHub Secret VPS_SSH_KEY
```

#### 4. Primer Deployment

```powershell
# En tu máquina local
git add .
git commit -m "Setup GitHub Actions deployment"
git push origin mejoras-2025-10-18

# GitHub automáticamente ejecutará el deployment
# Ver en: https://github.com/tiagofur/aegg-new-app/actions
```

### Deployment Subsecuente

Simplemente:

```powershell
git add .
git commit -m "Tu mensaje de commit"
git push
```

🎉 ¡GitHub Actions se encargará del resto!

---

## 🔄 Método 3: Git Hooks (Post-Receive)

### Ventajas

- ✅ Deployment automático al hacer `git push production`
- ✅ Sin servicios externos
- ✅ Control total

### Setup

#### 1. Crear Repositorio Bare en Servidor

```bash
# SSH al servidor
ssh root@74.208.234.244

# Crear repo bare
mkdir -p /var/repo/aegg.git
cd /var/repo/aegg.git
git init --bare

# Crear directorio de trabajo
mkdir -p /var/www/vhosts/creapolis.mx/aegg-app
```

#### 2. Configurar Post-Receive Hook

```bash
nano /var/repo/aegg.git/hooks/post-receive
```

Contenido:

```bash
#!/bin/bash

WORK_TREE="/var/www/vhosts/creapolis.mx/aegg-app"
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"

echo "🚀 Post-receive hook triggered!"

# Checkout files
git --work-tree=$WORK_TREE --git-dir=/var/repo/aegg.git checkout -f

cd $WORK_TREE

# Backend
echo "📦 Building backend..."
cd backend
npm install --production
npm run build
cp -r dist/* $BACKEND_DIR/backend/dist/

# Frontend
echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build
rm -rf $FRONTEND_DIR/*
cp -r dist/* $FRONTEND_DIR/

# Restart
echo "🔄 Restarting application..."
pm2 reload aegg-backend

echo "✅ Deployment completed!"
pm2 logs aegg-backend --lines 10
```

Hacer ejecutable:

```bash
chmod +x /var/repo/aegg.git/hooks/post-receive
```

#### 3. Agregar Remote en Local

```powershell
# En tu máquina local
git remote add production root@74.208.234.244:/var/repo/aegg.git

# Verificar
git remote -v
```

#### 4. Deployment

```powershell
# Push a producción
git push production mejoras-2025-10-18

# O simplificar:
git push production HEAD:master
```

---

## 🔐 Seguridad con Git

### 1. Nunca commitear .env

Asegurar que `.gitignore` incluya:

```
.env
.env.production
.env.local
*.env
```

### 2. Usar Variables de Entorno del Servidor

Crear `.env` directamente en el servidor, nunca en Git.

### 3. Usar Git Submodules para Configuraciones

```bash
# Si tienes repo privado para configs
git submodule add https://github.com/tu-org/aegg-config.git config

# Actualizar
git submodule update --remote
```

---

## 📊 Comparación de Métodos

| Método              | Dificultad | Velocidad | Automatización | Recomendado Para         |
| ------------------- | ---------- | --------- | -------------- | ------------------------ |
| **Git Pull Manual** | ⭐⭐       | ⭐⭐      | ❌             | Equipos pequeños         |
| **GitHub Actions**  | ⭐⭐⭐     | ⭐⭐⭐    | ✅             | Equipos medianos/grandes |
| **Git Hooks**       | ⭐⭐⭐⭐   | ⭐⭐⭐    | ⚠️ Semi        | Avanzados                |
| **Manual (ZIP)**    | ⭐         | ⭐        | ❌             | Desarrollo inicial       |

---

## 🎯 Recomendación Final

### Para tu caso (AEGG):

1. **Fase 1 (Ahora)**: Usar método manual con ZIP

   - Más rápido para comenzar
   - Menos configuración inicial
   - Seguir `DEPLOYMENT-CHECKLIST.md`

2. **Fase 2 (Después de validar)**: Migrar a Git Pull

   - Setup en 30 minutos
   - Deployments más rápidos
   - Mejor para actualizaciones frecuentes

3. **Fase 3 (Producción estable)**: GitHub Actions
   - CI/CD completo
   - Tests automáticos
   - Deployment con un push

---

## 🔄 Script de Migración a Git

### Si ya deployaste manualmente y quieres migrar a Git:

```bash
#!/bin/bash
# migrate-to-git.sh

echo "🔄 Migrando a deployment con Git..."

CURRENT_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
GIT_DIR="/var/www/vhosts/creapolis.mx/aegg-source"

# Backup actual
echo "💾 Creando backup..."
cp -r $CURRENT_DIR ${CURRENT_DIR}.backup.$(date +%Y%m%d)

# Clonar repo
echo "📦 Clonando repositorio..."
git clone https://github.com/tiagofur/aegg-new-app.git $GIT_DIR

# Copiar .env existente
echo "🔐 Copiando configuración..."
cp $CURRENT_DIR/backend/.env $GIT_DIR/backend/.env

# Build
echo "🔨 Building..."
cd $GIT_DIR/backend
npm install --production
npm run build

cd $GIT_DIR/frontend
npm install
npm run build

# Actualizar PM2
echo "🔄 Actualizando PM2..."
pm2 delete aegg-backend
cd $GIT_DIR
pm2 start ecosystem.config.js
pm2 save

echo "✅ Migración completada!"
echo "Verifica que todo funcione correctamente"
echo "Si hay problemas, restaurar desde: ${CURRENT_DIR}.backup.$(date +%Y%m%d)"
```

---

## 📚 Recursos Adicionales

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [PM2 Deployment Guide](https://pm2.keymetrics.io/docs/usage/deployment/)

---

¿Prefieres empezar con el método manual o ir directo a Git? 🚀
