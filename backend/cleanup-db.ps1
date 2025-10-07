# Script para limpiar la base de datos y empezar de cero

Write-Host "=== LIMPIEZA DE BASE DE DATOS ===" -ForegroundColor Cyan

# Variables de conexión (ajustar según tu .env)
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "appdb"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

Write-Host "`nEliminando tablas viejas..." -ForegroundColor Yellow

# Comandos SQL para limpiar
$sqlCommands = @"
-- Eliminar tabla trabajos
DROP TABLE IF EXISTS trabajos CASCADE;

-- Eliminar tabla reportes
DROP TABLE IF EXISTS reportes CASCADE;

-- Eliminar tabla reportes_base_anual si existe
DROP TABLE IF EXISTS reportes_base_anual CASCADE;

-- Eliminar tabla meses si existe  
DROP TABLE IF EXISTS meses CASCADE;

-- Eliminar tabla reportes_mensuales si existe
DROP TABLE IF EXISTS reportes_mensuales CASCADE;

-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS "public"."reportes_mensuales_tipo_enum" CASCADE;
DROP TYPE IF EXISTS "public"."reportes_mensuales_estado_enum" CASCADE;
DROP TYPE IF EXISTS "public"."meses_estado_enum" CASCADE;
DROP TYPE IF EXISTS "public"."trabajos_estado_enum" CASCADE;

SELECT 'Tablas eliminadas correctamente' as resultado;
"@

# Guardar comandos en archivo temporal
$sqlCommands | Out-File -FilePath "temp_cleanup.sql" -Encoding UTF8

Write-Host "Ejecutando comandos SQL..." -ForegroundColor Yellow

# Ejecutar con psql
$env:PGPASSWORD = $DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "temp_cleanup.sql"

# Limpiar archivo temporal
Remove-Item "temp_cleanup.sql" -ErrorAction SilentlyContinue

Write-Host "`n=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "Ahora puedes reiniciar el backend para que TypeORM cree las nuevas tablas." -ForegroundColor Cyan
