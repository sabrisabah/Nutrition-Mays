#!/bin/bash

# Quick Fix for Logging Permissions Issue
# This script quickly fixes the logging permissions error

echo "============================================================"
echo "Quick Fix for Logging Permissions Issue"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing logging permissions..."

# 1. Create log directory and files
echo "📁 Creating log directory and files..."
sudo mkdir -p /var/log/drmays
sudo touch /var/log/drmays.log
sudo touch /var/log/drmays/drmays.log

# 2. Set proper ownership and permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/log/drmays
sudo chown www-data:www-data /var/log/drmays.log
sudo chmod 755 /var/log/drmays
sudo chmod 644 /var/log/drmays.log
sudo chmod 644 /var/log/drmays/drmays.log

# 3. Update Django settings to use console logging only (safer approach)
echo "⚙️  Updating Django settings..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup2

# Remove the problematic logging configuration
sed -i '/# Logging configuration/,/^}/d' dr_mays_nutrition/settings.py

# Add simple console logging configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Simple logging configuration for production
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

# 4. Test the configuration
echo "🧪 Testing configuration..."
python manage.py check --deploy

# 5. Restart services
echo "🔄 Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service

# 6. Check status
echo "✅ Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    echo "✅ Django service is running"
else
    echo "❌ Django service is not running"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

echo ""
echo "🎉 Logging permissions issue should now be fixed!"
echo "🌐 Your application should be accessible at: https://mayslife.uk"
echo ""
echo "📊 To monitor your application:"
echo "sudo systemctl status drmays.service"
echo "sudo journalctl -u drmays.service -f"
echo ""
