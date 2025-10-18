#!/bin/bash

# Fix Database Permissions Script for Dr. Mays Nutrition Platform
# This script fixes the database permission issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="drmays_db"
DB_USER="drmays_user"
PROJECT_DIR="/srv/mayslife/Nutrition-Mays"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Permissions Fix Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root to fix database permissions."
   exit 1
fi

print_status "Fixing database permissions for $DB_USER on $DB_NAME..."

# Step 1: Stop Django services to avoid conflicts
print_status "Stopping Django services..."
systemctl stop drmays 2>/dev/null || true
systemctl stop drmays-celery 2>/dev/null || true
systemctl stop drmays-celery-beat 2>/dev/null || true

# Step 2: Fix database permissions
print_status "Connecting to PostgreSQL and fixing permissions..."

sudo -u postgres psql << EOF
-- Grant all necessary permissions
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;

-- Make user owner of the database
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

-- Grant permissions on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Show current permissions
\du $DB_USER
\l $DB_NAME
EOF

# Step 3: Test database connection
print_status "Testing database connection..."
if sudo -u postgres psql -c "SELECT 1;" -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    print_status "Database connection test successful"
else
    print_warning "Database connection test failed, trying alternative approach..."
    
    # Alternative: Recreate user with superuser privileges
    print_status "Recreating database user with superuser privileges..."
    sudo -u postgres psql << EOF
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD 'your_secure_password_here' CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
fi

# Step 4: Navigate to project directory and run migrations
print_status "Running Django migrations..."
cd $PROJECT_DIR

# Activate virtual environment
source venv/bin/activate

# Set Django settings
export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production

# Run migrations
python manage.py migrate

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully"
else
    print_error "Migrations failed. Please check the error messages above."
    exit 1
fi

# Step 5: Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Step 6: Set proper permissions
print_status "Setting proper file permissions..."
chown -R mays:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 775 $PROJECT_DIR/media
chmod -R 775 $PROJECT_DIR/logs

# Step 7: Start services
print_status "Starting Django services..."
systemctl start drmays
systemctl start drmays-celery
systemctl start drmays-celery-beat

# Step 8: Check service status
print_status "Checking service status..."
services=("drmays" "drmays-celery" "drmays-celery-beat")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        print_status "$service is running"
    else
        print_error "$service failed to start"
        systemctl status $service
    fi
done

# Step 9: Test application
print_status "Testing application..."
sleep 5  # Wait for services to start

if curl -f http://127.0.0.1:8000/health/ > /dev/null 2>&1; then
    print_status "Application is responding"
else
    print_warning "Application health check failed"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Database permissions fix completed!${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Next steps:"
echo "1. Create a superuser account:"
echo "   sudo -u mays bash -c 'cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py createsuperuser'"
echo ""
echo "2. Test the application at: https://www.mayslife.uk"
echo ""
echo "3. Check logs if there are any issues:"
echo "   sudo tail -f $PROJECT_DIR/logs/django.log"
echo "   sudo tail -f /var/log/nginx/mayslife.uk.error.log"

print_status "Database permissions have been fixed successfully!"
