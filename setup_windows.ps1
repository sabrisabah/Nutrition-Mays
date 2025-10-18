# Dr. Mays Nutrition - Windows 11 PowerShell Setup Script
# Run this script in PowerShell as Administrator for best results

Write-Host "========================================" -ForegroundColor Green
Write-Host "Dr. Mays Nutrition - Windows 11 Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Python and Node.js are installed. Proceeding with setup..." -ForegroundColor Green
Write-Host ""

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
try {
    python -m venv venv
    Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to create virtual environment" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
try {
    pip install -r requirements_windows.txt
    Write-Host "✓ Python dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Node.js dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to install Node.js dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create .env file from template
Write-Host "Creating environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item "env_windows_template.txt" ".env"
    Write-Host "✓ Created .env file from template" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists, skipping..." -ForegroundColor Yellow
}

# Create logs directory
Write-Host "Creating logs directory..." -ForegroundColor Yellow
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs"
    Write-Host "✓ Logs directory created" -ForegroundColor Green
}

# Set environment variable for Django settings
$env:DJANGO_SETTINGS_MODULE = "dr_mays_nutrition.settings_windows"

# Run Django migrations
Write-Host "Running Django migrations..." -ForegroundColor Yellow
try {
    python manage.py makemigrations
    python manage.py migrate
    Write-Host "✓ Database migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to run migrations" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development servers:" -ForegroundColor Cyan
Write-Host "1. Run: .\start_dev.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To create a superuser account:" -ForegroundColor Cyan
Write-Host "1. Run: .\create_superuser.ps1" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "- Admin Panel: http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"