# Quick Deploy Frontend - Sin complicaciones
# Úsalo para deployments rápidos de solo frontend

Write-Host "⚡ Quick Deploy Frontend" -ForegroundColor Cyan
Write-Host ""

# 1. Build
Write-Host "📦 Building..." -ForegroundColor Yellow
cd frontend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

# 2. Git
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Update frontend - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin mejoras-2025-10-18

# 3. Crear ZIP
Write-Host "🗜️ Creating ZIP..." -ForegroundColor Yellow
$zipName = "frontend-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

if (-not (Test-Path "deployment-packages")) {
    New-Item -ItemType Directory -Path "deployment-packages" | Out-Null
}

Compress-Archive -Path "frontend\dist\*" -DestinationPath "deployment-packages\$zipName" -Force

# 4. Resultado
Write-Host ""
Write-Host "✅ Listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivo: deployment-packages\$zipName" -ForegroundColor Cyan
Write-Host "📁 Tamaño: $([math]::Round((Get-Item "deployment-packages\$zipName").Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Sube el ZIP a Plesk y extrae en /httpdocs/" -ForegroundColor Yellow
Write-Host "🌐 Luego verifica: https://aegg.creapolis.mx" -ForegroundColor Yellow
