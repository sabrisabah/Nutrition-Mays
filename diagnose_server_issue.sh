#!/bin/bash

# Diagnostic script for 404 login error
# Run this on the Ubuntu server to identify the issue

echo "=== Server Diagnostic for 404 Login Error ==="
echo "Server: 167.172.71.182 (mayslife.uk)"
echo "Date: $(date)"
echo ""

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting diagnostic..."

# 1. Check if Django service is running
log "1. Checking Django service status..."
systemctl status drmays --no-pager -l

echo ""

# 2. Check if nginx is running
log "2. Checking nginx service status..."
systemctl status nginx --no-pager -l

echo ""

# 3. Check port listening
log "3. Checking which ports are listening..."
netstat -tlnp | grep -E ":(80|443|8000)"

echo ""

# 4. Check Django logs
log "4. Recent Django service logs (last 50 lines)..."
journalctl -u drmays --since "1 hour ago" --no-pager -l | tail -50

echo ""

# 5. Check nginx logs
log "5. Recent nginx error logs..."
if [ -f "/var/log/nginx/mayslife.uk.error.log" ]; then
    tail -20 /var/log/nginx/mayslife.uk.error.log
else
    log "Nginx error log not found at /var/log/nginx/mayslife.uk.error.log"
fi

echo ""

# 6. Test local Django endpoint
log "6. Testing Django endpoint locally..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    "http://127.0.0.1:8000/api/auth/login/"

echo ""

# 7. Test through nginx
log "7. Testing through nginx..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    "https://mayslife.uk/api/auth/login/"

echo ""

# 8. Check Django URL configuration
log "8. Checking Django URL configuration..."
cd /home/mays/drmays || {
    log "ERROR: Cannot access Django project directory"
    exit 1
}

source venv/bin/activate
python manage.py check --deploy

echo ""

# 9. Check if UserViewSet exists
log "9. Checking if UserViewSet exists in accounts/views.py..."
if grep -q "class UserViewSet" accounts/views.py; then
    log "SUCCESS: UserViewSet found in accounts/views.py"
else
    log "ERROR: UserViewSet NOT found in accounts/views.py"
fi

echo ""

# 10. Check accounts/urls.py for router configuration
log "10. Checking accounts/urls.py for router configuration..."
if grep -q "router.register.*UserViewSet" accounts/urls.py; then
    log "SUCCESS: UserViewSet router registration found"
else
    log "ERROR: UserViewSet router registration NOT found"
fi

echo ""

# 11. Check main URLs configuration
log "11. Checking main URLs configuration..."
if grep -q "path('api/auth/', include('accounts.urls'))" dr_mays_nutrition/urls.py; then
    log "SUCCESS: accounts.urls included in main URLs"
else
    log "ERROR: accounts.urls NOT included in main URLs"
fi

echo ""

# 12. Check Django settings
log "12. Checking Django settings..."
echo "DEBUG setting:"
grep "DEBUG" dr_mays_nutrition/settings.py

echo "ALLOWED_HOSTS setting:"
grep "ALLOWED_HOSTS" dr_mays_nutrition/settings.py

echo ""

# 13. Check file permissions
log "13. Checking file permissions..."
ls -la accounts/views.py
ls -la accounts/urls.py
ls -la dr_mays_nutrition/urls.py

echo ""

# 14. Check if the code is up to date
log "14. Checking if code is up to date..."
if [ -d ".git" ]; then
    git status --porcelain
    echo "Last commit:"
    git log -1 --oneline
else
    log "No git repository found"
fi

echo ""

log "=== Diagnostic Complete ==="
log "Review the output above to identify the issue."
log "Common issues:"
log "1. Django service not running"
log "2. Missing UserViewSet in accounts/views.py"
log "3. Missing router configuration in accounts/urls.py"
log "4. Nginx not proxying correctly"
log "5. Code not updated on server"
