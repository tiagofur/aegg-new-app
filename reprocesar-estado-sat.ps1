# Script para reprocesar Estado SAT de un reporte existente
# Este script llena las celdas vacías de "Estado SAT" con "Vigente"

param(
    [string]$mesId,
    [string]$reporteId
)

# Configuración
$apiUrl = "http://localhost:3000"
$tokenFile = ".\token.txt"

# Función para obtener el token
function Get-AuthToken {
    if (Test-Path $tokenFile) {
        return Get-Content $tokenFile -Raw
    } else {
        Write-Host "❌ No se encontró el archivo token.txt" -ForegroundColor Red
        Write-Host "   Por favor, ejecuta primero un login o crea el archivo con tu token JWT" -ForegroundColor Yellow
        exit 1
    }
}

# Función para hacer la petición
function Invoke-ReprocesarEstadoSat {
    param($mesId, $reporteId)
    
    $token = Get-AuthToken
    $endpoint = "$apiUrl/reportes-mensuales/$mesId/$reporteId/reprocesar-estado-sat"
    
    Write-Host "`n🔄 Reprocesando Estado SAT..." -ForegroundColor Cyan
    Write-Host "   Mes ID: $mesId" -ForegroundColor Gray
    Write-Host "   Reporte ID: $reporteId" -ForegroundColor Gray
    Write-Host "   Endpoint: $endpoint`n" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers
        
        Write-Host "✅ Éxito!" -ForegroundColor Green
        Write-Host "   Mensaje: $($response.message)" -ForegroundColor White
        Write-Host "   Celdas modificadas: $($response.celdasModificadas)" -ForegroundColor Yellow
        
        if ($response.celdasModificadas -eq 0) {
            Write-Host "`n   ℹ️  Todas las celdas ya tenían valores" -ForegroundColor Cyan
        } else {
            Write-Host "`n   🎉 Se actualizaron $($response.celdasModificadas) celda(s) con 'Vigente'" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Error al reprocesar:" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Detalles: $responseBody" -ForegroundColor Red
        }
        
        exit 1
    }
}

# Validar parámetros
if (-not $mesId -or -not $reporteId) {
    Write-Host "`n❌ Error: Faltan parámetros requeridos" -ForegroundColor Red
    Write-Host "`nUso:" -ForegroundColor Yellow
    Write-Host "   .\reprocesar-estado-sat.ps1 -mesId <MES_ID> -reporteId <REPORTE_ID>`n" -ForegroundColor White
    Write-Host "Ejemplo:" -ForegroundColor Yellow
    Write-Host "   .\reprocesar-estado-sat.ps1 -mesId '123e4567-e89b-12d3-a456-426614174000' -reporteId '987f6543-e21c-43d2-b765-532413270001'`n" -ForegroundColor White
    exit 1
}

# Ejecutar
Invoke-ReprocesarEstadoSat -mesId $mesId -reporteId $reporteId

Write-Host "`n✨ Proceso completado. Refresca la página para ver los cambios.`n" -ForegroundColor Green
