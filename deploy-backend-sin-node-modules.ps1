# Script para deployment backend SIN node_modules
# Los node_modules se instalarán en el servidor Linux

Write-Host "🚀 Preparando backend para deployment (SIN node_modules)..." -ForegroundColor Green

# Configuración
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$ZIP_NAME = "backend-deploy-$TIMESTAMP.zip"
$TEMP_DIR = "backend-temp"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: No se encuentra la carpeta 'backend'" -ForegroundColor Red
    exit 1
}

# 1. Instalar dependencias localmente (solo para compilar)
Write-Host "📦 Verificando dependencias para compilar..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependencias localmente..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
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

# 3. Crear directorio temporal
Write-Host "📁 Creando paquete de deployment..." -ForegroundColor Cyan
if (Test-Path $TEMP_DIR) {
    Remove-Item -Path $TEMP_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# 4. Copiar solo lo necesario (SIN node_modules)
Write-Host "📦 Copiando archivos (sin node_modules)..." -ForegroundColor Cyan
Copy-Item -Path "backend/dist" -Destination "$TEMP_DIR/dist" -Recurse -Force
Copy-Item -Path "backend/src" -Destination "$TEMP_DIR/src" -Recurse -Force
Copy-Item -Path "backend/package.json" -Destination "$TEMP_DIR/" -Force
Copy-Item -Path "backend/package-lock.json" -Destination "$TEMP_DIR/" -Force
Copy-Item -Path "backend/tsconfig.json" -Destination "$TEMP_DIR/" -Force
Copy-Item -Path "backend/nest-cli.json" -Destination "$TEMP_DIR/" -Force

# 5. Crear el ZIP
Write-Host "🗜️ Creando archivo ZIP..." -ForegroundColor Cyan
if (Test-Path $ZIP_NAME) {
    Remove-Item $ZIP_NAME -Force
}
Compress-Archive -Path "$TEMP_DIR/*" -DestinationPath $ZIP_NAME -Force

# 6. Limpiar
Remove-Item -Path $TEMP_DIR -Recurse -Force

# Obtener tamaño del archivo
$fileSize = (Get-Item $ZIP_NAME).Length / 1MB
$fileSizeFormatted = [math]::Round($fileSize, 2)

Write-Host ""
Write-Host "✅ ¡Paquete de backend listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Archivo: $ZIP_NAME" -ForegroundColor White
Write-Host "📊 Tamaño: $fileSizeFormatted MB" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📋 CONTENIDO DEL ZIP:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ src/ (código fuente)" -ForegroundColor White
Write-Host "✅ dist/ (código compilado)" -ForegroundColor White
Write-Host "✅ package.json" -ForegroundColor White
Write-Host "✅ package-lock.json" -ForegroundColor White
Write-Host "✅ tsconfig.json" -ForegroundColor White
Write-Host "✅ nest-cli.json" -ForegroundColor White
Write-Host "❌ SIN node_modules (se instalarán en el servidor)" -ForegroundColor Yellow
Write-Host "❌ SIN .env (ya existe en el servidor)" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🚀 PASOS SIGUIENTES EN EL SERVIDOR:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Sube el ZIP al servidor (Plesk File Manager)" -ForegroundColor Cyan
Write-Host "   Ruta: /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/" -ForegroundColor White
Write-Host ""
Write-Host "2. Conéctate por SSH y ejecuta:" -ForegroundColor Cyan
Write-Host "   cd /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx" -ForegroundColor White
Write-Host "   pm2 stop aegg-backend" -ForegroundColor White
Write-Host "   mv backend backend-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ForegroundColor White
Write-Host "   mkdir backend" -ForegroundColor White
Write-Host "   unzip $ZIP_NAME -d backend/" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install --production" -ForegroundColor Yellow
Write-Host "   # Asegúrate que existe el .env con las variables correctas" -ForegroundColor White
Write-Host "   cd .." -ForegroundColor White
Write-Host "   chown -R www-data:www-data backend" -ForegroundColor White
Write-Host "   chmod -R 755 backend" -ForegroundColor White
Write-Host "   pm2 restart aegg-backend" -ForegroundColor White
Write-Host "   pm2 logs aegg-backend" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 Ubicación: $((Get-Location).Path)\$ZIP_NAME" -ForegroundColor Cyan
Write-Host ""
