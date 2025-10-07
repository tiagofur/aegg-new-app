# Script para iniciar la aplicación completa con Docker

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

# Iniciar solo la base de datos con Docker Compose
Write-Host "📦 Iniciando PostgreSQL con Docker Compose..." -ForegroundColor Yellow
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
Write-Host "⏳ Esperando que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep 10

# Verificar que PostgreSQL esté funcionando
$maxAttempts = 30
$attempt = 1
do {
    $pgReady = docker exec aegg-postgres pg_isready -U postgres -d appdb 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL está listo!" -ForegroundColor Green
        break
    }
    Write-Host "⏳ Intento $attempt/$maxAttempts - PostgreSQL aún no está listo..." -ForegroundColor Yellow
    Start-Sleep 2
    $attempt++
} while ($attempt -le $maxAttempts)

if ($attempt -gt $maxAttempts) {
    Write-Host "❌ PostgreSQL no se pudo iniciar correctamente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Iniciando Frontend (React + Vite)..." -ForegroundColor Green
Start-Job -ScriptBlock {
    Set-Location "C:\Users\Usuario\source\repos\aegg\aegg-new-app\frontend"
    npm run dev
} -Name "Frontend"

Write-Host "🔧 Iniciando Backend (NestJS)..." -ForegroundColor Blue
Start-Job -ScriptBlock {
    Set-Location "C:\Users\Usuario\source\repos\aegg\aegg-new-app\backend"
    Write-Host "📦 Compilando backend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend compilado correctamente" -ForegroundColor Green
        Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Blue
        npm run start:prod
    } else {
        Write-Host "❌ Error al compilar backend" -ForegroundColor Red
        Write-Host "🔄 Intentando con modo desarrollo..." -ForegroundColor Yellow
        npm run start:dev
    }
} -Name "Backend"

Write-Host ""
Write-Host "🎉 ¡Aplicación iniciada!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🐘 PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "🔍 PgAdmin: http://localhost:8080 (admin@aegg.com / admin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios..." -ForegroundColor Yellow

# Mantener el script corriendo y mostrar logs
try {
    while ($true) {
        Start-Sleep 5
        # Verificar que los jobs estén corriendo
        $jobs = Get-Job
        foreach ($job in $jobs) {
            if ($job.State -eq "Failed") {
                Write-Host "❌ El servicio $($job.Name) falló" -ForegroundColor Red
                Receive-Job $job
            }
        }
    }
}
finally {
    Write-Host ""
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    
    # Detener jobs
    Get-Job | Stop-Job -Force
    Get-Job | Remove-Job -Force
    
    # Detener Docker Compose
    docker-compose down
    
    Write-Host "🎉 Todos los servicios detenidos" -ForegroundColor Cyan
}
