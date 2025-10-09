#!/bin/bash

# =============================================================================
# EMERGENCY FIX FOR DJANGO SERVICE STARTUP ISSUES
# =============================================================================

set -e

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚨 EMERGENCY FIX FOR DJANGO SERVICE"
echo "=================================="

# Change to project directory
cd /var/www/drmays

# Stop all services
print_status "Stopping all services..."
sudo systemctl stop drmays.service drmays-celery.service drmays-celery-beat.service

# Fix critical issues
print_status "Fixing critical issues..."

# 1. Ensure virtual environment exists and is activated
if [ ! -d "venv" ]; then
    print_status "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# 2. Install/upgrade critical packages
print_status "Installing critical packages..."
pip install --upgrade pip
pip install gunicorn psycopg2-binary python-decouple dj-database-url

# 3. Create essential files
print_status "Creating essential files..."

# Create .env file
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-temp-key
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50
DATABASE_URL=postgresql://drmays_user:NewStrong!Passw0rd2025@localhost/drmays_nutrition
REDIS_URL=redis://localhost:6379
EOF

# Create Gunicorn config
cat > gunicorn.conf.py << 'EOF'
bind = "127.0.0.1:8000"
workers = 2
worker_class = "sync"
timeout = 30
keepalive = 2
max_requests = 1000
preload_app = True
EOF

# 4. Fix Django settings
print_status "Fixing Django settings..."

# Remove any existing production settings
sed -i '/# Production Settings - Complete Fix/,$d' dr_mays_nutrition/settings.py

# Add production settings
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings - Emergency Fix
import dj_database_url

# Database Configuration
DATABASES = {
    'default': dj_database_url.parse('postgresql://drmays_user:NewStrong!Passw0rd2025@localhost/drmays_nutrition')
}

# Static Files Configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# 5. Fix URLs
print_status "Fixing URLs..."
sed -i '/urlpatterns += static/d' dr_mays_nutrition/urls.py
cat >> dr_mays_nutrition/urls.py << 'EOF'

# Only serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 6. Create directories and set permissions
print_status "Setting up directories and permissions..."
mkdir -p staticfiles media
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod +x venv/bin/gunicorn

# 7. Run Django commands
print_status "Running Django commands..."
python3 manage.py collectstatic --noinput
python3 manage.py migrate

# 8. Create superuser safely
print_status "Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')" | python3 manage.py shell

# 9. Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/drmays.service > /dev/null << 'EOF'
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/var/www/drmays/venv/bin/gunicorn --config /var/www/drmays/gunicorn.conf.py dr_mays_nutrition.wsgi:application
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 10. Start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl start drmays.service
sleep 5

# Check status
if sudo systemctl is-active --quiet drmays.service; then
    print_success "Django service is running!"
else
    print_error "Django service failed to start"
    print_status "Checking logs..."
    sudo journalctl -u drmays.service --no-pager -l | tail -10
fi

# Test application
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ | grep -q "200\|302"; then
    print_success "Django application is responding!"
else
    print_error "Django application is not responding"
fi

echo ""
echo "🎯 Emergency fix complete!"
echo "Check the status above for results."
