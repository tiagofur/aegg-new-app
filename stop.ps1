# Script para detener la aplicación

Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "✅ Servicios detenidos correctamente" -ForegroundColor Green
