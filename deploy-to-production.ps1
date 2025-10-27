# PowerShell Script para deployment automatizado a producción

param(
    [string]$Message = "Deploy to production - $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [string]$Branch = "mejoras-2025-10-18",
    [switch]$FrontendOnly = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 AEGG - Deployment Automático a Producción" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configuración del servidor
$SERVER_HOST = "74.208.234.244"
$SERVER_USER = "root"
$SERVER_PATH = "/var/www/vhosts/creapolis.mx/aegg"
$SERVER_BACKEND_PATH = "/var/www/vhosts/creapolis.mx/aegg-api"

# 1. Verificar estado de Git
Write-Host "📋 Verificando estado de Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus -and -not $Force) {
    Write-Host ""
    Write-Host "⚠️ Tienes cambios sin commitear:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $confirm = Read-Host "¿Commitear y continuar? (s/n)"
    if ($confirm -ne "s") {
        Write-Host "❌ Deployment cancelado" -ForegroundColor Red
        exit 0
    }
    
    git add .
    git commit -m "$Message"
}

# 2. Push a GitHub
Write-Host ""
Write-Host "📤 Subiendo cambios a GitHub ($Branch)..." -ForegroundColor Yellow
git push origin $Branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al subir a GitHub" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cambios subidos a GitHub" -ForegroundColor Green

# 3. Build local
Write-Host ""
if ($FrontendOnly) {
    Write-Host "📦 Building frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
} else {
    Write-Host "📦 Building backend y frontend..." -ForegroundColor Yellow
    
    # Backend
    Set-Location backend
    npm install --production
    npm run build
    Set-Location ..
    
    # Frontend
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build exitoso" -ForegroundColor Green

# 4. Verificar conexión SSH
Write-Host ""
Write-Host "🔐 Verificando conexión con servidor..." -ForegroundColor Yellow
$sshTest = ssh -o BatchMode=yes -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_HOST}" "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "❌ No se puede conectar al servidor via SSH" -ForegroundColor Red
    Write-Host "   Configura SSH keys primero o usa deployment manual" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Alternativa: Ejecuta .\deploy-frontend-only.ps1" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ Conexión SSH exitosa" -ForegroundColor Green

# 5. Deployment en servidor
Write-Host ""
Write-Host "🚀 Ejecutando deployment en servidor..." -ForegroundColor Yellow

if ($FrontendOnly) {
    # Solo frontend
    Write-Host "   → Actualizando frontend..." -ForegroundColor Cyan
    
    # Crear archivo temporal con los comandos
    $deployScript = @"
cd $SERVER_PATH
git pull origin $Branch
cd frontend
npm install
npm run build
rm -rf $SERVER_PATH/httpdocs/*
cp -r dist/* $SERVER_PATH/httpdocs/
echo "✅ Frontend actualizado"
"@
    
    # Ejecutar via SSH
    $deployScript | ssh "${SERVER_USER}@${SERVER_HOST}" "bash -s"
    
} else {
    # Backend y Frontend
    Write-Host "   → Actualizando backend y frontend..." -ForegroundColor Cyan
    
    $deployScript = @"
cd $SERVER_PATH
git pull origin $Branch

# Backend
cd backend
npm install --production
npm run build
pm2 reload aegg-backend

# Frontend
cd ../frontend
npm install
npm run build
rm -rf $SERVER_PATH/httpdocs/*
cp -r dist/* $SERVER_PATH/httpdocs/

echo "✅ Backend y Frontend actualizados"
pm2 logs aegg-backend --lines 5
"@
    
    $deployScript | ssh "${SERVER_USER}@${SERVER_HOST}" "bash -s"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "✅ ¡Deployment exitoso!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: https://aegg.creapolis.mx" -ForegroundColor White
    Write-Host "   Backend:  https://aegg-api.creapolis.mx" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Verifica los logs en el servidor:" -ForegroundColor Cyan
    Write-Host "   ssh $SERVER_USER@$SERVER_HOST 'pm2 logs aegg-backend'" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment falló" -ForegroundColor Red
    Write-Host "   Revisa los logs del servidor" -ForegroundColor Yellow
    exit 1
}
