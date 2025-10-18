# Dr. Mays Nutrition - Create Superuser (PowerShell)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Dr. Mays Nutrition - Create Superuser" -ForegroundColor Green
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

Write-Host "Creating Django superuser account..." -ForegroundColor Yellow
Write-Host "Please enter the following information:" -ForegroundColor Cyan
Write-Host ""

try {
    python manage.py createsuperuser
    Write-Host ""
    Write-Host "✓ Superuser created successfully!" -ForegroundColor Green
    Write-Host "You can now access the admin panel at: http://localhost:8000/admin" -ForegroundColor Cyan
} catch {
    Write-Host "✗ ERROR: Failed to create superuser" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to continue"
