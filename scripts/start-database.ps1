# Script para iniciar solo la base de datos PostgreSQL en Docker
Write-Host "🐘 Iniciando PostgreSQL con Docker..." -ForegroundColor Cyan

# Verificar si Docker está corriendo
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está corriendo" -ForegroundColor Green

# Iniciar PostgreSQL
Write-Host "📦 Iniciando PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres

# Esperar y verificar
Write-Host "⏳ Esperando que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep 10

$maxAttempts = 15
$attempt = 1
do {
    $pgReady = docker exec aegg-postgres pg_isready -U postgres -d appdb 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL está listo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Información de conexión:" -ForegroundColor Cyan
        Write-Host "  Host: localhost" -ForegroundColor White
        Write-Host "  Puerto: 5432" -ForegroundColor White
        Write-Host "  Base de datos: appdb" -ForegroundColor White
        Write-Host "  Usuario: postgres" -ForegroundColor White
        Write-Host "  Contraseña: postgres" -ForegroundColor White
        Write-Host ""
        Write-Host "🔍 PgAdmin disponible en: http://localhost:8080" -ForegroundColor Green
        Write-Host "   Email: admin@aegg.com" -ForegroundColor White
        Write-Host "   Contraseña: admin" -ForegroundColor White
        break
    }
    Write-Host "⏳ Intento $attempt/$maxAttempts..." -ForegroundColor Yellow
    Start-Sleep 2
    $attempt++
} while ($attempt -le $maxAttempts)

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ PostgreSQL no se pudo iniciar correctamente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡PostgreSQL está listo para usar!" -ForegroundColor Green