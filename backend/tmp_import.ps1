param(
    [string]$Token,
    [string]$TrabajoId,
    [string]$FilePath
)

Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Token)

$content = New-Object System.Net.Http.MultipartFormDataContent
$fileStream = [System.IO.File]::OpenRead($FilePath)
$fileContent = New-Object System.Net.Http.StreamContent($fileStream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
$content.Add($fileContent, 'file', [System.IO.Path]::GetFileName($FilePath))

$response = $client.PostAsync("http://localhost:3000/trabajos/$TrabajoId/reporte-base/importar", $content).Result

if (-not $response.IsSuccessStatusCode) {
    $details = $response.Content.ReadAsStringAsync().Result
    throw "Request failed with status ${($response.StatusCode)}: $details"
}

$response.Content.ReadAsStringAsync().Result
