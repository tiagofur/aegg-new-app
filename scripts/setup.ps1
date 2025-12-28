# Script para verificar y preparar el entorno de desarrollo

Write-Host "🔍 Verificando configuración del proyecto..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar npm
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm no está disponible" -ForegroundColor Red
    exit 1
}

# Verificar Docker
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "✅ $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
Set-Location "backend"
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencias del backend ya instaladas" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencias del frontend ya instaladas" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor Red
        exit 1
    }
}

Set-Location ".."

Write-Host ""
Write-Host "🔨 Compilando backend..." -ForegroundColor Yellow
Set-Location "backend"
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend compilado correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️ Error compilando backend - se usará modo desarrollo" -ForegroundColor Yellow
}

Set-Location ".."

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host "🚀 Ejecuta .\start.ps1 para iniciar la aplicación" -ForegroundColor Cyan