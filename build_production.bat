@echo off
echo ========================================
echo Dr. Mays Nutrition - Building for Production
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

echo Building React frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo Collecting Django static files...
python manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo ERROR: Failed to collect static files
    pause
    exit /b 1
)

echo.
echo ========================================
echo Production build completed successfully!
echo ========================================
echo.
echo Built files are in the 'dist' and 'staticfiles' directories
echo You can now deploy these files to your production server
echo.
pause
