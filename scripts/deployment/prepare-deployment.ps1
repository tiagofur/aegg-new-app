# PowerShell Script para preparar el deployment en Windows

Write-Host "🚀 Preparando deployment..." -ForegroundColor Cyan

# 1. Backend Build
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm install --production
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en backend build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend build exitoso" -ForegroundColor Green

# 2. Frontend Build
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en frontend build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build exitoso" -ForegroundColor Green

# 3. Crear paquete de deployment
Write-Host "📦 Creando paquete de deployment..." -ForegroundColor Yellow
Set-Location ..

# Crear directorio
if (Test-Path "deployment-package") {
    Remove-Item -Recurse -Force deployment-package
}
New-Item -ItemType Directory -Path "deployment-package" | Out-Null

# Copiar backend
Copy-Item -Recurse backend\dist deployment-package\backend-dist
Copy-Item -Recurse backend\node_modules deployment-package\backend-node_modules
Copy-Item backend\package.json deployment-package\
Copy-Item .env.production deployment-package\.env

# Copiar frontend
Copy-Item -Recurse frontend\dist deployment-package\frontend-dist

# Copiar configuraciones
Copy-Item ecosystem.config.js deployment-package\

Write-Host "✅ Paquete creado en .\deployment-package" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Editar deployment-package\.env con credenciales reales" -ForegroundColor White
Write-Host "2. Comprimir deployment-package en ZIP" -ForegroundColor White
Write-Host "3. Subir al servidor via Plesk File Manager o WinSCP" -ForegroundColor White
Write-Host "4. Descomprimir y configurar en el servidor" -ForegroundColor White
