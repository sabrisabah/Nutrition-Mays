#!/bin/bash

# Fix All Permissions Script for Dr. Mays Nutrition Platform
# This script fixes all file permissions and runs migrations

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix All Permissions Script${NC}"
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
   print_error "This script must be run as root to fix permissions."
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
chmod -R 775 logs
chmod -R 775 media
chmod -R 775 staticfiles

# Make sure settings files are readable
chmod 644 dr_mays_nutrition/settings.py
chmod 644 dr_mays_nutrition/settings_production.py

# Fix database permissions
print_status "Fixing database permissions..."
sudo -u postgres psql << EOF
-- Drop and recreate user with proper permissions
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD 'your_secure_password_here' CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

# Install required packages
print_status "Installing required packages..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && pip install psycopg2-binary"

# Create a simplified settings file without file logging
print_status "Creating simplified settings file..."
sudo -u mays tee dr_mays_nutrition/settings_simple.py > /dev/null << 'EOF'
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

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
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'drmays_db',
        'USER': 'drmays_user',
        'PASSWORD': 'your_secure_password_here',
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

CORS_ALLOWED_ORIGINS = [
    "https://www.mayslife.uk",
    "https://mayslife.uk",
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

# Simple Logging Configuration (Console only)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

# Set proper permissions on the new settings file
chown mays:www-data dr_mays_nutrition/settings_simple.py
chmod 644 dr_mays_nutrition/settings_simple.py

# Run migrations with simplified settings
print_status "Running Django migrations with simplified settings..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_simple && python manage.py migrate"

if [ $? -eq 0 ]; then
    print_status "Migrations completed successfully!"
else
    print_error "Migrations failed. Please check the error messages above."
    exit 1
fi

# Collect static files
print_status "Collecting static files..."
sudo -u mays bash -c "cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_simple && python manage.py collectstatic --noinput"

print_status "All fixes completed successfully!"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}All Permissions Fix Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Next steps:"
echo "1. Create a superuser account:"
echo "   sudo -u mays bash -c 'cd $PROJECT_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_simple && python manage.py createsuperuser'"
echo ""
echo "2. Start the services:"
echo "   systemctl start drmays"
echo "   systemctl start drmays-celery"
echo "   systemctl start drmays-celery-beat"
echo ""
echo "3. Test the application at: https://www.mayslife.uk"

print_status "Your Django application is now ready!"
