@echo off
REM Dr. Mays Nutrition Platform - Windows Deployment Helper
REM This script helps you deploy the application to your Ubuntu server

echo ========================================
echo Dr. Mays Nutrition Platform Deployment
echo ========================================
echo.
echo This script will help you deploy the application to your Ubuntu server.
echo Make sure you have SSH access to your server.
echo.

set /p SERVER_IP="Enter your server IP address (default: 152.42.167.125): "
if "%SERVER_IP%"=="" set SERVER_IP=152.42.167.125

set /p USERNAME="Enter your SSH username (default: root): "
if "%USERNAME%"=="" set USERNAME=root

echo.
echo Server IP: %SERVER_IP%
echo Username: %USERNAME%
echo.
echo This will:
echo 1. Upload deployment scripts to your server
echo 2. Run the deployment script
echo 3. Set up SSL certificates
echo 4. Configure all services
echo.
set /p CONFIRM="Continue? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo.
echo Step 1: Uploading deployment scripts...
scp deploy_to_ubuntu.sh %USERNAME%@%SERVER_IP%:/tmp/
scp setup_ssl_and_finalize.sh %USERNAME%@%SERVER_IP%:/tmp/
scp verify_deployment.sh %USERNAME%@%SERVER_IP%:/tmp/

if errorlevel 1 (
    echo Error: Failed to upload files. Please check your SSH connection.
    goto :end
)

echo.
echo Step 2: Running deployment script...
ssh %USERNAME%@%SERVER_IP% "chmod +x /tmp/deploy_to_ubuntu.sh && /tmp/deploy_to_ubuntu.sh"

if errorlevel 1 (
    echo Error: Deployment script failed. Please check the server logs.
    goto :end
)

echo.
echo Step 3: Setting up SSL certificates...
ssh %USERNAME%@%SERVER_IP% "chmod +x /tmp/setup_ssl_and_finalize.sh && /tmp/setup_ssl_and_finalize.sh"

if errorlevel 1 (
    echo Error: SSL setup failed. Please check the server logs.
    goto :end
)

echo.
echo Step 4: Verifying deployment...
ssh %USERNAME%@%SERVER_IP% "chmod +x /tmp/verify_deployment.sh && /tmp/verify_deployment.sh"

echo.
echo ========================================
echo Deployment Completed!
echo ========================================
echo.
echo Your Dr. Mays Nutrition Platform is now running at:
echo https://www.mayslife.uk
echo.
echo Admin panel: https://www.mayslife.uk/admin/
echo.
echo Next steps:
echo 1. Create a superuser account
echo 2. Update email configuration in .env file
echo 3. Configure payment provider credentials
echo 4. Test all functionality
echo.
echo For support, check the documentation or contact the development team.
echo.

:end
pause
