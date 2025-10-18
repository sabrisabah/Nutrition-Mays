#!/bin/bash

# Fix for 404 login error on Ubuntu server
# This script updates the Django application with the latest code and restarts services

echo "=== Fixing 404 Login Error on Ubuntu Server ==="
echo "Server: 167.172.71.182 (mayslife.uk)"
echo "Date: $(date)"
echo ""

# Set variables
PROJECT_DIR="/home/mays/drmays"
SERVICE_NAME="drmays"
NGINX_SITE="mayslife.uk"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    log "Running as root - good for system operations"
else
    log "Not running as root - some operations may require sudo"
fi

log "Starting fix process..."

# 1. Navigate to project directory
log "Navigating to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
    log "ERROR: Cannot access project directory $PROJECT_DIR"
    exit 1
}

# 2. Activate virtual environment
log "Activating virtual environment..."
source venv/bin/activate || {
    log "ERROR: Cannot activate virtual environment"
    exit 1
}

# 3. Pull latest code (if using git)
if [ -d ".git" ]; then
    log "Pulling latest code from git..."
    git pull origin main || {
        log "WARNING: Git pull failed - continuing with current code"
    }
else
    log "No git repository found - using current code"
fi

# 4. Install/update dependencies
log "Installing/updating Python dependencies..."
pip install -r requirements.txt || {
    log "ERROR: Failed to install dependencies"
    exit 1
}

# 5. Run Django checks
log "Running Django system checks..."
python manage.py check || {
    log "ERROR: Django system check failed"
    exit 1
}

# 6. Run migrations
log "Running database migrations..."
python manage.py migrate || {
    log "ERROR: Database migration failed"
    exit 1
}

# 7. Collect static files
log "Collecting static files..."
python manage.py collectstatic --noinput || {
    log "ERROR: Failed to collect static files"
    exit 1
}

# 8. Set proper permissions
log "Setting proper file permissions..."
chown -R mays:mays "$PROJECT_DIR" || {
    log "WARNING: Failed to set ownership - may need sudo"
}

# 9. Restart Django service
log "Restarting Django service..."
systemctl restart "$SERVICE_NAME" || {
    log "ERROR: Failed to restart Django service"
    exit 1
}

# 10. Check service status
log "Checking Django service status..."
systemctl status "$SERVICE_NAME" --no-pager -l || {
    log "ERROR: Django service is not running properly"
    exit 1
}

# 11. Test nginx configuration
log "Testing nginx configuration..."
nginx -t || {
    log "ERROR: Nginx configuration is invalid"
    exit 1
}

# 12. Restart nginx
log "Restarting nginx..."
systemctl restart nginx || {
    log "ERROR: Failed to restart nginx"
    exit 1
}

# 13. Check nginx status
log "Checking nginx status..."
systemctl status nginx --no-pager -l || {
    log "ERROR: Nginx is not running properly"
    exit 1
}

# 14. Test the login endpoint
log "Testing login endpoint..."
sleep 5  # Wait for services to fully start

# Test with curl
LOGIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    "http://127.0.0.1:8000/api/auth/login/")

if [ "$LOGIN_TEST" = "400" ] || [ "$LOGIN_TEST" = "401" ]; then
    log "SUCCESS: Login endpoint is responding (HTTP $LOGIN_TEST - expected for invalid credentials)"
elif [ "$LOGIN_TEST" = "404" ]; then
    log "ERROR: Login endpoint still returning 404 - URL routing issue"
    exit 1
else
    log "WARNING: Login endpoint returned HTTP $LOGIN_TEST - unexpected response"
fi

# 15. Check logs for any errors
log "Checking recent Django logs..."
journalctl -u "$SERVICE_NAME" --since "5 minutes ago" --no-pager -l | tail -20

log "Checking recent nginx logs..."
tail -20 /var/log/nginx/mayslife.uk.error.log 2>/dev/null || {
    log "WARNING: Cannot access nginx error log"
}

# 16. Final status check
log "Final service status check..."
echo ""
echo "=== Service Status ==="
systemctl is-active "$SERVICE_NAME" && echo "Django service: ACTIVE" || echo "Django service: INACTIVE"
systemctl is-active nginx && echo "Nginx service: ACTIVE" || echo "Nginx service: INACTIVE"

echo ""
echo "=== Network Status ==="
netstat -tlnp | grep :8000 && echo "Port 8000: LISTENING" || echo "Port 8000: NOT LISTENING"
netstat -tlnp | grep :80 && echo "Port 80: LISTENING" || echo "Port 80: NOT LISTENING"
netstat -tlnp | grep :443 && echo "Port 443: LISTENING" || echo "Port 443: NOT LISTENING"

echo ""
log "=== Fix Complete ==="
log "If issues persist, check the logs above and verify:"
log "1. Django service is running: systemctl status $SERVICE_NAME"
log "2. Nginx is running: systemctl status nginx"
log "3. Port 8000 is listening: netstat -tlnp | grep :8000"
log "4. Check Django logs: journalctl -u $SERVICE_NAME -f"
log "5. Check nginx logs: tail -f /var/log/nginx/mayslife.uk.error.log"

echo ""
log "To test the login endpoint manually:"
log "curl -X POST -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}' http://127.0.0.1:8000/api/auth/login/"

echo ""
log "Frontend should now be able to connect to: https://mayslife.uk/api/auth/login/"
