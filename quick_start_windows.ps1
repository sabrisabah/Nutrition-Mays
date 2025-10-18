# Dr. Mays Nutrition - Quick Start Windows 11 (PowerShell)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Dr. Mays Nutrition - Quick Start Windows 11" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if this is the first run
if (-not (Test-Path "venv")) {
    Write-Host "First time setup detected..." -ForegroundColor Yellow
    Write-Host "Running initial setup..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        & ".\setup_windows.ps1"
        Write-Host ""
        Write-Host "Setup completed! Starting development servers..." -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Setup failed. Please check the errors above." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start development servers
& ".\start_dev.ps1"
