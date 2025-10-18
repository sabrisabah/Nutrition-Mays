# PowerShell script to deploy login fix to Ubuntu server
# Server: 167.172.71.182 (mayslife.uk)

Write-Host "=== Deploying Login Fix to Ubuntu Server ===" -ForegroundColor Green
Write-Host "Server: 167.172.71.182 (mayslife.uk)" -ForegroundColor Yellow
Write-Host "Date: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Set variables
$SERVER_IP = "167.172.71.182"
$SERVER_USER = "mays"
$SERVER_PATH = "/home/mays/drmays"
$LOCAL_PROJECT = "C:\Project\1212"

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting deployment..." -ForegroundColor Cyan

try {
    # 1. Upload the updated accounts files
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Uploading updated accounts/views.py..." -ForegroundColor Cyan
    scp "$LOCAL_PROJECT\accounts\views.py" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/accounts/"

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Uploading updated accounts/urls.py..." -ForegroundColor Cyan
    scp "$LOCAL_PROJECT\accounts\urls.py" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/accounts/"

    # 2. Upload the fix script
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Uploading fix script..." -ForegroundColor Cyan
    scp "$LOCAL_PROJECT\fix_login_404_error.sh" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"

    # 3. Upload the diagnostic script
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Uploading diagnostic script..." -ForegroundColor Cyan
    scp "$LOCAL_PROJECT\diagnose_server_issue.sh" "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/"

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Files uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Next Steps ===" -ForegroundColor Yellow
    Write-Host "1. SSH to your server:" -ForegroundColor White
    Write-Host "   ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Run the diagnostic script to check current status:" -ForegroundColor White
    Write-Host "   cd ${SERVER_PATH}" -ForegroundColor Gray
    Write-Host "   chmod +x diagnose_server_issue.sh" -ForegroundColor Gray
    Write-Host "   ./diagnose_server_issue.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Run the fix script to apply the changes:" -ForegroundColor White
    Write-Host "   chmod +x fix_login_404_error.sh" -ForegroundColor Gray
    Write-Host "   ./fix_login_404_error.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Test the login endpoint:" -ForegroundColor White
    Write-Host '   curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}" https://mayslife.uk/api/auth/login/' -ForegroundColor Gray
    Write-Host ""
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Deployment preparation complete!" -ForegroundColor Green

} catch {
    Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure you have SSH access to the server and SCP is available." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
