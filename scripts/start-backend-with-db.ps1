# Script para iniciar el backend con la base de datos configurada
Write-Host "🚀 Iniciando Backend con PostgreSQL..." -ForegroundColor Cyan

# Cambiar al directorio del backend
Set-Location "C:\Users\Usuario\source\repos\aegg\aegg-new-app\backend"

# Verificar que PostgreSQL esté corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$pgCheck = docker exec aegg-postgres pg_isready -U postgres -d appdb 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PostgreSQL no está disponible. Iniciando..." -ForegroundColor Red
    Set-Location ".."
    docker-compose up -d postgres
    Start-Sleep 10
    Set-Location "backend"
}

Write-Host "✅ PostgreSQL está listo!" -ForegroundColor Green

# Mostrar información de conexión
Write-Host "📊 Información de conexión:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Puerto: 5433" -ForegroundColor White
Write-Host "  Base de datos: appdb" -ForegroundColor White
Write-Host "  Usuario: postgres" -ForegroundColor White

# Iniciar el backend
Write-Host "🔧 Iniciando servidor NestJS..." -ForegroundColor Blue
node .\dist\main.js