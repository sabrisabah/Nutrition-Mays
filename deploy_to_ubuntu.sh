#!/bin/bash

# Dr. Mays Nutrition Platform - Ubuntu 24.04 LTS Deployment Script
# IP: 152.42.167.125
# Domain: www.mayslife.uk
# GitHub: https://github.com/sabrisabah/Nutrition-Mays.git

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="www.mayslife.uk"
IP_ADDRESS="152.42.167.125"
GITHUB_REPO="https://github.com/sabrisabah/Nutrition-Mays.git"
APP_USER="mays"
APP_DIR="/home/$APP_USER/drmays"
DB_NAME="drmays_db"
DB_USER="drmays_user"
DB_PASSWORD=$(openssl rand -base64 32)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dr. Mays Nutrition Platform Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}IP: $IP_ADDRESS${NC}"
echo -e "${GREEN}GitHub: $GITHUB_REPO${NC}"
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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git vim htop ufw fail2ban software-properties-common

# Create application user
print_status "Creating application user: $APP_USER"
if ! id "$APP_USER" &>/dev/null; then
    sudo adduser --disabled-password --gecos "" $APP_USER
    sudo usermod -aG sudo $APP_USER
    sudo usermod -aG www-data $APP_USER
    print_status "User $APP_USER created successfully"
else
    print_warning "User $APP_USER already exists"
fi

# Install Python 3.11
print_status "Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install Node.js 18 LTS
print_status "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib postgresql-client
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
print_status "Installing Redis..."
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install additional dependencies
print_status "Installing additional dependencies..."
sudo apt install -y build-essential libpq-dev libjpeg-dev zlib1g-dev libffi-dev libssl-dev

# Install Certbot
print_status "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Configure PostgreSQL
print_status "Configuring PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Clone repository
print_status "Cloning repository..."
cd $APP_DIR
sudo -u $APP_USER git clone $GITHUB_REPO .

# Create virtual environment
print_status "Creating Python virtual environment..."
sudo -u $APP_USER python3.11 -m venv venv

# Install Python dependencies
print_status "Installing Python dependencies..."
sudo -u $APP_USER bash -c "source venv/bin/activate && pip install --upgrade pip"
sudo -u $APP_USER bash -c "source venv/bin/activate && pip install -r requirements.txt"
sudo -u $APP_USER bash -c "source venv/bin/activate && pip install gunicorn psycopg2-binary dj-database-url"

# Install Node.js dependencies and build frontend
print_status "Installing Node.js dependencies and building frontend..."
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build

# Create environment file
print_status "Creating environment configuration..."
sudo -u $APP_USER tee .env > /dev/null << EOF
DEBUG=False
SECRET_KEY=$(openssl rand -base64 50)
ALLOWED_HOSTS=www.mayslife.uk,mayslife.uk,$IP_ADDRESS,localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration (Update with your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Payment Providers (Update with your payment provider details)
ZAINCASH_MERCHANT_ID=your_zaincash_merchant_id
ZAINCASH_SECRET_KEY=your_zaincash_secret_key
ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init

ASIAHAWALA_MERCHANT_ID=your_asiahawala_merchant_id
ASIAHAWALA_SECRET_KEY=your_asiahawala_secret_key
ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://www.mayslife.uk,https://mayslife.uk
EOF

# Create production settings
print_status "Creating production settings..."
sudo -u $APP_USER tee dr_mays_nutrition/settings_production.py > /dev/null << 'EOF'
import os
from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'accounts',
    'meal_plans',
    'bookings',
    'payments',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'accounts.middleware.RequestLoggingMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

ROOT_URLCONF = 'dr_mays_nutrition.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dr_mays_nutrition.wsgi.application'

# Database Configuration
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL'))
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ('en', 'English'),
    ('ar', 'العربية'),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CELERY_BROKER_URL = config('REDIS_URL')
CELERY_RESULT_BACKEND = config('REDIS_URL')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

AUTH_USER_MODEL = 'accounts.User'

PAYMENT_PROVIDERS = {
    'ZAINCASH': {
        'MERCHANT_ID': config('ZAINCASH_MERCHANT_ID', default=''),
        'SECRET_KEY': config('ZAINCASH_SECRET_KEY', default=''),
        'API_URL': config('ZAINCASH_API_URL', default=''),
    },
    'ASIAHAWALA': {
        'MERCHANT_ID': config('ASIAHAWALA_MERCHANT_ID', default=''),
        'SECRET_KEY': config('ASIAHAWALA_SECRET_KEY', default=''),
        'API_URL': config('ASIAHAWALA_API_URL', default=''),
    },
}

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 31536000
SECURE_REDIRECT_EXEMPT = []
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# Logging Configuration
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
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/home/mays/drmays/logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'accounts': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# Create logs directory
print_status "Creating logs directory..."
sudo -u $APP_USER mkdir -p logs

# Run database migrations
print_status "Running database migrations..."
sudo -u $APP_USER bash -c "cd $APP_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py migrate"

# Collect static files
print_status "Collecting static files..."
sudo -u $APP_USER bash -c "cd $APP_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py collectstatic --noinput"

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $APP_USER:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR
sudo chmod -R 775 $APP_DIR/media
sudo chmod -R 775 $APP_DIR/logs

# Configure Redis
print_status "Configuring Redis..."
sudo tee /etc/redis/redis.conf > /dev/null << 'EOF'
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

sudo systemctl restart redis-server

# Create systemd services
print_status "Creating systemd services..."

# Django service
sudo tee /etc/systemd/system/drmays.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=$APP_USER
Group=www-data
WorkingDirectory=$APP_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Celery service
sudo tee /etc/systemd/system/drmays-celery.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Worker
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=$APP_USER
Group=www-data
WorkingDirectory=$APP_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info --concurrency=2
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Celery Beat service
sudo tee /etc/systemd/system/drmays-celery-beat.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Beat
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=$APP_USER
Group=www-data
WorkingDirectory=$APP_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/mayslife.uk > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream configuration
upstream django_app {
    server 127.0.0.1:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mayslife.uk www.mayslife.uk;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name mayslife.uk www.mayslife.uk;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mayslife.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mayslife.uk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Logging
    access_log /var/log/nginx/mayslife.uk.access.log;
    error_log /var/log/nginx/mayslife.uk.error.log;

    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Static files
    location /static/ {
        alias /home/mays/drmays/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files
    location /media/ {
        alias /home/mays/drmays/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend build files
    location /assets/ {
        alias /home/mays/drmays/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Login endpoints with stricter rate limiting
    location ~ ^/(admin|api/auth)/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Health check endpoint
    location /health/ {
        proxy_pass http://django_app/health/;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|ini)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable Nginx site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl restart fail2ban

# Create health check script
print_status "Creating health check script..."
sudo -u $APP_USER tee $APP_DIR/health_check.sh > /dev/null << 'EOF'
#!/bin/bash

# Check if Django app is running
if ! curl -f http://127.0.0.1:8000/health/ > /dev/null 2>&1; then
    echo "Django app is not responding"
    systemctl restart drmays
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running"
    systemctl restart nginx
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is not running"
    systemctl restart postgresql
fi

# Check if Redis is running
if ! systemctl is-active --quiet redis-server; then
    echo "Redis is not running"
    systemctl restart redis-server
fi
EOF

sudo chmod +x $APP_DIR/health_check.sh

# Create backup script
print_status "Creating backup script..."
sudo -u $APP_USER tee $APP_DIR/backup.sh > /dev/null << EOF
#!/bin/bash

BACKUP_DIR="/home/$APP_USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="$APP_DIR"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U $DB_USER $DB_NAME > \$BACKUP_DIR/database_\$DATE.sql

# Backup media files
tar -czf \$BACKUP_DIR/media_\$DATE.tar.gz -C \$PROJECT_DIR media/

# Backup project files (excluding venv and node_modules)
tar -czf \$BACKUP_DIR/project_\$DATE.tar.gz \\
    --exclude='venv' \\
    --exclude='node_modules' \\
    --exclude='__pycache__' \\
    --exclude='.git' \\
    --exclude='logs' \\
    -C \$PROJECT_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x $APP_DIR/backup.sh

# Create log rotation
print_status "Creating log rotation..."
sudo tee /etc/logrotate.d/drmays > /dev/null << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $APP_USER www-data
    postrotate
        systemctl reload drmays
    endscript
}
EOF

# Enable and start services
print_status "Enabling and starting services..."
sudo systemctl daemon-reload
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service

# Start services
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# Reload Nginx
sudo systemctl reload nginx

# Add cron jobs
print_status "Adding cron jobs..."
sudo -u $APP_USER crontab -l 2>/dev/null | { cat; echo "*/5 * * * * $APP_DIR/health_check.sh"; } | sudo -u $APP_USER crontab -
sudo -u $APP_USER crontab -l 2>/dev/null | { cat; echo "0 2 * * * $APP_DIR/backup.sh"; } | sudo -u $APP_USER crontab -

# Add SSL certificate auto-renewal
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

print_status "Deployment completed successfully!"
print_warning "IMPORTANT: You need to obtain SSL certificates manually:"
print_warning "Run: sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk"
print_warning "Also, update the .env file with your actual email and payment provider credentials."

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Summary:${NC}"
echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}IP: $IP_ADDRESS${NC}"
echo -e "${GREEN}Database: $DB_NAME${NC}"
echo -e "${GREEN}Database User: $DB_USER${NC}"
echo -e "${GREEN}Database Password: $DB_PASSWORD${NC}"
echo -e "${GREEN}App Directory: $APP_DIR${NC}"
echo -e "${GREEN}App User: $APP_USER${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Next steps:"
echo "1. Obtain SSL certificate: sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk"
echo "2. Update .env file with your email and payment provider credentials"
echo "3. Create superuser: sudo -u $APP_USER bash -c 'cd $APP_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py createsuperuser'"
echo "4. Test the application: https://www.mayslife.uk"

print_status "Deployment completed! Your Dr. Mays Nutrition platform is now running."
