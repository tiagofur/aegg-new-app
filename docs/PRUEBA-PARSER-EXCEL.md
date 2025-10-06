# 🧪 Test del Parser de Excel

## Crear archivo Excel de prueba

Para probar el parser, primero necesitamos crear un archivo Excel de prueba. Puedes usar este script de PowerShell:

```powershell
# Script para crear un Excel de prueba
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Add()

# Hoja 1: Reporte Mensual
$sheet1 = $workbook.Worksheets.Item(1)
$sheet1.Name = "Reporte Mensual"
$sheet1.Cells.Item(1, 1) = "Concepto"
$sheet1.Cells.Item(1, 2) = "Enero"
$sheet1.Cells.Item(1, 3) = "Febrero"
$sheet1.Cells.Item(1, 4) = "Marzo"
$sheet1.Cells.Item(1, 5) = "Total"

$sheet1.Cells.Item(2, 1) = "Ventas"
$sheet1.Cells.Item(2, 2) = 10000
$sheet1.Cells.Item(2, 3) = 12000
$sheet1.Cells.Item(2, 4) = 15000
$sheet1.Cells.Item(2, 5) = 37000

$sheet1.Cells.Item(3, 1) = "Servicios"
$sheet1.Cells.Item(3, 2) = 5000
$sheet1.Cells.Item(3, 3) = 6000
$sheet1.Cells.Item(3, 4) = 7000
$sheet1.Cells.Item(3, 5) = 18000

# Hoja 2: Ingresos
$sheet2 = $workbook.Worksheets.Add()
$sheet2.Name = "Ingresos"
$sheet2.Cells.Item(1, 1) = "Fecha"
$sheet2.Cells.Item(1, 2) = "Cliente"
$sheet2.Cells.Item(1, 3) = "Monto"

$sheet2.Cells.Item(2, 1) = "2025-10-01"
$sheet2.Cells.Item(2, 2) = "Cliente A"
$sheet2.Cells.Item(2, 3) = 5000

$sheet2.Cells.Item(3, 1) = "2025-10-02"
$sheet2.Cells.Item(3, 2) = "Cliente B"
$sheet2.Cells.Item(3, 3) = 7500

# Guardar
$filePath = "$PWD\test-reporte.xlsx"
$workbook.SaveAs($filePath)
$workbook.Close()
$excel.Quit()

Write-Output "Excel creado en: $filePath"
```

## O crear manualmente:

1. Abre Excel
2. Crea una hoja llamada "Reporte Mensual":

   - A1: Concepto | B1: Enero | C1: Febrero | D1: Marzo | E1: Total
   - A2: Ventas | B2: 10000 | C2: 12000 | D2: 15000 | E2: 37000
   - A3: Servicios | B3: 5000 | C3: 6000 | D3: 7000 | E3: 18000

3. Crea una segunda hoja llamada "Ingresos":

   - A1: Fecha | B1: Cliente | C1: Monto
   - A2: 2025-10-01 | B2: Cliente A | C2: 5000
   - A3: 2025-10-02 | B3: Cliente B | C3: 7500

4. Guarda como `test-reporte.xlsx`

## Probar el servicio

Una vez creado el Excel, usa este script para probar:

```powershell
# Leer el archivo como bytes
$bytes = [System.IO.File]::ReadAllBytes("$PWD\test-reporte.xlsx")
$base64 = [Convert]::ToBase64String($bytes)

# Token de autenticación (obtener primero con login)
$headers = @{
    Authorization = "Bearer TU_TOKEN_AQUI"
}

# Crear trabajo
$trabajoBody = @{
    nombre = "Test Importación Excel"
    mes = "2025-10-01"
    descripcion = "Prueba de importación"
} | ConvertTo-Json

$trabajo = Invoke-RestMethod -Uri "http://localhost:3001/trabajos" `
    -Method POST -Body $trabajoBody `
    -ContentType "application/json" -Headers $headers

$trabajoId = $trabajo.id
Write-Output "Trabajo creado: $trabajoId"

# Crear reporte (tipo mensual = multi-hoja)
$reporteBody = @{
    tipoReporte = "mensual"
    archivoOriginal = "test-reporte.xlsx"
} | ConvertTo-Json

$reporte = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes" `
    -Method POST -Body $reporteBody `
    -ContentType "application/json" -Headers $headers

$reporteId = $reporte.id
Write-Output "Reporte creado: $reporteId"

# Importar el Excel
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test-reporte.xlsx`"",
    "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet$LF",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes),
    "--$boundary--$LF"
) -join $LF

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/importar-excel" `
    -Method POST `
    -ContentType "multipart/form-data; boundary=$boundary" `
    -Body $bodyLines `
    -Headers $headers

Write-Output "Importación exitosa!"
$response | ConvertTo-Json -Depth 10
```
