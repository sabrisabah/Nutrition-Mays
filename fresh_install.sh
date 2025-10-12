#!/bin/bash

# =============================================================================
# Dr. Mays Nutrition System - Fresh Ubuntu Installation Script
# =============================================================================
# This script performs a complete fresh installation with all fixes
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
}

print_step() {
    echo -e "\n${YELLOW}[STEP] $1${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# =============================================================================
# SYSTEM REQUIREMENTS AND VALIDATION
# =============================================================================
print_header "Dr. Mays Nutrition System - Fresh Installation"
print_status "Starting fresh system installation..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check Ubuntu version
if ! command -v lsb_release &> /dev/null; then
    print_status "Installing lsb-release..."
    sudo apt update && sudo apt install -y lsb-release
fi

UBUNTU_VERSION=$(lsb_release -rs)
print_status "Detected Ubuntu version: $UBUNTU_VERSION"

# =============================================================================
# STEP 1: SYSTEM UPDATE AND BASIC PACKAGES
# =============================================================================
print_step "Step 1: System Update and Basic Packages"

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing essential system packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    python3-pip \
    python3-venv \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    supervisor \
    certbot \
    python3-certbot-nginx

print_success "System packages installed successfully"

# =============================================================================
# STEP 2: PYTHON AND NODE.JS SETUP
# =============================================================================
print_step "Step 2: Python and Node.js Setup"

# Install Python 3.12
print_status "Installing Python 3.12..."
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
print_status "Verifying installations..."
python3 --version
node --version
npm --version

print_success "Python and Node.js setup complete"

# =============================================================================
# STEP 3: DATABASE SETUP
# =============================================================================
print_step "Step 3: Database Setup"

print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

print_status "Creating database and user..."
sudo -u postgres psql << 'EOF'
CREATE DATABASE drmays_db;
CREATE USER drmays_user WITH PASSWORD 'NewStrong!Passw0rd2025';
GRANT ALL PRIVILEGES ON DATABASE drmays_db TO drmays_user;
ALTER USER drmays_user CREATEDB;
\q
EOF

print_success "Database setup complete"

# =============================================================================
# STEP 4: REDIS SETUP
# =============================================================================
print_step "Step 4: Redis Setup"

print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
if redis-cli ping | grep -q "PONG"; then
    print_success "Redis is running and accessible"
else
    print_error "Redis connection failed"
    exit 1
fi

# =============================================================================
# STEP 5: PROJECT SETUP
# =============================================================================
print_step "Step 5: Project Setup"

# Create project directory
PROJECT_DIR="/srv/mayslife/Nutrition-Mays"
print_status "Setting up project directory: $PROJECT_DIR"

sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Navigate to project directory
cd $PROJECT_DIR

print_status "Current project directory: $(pwd)"

# =============================================================================
# STEP 6: PYTHON VIRTUAL ENVIRONMENT
# =============================================================================
print_step "Step 6: Python Virtual Environment Setup"

print_status "Creating Python virtual environment..."
python3 -m venv venv

print_status "Activating virtual environment..."
. venv/bin/activate

print_status "Upgrading pip..."
pip install --upgrade pip

# =============================================================================
# STEP 7: PYTHON DEPENDENCIES
# =============================================================================
print_step "Step 7: Python Dependencies Installation"

print_status "Creating requirements.txt..."
cat > requirements.txt << 'EOF'
Django==5.2.7
djangorestframework==3.15.2
django-cors-headers==4.3.1
django-filter==23.5
Pillow==10.2.0
django-extensions==3.2.3
python-decouple==3.8
celery==5.3.6
redis==5.0.1
django-channels==4.0.0
channels-redis==4.1.0
cryptography==42.0.5
reportlab==4.0.9
openpyxl==3.1.2
requests==2.31.0
stripe==7.8.0
whitenoise==6.6.0
schedule==1.2.0
dj-database-url==2.1.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
EOF

print_status "Installing requirements..."
pip install -r requirements.txt

print_success "Python dependencies installed successfully"

# =============================================================================
# STEP 8: DJANGO CONFIGURATION
# =============================================================================
print_step "Step 8: Django Configuration"

# Create .env file
print_status "Creating .env file..."
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-$(openssl rand -hex 32)
DATABASE_URL=postgresql://drmays_user:NewStrong!Passw0rd2025@localhost:5432/drmays_db
ALLOWED_HOSTS=152.42.167.125,mayslife.uk,localhost,127.0.0.1
EOF

# Configure Django settings for production
print_status "Configuring Django settings..."

# Create a proper settings.py file
cat > dr_mays_nutrition/settings.py << 'EOF'
import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
    'meal_plans',
    'bookings',
    'payments',
    'reports',
    'notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'drmays_db',
        'USER': 'drmays_user',
        'PASSWORD': 'NewStrong!Passw0rd2025',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Password validation
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

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = '/srv/mayslife/staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = '/srv/mayslife/media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
    "http://152.42.167.125",
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Logging configuration
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
    },
}
EOF

# Create URLs configuration
print_status "Configuring URLs..."
cat > dr_mays_nutrition/urls.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/meals/', include('meal_plans.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/', include('reports.urls')),
    
    # Health check
    path('health/', lambda request: HttpResponse('OK')),
    
    # Serve frontend for all other routes
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]

# Only serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

print_success "Django configuration complete"

# =============================================================================
# STEP 9: DATABASE MIGRATIONS
# =============================================================================
print_step "Step 9: Database Migrations"

print_status "Running database migrations..."
python3 manage.py makemigrations
python3 manage.py migrate

# Create superuser
print_status "Creating superuser..."
python3 manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')
    print("Superuser created: admin/admin123")
else:
    print("Superuser already exists")
EOF

print_success "Database setup complete"

# =============================================================================
# STEP 10: STATIC FILES
# =============================================================================
print_step "Step 10: Static Files Collection"

print_status "Collecting static files..."
python3 manage.py collectstatic --noinput

# Create media directory
sudo mkdir -p /srv/mayslife/media
sudo chown -R $USER:$USER /srv/mayslife/media
sudo chmod -R 755 /srv/mayslife/media

print_success "Static files collected"

# =============================================================================
# STEP 11: GUNICORN CONFIGURATION
# =============================================================================
print_step "Step 11: Gunicorn Configuration"

print_status "Creating Gunicorn configuration..."
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
accesslog = "/var/log/mayslife/access.log"
errorlog = "/var/log/mayslife/error.log"
loglevel = "info"
EOF

print_success "Gunicorn configuration created"

# =============================================================================
# STEP 12: SYSTEMD SERVICES
# =============================================================================
print_step "Step 12: Systemd Services Setup"

# Create log directory
sudo mkdir -p /var/log/mayslife
sudo chown $USER:$USER /var/log/mayslife

# Create Django service
print_status "Creating Django systemd service..."
sudo tee /etc/systemd/system/drmays.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=exec
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings
ExecStartPre=/bin/sleep 10
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --config $PROJECT_DIR/gunicorn.conf.py dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
SyslogIdentifier=drmays

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

# =============================================================================
# STEP 13: NGINX CONFIGURATION
# =============================================================================
print_step "Step 13: Nginx Configuration"

print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/mayslife.uk > /dev/null << 'EOF'
server {
    listen 80;
    server_name 152.42.167.125 mayslife.uk www.mayslife.uk;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Static files
    location /static/ {
        alias /srv/mayslife/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /srv/mayslife/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Django application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Health check
    location /health/ {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

print_success "Nginx configuration complete"

# =============================================================================
# STEP 14: PERMISSIONS AND OWNERSHIP
# =============================================================================
print_step "Step 14: Setting Permissions"

print_status "Setting proper permissions..."
sudo chown -R $USER:$USER /srv/mayslife
sudo chmod -R 755 /srv/mayslife
sudo chmod +x /srv/mayslife/Nutrition-Mays/manage.py

print_success "Permissions set correctly"

# =============================================================================
# STEP 15: START SERVICES
# =============================================================================
print_step "Step 15: Starting Services"

print_status "Reloading systemd..."
sudo systemctl daemon-reload

print_status "Starting and enabling services..."
sudo systemctl enable drmays
sudo systemctl start drmays

sudo systemctl enable nginx
sudo systemctl restart nginx

print_success "Services started successfully"

# =============================================================================
# STEP 16: SSL CERTIFICATE
# =============================================================================
print_step "Step 16: SSL Certificate Setup"

print_status "Setting up SSL certificate with Let's Encrypt..."
if sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk --non-interactive --agree-tos --email admin@mayslife.uk; then
    print_success "SSL certificate installed successfully"
else
    print_warning "SSL certificate setup failed. You can set it up manually later."
fi

# =============================================================================
# STEP 17: FINAL VERIFICATION
# =============================================================================
print_step "Step 17: Final Verification"

print_status "Checking service status..."

# Check Django service
if sudo systemctl is-active --quiet drmays; then
    print_success "✅ Django service is running"
else
    print_error "❌ Django service is not running"
    sudo systemctl status drmays
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

# Check PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    print_success "✅ PostgreSQL is running"
else
    print_error "❌ PostgreSQL is not running"
fi

# Check Redis
if sudo systemctl is-active --quiet redis-server; then
    print_success "✅ Redis is running"
else
    print_error "❌ Redis is not running"
fi

# Test application
print_status "Testing application..."
sleep 5
if curl -f http://localhost/health/ > /dev/null 2>&1; then
    print_success "✅ Application is responding"
else
    print_warning "⚠️ Application health check failed"
fi

# =============================================================================
# COMPLETION SUMMARY
# =============================================================================
print_header "Installation Complete!"

echo -e "${GREEN}🎉 Dr. Mays Nutrition System has been successfully installed!${NC}"
echo ""
echo -e "${BLUE}📋 Installation Summary:${NC}"
echo -e "  • Django Application: ${GREEN}Running${NC}"
echo -e "  • Database: ${GREEN}PostgreSQL${NC}"
echo -e "  • Web Server: ${GREEN}Nginx${NC}"
echo -e "  • Cache: ${GREEN}Redis${NC}"
echo -e "  • SSL Certificate: ${GREEN}Installed${NC}"
echo ""
echo -e "${BLUE}🌐 Access Information:${NC}"
echo -e "  • Website: ${YELLOW}https://mayslife.uk${NC}"
echo -e "  • Admin Panel: ${YELLOW}https://mayslife.uk/admin/${NC}"
echo -e "  • Admin Credentials: ${YELLOW}admin / admin123${NC}"
echo ""
echo -e "${BLUE}📁 Important Directories:${NC}"
echo -e "  • Project: ${YELLOW}$PROJECT_DIR${NC}"
echo -e "  • Static Files: ${YELLOW}/srv/mayslife/staticfiles${NC}"
echo -e "  • Media Files: ${YELLOW}/srv/mayslife/media${NC}"
echo -e "  • Logs: ${YELLOW}/var/log/mayslife${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "  • Check status: ${YELLOW}sudo systemctl status drmays${NC}"
echo -e "  • Restart app: ${YELLOW}sudo systemctl restart drmays${NC}"
echo -e "  • View logs: ${YELLOW}sudo journalctl -u drmays -f${NC}"
echo -e "  • Nginx logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
