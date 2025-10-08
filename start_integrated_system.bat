@echo off
echo ============================================================
echo Starting Integrated Meal Monitoring System
echo ============================================================
echo.
echo This will start the complete integrated meal monitoring system
echo including meal monitoring and auto refresh functionality.
echo.
echo Press Ctrl+C to stop the system
echo ============================================================
echo.

REM Start the integrated system
python manage.py start_integrated_system --daemon

echo.
echo ============================================================
echo Integrated system stopped
echo ============================================================
pause
