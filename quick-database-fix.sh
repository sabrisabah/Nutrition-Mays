#!/bin/bash

# Quick Fix for Database Permissions Issue
# This script quickly fixes the "attempt to write a readonly database" error

echo "============================================================"
echo "Quick Fix for Database Permissions Issue"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing database configuration..."

# 1. Install required packages
echo "📦 Installing required packages..."
pip install dj-database-url psycopg2-binary

# 2. Ensure PostgreSQL is running
echo "🗄️  Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Create database and user if they don't exist
echo "👤 Setting up database user..."
sudo -u postgres psql -c "CREATE DATABASE drmays_nutrition;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER drmays_user WITH PASSWORD 'drmays_secure_password_2024';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;"
sudo -u postgres psql -c "ALTER USER drmays_user CREATEDB;"

# 4. Update Django settings to use PostgreSQL
echo "⚙️  Updating Django settings..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup4

# Remove any existing database configuration
sed -i '/DATABASES = {/,/}/d' dr_mays_nutrition/settings.py

# Add PostgreSQL configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Database Configuration - PostgreSQL
import dj_database_url

DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition'))
}
EOF

# 5. Update .env file
echo "📝 Updating environment file..."
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

# 6. Remove SQLite database file
echo "🗑️  Removing SQLite database file..."
rm -f db.sqlite3

# 7. Test database connection
echo "🧪 Testing database connection..."
python manage.py check --database default

# 8. Run migrations
echo "🔄 Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# 9. Create superuser
echo "👤 Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')" | python manage.py shell

# 10. Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays

# 11. Restart services
echo "🔄 Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service

# 12. Check status
echo "✅ Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    echo "✅ Django service is running"
else
    echo "❌ Django service is not running"
    echo "📋 Check logs: sudo journalctl -u drmays.service -f"
fi

echo ""
echo "🎉 Database permissions issue should now be fixed!"
echo "🌐 Your application should be accessible at: https://mayslife.uk"
echo "👤 Admin credentials: admin / admin123"
echo ""
echo "📊 To monitor your application:"
echo "sudo systemctl status drmays.service"
echo "sudo journalctl -u drmays.service -f"
echo ""
