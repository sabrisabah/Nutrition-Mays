@echo off
echo ========================================
echo Dr. Mays Nutrition - Starting Development Servers
echo ========================================
echo.

REM Check if virtual environment exists
if not exist venv (
    echo ERROR: Virtual environment not found
    echo Please run setup_windows.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Set Django settings
set DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

echo Starting Django development server...
echo Backend will be available at: http://localhost:8000
echo Admin panel: http://localhost:8000/admin
echo.

REM Start Django server in a new window
start "Django Backend" cmd /k "call venv\Scripts\activate.bat && set DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows && python manage.py runserver 0.0.0.0:8000"

REM Wait a moment for Django to start
timeout /t 3 /nobreak >nul

echo Starting React development server...
echo Frontend will be available at: http://localhost:3000
echo.

REM Start React development server
npm run dev

echo.
echo Both servers are now running!
echo Press Ctrl+C to stop the frontend server
echo The backend server will continue running in its own window
pause
