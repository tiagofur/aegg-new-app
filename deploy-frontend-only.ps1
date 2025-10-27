# PowerShell Script para deployment SOLO de Frontend

param(
    [string]$Message = "Frontend update - $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$SkipGit = $false
)

Write-Host "🚀 Deployment Frontend Only" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que estamos en el directorio correcto
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Error: No se encontró la carpeta 'frontend'" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar cambios en Git
if (-not $SkipGit) {
    Write-Host "📋 Verificando cambios en Git..." -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $confirm = Read-Host "¿Continuar con el deployment? (s/n)"
    if ($confirm -ne "s") {
        Write-Host "❌ Deployment cancelado" -ForegroundColor Red
        exit 0
    }
}

# 3. Build Frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend

# Instalar dependencias (solo si es necesario)
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Build
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en frontend build" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Frontend build exitoso" -ForegroundColor Green
Set-Location ..

# 4. Crear paquete solo del frontend
Write-Host "📦 Creando paquete de frontend..." -ForegroundColor Yellow

# Crear directorio temporal
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageName = "frontend-deployment-$timestamp"
$packagePath = "deployment-packages\$packageName"

if (-not (Test-Path "deployment-packages")) {
    New-Item -ItemType Directory -Path "deployment-packages" | Out-Null
}

if (Test-Path $packagePath) {
    Remove-Item -Recurse -Force $packagePath
}
New-Item -ItemType Directory -Path $packagePath | Out-Null

# Copiar solo el frontend dist
Copy-Item -Recurse frontend\dist "$packagePath\frontend-dist"

# Crear archivo de instrucciones
@"
# Deployment Frontend - $timestamp

## Archivos incluidos:
- frontend-dist/ - Build de producción del frontend

## Instrucciones de deployment:

### Opción 1: Plesk File Manager
1. Comprimir esta carpeta en ZIP
2. Subir a Plesk File Manager
3. Descomprimir en /var/www/vhosts/creapolis.mx/aegg/
4. Ejecutar:
   rm -rf httpdocs/*
   cp -r frontend-dist/* httpdocs/

### Opción 2: WinSCP
1. Conectar a 74.208.234.244
2. Ir a /var/www/vhosts/creapolis.mx/aegg/httpdocs
3. Eliminar contenido actual
4. Subir contenido de frontend-dist/

### Opción 3: SSH (más rápido)
```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg
rm -rf httpdocs/*
# (Subir frontend-dist primero)
cp -r frontend-dist/* httpdocs/
```

## Verificación:
- URL: https://aegg.creapolis.mx
- Debe cargar la aplicación actualizada
- Verificar en DevTools > Network que no hay errores 404

"@ | Out-File -FilePath "$packagePath\README.txt" -Encoding UTF8

# Comprimir
Write-Host "🗜️ Comprimiendo paquete..." -ForegroundColor Yellow
$zipPath = "deployment-packages\$packageName.zip"
Compress-Archive -Path "$packagePath\*" -DestinationPath $zipPath -Force

Write-Host "✅ Paquete creado: $zipPath" -ForegroundColor Green

# 5. Commit y push a Git (opcional)
if (-not $SkipGit) {
    Write-Host ""
    Write-Host "📤 Subiendo cambios a GitHub..." -ForegroundColor Yellow
    
    git add .
    git commit -m "$Message"
    git push origin mejoras-2025-10-18
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cambios subidos a GitHub" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Error al subir a GitHub (continúa con deployment manual)" -ForegroundColor Yellow
    }
}

# 6. Resumen final
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Frontend listo para deployment" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Paquete: $zipPath" -ForegroundColor Cyan
Write-Host "📁 Tamaño: $((Get-Item $zipPath).Length / 1MB) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Subir $packageName.zip al servidor" -ForegroundColor White
Write-Host "2. Descomprimir y mover a httpdocs/" -ForegroundColor White
Write-Host "3. Verificar en https://aegg.creapolis.mx" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Para deployment automático, configura GitHub Actions" -ForegroundColor Cyan
Write-Host "    Ver: .\docs\github-actions-setup.md" -ForegroundColor Cyan
