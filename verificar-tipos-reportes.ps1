# Verificar tipos de reportes en la base de datos
$env:PGPASSWORD = "aegg2024"

Write-Host "🔍 Consultando tipos de reportes..." -ForegroundColor Cyan
Write-Host ""

$query = @"
SELECT 
    rm.id,
    rm.tipo,
    rm.estado,
    rm."archivoOriginal",
    m.mes,
    m.anio,
    t.nombre as trabajo
FROM reportes_mensuales rm
JOIN meses m ON rm."mesId" = m.id
JOIN trabajos t ON m."trabajoId" = t.id
ORDER BY m.anio DESC, m.mes DESC, rm.tipo
LIMIT 20;
"@

$query | & "C:\Program Files\PostgreSQL\16\bin\psql.exe" `
    -h localhost `
    -p 5432 `
    -U aegg_user `
    -d aegg_app `
    -f -

Write-Host ""
Write-Host "📊 Resumen de tipos:" -ForegroundColor Yellow
Write-Host ""

$queryResumen = @"
SELECT 
    tipo,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN estado = 'PROCESADO' THEN 1 END) as procesados
FROM reportes_mensuales
GROUP BY tipo
ORDER BY tipo;
"@

$queryResumen | & "C:\Program Files\PostgreSQL\16\bin\psql.exe" `
    -h localhost `
    -p 5432 `
    -U aegg_user `
    -d aegg_app `
    -f -

Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "💡 IMPORTANTE:" -ForegroundColor Cyan
Write-Host "   - Si ves 'INGRESOS' → Tabla vieja (ReporteViewer) - NO EDITABLE" -ForegroundColor Red
Write-Host "   - Si ves 'INGRESOS_AUXILIAR' → Tabla nueva (AuxiliarIngresosTable) - EDITABLE" -ForegroundColor Green
Write-Host "   - Si ves 'INGRESOS_MI_ADMIN' → Tabla nueva (MiAdminIngresosTable) - EDITABLE" -ForegroundColor Green
Write-Host ""
