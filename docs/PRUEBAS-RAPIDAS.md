# 🧪 Pruebas Rápidas del Sistema de Trabajos

## Variables de Entorno (reemplazar con valores reales)

```powershell
$TOKEN = "tu_token_jwt_aqui"
$BASE_URL = "http://localhost:3000"
```

---

## 1️⃣ Autenticación

### Registrar usuario

```powershell
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -ContentType "application/json" -Body '{
  "email": "contador@example.com",
  "password": "password123",
  "name": "Juan Contador"
}'
$response
```

### Login y obtener token

```powershell
$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -ContentType "application/json" -Body '{
  "email": "contador@example.com",
  "password": "password123"
}'
$TOKEN = $loginResponse.access_token
Write-Host "Token obtenido: $TOKEN"
```

---

## 2️⃣ Gestión de Trabajos

### Crear trabajo

```powershell
$trabajo = Invoke-RestMethod -Uri "$BASE_URL/trabajos" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "nombre": "Contabilidad Octubre 2025",
  "mes": "2025-10-01",
  "descripcion": "Reportes contables del mes de octubre"
}'
$TRABAJO_ID = $trabajo.id
Write-Host "Trabajo creado con ID: $TRABAJO_ID"
$trabajo
```

### Listar todos los trabajos

```powershell
$trabajos = Invoke-RestMethod -Uri "$BASE_URL/trabajos" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$trabajos
```

### Obtener un trabajo específico

```powershell
$trabajoDetalle = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$trabajoDetalle
```

### Actualizar trabajo

```powershell
$trabajoActualizado = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "nombre": "Contabilidad Octubre 2025 - ACTUALIZADO",
  "estado": "activo"
}'
$trabajoActualizado
```

### Obtener estadísticas

```powershell
$estadisticas = Invoke-RestMethod -Uri "$BASE_URL/trabajos/estadisticas" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$estadisticas
```

---

## 3️⃣ Gestión de Reportes

### Crear reporte en el trabajo

```powershell
$reporte = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "tipoReporte": "mensual",
  "archivoOriginal": "reporte_octubre.xlsx"
}'
$REPORTE_ID = $reporte.id
Write-Host "Reporte creado con ID: $REPORTE_ID"
$reporte
```

### Importar datos al reporte

```powershell
$datosImportados = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/importar" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "headers": ["Concepto", "Monto", "Fecha"],
  "filas": [
    ["Venta 1", 1000, "2025-10-01"],
    ["Venta 2", 2000, "2025-10-02"],
    ["Venta 3", 1500, "2025-10-03"],
    ["Venta 4", 3000, "2025-10-04"],
    ["Venta 5", 2500, "2025-10-05"]
  ],
  "metadata": {
    "total_filas": 5,
    "total_columnas": 3,
    "fecha_importacion": "2025-10-06T12:00:00Z"
  }
}'
$datosImportados
```

### Ver vista previa del reporte

```powershell
$vistaPrevia = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/vista-previa" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$vistaPrevia
```

---

## 4️⃣ Edición de Celdas

### Actualizar valor de una celda (fila 0, columna 1)

```powershell
$celdaActualizada = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/celdas/0/1" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "valor": 1200
}'
$celdaActualizada
```

### Agregar fórmula en una celda (fila 5, columna 1)

```powershell
$celdaConFormula = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/celdas/5/1" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "formula": "=SUM(B1:B5)"
}'
$celdaConFormula
```

---

## 5️⃣ Agregar Filas y Columnas

### Agregar nueva fila

```powershell
$nuevaFila = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/filas" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "datos": ["Venta Nueva", 5000, "2025-10-06"],
  "posicion": 5
}'
$nuevaFila
```

### Agregar nueva columna

```powershell
$nuevaColumna = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/columnas" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "nombre": "Monto con IVA",
  "tipo": "formula",
  "formula": "=B{fila}*1.21",
  "posicion": 3
}'
$nuevaColumna
```

---

## 6️⃣ Obtener Reporte Completo

### Ver el reporte con todas las modificaciones

```powershell
$reporteCompleto = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$reporteCompleto | ConvertTo-Json -Depth 10
```

### Listar todos los reportes del trabajo

```powershell
$reportes = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
$reportes
```

---

## 7️⃣ Duplicar y Eliminar

### Duplicar trabajo

```powershell
$trabajoDuplicado = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/duplicar" -Method Post -Headers @{Authorization="Bearer $TOKEN"}
$trabajoDuplicado
```

### Eliminar reporte

```powershell
Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID" -Method Delete -Headers @{Authorization="Bearer $TOKEN"}
Write-Host "Reporte eliminado"
```

### Eliminar trabajo

```powershell
Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID" -Method Delete -Headers @{Authorization="Bearer $TOKEN"}
Write-Host "Trabajo eliminado"
```

---

## 🔥 Script Completo de Prueba

```powershell
# Script completo para probar todo el flujo
$BASE_URL = "http://localhost:3000"

# 1. Registrar y login
Write-Host "=== 1. AUTENTICACIÓN ===" -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -ContentType "application/json" -Body '{
  "email": "contador@example.com",
  "password": "password123"
}'
$TOKEN = $loginResponse.access_token
Write-Host "✅ Token obtenido" -ForegroundColor Green

# 2. Crear trabajo
Write-Host "`n=== 2. CREAR TRABAJO ===" -ForegroundColor Cyan
$trabajo = Invoke-RestMethod -Uri "$BASE_URL/trabajos" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "nombre": "Prueba Completa",
  "mes": "2025-10-01",
  "descripcion": "Prueba del sistema completo"
}'
$TRABAJO_ID = $trabajo.id
Write-Host "✅ Trabajo creado: $($trabajo.nombre)" -ForegroundColor Green

# 3. Crear reporte
Write-Host "`n=== 3. CREAR REPORTE ===" -ForegroundColor Cyan
$reporte = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "tipoReporte": "mensual",
  "archivoOriginal": "prueba.xlsx"
}'
$REPORTE_ID = $reporte.id
Write-Host "✅ Reporte creado: $($reporte.tipoReporte)" -ForegroundColor Green

# 4. Importar datos
Write-Host "`n=== 4. IMPORTAR DATOS ===" -ForegroundColor Cyan
$datosImportados = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/importar" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "headers": ["Concepto", "Monto", "Fecha"],
  "filas": [
    ["Venta 1", 1000, "2025-10-01"],
    ["Venta 2", 2000, "2025-10-02"],
    ["Venta 3", 1500, "2025-10-03"]
  ],
  "metadata": {
    "total_filas": 3,
    "total_columnas": 3,
    "fecha_importacion": "2025-10-06T12:00:00Z"
  }
}'
Write-Host "✅ Datos importados" -ForegroundColor Green

# 5. Editar celda
Write-Host "`n=== 5. EDITAR CELDA ===" -ForegroundColor Cyan
$celdaEditada = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/celdas/0/1" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "valor": 1200
}'
Write-Host "✅ Celda editada: $($celdaEditada.valor)" -ForegroundColor Green

# 6. Agregar fórmula
Write-Host "`n=== 6. AGREGAR FÓRMULA ===" -ForegroundColor Cyan
$formula = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/celdas/3/1" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "formula": "=SUM(B1:B3)"
}'
Write-Host "✅ Fórmula agregada. Resultado: $($formula.resultado)" -ForegroundColor Green

# 7. Agregar fila
Write-Host "`n=== 7. AGREGAR FILA ===" -ForegroundColor Cyan
$nuevaFila = Invoke-RestMethod -Uri "$BASE_URL/trabajos/$TRABAJO_ID/reportes/$REPORTE_ID/filas" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{
  "datos": ["Venta Nueva", 3000, "2025-10-06"]
}'
Write-Host "✅ Fila agregada" -ForegroundColor Green

# 8. Ver estadísticas
Write-Host "`n=== 8. ESTADÍSTICAS ===" -ForegroundColor Cyan
$estadisticas = Invoke-RestMethod -Uri "$BASE_URL/trabajos/estadisticas" -Method Get -Headers @{Authorization="Bearer $TOKEN"}
Write-Host "✅ Total trabajos: $($estadisticas.total)" -ForegroundColor Green
Write-Host "✅ Total reportes: $($estadisticas.total_reportes)" -ForegroundColor Green

Write-Host "`n=== ✅ PRUEBA COMPLETA EXITOSA ===" -ForegroundColor Green
Write-Host "Trabajo ID: $TRABAJO_ID"
Write-Host "Reporte ID: $REPORTE_ID"
```

---

## 📝 Notas

- Reemplaza `$TOKEN` con tu token JWT real
- Los IDs se guardan automáticamente en variables para usarlas en pruebas posteriores
- Usa `-Verbose` al final de los comandos para ver más detalles
- Para ver JSON formateado: `| ConvertTo-Json -Depth 10`

---

**Fecha**: 6 de octubre de 2025
