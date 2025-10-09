#!/bin/bash

# Complete Fix for All Issues
# This script fixes all the issues: static files, database, logging, and services

echo "============================================================"
echo "Complete Fix for All Issues"
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

print_status "Starting complete fix for all issues..."

# 1. Stop all services
print_status "Stopping all services..."
sudo systemctl stop drmays.service
sudo systemctl stop drmays-celery.service
sudo systemctl stop drmays-celery-beat.service

# 2. Install required packages
print_status "Installing required packages..."
pip install dj-database-url psycopg2-binary

# 3. Ensure PostgreSQL is running
print_status "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Setup database
print_status "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE drmays_nutrition;" 2>/dev/null || print_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER drmays_user WITH PASSWORD 'drmays_secure_password_2024';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;"
sudo -u postgres psql -c "ALTER USER drmays_user CREATEDB;"

# 5. Setup logging
print_status "Setting up logging..."
sudo mkdir -p /var/log/drmays
sudo touch /var/log/drmays/drmays.log
sudo chown -R www-data:www-data /var/log/drmays
sudo chmod 755 /var/log/drmays
sudo chmod 644 /var/log/drmays/drmays.log

# 6. Fix Django settings
print_status "Fixing Django settings..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup7

# Remove problematic configurations
sed -i '/DATABASES = {/,/}/d' dr_mays_nutrition/settings.py
sed -i '/STATICFILES_DIRS = \[/,/\]/d' dr_mays_nutrition/settings.py
sed -i '/# Logging configuration/,/^}/d' dr_mays_nutrition/settings.py

# Add correct configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings - Complete Fix
import dj_database_url

# Database Configuration - PostgreSQL
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition'))
}

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

# CORS settings for production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
]

# Update ALLOWED_HOSTS
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

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
        'dr_mays_nutrition': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# 7. Update .env file
print_status "Updating environment configuration..."
cat > .env << 'EOF'
# Production Environment Configuration for mayslife.uk
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50

# Database Configuration - PostgreSQL
DATABASE_URL=postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment Providers
ZAINCASH_MERCHANT_ID=your-merchant-id
ZAINCASH_SECRET_KEY=your-secret-key
ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init

ASIAHAWALA_MERCHANT_ID=your-merchant-id
ASIAHAWALA_SECRET_KEY=your-secret-key
ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init
EOF

# 8. Remove SQLite database
print_status "Removing SQLite database..."
rm -f db.sqlite3

# 9. Test Django configuration
print_status "Testing Django configuration..."
python manage.py check --deploy

# 10. Run migrations
print_status "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# 11. Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# 12. Create superuser
print_status "Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')" | python manage.py shell

# 13. Fix systemd service files
print_status "Fixing systemd service files..."

# Django service
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

# Celery worker service
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

# Celery beat service
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

# 14. Ensure Gunicorn config exists
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

# 15. Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 16. Reload systemd and start services
print_status "Reloading systemd and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service

# Start services
sudo systemctl start drmays.service
sleep 5
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# 17. Check service status
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

# 18. Check Nginx
print_status "Checking Nginx..."
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    print_status "Starting Nginx..."
    sudo systemctl start nginx
fi

# 19. Test the application
print_status "Testing application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ | grep -q "200\|302"; then
    print_success "Django application is responding"
else
    print_error "Django application is not responding"
    print_status "Checking Django logs..."
    sudo journalctl -u drmays.service --no-pager -l
fi

print_success "All issues fixed!"
echo ""
echo "🎉 Your application should now be accessible at: https://mayslife.uk"
echo "👤 Admin credentials: admin / admin123"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo "sudo systemctl status drmays-celery.service"
echo "sudo systemctl status drmays-celery-beat.service"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
