# 🌿 Estrategia de Deployment con Ramas Git

## 📋 Resumen

Estrategia profesional para gestionar deployments con múltiples ramas y ambientes.

## 🌳 Estructura de Ramas Recomendada

```
main (producción estable)
├── production (staging/pre-producción)
└── mejoras-2025-10-18 (desarrollo actual)
    └── feature/* (ramas de características)
```

### Descripción de Ramas

| Rama                    | Ambiente     | Propósito                           | Deploy            |
| ----------------------- | ------------ | ----------------------------------- | ----------------- |
| `main`                  | Producción   | Código estable en producción        | Manual/CI/CD      |
| `production`            | Pre-Prod     | Testing final antes de producción   | Automático/Manual |
| `mejoras-2025-10-18`    | Desarrollo   | Desarrollo activo                   | Manual            |
| `feature/nombre-feature` | Local/Dev    | Nuevas características              | No deploy         |
| `hotfix/nombre-fix`     | Todos        | Fixes urgentes                      | Fast-track        |

---

## 🚀 Flujo de Trabajo Recomendado

### Opción 1: Flujo Simple (Actual - Recomendado para empezar)

```
mejoras-2025-10-18 → production (servidor)
```

**Cuándo usar:** Equipo pequeño, desarrollo activo, deployments frecuentes

**Comandos:**

```powershell
# Desarrollo normal
git add .
git commit -m "Nueva funcionalidad"
git push origin mejoras-2025-10-18

# Deployment
.\deploy-frontend-only.ps1
# O con automatización:
.\deploy-to-production.ps1 -FrontendOnly
```

---

### Opción 2: Flujo con Rama Production (Recomendado cuando estabilices)

```
mejoras-2025-10-18 → production → servidor
```

**Cuándo usar:** Quieres testing antes de producción

**Setup inicial:**

```powershell
# Crear rama production desde tu rama actual
git checkout -b production
git push origin production

# Configurar deployment automático en production
# (Ver sección GitHub Actions más abajo)
```

**Flujo de trabajo:**

```powershell
# 1. Desarrollo en mejoras-2025-10-18
git checkout mejoras-2025-10-18
# ... hacer cambios ...
git add .
git commit -m "Nueva funcionalidad"
git push origin mejoras-2025-10-18

# 2. Cuando esté listo para producción
git checkout production
git merge mejoras-2025-10-18
git push origin production

# 3. GitHub Actions automáticamente deploya
# O deployment manual:
.\deploy-to-production.ps1
```

---

### Opción 3: Flujo Completo con Main (Profesional)

```
feature/nueva-funcionalidad
    ↓ Pull Request
mejoras-2025-10-18
    ↓ Testing local
production
    ↓ Testing en servidor
main (producción estable)
```

**Cuándo usar:** Equipo mediano/grande, múltiples desarrolladores

**Setup:**

```powershell
# Proteger rama main
# GitHub → Settings → Branches → Add rule
# - Branch name: main
# - Require pull request before merging
# - Require status checks to pass

# Crear estructura
git checkout -b production
git push origin production
git checkout -b main
git push origin main
```

**Flujo:**

```powershell
# 1. Nueva característica
git checkout mejoras-2025-10-18
git checkout -b feature/permisos-miembro
# ... desarrollar ...
git add .
git commit -m "feat: Agregar permisos para miembros"
git push origin feature/permisos-miembro

# 2. Pull Request en GitHub
# feature/permisos-miembro → mejoras-2025-10-18

# 3. Después de merge, testing local
git checkout mejoras-2025-10-18
git pull

# 4. Promover a production para testing
git checkout production
git merge mejoras-2025-10-18
git push origin production
# → Automáticamente deploya a servidor de staging

# 5. Si todo OK, promover a main (producción)
git checkout main
git merge production
git push origin main
# → Automáticamente deploya a producción
```

---

## 🤖 Configuración GitHub Actions

### Para Deployment Automático en Push

Crear archivo: `.github/workflows/deploy-on-push.yml`

```yaml
name: Deploy on Push

on:
  push:
    branches:
      - production  # Deploya cuando haces push a production

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/vhosts/creapolis.mx/aegg
            git pull origin production
            cd frontend
            npm ci
            npm run build
            rm -rf /var/www/vhosts/creapolis.mx/aegg/httpdocs/*
            cp -r dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/
            echo "✅ Frontend deployed successfully"

      - name: Notification
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment ${{ job.status }}
            Branch: production
            Commit: ${{ github.sha }}
```

### Configurar Secrets en GitHub

1. Ve a tu repositorio: `https://github.com/tiagofur/aegg-new-app`
2. Settings → Secrets and variables → Actions
3. Agregar secrets:

```
SERVER_HOST = 74.208.234.244
SERVER_USER = root
SSH_PRIVATE_KEY = (tu clave SSH privada)
```

### Para obtener SSH_PRIVATE_KEY:

```bash
# En tu máquina local (PowerShell)
ssh-keygen -t rsa -b 4096 -C "github-actions@aegg" -f ~/.ssh/aegg-deploy

# Copiar clave pública al servidor
type ~/.ssh/aegg-deploy.pub | ssh root@74.208.234.244 "cat >> ~/.ssh/authorized_keys"

# Copiar clave privada para GitHub
type ~/.ssh/aegg-deploy
# Copiar TODO el contenido (incluido BEGIN y END)
# Pegarlo en GitHub Secret: SSH_PRIVATE_KEY
```

---

## 📦 Scripts de Deployment Rápido

### 1. Deploy Frontend Only

```powershell
# deploy-frontend-only.ps1
# Ya creado en la raíz del proyecto

# Uso:
.\deploy-frontend-only.ps1

# Con mensaje personalizado:
.\deploy-frontend-only.ps1 -Message "Fix: Permisos de usuario"

# Sin commit a Git:
.\deploy-frontend-only.ps1 -SkipGit
```

### 2. Deploy Full con Automatización

```powershell
# deploy-to-production.ps1
# Ya creado en la raíz del proyecto

# Uso:
.\deploy-to-production.ps1 -FrontendOnly

# Deploy completo (backend + frontend):
.\deploy-to-production.ps1

# Especificar rama:
.\deploy-to-production.ps1 -Branch "production" -FrontendOnly
```

### 3. Quick Deploy (Frontend)

Crear archivo: `quick-deploy.ps1`

```powershell
# Quick Deploy - Frontend Only
# Sin prompts, para deployments rápidos

param([string]$msg = "Quick update")

Write-Host "🚀 Quick Deploy..." -ForegroundColor Cyan

cd frontend
npm run build
cd ..

git add .
git commit -m "$msg"
git push origin mejoras-2025-10-18

.\deploy-frontend-only.ps1 -SkipGit

Write-Host "✅ Done!" -ForegroundColor Green
```

Uso:

```powershell
.\quick-deploy.ps1 "Fix permisos"
```

---

## 🔄 Workflow Típico (Tu Caso Actual)

### Cambio Simple (Solo Frontend)

```powershell
# 1. Hacer cambios en el código
# frontend/src/pages/ReporteMensualPage.tsx

# 2. Probar localmente
cd frontend
npm run dev

# 3. Deploy cuando esté listo
cd ..
.\deploy-frontend-only.ps1
# → Build automático
# → Commit y push a GitHub
# → Genera paquete ZIP
# → Instrucciones de subida

# 4. Subir ZIP al servidor via Plesk
# O usar WinSCP
```

### Cambio que Afecta Backend

```powershell
# 1. Hacer cambios

# 2. Probar localmente
.\start.ps1

# 3. Deploy completo
.\deploy-to-production.ps1

# Si tienes SSH configurado, deploy automático
# Si no, genera paquete completo manual
```

---

## 🎯 Recomendación Para Tu Proyecto

### Fase Actual (Desarrollo Activo)

✅ **Usa:** Flujo Simple con `mejoras-2025-10-18`

```powershell
# Cada cambio:
.\deploy-frontend-only.ps1

# O si configuraste SSH:
.\deploy-to-production.ps1 -FrontendOnly
```

**Ventajas:**
- Rápido y simple
- Sin complejidad extra
- Deployments en minutos

### Después de Estabilizar (1-2 meses)

✅ **Migra a:** Flujo con rama `production`

```powershell
# 1. Crear rama production
git checkout -b production
git push origin production

# 2. Configurar GitHub Actions

# 3. Workflow:
git checkout mejoras-2025-10-18
# ... desarrollo ...
git push

# Cuando esté listo:
git checkout production
git merge mejoras-2025-10-18
git push  # → Deploy automático
```

**Ventajas:**
- Deploy automático
- Testing antes de producción
- Trazabilidad completa

### Cuando Tengas Múltiples Developers

✅ **Migra a:** Flujo completo con `main` + Pull Requests

**Ventajas:**
- Code review
- CI/CD completo
- Protección de producción

---

## 🔐 Seguridad y Mejores Prácticas

### 1. Proteger Ramas Importantes

En GitHub → Settings → Branches:

- **production**: Require PR, require reviews
- **main**: Require PR, require reviews + status checks

### 2. Variables de Entorno

```powershell
# Nunca commitear .env
# Siempre usar .env.example

# En servidor:
ssh root@74.208.234.244
nano /var/www/vhosts/creapolis.mx/aegg/backend/.env
# Configurar variables reales
```

### 3. Backups Antes de Deploy

```bash
# En servidor, antes de deploy:
cd /var/www/vhosts/creapolis.mx/aegg
cp -r httpdocs httpdocs.backup.$(date +%Y%m%d-%H%M)
```

### 4. Rollback Rápido

```bash
# Si algo falla:
cd /var/www/vhosts/creapolis.mx/aegg
rm -rf httpdocs
mv httpdocs.backup.YYYYMMDD-HHMM httpdocs
```

---

## 📊 Resumen de Comandos

| Acción                     | Comando                                       |
| -------------------------- | --------------------------------------------- |
| Deploy frontend rápido     | `.\deploy-frontend-only.ps1`                  |
| Deploy frontend auto       | `.\deploy-to-production.ps1 -FrontendOnly`    |
| Deploy completo            | `.\deploy-to-production.ps1`                  |
| Crear paquete manual       | `.\prepare-deployment.ps1`                    |
| Ver estado Git             | `git status`                                  |
| Cambiar de rama            | `git checkout production`                     |
| Crear rama nueva           | `git checkout -b feature/nombre`              |
| Merge a production         | `git checkout production && git merge mejoras-2025-10-18` |
| Push con force             | `git push origin mejoras-2025-10-18 --force` |

---

## 🆘 Troubleshooting

### Error: "No se puede conectar al servidor"

```powershell
# Verifica SSH
ssh root@74.208.234.244

# Si falla, usa deployment manual:
.\deploy-frontend-only.ps1 -SkipGit
# Sube ZIP manualmente
```

### Error: "Build failed"

```powershell
# Limpia node_modules
cd frontend
Remove-Item -Recurse node_modules
npm install
npm run build
```

### Error: "Git conflicts"

```powershell
# Ver conflictos
git status

# Resolver manualmente o:
git checkout --theirs archivo.txt  # Usar versión remota
git checkout --ours archivo.txt    # Usar versión local

git add .
git commit -m "Resolve conflicts"
```

---

¿Con qué flujo quieres empezar? Te recomiendo:

1. **Ahora:** Usa `deploy-frontend-only.ps1` (más rápido)
2. **Después:** Configura GitHub Actions para push a `production`
3. **Futuro:** Migra a flujo completo con `main`

¿Te ayudo a configurar alguno de estos? 🚀
