#!/bin/bash

# Fix Logging Permissions Issue for Dr. Mays Nutrition System
# This script fixes the "Permission denied: '/var/log/drmays.log'" error

echo "============================================================"
echo "Fixing Logging Permissions Issue"
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

print_status "Fixing logging permissions..."

# 1. Create log directory and files with proper permissions
print_status "Creating log directory and files..."
sudo mkdir -p /var/log/drmays
sudo touch /var/log/drmays.log
sudo touch /var/log/drmays-celery.log
sudo touch /var/log/drmays-celery-beat.log

# 2. Set proper ownership and permissions
print_status "Setting proper ownership and permissions..."
sudo chown -R www-data:www-data /var/log/drmays
sudo chown www-data:www-data /var/log/drmays.log
sudo chown www-data:www-data /var/log/drmays-celery.log
sudo chown www-data:www-data /var/log/drmays-celery-beat.log

sudo chmod 755 /var/log/drmays
sudo chmod 644 /var/log/drmays.log
sudo chmod 644 /var/log/drmays-celery.log
sudo chmod 644 /var/log/drmays-celery-beat.log

# 3. Update Django settings with better logging configuration
print_status "Updating Django settings with better logging configuration..."

# Create a backup of current settings
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup

# Remove the problematic logging configuration and add a better one
# First, let's remove the old logging config if it exists
sed -i '/# Logging configuration/,/^}/d' dr_mays_nutrition/settings.py

# Add better logging configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/drmays/drmays.log',
            'maxBytes': 1024*1024*5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'dr_mays_nutrition': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'accounts': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'meal_plans': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'bookings': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'payments': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'reports': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# 4. Create logrotate configuration for log management
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/drmays > /dev/null << 'EOF'
/var/log/drmays/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload drmays.service > /dev/null 2>&1 || true
    endscript
}
EOF

# 5. Test the logging configuration
print_status "Testing logging configuration..."
python manage.py check --deploy

# 6. Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# 7. Set proper permissions for the application
print_status "Setting application permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles

# 8. Restart services
print_status "Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service

# 9. Check service status
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

# 10. Test logging
print_status "Testing logging functionality..."
python manage.py shell -c "
import logging
logger = logging.getLogger('django')
logger.info('Logging test successful!')
print('Logging test completed.')
"

print_success "Logging permissions issue fixed!"
echo ""
echo "🌐 Your application should now be accessible at: https://mayslife.uk"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo ""
echo "📋 View application logs:"
echo "sudo tail -f /var/log/drmays/drmays.log"
echo ""
echo "📋 View service logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
