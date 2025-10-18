@echo off
echo ========================================
echo Dr. Mays Nutrition - Windows 11 Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Python and Node.js are installed. Proceeding with setup...
echo.

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements_windows.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

REM Create .env file from template
echo Creating environment configuration...
if not exist .env (
    copy env_windows_template.txt .env
    echo Created .env file from template
) else (
    echo .env file already exists, skipping...
)

REM Create logs directory
echo Creating logs directory...
if not exist logs mkdir logs

REM Run Django migrations
echo Running Django migrations...
set DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows
python manage.py makemigrations
python manage.py migrate
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)

REM Create superuser (optional)
echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the development servers:
echo 1. Run: start_dev.bat
echo.
echo To create a superuser account:
echo 1. Run: create_superuser.bat
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Admin Panel: http://localhost:8000/admin
echo.
pause
