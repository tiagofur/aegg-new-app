$envFile = "C:\Users\Usuario\source\repos\aegg\aegg-new-app\backend\.env"
$dockerEnvFile = "C:\Users\Usuario\source\repos\aegg\aegg-new-app\backend\.env.docker"

Write-Host "Configurando .env para Docker..." -ForegroundColor Cyan

if (Test-Path $dockerEnvFile) {
    Copy-Item -Path $dockerEnvFile -Destination $envFile -Force
    Write-Host "Archivo .env copiado desde .env.docker" -ForegroundColor Green
} else {
    $envContent = @"
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
"@
    Set-Content -Path $envFile -Value $envContent
    Write-Host "Archivo .env creado con configuracion Docker" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuracion:" -ForegroundColor Cyan
Write-Host "  DATABASE_HOST=localhost" -ForegroundColor White
Write-Host "  DATABASE_PORT=5440" -ForegroundColor White
Write-Host "  DATABASE_USER=postgres" -ForegroundColor White
Write-Host "  DATABASE_PASSWORD=postgres" -ForegroundColor White
Write-Host "  DATABASE_NAME=appdb" -ForegroundColor White
Write-Host ""
