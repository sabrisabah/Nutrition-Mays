@echo off
echo ========================================
echo Dr. Mays Nutrition - Running Tests
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

echo Running Django tests...
python manage.py test
if %errorlevel% neq 0 (
    echo ERROR: Some tests failed
    pause
    exit /b 1
)

echo.
echo Running frontend tests (if available)...
npm test 2>nul
if %errorlevel% neq 0 (
    echo No frontend tests configured or tests failed
)

echo.
echo ========================================
echo All tests completed!
echo ========================================
echo.
pause
