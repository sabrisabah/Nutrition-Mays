@echo off
echo === Deploying Login Fix to Ubuntu Server ===
echo Server: 167.172.71.182 (mayslife.uk)
echo Date: %date% %time%
echo.

REM Set variables
set SERVER_IP=167.172.71.182
set SERVER_USER=mays
set SERVER_PATH=/home/mays/drmays
set LOCAL_PROJECT=C:\Project\1212

echo [%time%] Starting deployment...

REM 1. Upload the updated accounts files
echo [%time%] Uploading updated accounts/views.py...
scp "%LOCAL_PROJECT%\accounts\views.py" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/accounts/

echo [%time%] Uploading updated accounts/urls.py...
scp "%LOCAL_PROJECT%\accounts\urls.py" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/accounts/

REM 2. Upload the fix script
echo [%time%] Uploading fix script...
scp "%LOCAL_PROJECT%\fix_login_404_error.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

REM 3. Upload the diagnostic script
echo [%time%] Uploading diagnostic script...
scp "%LOCAL_PROJECT%\diagnose_server_issue.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo [%time%] Files uploaded successfully!
echo.
echo === Next Steps ===
echo 1. SSH to your server:
echo    ssh %SERVER_USER%@%SERVER_IP%
echo.
echo 2. Run the diagnostic script to check current status:
echo    cd %SERVER_PATH%
echo    chmod +x diagnose_server_issue.sh
echo    ./diagnose_server_issue.sh
echo.
echo 3. Run the fix script to apply the changes:
echo    chmod +x fix_login_404_error.sh
echo    ./fix_login_404_error.sh
echo.
echo 4. Test the login endpoint:
echo    curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}" https://mayslife.uk/api/auth/login/
echo.
echo [%time%] Deployment preparation complete!
pause
