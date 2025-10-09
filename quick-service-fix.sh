#!/bin/bash

# Quick Fix for Service Issues
# This script quickly fixes the systemd service failures and static files error

echo "============================================================"
echo "Quick Fix for Service Issues"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing service issues..."

# 1. Stop all services
echo "🛑 Stopping all services..."
sudo systemctl stop drmays.service
sudo systemctl stop drmays-celery.service
sudo systemctl stop drmays-celery-beat.service

# 2. Fix static files configuration
echo "📁 Fixing static files configuration..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup6

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

# 3. Test Django configuration
echo "🧪 Testing Django configuration..."
python manage.py check --deploy

# 4. Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# 5. Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 6. Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# 7. Start services
echo "🚀 Starting services..."
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# 8. Check status
echo "✅ Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    echo "✅ Django service is running"
else
    echo "❌ Django service is not running"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

if sudo systemctl is-active --quiet drmays-celery.service; then
    echo "✅ Celery worker is running"
else
    echo "❌ Celery worker is not running"
    echo "📋 Check logs: sudo journalctl -u drmays-celery.service -f"
fi

if sudo systemctl is-active --quiet drmays-celery-beat.service; then
    echo "✅ Celery beat is running"
else
    echo "❌ Celery beat is not running"
    echo "📋 Check logs: sudo journalctl -u drmays-celery-beat.service -f"
fi

# 9. Check Nginx
echo "🌐 Checking Nginx..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    echo "🔄 Starting Nginx..."
    sudo systemctl start nginx
fi

# 10. Test application
echo "🧪 Testing application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ | grep -q "200\|302"; then
    echo "✅ Django application is responding"
else
    echo "❌ Django application is not responding"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

echo ""
echo "🎉 Service issues should now be fixed!"
echo "🌐 Your application should be accessible at: https://mayslife.uk"
echo ""
echo "📊 To monitor your application:"
echo "sudo systemctl status drmays.service"
echo "sudo journalctl -u drmays.service -f"
echo ""
