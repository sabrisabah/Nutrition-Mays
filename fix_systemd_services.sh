#!/bin/bash

# Fix Systemd Services Script for Dr. Mays Nutrition Platform
# This script fixes all systemd service configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/srv/mayslife/Nutrition-Mays"
DB_NAME="drmays_db"
DB_USER="drmays_user"
DB_PASSWORD="3MkI9GtLxrcjDREdk3WOG4saASbavLtZi0FRxXnuQC0="

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Systemd Services Script${NC}"
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
   print_error "This script must be run as root to fix systemd services."
   exit 1
fi

# Navigate to project directory
cd $PROJECT_DIR

# Create mays user if it doesn't exist
print_status "Creating mays user if it doesn't exist..."
if ! id "mays" &>/dev/null; then
    adduser --disabled-password --gecos "" mays
    usermod -aG sudo mays
    usermod -aG www-data mays
    print_status "User mays created successfully"
else
    print_status "User mays already exists"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p media
mkdir -p staticfiles

# Fix ownership and permissions
print_status "Setting proper ownership and permissions..."
chown -R mays:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 777 logs  # Give full permissions to logs
chmod -R 777 staticfiles  # Give full permissions to staticfiles
chmod -R 775 media

# Make sure all Python files are readable
print_status "Setting proper permissions on Python files..."
find $PROJECT_DIR -name "*.py" -exec chmod 644 {} \;

# Edit urls.py to remove static file serving
print_status "Editing urls.py to remove static file serving..."
if [ -f "dr_mays_nutrition/urls.py" ]; then
    # Make file writable temporarily
    chmod 666 dr_mays_nutrition/urls.py
    
    # Remove static file serving lines
    sed -i '/urlpatterns += static/d' dr_mays_nutrition/urls.py
    sed -i '/from django.conf import settings/d' dr_mays_nutrition/urls.py
    sed -i '/from django.conf.urls.static import static/d' dr_mays_nutrition/urls.py
    
    # Fix permissions back
    chmod 644 dr_mays_nutrition/urls.py
    chown mays:www-data dr_mays_nutrition/urls.py
    
    print_status "urls.py edited successfully"
else
    print_error "urls.py file not found"
fi

# Create production settings file with console-only logging
print_status "Creating production settings file with console-only logging..."
sudo -u mays tee dr_mays_nutrition/settings_production.py > /dev/null << 'EOF'
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

DEBUG = False

ALLOWED_HOSTS = [
    '152.42.167.125',
    'mayslife.uk',
    'www.mayslife.uk',
    'localhost',
    '127.0.0.1',
]

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

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'drmays_db',
        'USER': 'drmays_user',
        'PASSWORD': '3MkI9GtLxrcjDREdk3WOG4saASbavLtZi0FRxXnuQC0=',
        'HOST': 'localhost',
        'PORT': '5432',
    }
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
STATIC_ROOT = '/srv/mayslife/staticfiles'
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
MEDIA_URL = '/media/'
MEDIA_ROOT = '/srv/mayslife/media'

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

# CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
    "http://167.172.71.182",
]
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

CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Console-only logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'dr_mays_nutrition': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# Set proper permissions
chown mays:www-data dr_mays_nutrition/settings_production.py
chmod 644 dr_mays_nutrition/settings_production.py

# Fix database permissions
print_status "Fixing database permissions..."
sudo -u postgres psql << EOF
-- Drop and recreate user with proper permissions
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

# Install required packages
print_status "Installing required packages..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && pip install psycopg2-binary gunicorn"

# Run migrations
print_status "Running Django migrations..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py migrate"

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully!"
else
    print_error "Migrations failed. Please check the error messages above."
    exit 1
fi

# Collect static files
print_status "Collecting static files..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py collectstatic --noinput"

if [ $? -eq 0 ]; then
    print_status "Static files collected successfully!"
else
    print_error "Static files collection failed. Please check the error messages above."
    exit 1
fi

# Create systemd services
print_status "Creating systemd services..."

# Django service
cat > /etc/systemd/system/drmays.service << EOF
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Celery service
cat > /etc/systemd/system/drmays-celery.service << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Worker
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info --concurrency=2
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Celery Beat service
cat > /etc/systemd/system/drmays-celery-beat.service << EOF
[Unit]
Description=Dr. Mays Nutrition Celery Beat
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start services
print_status "Reloading systemd and starting services..."
systemctl daemon-reload
systemctl enable drmays
systemctl enable drmays-celery
systemctl enable drmays-celery-beat

# Start services
systemctl start drmays
systemctl start drmays-celery
systemctl start drmays-celery-beat

# Check service status
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

# Test application
print_status "Testing application..."
sleep 5  # Wait for services to start

if curl -f http://127.0.0.1:8000/health/ > /dev/null 2>&1; then
    print_status "Application is responding"
else
    print_warning "Application health check failed"
fi

print_status "All fixes completed successfully!"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Systemd Services Fix Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Next steps:"
echo "1. Create a superuser account:"
echo "   sudo -u mays bash -c 'cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py createsuperuser'"
echo ""
echo "2. Test the application at: https://www.mayslife.uk"
echo ""
echo "3. Check service status:"
echo "   systemctl status drmays"

print_status "Your Django application is now ready!"
