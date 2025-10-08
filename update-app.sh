#!/bin/bash

# Update Script for Dr. Mays Nutrition System
# Usage: ./update-app.sh

set -e  # Exit on any error

echo "============================================================"
echo "Dr. Mays Nutrition System - Update Script"
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

# Check if running from correct directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

# Create backup before update
print_status "Creating backup before update..."
BACKUP_DIR="/backup/drmays"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
print_status "Backing up database..."
pg_dump drmays_nutrition > $BACKUP_DIR/database_$DATE.sql

# Backup files
print_status "Backing up application files..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/drmays

print_success "Backup completed: $DATE"

# Stop services
print_status "Stopping services..."
sudo systemctl stop drmays.service
sudo systemctl stop drmays-celery.service
sudo systemctl stop drmays-celery-beat.service

# Update code (if using git)
if [ -d ".git" ]; then
    print_status "Updating code from git repository..."
    git pull origin main
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Update Python dependencies
print_status "Updating Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Update Node.js dependencies
print_status "Updating Node.js dependencies..."
npm install

# Run database migrations
print_status "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Build frontend
print_status "Building React frontend..."
npm run build

# Set permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles
sudo chmod -R 644 /var/www/drmays/dist

# Start services
print_status "Starting services..."
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# Check service status
print_status "Checking service status..."
services=("drmays" "drmays-celery" "drmays-celery-beat")
for service in "${services[@]}"; do
    if sudo systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_error "$service is not running"
        print_status "Restarting $service..."
        sudo systemctl restart $service
    fi
done

# Clean old backups (older than 7 days)
print_status "Cleaning old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

print_success "Application update completed successfully!"
echo ""
echo "🌐 Your application is now updated and running at: https://mayslife.uk"
echo ""
echo "📊 Check service status:"
echo "sudo systemctl status drmays.service"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u drmays.service -f"
echo ""
