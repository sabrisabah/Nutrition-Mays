#!/bin/bash

# Fix Service Issues for Dr. Mays Nutrition System
# This script fixes systemd service failures and static files configuration

echo "============================================================"
echo "Fixing Service Issues"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

print_status "Fixing service issues..."

# 1. Stop all services first
print_status "Stopping all services..."
sudo systemctl stop drmays.service
sudo systemctl stop drmays-celery.service
sudo systemctl stop drmays-celery-beat.service

# 2. Fix static files configuration
print_status "Fixing static files configuration..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup5

# Remove the problematic STATICFILES_DIRS configuration
sed -i '/STATICFILES_DIRS = \[/,/\]/d' dr_mays_nutrition/settings.py

# Add correct static files configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Static Files Configuration - Fixed
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Only add STATICFILES_DIRS if the static directory exists and is not the same as STATIC_ROOT
if (BASE_DIR / 'static').exists() and (BASE_DIR / 'static') != (BASE_DIR / 'staticfiles'):
    STATICFILES_DIRS = [
        BASE_DIR / 'static',
    ]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
EOF

# 3. Fix systemd service files
print_status "Fixing systemd service files..."

# Fix Django service
sudo tee /etc/systemd/system/drmays.service > /dev/null << 'EOF'
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/gunicorn --config gunicorn.conf.py dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Fix Celery worker service
sudo tee /etc/systemd/system/drmays-celery.service > /dev/null << 'EOF'
[Unit]
Description=Dr. Mays Nutrition Celery Worker
After=network.target redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Fix Celery beat service
sudo tee /etc/systemd/system/drmays-celery-beat.service > /dev/null << 'EOF'
[Unit]
Description=Dr. Mays Nutrition Celery Beat
After=network.target redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. Ensure Gunicorn config exists
print_status "Creating Gunicorn configuration..."
cat > gunicorn.conf.py << 'EOF'
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
EOF

# 5. Test Django configuration
print_status "Testing Django configuration..."
python manage.py check --deploy

# 6. Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# 7. Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 8. Reload systemd and start services
print_status "Reloading systemd and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service

# Start services one by one
print_status "Starting Django service..."
sudo systemctl start drmays.service

# Wait a moment for Django to start
sleep 5

print_status "Starting Celery worker..."
sudo systemctl start drmays-celery.service

print_status "Starting Celery beat..."
sudo systemctl start drmays-celery-beat.service

# 9. Check service status
print_status "Checking service status..."
services=("drmays" "drmays-celery" "drmays-celery-beat")
for service in "${services[@]}"; do
    if sudo systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_error "$service is not running"
        print_status "Checking logs for $service..."
        sudo journalctl -u $service --no-pager -l
    fi
done

# 10. Check Nginx status
print_status "Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    print_status "Starting Nginx..."
    sudo systemctl start nginx
fi

# 11. Test the application
print_status "Testing application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ | grep -q "200\|302"; then
    print_success "Django application is responding"
else
    print_error "Django application is not responding"
    print_status "Checking Django logs..."
    sudo journalctl -u drmays.service --no-pager -l
fi

print_success "Service issues fixed!"
echo ""
echo "🌐 Your application should now be accessible at: https://mayslife.uk"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo "sudo systemctl status drmays-celery.service"
echo "sudo systemctl status drmays-celery-beat.service"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
