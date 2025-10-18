@echo off
echo ========================================
echo Dr. Mays Nutrition - Create Superuser
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

echo Creating Django superuser account...
echo Please enter the following information:
echo.

python manage.py createsuperuser

if %errorlevel% neq 0 (
    echo ERROR: Failed to create superuser
    pause
    exit /b 1
)

echo.
echo Superuser created successfully!
echo You can now access the admin panel at: http://localhost:8000/admin
echo.
pause
