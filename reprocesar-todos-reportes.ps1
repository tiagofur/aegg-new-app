# Script simple: Reprocesar Estado SAT de TODOS los reportes de un mes
# Detecta automáticamente todos los reportes y los reprocesa

param(
    [string]$mesId = ""
)

# Configuración
$apiUrl = "http://localhost:3000"
$tokenFile = ".\token.txt"

# Función para obtener el token
function Get-AuthToken {
    if (Test-Path $tokenFile) {
        return Get-Content $tokenFile -Raw | ForEach-Object { $_.Trim() }
    } else {
        Write-Host "❌ No se encontró el archivo token.txt" -ForegroundColor Red
        Write-Host "   Creando uno de prueba..." -ForegroundColor Yellow
        # Token de ejemplo - reemplaza con tu token real
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}

# Si no se proporciona mesId, mostrar lista de trabajos
if (-not $mesId) {
    Write-Host "`n📋 Primero necesitas obtener el MES ID" -ForegroundColor Cyan
    Write-Host "   1. Abre la aplicación web" -ForegroundColor White
    Write-Host "   2. Ve a un trabajo/proyecto" -ForegroundColor White
    Write-Host "   3. Selecciona un mes (Ene, Feb, etc.)" -ForegroundColor White
    Write-Host "   4. Abre la consola del navegador (F12)" -ForegroundColor White
    Write-Host "   5. Busca en Network una petición que contenga el mesId" -ForegroundColor White
    Write-Host "   6. O busca en la URL algo como: /trabajos/XXX/mes/YYY" -ForegroundColor White
    Write-Host "      donde YYY es el mesId`n" -ForegroundColor White
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "   .\reprocesar-todos-reportes.ps1 -mesId 'TU_MES_ID_AQUI'`n" -ForegroundColor White
    exit 0
}

$token = Get-AuthToken

# Obtener información del mes
Write-Host "`n🔍 Obteniendo información del mes..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $mesUrl = "$apiUrl/meses/$mesId"
    $mes = Invoke-RestMethod -Uri $mesUrl -Method Get -Headers $headers
    
    Write-Host "✅ Mes encontrado: $($mes.nombre) - $($mes.anio)" -ForegroundColor Green
    Write-Host "   Estado: $($mes.estado)" -ForegroundColor Gray
    Write-Host "   Reportes: $($mes.reportes.Count)`n" -ForegroundColor Gray
    
    if ($mes.reportes.Count -eq 0) {
        Write-Host "⚠️  Este mes no tiene reportes" -ForegroundColor Yellow
        exit 0
    }
    
    # Procesar cada reporte
    $totalModificadas = 0
    
    foreach ($reporte in $mes.reportes) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "📄 Reporte: $($reporte.tipo)" -ForegroundColor Cyan
        Write-Host "   ID: $($reporte.id)" -ForegroundColor Gray
        Write-Host "   Estado: $($reporte.estado)" -ForegroundColor Gray
        Write-Host "   Archivo: $($reporte.archivoOriginal)" -ForegroundColor Gray
        
        if (-not $reporte.datos -or $reporte.datos.Count -eq 0) {
            Write-Host "   ⚠️  Sin datos para procesar`n" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "   🔄 Reprocesando Estado SAT..." -ForegroundColor Cyan
        
        try {
            $endpoint = "$apiUrl/reportes-mensuales/$mesId/$($reporte.id)/reprocesar-estado-sat"
            $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers
            
            if ($response.celdasModificadas -gt 0) {
                Write-Host "   ✅ $($response.celdasModificadas) celda(s) actualizadas" -ForegroundColor Green
                $totalModificadas += $response.celdasModificadas
            } else {
                Write-Host "   ℹ️  Todas las celdas ya tenían valores" -ForegroundColor Gray
            }
            
        } catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "`n🎉 Proceso completado!" -ForegroundColor Green
    Write-Host "   Total de celdas actualizadas: $totalModificadas" -ForegroundColor Yellow
    
    if ($totalModificadas -gt 0) {
        Write-Host "`n   ✨ Refresca la página para ver los cambios`n" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n❌ Error al obtener información del mes:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Detalles: $responseBody" -ForegroundColor Red
        } catch {}
    }
    
    Write-Host "`n💡 Posibles causas:" -ForegroundColor Yellow
    Write-Host "   • El mesId es incorrecto" -ForegroundColor White
    Write-Host "   • El token JWT ha expirado (actualiza token.txt)" -ForegroundColor White
    Write-Host "   • El backend no está corriendo en http://localhost:3000" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
