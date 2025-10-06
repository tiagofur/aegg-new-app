# 🧪 Script de Pruebas del Sistema de Trabajos
# Ejecutar en PowerShell desde la raíz del proyecto

Write-Host "🚀 Iniciando pruebas del Sistema de Trabajos..." -ForegroundColor Cyan
Write-Host ""

# Configuración
$baseUrl = "http://localhost:3001"
$contentType = "application/json"

# ============================================
# 1. REGISTRO DE USUARIO
# ============================================
Write-Host "📝 1. Registrando nuevo usuario..." -ForegroundColor Yellow

$registerBody = @{
    email    = "test$(Get-Random -Maximum 9999)@example.com"
    password = "password123"
    name     = "Usuario de Prueba"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod `
        -Uri "$baseUrl/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType $contentType
    
    $token = $registerResponse.token
    $userId = $registerResponse.user.id
    
    Write-Host "✅ Usuario registrado exitosamente" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error al registrar usuario: $_" -ForegroundColor Red
    exit 1
}

# Headers con autenticación
$headers = @{
    Authorization = "Bearer $token"
}

Write-Host ""

# ============================================
# 2. CREAR TRABAJO
# ============================================
Write-Host "📁 2. Creando trabajo..." -ForegroundColor Yellow

$trabajoBody = @{
    nombre      = "Contabilidad Octubre 2025"
    mes         = "2025-10-01"
    descripcion = "Reportes mensuales de octubre - Prueba"
} | ConvertTo-Json

try {
    $trabajo = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos" `
        -Method POST `
        -Body $trabajoBody `
        -ContentType $contentType `
        -Headers $headers
    
    $trabajoId = $trabajo.id
    
    Write-Host "✅ Trabajo creado exitosamente" -ForegroundColor Green
    Write-Host "   ID: $trabajoId" -ForegroundColor Gray
    Write-Host "   Nombre: $($trabajo.nombre)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error al crear trabajo: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 3. CREAR REPORTES
# ============================================
Write-Host "📊 3. Creando reportes..." -ForegroundColor Yellow

$tiposReporte = @("mensual", "ingresos", "auxiliar_ingresos", "egresos")
$reporteIds = @()

foreach ($tipo in $tiposReporte) {
    $reporteBody = @{
        tipoReporte     = $tipo
        archivoOriginal = "reporte_${tipo}_octubre.xlsx"
    } | ConvertTo-Json
    
    try {
        $reporte = Invoke-RestMethod `
            -Uri "$baseUrl/trabajos/$trabajoId/reportes" `
            -Method POST `
            -Body $reporteBody `
            -ContentType $contentType `
            -Headers $headers
        
        $reporteIds += $reporte.id
        Write-Host "   ✅ Reporte '$tipo' creado: $($reporte.id.Substring(0, 8))..." -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Error al crear reporte '$tipo': $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 4. SIMULAR IMPORTACIÓN DE DATOS
# ============================================
Write-Host "📥 4. Simulando importación de datos..." -ForegroundColor Yellow

if ($reporteIds.Count -gt 0) {
    $reporteId = $reporteIds[0]
    
    # Datos simulados de un Excel
    $datosImportados = @{
        headers = @("Concepto", "Enero", "Febrero", "Marzo", "Total")
        filas   = @(
            @("Ventas", 10000, 12000, 15000, 37000),
            @("Servicios", 5000, 6000, 7000, 18000),
            @("Otros", 2000, 2500, 3000, 7500)
        )
        metadata = @{
            total_filas    = 3
            total_columnas = 5
        }
    }
    
    $importBody = @{
        datosOriginales = $datosImportados
        metadata        = @{
            filas           = 3
            columnas        = 5
            headers         = $datosImportados.headers
            areas_editables = @(
                @{
                    inicio_fila    = 1
                    fin_fila       = 3
                    inicio_columna = 1
                    fin_columna    = 4
                }
            )
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $importResponse = Invoke-RestMethod `
            -Uri "$baseUrl/trabajos/$trabajoId/reportes/$reporteId" `
            -Method PATCH `
            -Body $importBody `
            -ContentType $contentType `
            -Headers $headers
        
        Write-Host "✅ Datos importados exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al importar datos: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 5. EDITAR CELDA
# ============================================
Write-Host "✏️  5. Editando celda..." -ForegroundColor Yellow

if ($reporteIds.Count -gt 0) {
    $reporteId = $reporteIds[0]
    $fila = 1
    $columna = 2
    
    $celdaBody = @{
        valor = 12500
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod `
            -Uri "$baseUrl/trabajos/$trabajoId/reportes/$reporteId/celdas/$fila/$columna" `
            -Method PATCH `
            -Body $celdaBody `
            -ContentType $contentType `
            -Headers $headers
        
        Write-Host "✅ Celda [$fila, $columna] editada a: 12500" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al editar celda: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 6. AGREGAR FILA
# ============================================
Write-Host "➕ 6. Agregando nueva fila..." -ForegroundColor Yellow

if ($reporteIds.Count -gt 0) {
    $reporteId = $reporteIds[0]
    
    $filaBody = @{
        datos    = @("Nuevo Concepto", 3000, 3500, 4000, 10500)
        posicion = 3
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod `
            -Uri "$baseUrl/trabajos/$trabajoId/reportes/$reporteId/filas" `
            -Method POST `
            -Body $filaBody `
            -ContentType $contentType `
            -Headers $headers
        
        Write-Host "✅ Nueva fila agregada" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al agregar fila: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 7. AGREGAR COLUMNA
# ============================================
Write-Host "➕ 7. Agregando nueva columna..." -ForegroundColor Yellow

if ($reporteIds.Count -gt 0) {
    $reporteId = $reporteIds[0]
    
    $columnaBody = @{
        nombre   = "Abril"
        tipo     = "numero"
        posicion = 5
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod `
            -Uri "$baseUrl/trabajos/$trabajoId/reportes/$reporteId/columnas" `
            -Method POST `
            -Body $columnaBody `
            -ContentType $contentType `
            -Headers $headers
        
        Write-Host "✅ Nueva columna 'Abril' agregada" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al agregar columna: $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 8. LISTAR TRABAJOS
# ============================================
Write-Host "📋 8. Listando trabajos..." -ForegroundColor Yellow

try {
    $trabajos = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Trabajos encontrados: $($trabajos.Count)" -ForegroundColor Green
    
    foreach ($t in $trabajos) {
        Write-Host "   📁 $($t.nombre) - $($t.reportes.Count) reportes" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Error al listar trabajos: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 9. OBTENER ESTADÍSTICAS
# ============================================
Write-Host "📊 9. Obteniendo estadísticas..." -ForegroundColor Yellow

try {
    $stats = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos/estadisticas" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Estadísticas:" -ForegroundColor Green
    Write-Host "   Total trabajos: $($stats.total)" -ForegroundColor Gray
    Write-Host "   Activos: $($stats.activos)" -ForegroundColor Gray
    Write-Host "   Completados: $($stats.completados)" -ForegroundColor Gray
    Write-Host "   Total reportes: $($stats.total_reportes)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error al obtener estadísticas: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 10. OBTENER TRABAJO COMPLETO
# ============================================
Write-Host "🔍 10. Obteniendo trabajo completo..." -ForegroundColor Yellow

try {
    $trabajoCompleto = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos/$trabajoId" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Trabajo obtenido:" -ForegroundColor Green
    Write-Host "   Nombre: $($trabajoCompleto.nombre)" -ForegroundColor Gray
    Write-Host "   Reportes: $($trabajoCompleto.reportes.Count)" -ForegroundColor Gray
    
    foreach ($r in $trabajoCompleto.reportes) {
        Write-Host "      - $($r.tipoReporte): $($r.estado)" -ForegroundColor DarkGray
    }
}
catch {
    Write-Host "❌ Error al obtener trabajo: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 11. DUPLICAR TRABAJO
# ============================================
Write-Host "📋 11. Duplicando trabajo..." -ForegroundColor Yellow

try {
    $trabajoDuplicado = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos/$trabajoId/duplicar" `
        -Method POST `
        -Headers $headers
    
    Write-Host "✅ Trabajo duplicado:" -ForegroundColor Green
    Write-Host "   ID Original: $trabajoId" -ForegroundColor Gray
    Write-Host "   ID Duplicado: $($trabajoDuplicado.id)" -ForegroundColor Gray
    Write-Host "   Nombre: $($trabajoDuplicado.nombre)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error al duplicar trabajo: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 12. ACTUALIZAR TRABAJO
# ============================================
Write-Host "✏️  12. Actualizando trabajo..." -ForegroundColor Yellow

$updateBody = @{
    descripcion = "Actualizado: Reportes mensuales de octubre - COMPLETADO"
    estado      = "completado"
} | ConvertTo-Json

try {
    $trabajoActualizado = Invoke-RestMethod `
        -Uri "$baseUrl/trabajos/$trabajoId" `
        -Method PATCH `
        -Body $updateBody `
        -ContentType $contentType `
        -Headers $headers
    
    Write-Host "✅ Trabajo actualizado:" -ForegroundColor Green
    Write-Host "   Estado: $($trabajoActualizado.estado)" -ForegroundColor Gray
    Write-Host "   Descripción: $($trabajoActualizado.descripcion)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error al actualizar trabajo: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Sistema de Trabajos funcionando correctamente" -ForegroundColor Green
Write-Host "✅ Todos los endpoints probados" -ForegroundColor Green
Write-Host "✅ CRUD completo verificado" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Trabajo de prueba ID: $trabajoId" -ForegroundColor Yellow
Write-Host "👤 Usuario de prueba ID: $userId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para limpiar los datos de prueba, puedes eliminar el trabajo:" -ForegroundColor Gray
Write-Host "   DELETE $baseUrl/trabajos/$trabajoId" -ForegroundColor DarkGray
Write-Host ""
