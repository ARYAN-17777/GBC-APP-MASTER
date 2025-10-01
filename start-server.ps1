
Write-Host "Starting General Bilimoria's Canteen on port 8082..." -ForegroundColor Green
Write-Host ""
Write-Host "Access your app at: http://localhost:8082" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    npx expo start --web --port 8082
}
catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
