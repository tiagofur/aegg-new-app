# Script para preparar BACKEND COMPLETO (con node_modules)
# Para subir directamente a la carpeta del backend en el servidor

Write-Host "🚀 Preparando BACKEND COMPLETO para deployment..." -ForegroundColor Green

# Configuración
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$ZIP_NAME = "backend-full-$TIMESTAMP.zip"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: No se encuentra la carpeta 'backend'" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# 1. Verificar/Instalar dependencias del backend
Write-Host "📦 Verificando dependencias del backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Instalando node_modules..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "✅ node_modules ya existe" -ForegroundColor Green
}

# 2. Compilar el backend
Write-Host "🔨 Compilando backend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# 3. Crear el ZIP del backend completo
Write-Host "🗜️ Creando ZIP del backend completo..." -ForegroundColor Cyan
Write-Host "   (Esto puede tardar unos minutos debido a node_modules...)" -ForegroundColor Yellow

# Eliminar ZIP anterior si existe
if (Test-Path $ZIP_NAME) {
    Remove-Item $ZIP_NAME -Force
}

# Comprimir toda la carpeta backend
Compress-Archive -Path "backend/*" -DestinationPath $ZIP_NAME -Force

# Obtener tamaño del archivo
$fileSize = (Get-Item $ZIP_NAME).Length / 1MB
$fileSizeFormatted = [math]::Round($fileSize, 2)

Write-Host ""
Write-Host "✅ ¡Paquete completo del backend listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivo: $ZIP_NAME" -ForegroundColor White
Write-Host "📊 Tamaño: $fileSizeFormatted MB" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📋 CONTENIDO DEL ZIP:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ src/ (código fuente)" -ForegroundColor White
Write-Host "✅ dist/ (código compilado)" -ForegroundColor White
Write-Host "✅ node_modules/ (todas las dependencias)" -ForegroundColor White
Write-Host "✅ package.json" -ForegroundColor White
Write-Host "✅ tsconfig.json" -ForegroundColor White
Write-Host "✅ nest-cli.json" -ForegroundColor White
Write-Host "⚠️  SIN .env (debes configurarlo en el servidor)" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🎯 ARCHIVO LISTO PARA SUBIR" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 Ubicación: $((Get-Location).Path)\$ZIP_NAME" -ForegroundColor Cyan
Write-Host ""
