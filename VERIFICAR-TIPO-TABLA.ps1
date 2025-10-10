# Script rápido: Verificar qué tabla estás usando
# Ejecuta esto en la consola del navegador (F12)

Write-Host "`n🔍 Verificador de Tipo de Tabla`n" -ForegroundColor Cyan

Write-Host "1️⃣  Abre tu navegador en http://localhost:5173" -ForegroundColor White
Write-Host "2️⃣  Abre DevTools (F12)" -ForegroundColor White
Write-Host "3️⃣  Ve a un Trabajo" -ForegroundColor White
Write-Host "4️⃣  Selecciona un mes" -ForegroundColor White
Write-Host "5️⃣  Haz clic en 'Ver' en un reporte" -ForegroundColor White
Write-Host "6️⃣  Busca en la consola el mensaje:`n" -ForegroundColor White

Write-Host "   🔍 ReporteCard - Tipo de reporte: XXXXX`n" -ForegroundColor Gray

Write-Host "📋 Interpretación:`n" -ForegroundColor Cyan

Write-Host "   Si dice 'INGRESOS':" -ForegroundColor Yellow
Write-Host "      ❌ Estás usando ReporteViewer (tabla vieja)" -ForegroundColor Red
Write-Host "      ❌ NO es editable" -ForegroundColor Red
Write-Host "      ⚠️  Necesitas migrar a tipo nuevo`n" -ForegroundColor Yellow

Write-Host "   Si dice 'INGRESOS_AUXILIAR':" -ForegroundColor Green
Write-Host "      ✅ Estás usando AuxiliarIngresosTable" -ForegroundColor Green
Write-Host "      ✅ ES editable" -ForegroundColor Green
Write-Host "      ✅ Todo funcionando correctamente`n" -ForegroundColor Green

Write-Host "   Si dice 'INGRESOS_MI_ADMIN':" -ForegroundColor Green
Write-Host "      ✅ Estás usando MiAdminIngresosTable" -ForegroundColor Green
Write-Host "      ✅ ES editable" -ForegroundColor Green
Write-Host "      ✅ Todo funcionando correctamente`n" -ForegroundColor Green

Write-Host "💡 Tip adicional:" -ForegroundColor Cyan
Write-Host "   Busca también este mensaje en la UI (dentro del reporte):`n" -ForegroundColor White

Write-Host "   '⚠️ DEBUG: Tipo de reporte INGRESOS - Usando ReporteViewer genérico'`n" -ForegroundColor Yellow

Write-Host "   Si ves ese mensaje → Estás usando la tabla vieja NO editable`n" -ForegroundColor Red

Write-Host "🔧 Solución si estás usando tabla vieja:" -ForegroundColor Cyan
Write-Host "   1. Identifica el ID del reporte" -ForegroundColor White
Write-Host "   2. Actualiza su tipo en la base de datos" -ForegroundColor White
Write-Host "   3. O reimporta el archivo con el tipo correcto`n" -ForegroundColor White

Write-Host "📚 Lee el archivo completo:" -ForegroundColor Cyan
Write-Host "   docs\DIAGNOSTICO-TABLA-DEFAULT-VS-ESPECIFICAS.md`n" -ForegroundColor Gray
