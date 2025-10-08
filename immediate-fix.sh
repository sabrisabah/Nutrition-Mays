#!/bin/bash

# Immediate Fix for Static Files Issue
# Run this script to fix the "Empty static prefix not permitted" error

echo "============================================================"
echo "Immediate Fix for Static Files Issue"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing static files configuration..."

# 1. Install required package
echo "📦 Installing dj-database-url..."
pip install dj-database-url

# 2. Update settings.py to ensure STATIC_URL is properly set
echo "⚙️  Updating Django settings..."

# Add production settings to the end of settings.py
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings - Static Files Fix
import dj_database_url

# Ensure static files are properly configured
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Database configuration
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
EOF

# 3. Update URLs to only serve static files in DEBUG mode
echo "🔗 Updating URLs configuration..."

# Create a backup
cp dr_mays_nutrition/urls.py dr_mays_nutrition/urls.py.backup

# Update urls.py
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

# 4. Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating environment file..."
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

# 5. Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# 6. Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 7. Restart services
echo "🔄 Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart nginx

# 8. Check status
echo "✅ Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    echo "✅ Django service is running"
else
    echo "❌ Django service is not running"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx service is running"
else
    echo "❌ Nginx service is not running"
    echo "📋 Check logs: sudo tail -f /var/log/nginx/error.log"
fi

echo ""
echo "🎉 Static files issue should now be fixed!"
echo "🌐 Your application should be accessible at: https://mayslife.uk"
echo ""
echo "📊 To monitor your application:"
echo "sudo systemctl status drmays.service"
echo "sudo journalctl -u drmays.service -f"
echo ""
