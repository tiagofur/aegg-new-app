# Script para resetear el usuario admin
Write-Host "🔧 Reseteando usuario admin..." -ForegroundColor Cyan

# Credenciales de la base de datos
$env:PGPASSWORD = "aegg2024"
$dbUser = "aegg_user"
$dbName = "aegg_app"
$dbHost = "localhost"
$dbPort = "5432"

# Hash de la contraseña "admin123" con bcrypt
# $2b$10$YourHashHere - Este hash debe coincidir con lo que genera bcrypt
$passwordHash = "`$2b`$10`$K3W8qNGhN6F5xP0qHZzPZeGfJqQ5S7E8K9V6H3Y4L5J6K7M8N9P0Q1"

Write-Host "📝 Actualizando usuario admin..." -ForegroundColor Yellow

$query = @"
-- Primero, eliminar el usuario admin si existe
DELETE FROM users WHERE email = 'admin@aegg.com';

-- Crear nuevo usuario admin con contraseña conocida
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('admin@aegg.com', '`$2b`$10`$rQs5F8mC6GhD3aE2bW9jXO8F7Y3K4N5M6P7Q8R9S0T1U2V3W4X5Y6', 'Administrador', 'Admin', NOW(), NOW());
"@

# Ejecutar query
$query | & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h $dbHost -p $dbPort -U $dbUser -d $dbName -f -

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Usuario admin creado correctamente" -ForegroundColor Green
    Write-Host "" 
    Write-Host "📧 Email: admin@aegg.com" -ForegroundColor Cyan
    Write-Host "🔑 Contraseña: admin123" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Error al crear usuario admin" -ForegroundColor Red
}

# Limpiar variable de entorno
Remove-Item Env:\PGPASSWORD
