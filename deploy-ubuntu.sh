#!/bin/bash

# Ubuntu Deployment Script for Dr. Mays Nutrition System
# Domain: mayslife.uk | IP: 158.178.143.50
# Usage: chmod +x deploy-ubuntu.sh && ./deploy-ubuntu.sh

set -e  # Exit on any error

echo "============================================================"
echo "Dr. Mays Nutrition System - Ubuntu Deployment Script"
echo "Domain: mayslife.uk | IP: 158.178.143.50"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Please run on Ubuntu 20.04+"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install required packages
print_status "Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
sudo apt install -y nginx redis-server supervisor git curl wget
sudo apt install -y postgresql postgresql-contrib postgresql-client
sudo apt install -y certbot python3-certbot-nginx
sudo apt install -y ufw

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
print_status "Verifying installations..."
python3 --version
node --version
npm --version

# Step 3: Setup PostgreSQL
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE drmays_nutrition;" || true
sudo -u postgres psql -c "CREATE USER drmays_user WITH PASSWORD 'drmays_secure_password_2024';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;" || true
sudo -u postgres psql -c "ALTER USER drmays_user CREATEDB;" || true

# Step 4: Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/drmays
sudo chown $USER:$USER /var/www/drmays

# Check if we're in the project directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

# Copy project files
print_status "Copying project files..."
cp -r . /var/www/drmays/
cd /var/www/drmays

# Step 5: Setup Python environment
print_status "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Step 6: Setup Node.js environment
print_status "Installing Node.js dependencies..."
npm install

# Step 7: Create production environment file
print_status "Creating production environment configuration..."
cat > .env << EOF
# Production Environment Configuration for mayslife.uk
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50

# Database Configuration
DATABASE_URL=postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (configure with your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment Providers (configure with your payment providers)
ZAINCASH_MERCHANT_ID=your-merchant-id
ZAINCASH_SECRET_KEY=your-secret-key
ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init

ASIAHAWALA_MERCHANT_ID=your-merchant-id
ASIAHAWALA_SECRET_KEY=your-secret-key
ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init
EOF

# Step 8: Update Django settings for production
print_status "Updating Django settings for production..."
cat >> dr_mays_nutrition/settings.py << EOF

# Production Settings
import dj_database_url

# Database
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='sqlite:///db.sqlite3'))
}

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static Files
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS for Production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
]

# Update ALLOWED_HOSTS
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
EOF

# Step 9: Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > gunicorn.conf.py << EOF
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

# Step 10: Database migration and setup
print_status "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Step 11: Build frontend
print_status "Building React frontend..."
npm run build

# Step 12: Setup systemd services
print_status "Setting up systemd services..."

# Django service
sudo tee /etc/systemd/system/drmays.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/gunicorn --config gunicorn.conf.py dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Celery worker service
sudo tee /etc/systemd/system/drmays-celery.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Worker
After=network.target redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Celery beat service
sudo tee /etc/systemd/system/drmays-celery-beat.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Beat
After=network.target redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drmays
Environment=PATH=/var/www/drmays/venv/bin
ExecStart=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Step 13: Setup Nginx
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/mayslife.uk > /dev/null << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mayslife.uk www.mayslife.uk;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name mayslife.uk www.mayslife.uk;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/mayslife.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mayslife.uk/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Static Files
    location /static/ {
        alias /var/www/drmays/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/drmays/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # API and Admin Routes
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Frontend Routes
    location / {
        root /var/www/drmays/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Step 14: Setup firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Step 15: Set permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles
sudo chmod -R 644 /var/www/drmays/dist

# Step 16: Enable and start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service
sudo systemctl enable redis-server
sudo systemctl enable postgresql
sudo systemctl enable nginx

sudo systemctl start redis-server
sudo systemctl start postgresql
sudo systemctl start nginx
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# Step 17: Get SSL certificate
print_status "Setting up SSL certificate..."
print_warning "Make sure your domain mayslife.uk points to this server's IP (158.178.143.50) before continuing"
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."
sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk --non-interactive --agree-tos --email admin@mayslife.uk

# Step 18: Setup automatic SSL renewal
print_status "Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Step 19: Create backup script
print_status "Creating backup script..."
cat > /var/www/drmays/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/drmays"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump drmays_nutrition > $BACKUP_DIR/database_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/drmays

# Clean old backups (older than 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/drmays/backup.sh

# Setup daily backup
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/drmays/backup.sh") | crontab -

# Step 20: Final checks
print_status "Performing final checks..."

# Check service status
services=("drmays" "drmays-celery" "drmays-celery-beat" "nginx" "redis-server" "postgresql")
for service in "${services[@]}"; do
    if sudo systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Test database connection
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
fi

# Test Redis connection
if redis-cli ping > /dev/null 2>&1; then
    print_success "Redis connection successful"
else
    print_error "Redis connection failed"
fi

print_success "Deployment completed successfully!"
echo ""
echo "============================================================"
echo "🎉 Dr. Mays Nutrition System is now deployed!"
echo "============================================================"
echo ""
echo "🌐 Website: https://mayslife.uk"
echo "🔧 Admin Panel: https://mayslife.uk/admin/"
echo "📡 API: https://mayslife.uk/api/"
echo ""
echo "📋 Next Steps:"
echo "1. Create a superuser: sudo -u www-data /var/www/drmays/venv/bin/python /var/www/drmays/manage.py createsuperuser"
echo "2. Configure your email settings in /var/www/drmays/.env"
echo "3. Configure payment providers in /var/www/drmays/.env"
echo "4. Test your application at https://mayslife.uk"
echo ""
echo "📊 Monitor your application:"
echo "- Service status: sudo systemctl status drmays.service"
echo "- Application logs: sudo journalctl -u drmays.service -f"
echo "- Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔄 Update application:"
echo "- Run: cd /var/www/drmays && ./update-app.sh"
echo ""
print_success "Deployment script completed successfully!"
