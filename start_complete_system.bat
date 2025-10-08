@echo off
echo ============================================================
echo Starting Complete Dr. Mays Nutrition System
echo ============================================================
echo.
echo This will start:
echo 1. Django Development Server
echo 2. Integrated Meal Monitoring System
echo 3. Auto Refresh System
echo.
echo Press Ctrl+C to stop all systems
echo ============================================================
echo.

REM Start Django server in background
echo Starting Django server...
start "Django Server" cmd /k "python manage.py runserver"

REM Wait a moment for Django to start
timeout /t 5 /nobreak > nul

REM Start the integrated system
echo Starting Integrated Meal Monitoring System...
python manage.py start_integrated_system --daemon

echo.
echo ============================================================
echo All systems started successfully!
echo ============================================================
echo.
echo Django Server: http://localhost:8000
echo Integrated System: Running in background
echo.
echo Press any key to stop all systems...
pause > nul

echo.
echo Stopping all systems...
taskkill /f /im python.exe > nul 2>&1
echo All systems stopped.
pause
