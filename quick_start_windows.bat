@echo off
echo ========================================
echo Dr. Mays Nutrition - Quick Start Windows 11
echo ========================================
echo.

REM Check if this is the first run
if not exist venv (
    echo First time setup detected...
    echo Running initial setup...
    call setup_windows.bat
    if %errorlevel% neq 0 (
        echo Setup failed. Please check the errors above.
        pause
        exit /b 1
    )
    echo.
    echo Setup completed! Starting development servers...
    echo.
)

REM Start development servers
call start_dev.bat
