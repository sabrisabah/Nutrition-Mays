#!/bin/bash

# Quick Fix for Service Execution Issue (Exit Code 203/EXEC)
# This script quickly fixes the systemd service execution error

echo "============================================================"
echo "Quick Fix for Service Execution Issue"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing service execution issue..."

# 1. Stop the failing service
echo "🛑 Stopping failing service..."
sudo systemctl stop drmays.service

# 2. Ensure Gunicorn is installed
echo "📦 Installing Gunicorn..."
source venv/bin/activate
pip install gunicorn

# 3. Create Gunicorn config if missing
echo "⚙️  Creating Gunicorn configuration..."
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

# 4. Fix systemd service file with absolute paths
echo "🔧 Fixing systemd service file..."
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
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 5. Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod +x /var/www/drmays/venv/bin/gunicorn

# 6. Test the command manually
echo "🧪 Testing Gunicorn command..."
sudo -u www-data /var/www/drmays/venv/bin/gunicorn --config /var/www/drmays/gunicorn.conf.py dr_mays_nutrition.wsgi:application --check-config

# 7. Reload systemd and start service
echo "🔄 Reloading systemd and starting service..."
sudo systemctl daemon-reload
sudo systemctl start drmays.service

# 8. Check status
echo "✅ Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    echo "✅ Django service is now running!"
else
    echo "❌ Django service is still not running"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

echo ""
echo "🎉 Service execution issue should now be fixed!"
echo "🌐 Your application should be accessible at: https://mayslife.uk"
echo ""
echo "📊 To monitor your application:"
echo "sudo systemctl status drmays.service"
echo "sudo journalctl -u drmays.service -f"
echo ""
