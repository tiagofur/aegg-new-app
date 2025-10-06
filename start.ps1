# Script para iniciar la aplicación completa

Write-Host "🚀 Iniciando aplicación Full Stack..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker está corriendo
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está corriendo" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Construyendo e iniciando servicios con Docker Compose..." -ForegroundColor Yellow
Write-Host ""

# Iniciar Docker Compose
docker-compose up --build

Write-Host ""
Write-Host "🎉 Aplicación detenida" -ForegroundColor Cyan
