# Dr. Mays Nutrition - Start Development Servers (PowerShell)
# This script starts both Django backend and React frontend servers

Write-Host "========================================" -ForegroundColor Green
Write-Host "Dr. Mays Nutrition - Starting Development Servers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "✗ ERROR: Virtual environment not found" -ForegroundColor Red
    Write-Host "Please run setup_windows.ps1 first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Set Django settings
$env:DJANGO_SETTINGS_MODULE = "dr_mays_nutrition.settings_windows"

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs"
}

Write-Host "Starting Django development server..." -ForegroundColor Yellow
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Admin panel: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host ""

# Start Django server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\venv\Scripts\Activate.ps1'; `$env:DJANGO_SETTINGS_MODULE = 'dr_mays_nutrition.settings_windows'; python manage.py runserver 0.0.0.0:8000" -WindowStyle Normal

# Wait a moment for Django to start
Start-Sleep -Seconds 3

Write-Host "Starting React development server..." -ForegroundColor Yellow
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Start React development server
try {
    npm run dev
} catch {
    Write-Host "✗ ERROR: Failed to start React development server" -ForegroundColor Red
    Write-Host "Make sure you have run setup_windows.ps1 first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Both servers are now running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the frontend server" -ForegroundColor Yellow
Write-Host "The backend server will continue running in its own window" -ForegroundColor Yellow
Read-Host "Press Enter to continue"
