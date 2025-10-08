#!/bin/bash

# Fix Static Files Issue for Dr. Mays Nutrition System
# This script fixes the "Empty static prefix not permitted" error

echo "============================================================"
echo "Fixing Static Files Configuration"
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

print_status "Fixing static files configuration..."

# 1. Update Django settings for production
print_status "Updating Django settings..."

# Create a backup of current settings
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup

# Add production settings to the end of settings.py
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings - Static Files Fix
import dj_database_url

# Ensure static files are properly configured for production
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Database configuration for production
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='sqlite:///db.sqlite3'))
}

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
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/drmays.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# 2. Update URLs configuration
print_status "Updating URLs configuration..."

# Create a backup of current urls.py
cp dr_mays_nutrition/urls.py dr_mays_nutrition/urls.py.backup

# Update urls.py to fix static files issue
cat > dr_mays_nutrition/urls.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/meals/', include('meal_plans.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    # path('api/notifications/', include('notifications.urls')),  # Temporarily commented out
    path('api/reports/', include('reports.urls')),
]

# Only serve static files in development mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 3. Create proper .env file if it doesn't exist
print_status "Creating/updating environment configuration..."

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Production Environment Configuration for mayslife.uk
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50

# Database Configuration
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
fi

# 4. Install required packages
print_status "Installing required packages..."
pip install dj-database-url

# 5. Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# 6. Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 7. Restart services
print_status "Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart nginx

# 8. Check service status
print_status "Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    print_success "Django service is running"
else
    print_error "Django service is not running"
    print_status "Checking logs..."
    sudo journalctl -u drmays.service --no-pager -l
fi

if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx service is running"
else
    print_error "Nginx service is not running"
    print_status "Checking Nginx logs..."
    sudo tail -f /var/log/nginx/error.log
fi

print_success "Static files configuration fixed!"
echo ""
echo "🌐 Your application should now be accessible at: https://mayslife.uk"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
