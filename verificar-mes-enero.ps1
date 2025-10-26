# Script para verificar el estado del mes de Enero 2025 del trabajo "Creapolis Dev"

Write-Host "🔍 Verificando estado del mes Enero 2025..." -ForegroundColor Cyan

# Obtener el trabajo "Creapolis Dev"
$trabajo = curl -s "http://localhost:3001/api/trabajos" | ConvertFrom-Json | Where-Object { $_.nombre -like "*Creapolis Dev*" }

if (-not $trabajo) {
    Write-Host "❌ No se encontró el trabajo 'Creapolis Dev'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Trabajo encontrado: $($trabajo.nombre)" -ForegroundColor Green
Write-Host "   ID: $($trabajo.id)" -ForegroundColor Gray

# Buscar el mes de Enero (mes = 1)
$mesEnero = $trabajo.meses | Where-Object { $_.mes -eq 1 }

if (-not $mesEnero) {
    Write-Host "❌ No se encontró el mes de Enero" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📅 MES DE ENERO 2025:" -ForegroundColor Yellow
Write-Host "   ID: $($mesEnero.id)" -ForegroundColor Gray
Write-Host "   Estado: $($mesEnero.estado)" -ForegroundColor $(if ($mesEnero.estado -eq "COMPLETADO") { "Green" } else { "Yellow" })
Write-Host "   Estado Revisión: $($mesEnero.estadoRevision)" -ForegroundColor $(
    switch ($mesEnero.estadoRevision) {
        "EN_EDICION" { "Gray" }
        "ENVIADO" { "Yellow" }
        "APROBADO" { "Green" }
        "CAMBIOS_SOLICITADOS" { "Red" }
        default { "White" }
    }
)
Write-Host "   Enviado por: $($mesEnero.enviadoRevisionPorId)" -ForegroundColor Gray
Write-Host "   Fecha envío: $($mesEnero.fechaEnvioRevision)" -ForegroundColor Gray
Write-Host "   Aprobado por: $($mesEnero.aprobadoPorId)" -ForegroundColor Gray
Write-Host "   Fecha aprobación: $($mesEnero.fechaAprobacion)" -ForegroundColor Gray
Write-Host "   Gestor responsable: $($trabajo.gestorResponsableId)" -ForegroundColor Gray

Write-Host ""
if ($mesEnero.estadoRevision -eq "ENVIADO") {
    Write-Host "✅ El mes SÍ está en estado ENVIADO en el backend" -ForegroundColor Green
    Write-Host "   Esto significa que el problema está en el frontend (no está recibiendo/mostrando los datos)" -ForegroundColor Yellow
} elseif ($mesEnero.estadoRevision -eq "EN_EDICION") {
    Write-Host "❌ El mes está en EN_EDICION en el backend" -ForegroundColor Red
    Write-Host "   El botón 'Enviar a Revisión' no funcionó correctamente" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️ El mes está en estado: $($mesEnero.estadoRevision)" -ForegroundColor Cyan
}
