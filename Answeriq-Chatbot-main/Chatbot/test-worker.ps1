# PowerShell script to test the Cloudflare Worker
# Usage: .\test-worker.ps1 [worker-url]

param(
    [string]$WorkerUrl = "http://localhost:8787"
)

Write-Host "Testing AnswerIQ Worker at: $WorkerUrl" -ForegroundColor Cyan
Write-Host ""

# Test data
$body = @{
    question = "What is photosynthesis?"
    reference_answer = "Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water. It generates oxygen as a byproduct and is essential for life on Earth."
    user_answer_1 = "Photosynthesis is how plants make food using sunlight, water, and CO2. They produce oxygen too."
} | ConvertTo-Json

Write-Host "Sending test request..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $WorkerUrl `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -UseBasicParsing

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host

} catch {
    Write-Host "✗ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error details: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
