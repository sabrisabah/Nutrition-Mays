#!/bin/bash

# Fix Database Permissions Issue for Dr. Mays Nutrition System
# This script fixes the "attempt to write a readonly database" error

echo "============================================================"
echo "Fixing Database Permissions Issue"
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

print_status "Fixing database permissions and configuration..."

# 1. Check if PostgreSQL is running
print_status "Checking PostgreSQL status..."
if sudo systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 2. Ensure PostgreSQL database and user exist
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE drmays_nutrition;" 2>/dev/null || print_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER drmays_user WITH PASSWORD 'drmays_secure_password_2024';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;" 2>/dev/null
sudo -u postgres psql -c "ALTER USER drmays_user CREATEDB;" 2>/dev/null

# 3. Test PostgreSQL connection
print_status "Testing PostgreSQL connection..."
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    print_success "PostgreSQL connection successful"
else
    print_error "PostgreSQL connection failed"
    exit 1
fi

# 4. Install required packages
print_status "Installing required packages..."
pip install dj-database-url psycopg2-binary

# 5. Update Django settings to force PostgreSQL usage
print_status "Updating Django settings to use PostgreSQL..."

# Create a backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup3

# Remove any existing database configuration
sed -i '/DATABASES = {/,/}/d' dr_mays_nutrition/settings.py

# Add proper PostgreSQL configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Database Configuration - Force PostgreSQL
import dj_database_url

DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition'))
}
EOF

# 6. Update .env file to ensure proper database URL
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

# 7. Remove SQLite database file if it exists
print_status "Removing SQLite database file..."
if [ -f "db.sqlite3" ]; then
    rm -f db.sqlite3
    print_success "SQLite database file removed"
fi

# 8. Test database connection
print_status "Testing Django database connection..."
python manage.py check --database default

# 9. Run migrations
print_status "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# 10. Set proper permissions for the application
print_status "Setting application permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays

# 11. Test creating a superuser
print_status "Testing superuser creation..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')" | python manage.py shell

# 12. Restart services
print_status "Restarting services..."
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service

# 13. Check service status
print_status "Checking service status..."
if sudo systemctl is-active --quiet drmays.service; then
    print_success "Django service is running"
else
    print_error "Django service is not running"
    print_status "Checking logs..."
    sudo journalctl -u drmays.service --no-pager -l
fi

# 14. Test database connection from Django
print_status "Testing database connection from Django..."
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT version();')
result = cursor.fetchone()
print('Database version:', result[0])
"

print_success "Database permissions issue fixed!"
echo ""
echo "🌐 Your application should now be accessible at: https://mayslife.uk"
echo "👤 Admin credentials: admin / admin123"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
