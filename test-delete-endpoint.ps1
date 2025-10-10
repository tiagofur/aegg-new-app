# Script para probar el endpoint DELETE de limpiar datos de reporte

Write-Host "🧪 Probando endpoint DELETE /reportes-mensuales/:mesId/:reporteId/datos" -ForegroundColor Cyan
Write-Host ""

# Configuración
$baseUrl = "http://localhost:3000"
$mesId = "58be5201-11c1-476c-ab95-a044b061bf12"
$reporteId = "1a31a2b5-3027-45f9-84d0-85a1f63c42ca"
$endpoint = "$baseUrl/reportes-mensuales/$mesId/$reporteId/datos"

Write-Host "📍 URL: $endpoint" -ForegroundColor White
Write-Host ""

# Obtener el token (asume que tienes un usuario de prueba)
Write-Host "⚠️  IMPORTANTE: Necesitas estar autenticado" -ForegroundColor Yellow
Write-Host "Este script requiere que tengas un token JWT válido" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para obtener el token:" -ForegroundColor Cyan
Write-Host "1. Inicia sesión en la aplicación" -ForegroundColor White
Write-Host "2. Abre las DevTools del navegador (F12)" -ForegroundColor White
Write-Host "3. Ve a Application > Local Storage > http://localhost:5173" -ForegroundColor White
Write-Host "4. Copia el valor de 'token'" -ForegroundColor White
Write-Host "5. Pégalo aquí y presiona Enter" -ForegroundColor White
Write-Host ""

$token = Read-Host "Token JWT"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token vacío. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Enviando petición DELETE..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $endpoint -Method Delete -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ ÉXITO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Respuesta:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles del error:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Código de estado: $statusCode" -ForegroundColor Red
    }
}
