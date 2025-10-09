param([string]$Token)
$response = Invoke-RestMethod -Uri "http://localhost:3000/trabajos" -Headers @{ Authorization = "Bearer $Token" }
$response | ConvertTo-Json -Compress
