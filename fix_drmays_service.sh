#!/bin/bash

# Fix Dr. Mays Nutrition Service - Complete Solution
# Run this script on your Linux server as root or with sudo

echo "=== Fixing Dr. Mays Nutrition Service ==="

# 1. Create log directory with proper permissions
echo "1. Creating log directory..."
mkdir -p /var/log/mayslife
chown -R www-data:www-data /var/log/mayslife
chmod -R 755 /var/log/mayslife

# 2. Create log files with proper permissions
echo "2. Creating log files..."
touch /var/log/mayslife/error.log
touch /var/log/mayslife/access.log
touch /var/log/mayslife/django.log
chown www-data:www-data /var/log/mayslife/*.log
chmod 644 /var/log/mayslife/*.log

# 3. Check and fix Django project directory permissions
echo "3. Fixing Django project permissions..."
DJANGO_DIR="/home/mays/drmays"  # Adjust this path to your actual Django project location
if [ -d "$DJANGO_DIR" ]; then
    chown -R mays:mays "$DJANGO_DIR"
    chmod -R 755 "$DJANGO_DIR"
    # Make sure manage.py is executable
    chmod +x "$DJANGO_DIR/manage.py"
else
    echo "Warning: Django directory $DJANGO_DIR not found. Please update the path in this script."
fi

# 4. Check systemd service file
echo "4. Checking systemd service configuration..."
SERVICE_FILE="/etc/systemd/system/drmays.service"

if [ -f "$SERVICE_FILE" ]; then
    echo "Current service file content:"
    cat "$SERVICE_FILE"
    echo ""
    echo "Checking if service runs as correct user..."
    if ! grep -q "User=mays" "$SERVICE_FILE"; then
        echo "Warning: Service should run as user 'mays'"
    fi
    if ! grep -q "Group=mays" "$SERVICE_FILE"; then
        echo "Warning: Service should run as group 'mays'"
    fi
else
    echo "Error: Service file $SERVICE_FILE not found!"
    exit 1
fi

# 5. Reload systemd and restart service
echo "5. Reloading systemd and restarting service..."
systemctl daemon-reload
systemctl stop drmays.service
sleep 2
systemctl start drmays.service
sleep 3

# 6. Check service status
echo "6. Checking service status..."
systemctl status drmays.service --no-pager

# 7. Check if Django is responding
echo "7. Testing Django application..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ | grep -q "200\|301\|302"; then
    echo "✓ Django application is responding on localhost:8000"
else
    echo "✗ Django application is not responding on localhost:8000"
    echo "Checking recent logs..."
    journalctl -u drmays.service --no-pager -n 20
fi

# 8. Check nginx configuration
echo "8. Checking nginx configuration..."
if systemctl is-active --quiet nginx; then
    echo "Nginx is running"
    nginx -t
    if [ $? -eq 0 ]; then
        echo "✓ Nginx configuration is valid"
        systemctl reload nginx
    else
        echo "✗ Nginx configuration has errors"
    fi
else
    echo "Nginx is not running, starting it..."
    systemctl start nginx
fi

# 9. Test external access
echo "9. Testing external access..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" https://mayslife.uk/ | grep -q "200\|301\|302"; then
    echo "✓ Website https://mayslife.uk/ is accessible"
else
    echo "✗ Website https://mayslife.uk/ is not accessible"
    echo "Checking nginx error logs..."
    tail -n 10 /var/log/nginx/error.log
fi

echo ""
echo "=== Fix Complete ==="
echo "If issues persist, check:"
echo "1. Django logs: tail -f /var/log/mayslife/error.log"
echo "2. Service logs: journalctl -u drmays.service -f"
echo "3. Nginx logs: tail -f /var/log/nginx/error.log"
echo "4. Service status: systemctl status drmays.service"
