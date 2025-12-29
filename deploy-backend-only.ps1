# Script para deployment SOLO BACKEND
# Empaqueta y prepara solo el backend para subir al servidor

Write-Host "🚀 Preparando deployment SOLO BACKEND..." -ForegroundColor Green

# Configuración
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$DEPLOY_DIR = "deployment-package-backend"
$ZIP_NAME = "backend-only-$TIMESTAMP.zip"

# Limpiar directorio anterior
if (Test-Path $DEPLOY_DIR) {
    Write-Host "🧹 Limpiando directorio anterior..." -ForegroundColor Yellow
    Remove-Item -Path $DEPLOY_DIR -Recurse -Force
}

# Crear estructura
Write-Host "📁 Creando estructura de directorios..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $DEPLOY_DIR -Force | Out-Null
New-Item -ItemType Directory -Path "$DEPLOY_DIR/backend-dist" -Force | Out-Null

# 1. Compilar Backend
Write-Host "🔨 Compilando backend..." -ForegroundColor Cyan
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando backend" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Copiar dist del backend
Write-Host "📦 Copiando archivos compilados del backend..." -ForegroundColor Cyan
Copy-Item -Path "backend/dist/*" -Destination "$DEPLOY_DIR/backend-dist/" -Recurse -Force

# 3. Copiar script de deployment
Write-Host "📄 Copiando script de deployment..." -ForegroundColor Cyan
Copy-Item -Path "deployment-packages/deploy-backend-only.sh" -Destination "$DEPLOY_DIR/" -Force

# 4. Crear ZIP
Write-Host "🗜️ Creando archivo ZIP..." -ForegroundColor Cyan
if (Test-Path $ZIP_NAME) {
    Remove-Item $ZIP_NAME -Force
}
Compress-Archive -Path "$DEPLOY_DIR/*" -DestinationPath $ZIP_NAME -Force

# Obtener tamaño del archivo
$fileSize = (Get-Item $ZIP_NAME).Length / 1MB
$fileSizeFormatted = [math]::Round($fileSize, 2)

Write-Host ""
Write-Host "✅ ¡Paquete de backend listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivo creado: $ZIP_NAME" -ForegroundColor White
Write-Host "📊 Tamaño: $fileSizeFormatted MB" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🚀 SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "1️⃣ Subir a Plesk:" -ForegroundColor Cyan
Write-Host "   • Abre: https://74.208.234.244:8443" -ForegroundColor White
Write-Host "   • File Manager → /tmp/" -ForegroundColor White
Write-Host "   • Upload → $ZIP_NAME" -ForegroundColor White
Write-Host "   • Click derecho → Extract here" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣ Conectar por SSH:" -ForegroundColor Cyan
Write-Host "   ssh root@74.208.234.244" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣ Ejecutar deployment:" -ForegroundColor Cyan
Write-Host "   bash /tmp/deployment-package-backend/deploy-backend-only.sh" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣ Verificar:" -ForegroundColor Cyan
Write-Host "   • https://aegg-api.creapolis.mx" -ForegroundColor White
Write-Host "   • pm2 status" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
