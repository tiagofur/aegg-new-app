$body = @{ email = "test@test.com"; password = "123456" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Compress
