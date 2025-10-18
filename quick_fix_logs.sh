#!/bin/bash

# Quick Fix for Logs Directory Issue
# This script creates the missing logs directory and fixes permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/srv/mayslife/Nutrition-Mays"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Quick Fix for Logs Directory${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root to create directories."
   exit 1
fi

# Navigate to project directory
cd $PROJECT_DIR

print_status "Creating logs directory..."
mkdir -p logs
chown mays:www-data logs
chmod 755 logs

print_status "Creating media directory..."
mkdir -p media
chown mays:www-data media
chmod 775 media

print_status "Setting proper permissions on project directory..."
chown -R mays:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 775 $PROJECT_DIR/media
chmod -R 775 $PROJECT_DIR/logs

print_status "Fixing database permissions..."
sudo -u postgres psql << EOF
GRANT ALL PRIVILEGES ON DATABASE drmays_db TO drmays_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO drmays_user;
GRANT CREATE ON SCHEMA public TO drmays_user;
GRANT USAGE ON SCHEMA public TO drmays_user;
ALTER DATABASE drmays_db OWNER TO drmays_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drmays_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drmays_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO drmays_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO drmays_user;
EOF

print_status "Installing required packages..."
source venv/bin/activate
pip install psycopg2-binary

print_status "Running Django migrations..."
export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
python manage.py migrate

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully!"
else
    print_error "Migrations failed. Please check the error messages above."
    exit 1
fi

print_status "Collecting static files..."
python manage.py collectstatic --noinput

print_status "All fixes completed successfully!"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Quick Fix Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Next steps:"
echo "1. Create a superuser account:"
echo "   sudo -u mays bash -c 'cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py createsuperuser'"
echo ""
echo "2. Start the services:"
echo "   systemctl start drmays"
echo "   systemctl start drmays-celery"
echo "   systemctl start drmays-celery-beat"
echo ""
echo "3. Test the application at: https://www.mayslife.uk"

print_status "Your Django application is now ready!"
