# Script para verificar los meses de un trabajo en la base de datos

$trabajoId = Read-Host "Ingrese el ID del trabajo (deje en blanco para crear uno nuevo)"

if ([string]::IsNullOrEmpty($trabajoId)) {
    Write-Host "`nCreando trabajo de prueba..." -ForegroundColor Yellow
    
    # Obtener token (asume que ya estás autenticado)
    $token = Read-Host "Ingrese su token de autenticación"
    
    # Crear trabajo de prueba
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        clienteNombre = "Cliente Prueba Meses"
        clienteRfc = "PRUEBA123456"
        anio = 2024
        usuarioAsignadoId = (Read-Host "Ingrese su ID de usuario")
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/trabajos" -Method Post -Headers $headers -Body $body
        $trabajoId = $response.id
        Write-Host "Trabajo creado con ID: $trabajoId" -ForegroundColor Green
    } catch {
        Write-Host "Error al crear trabajo: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nConsultando meses del trabajo $trabajoId..." -ForegroundColor Cyan

# Consultar trabajo con sus meses
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $trabajo = Invoke-RestMethod -Uri "http://localhost:3000/trabajos/$trabajoId" -Method Get -Headers $headers
    
    Write-Host "`n=== RESULTADO ===" -ForegroundColor Green
    Write-Host "ID: $($trabajo.id)"
    Write-Host "Cliente: $($trabajo.clienteNombre)"
    Write-Host "Año: $($trabajo.anio)"
    Write-Host "Estado: $($trabajo.estado)"
    
    if ($trabajo.meses -and $trabajo.meses.Count -gt 0) {
        Write-Host "`nMeses encontrados: $($trabajo.meses.Count)" -ForegroundColor Green
        
        foreach ($mes in $trabajo.meses | Sort-Object mes) {
            $reportesCount = if ($mes.reportes) { $mes.reportes.Count } else { 0 }
            Write-Host "  - Mes $($mes.mes): Estado=$($mes.estado), Reportes=$reportesCount"
        }
    } else {
        Write-Host "`nNO SE ENCONTRARON MESES" -ForegroundColor Red
        Write-Host "Este es el problema que debemos resolver" -ForegroundColor Yellow
    }
    
    if ($trabajo.reporteBaseAnual) {
        Write-Host "`nReporte Base Anual: Existe" -ForegroundColor Green
    } else {
        Write-Host "`nReporte Base Anual: NO EXISTE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error al consultar trabajo: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
}

Write-Host "`n=== FIN ===" -ForegroundColor Cyan
