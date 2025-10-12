# Complete Ubuntu 24.04 LTS Configuration Guide for Dr. Mays Nutrition Platform

## Server Information
- **IP Address**: 152.42.167.125
- **Domain**: www.mayslife.uk
- **GitHub Repository**: https://github.com/sabrisabah/Nutrition-Mays.git
- **Ubuntu Version**: 24.04 LTS

## Table of Contents
1. [System Preparation](#1-system-preparation)
2. [Domain and DNS Configuration](#2-domain-and-dns-configuration)
3. [SSL Certificate Setup](#3-ssl-certificate-setup)
4. [System Dependencies Installation](#4-system-dependencies-installation)
5. [Python Environment Setup](#5-python-environment-setup)
6. [Node.js and Frontend Setup](#6-nodejs-and-frontend-setup)
7. [Database Configuration](#7-database-configuration)
8. [Redis Configuration](#8-redis-configuration)
9. [Project Deployment](#9-project-deployment)
10. [Nginx Configuration](#10-nginx-configuration)
11. [Systemd Services](#11-systemd-services)
12. [Firewall Configuration](#12-firewall-configuration)
13. [Security Hardening](#13-security-hardening)
14. [Monitoring and Logging](#14-monitoring-and-logging)
15. [Backup Strategy](#15-backup-strategy)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. System Preparation

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop ufw fail2ban
```

### Create Application User
```bash
sudo adduser mays
sudo usermod -aG sudo mays
sudo usermod -aG www-data mays
```

### Switch to Application User
```bash
sudo su - mays
```

---

## 2. Domain and DNS Configuration

### DNS Records Setup
Configure these DNS records with your domain provider:

```
Type    Name    Value               TTL
A       @       152.42.167.125     300
A       www     152.42.167.125     300
CNAME   api     www.mayslife.uk    300
```

### Verify DNS Resolution
```bash
nslookup www.mayslife.uk
dig www.mayslife.uk
```

---

## 3. SSL Certificate Setup

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk --non-interactive --agree-tos --email admin@mayslife.uk
```

### Auto-renewal Setup
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 4. System Dependencies Installation

### Install Python 3.11
```bash
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

### Install Node.js 18 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib postgresql-client
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install Additional Dependencies
```bash
sudo apt install -y build-essential libpq-dev libjpeg-dev zlib1g-dev libffi-dev libssl-dev
```

---

## 5. Python Environment Setup

### Create Project Directory
```bash
mkdir -p /home/mays/drmays
cd /home/mays/drmays
```

### Clone Repository
```bash
git clone https://github.com/sabrisabah/Nutrition-Mays.git .
```

### Create Virtual Environment
```bash
python3.11 -m venv venv
source venv/bin/activate
```

### Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

---

## 6. Node.js and Frontend Setup

### Install Frontend Dependencies
```bash
npm install
```

### Build Frontend
```bash
npm run build
```

### Create Production Build Script
```bash
cat > /home/mays/drmays/build_frontend.sh << 'EOF'
#!/bin/bash
cd /home/mays/drmays
source venv/bin/activate
npm run build
python manage.py collectstatic --noinput
EOF

chmod +x /home/mays/drmays/build_frontend.sh
```

---

## 7. Database Configuration

### Configure PostgreSQL
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE drmays_db;
CREATE USER drmays_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE drmays_db TO drmays_user;
ALTER USER drmays_user CREATEDB;
\q
```

### Create Environment File
```bash
cat > /home/mays/drmays/.env << 'EOF'
DEBUG=False
SECRET_KEY=your_super_secret_key_here_change_this_in_production
ALLOWED_HOSTS=www.mayslife.uk,mayslife.uk,152.42.167.125,localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://drmays_user:your_secure_password_here@localhost:5432/drmays_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration (Configure with your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Payment Providers (Configure with your payment provider details)
ZAINCASH_MERCHANT_ID=your_zaincash_merchant_id
ZAINCASH_SECRET_KEY=your_zaincash_secret_key
ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init

ASIAHAWALA_MERCHANT_ID=your_asiahawala_merchant_id
ASIAHAWALA_SECRET_KEY=your_asiahawala_secret_key
ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://www.mayslife.uk,https://mayslife.uk
EOF
```

### Update Django Settings for Production
```bash
cat > /home/mays/drmays/dr_mays_nutrition/settings_production.py << 'EOF'
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
```

### Install Additional Dependencies
```bash
pip install dj-database-url
```

### Run Database Migrations
```bash
cd /home/mays/drmays
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## 8. Redis Configuration

### Configure Redis
```bash
sudo vim /etc/redis/redis.conf
```

Update these settings:
```
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Restart Redis
```bash
sudo systemctl restart redis-server
```

---

## 9. Project Deployment

### Create Logs Directory
```bash
mkdir -p /home/mays/drmays/logs
chmod 755 /home/mays/drmays/logs
```

### Set Proper Permissions
```bash
sudo chown -R mays:www-data /home/mays/drmays
sudo chmod -R 755 /home/mays/drmays
sudo chmod -R 775 /home/mays/drmays/media
sudo chmod -R 775 /home/mays/drmays/logs
```

---

## 10. Nginx Configuration

### Create Nginx Configuration
```bash
sudo vim /etc/nginx/sites-available/mayslife.uk
```

```nginx
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
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. Systemd Services

### Create Django Service
```bash
sudo vim /etc/systemd/system/drmays.service
```

```ini
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=/home/mays/drmays
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=/home/mays/drmays/venv/bin
ExecStart=/home/mays/drmays/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Create Celery Service
```bash
sudo vim /etc/systemd/system/drmays-celery.service
```

```ini
[Unit]
Description=Dr. Mays Nutrition Celery Worker
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=/home/mays/drmays
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=/home/mays/drmays/venv/bin
ExecStart=/home/mays/drmays/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info --concurrency=2
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Create Celery Beat Service
```bash
sudo vim /etc/systemd/system/drmays-celery-beat.service
```

```ini
[Unit]
Description=Dr. Mays Nutrition Celery Beat
After=network.target redis.service
Requires=redis.service

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=/home/mays/drmays
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=/home/mays/drmays/venv/bin
ExecStart=/home/mays/drmays/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service
```

---

## 12. Firewall Configuration

### Configure UFW
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### Check Firewall Status
```bash
sudo ufw status verbose
```

---

## 13. Security Hardening

### Configure Fail2ban
```bash
sudo vim /etc/fail2ban/jail.local
```

```ini
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
```

### Restart Fail2ban
```bash
sudo systemctl restart fail2ban
```

### Secure SSH
```bash
sudo vim /etc/ssh/sshd_config
```

Update these settings:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22
```

### Restart SSH
```bash
sudo systemctl restart ssh
```

---

## 14. Monitoring and Logging

### Install Monitoring Tools
```bash
sudo apt install -y htop iotop nethogs
```

### Create Log Rotation
```bash
sudo vim /etc/logrotate.d/drmays
```

```
/home/mays/drmays/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mays www-data
    postrotate
        systemctl reload drmays
    endscript
}
```

### Create Health Check Script
```bash
cat > /home/mays/drmays/health_check.sh << 'EOF'
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

chmod +x /home/mays/drmays/health_check.sh
```

### Add Health Check to Crontab
```bash
crontab -e
# Add this line:
*/5 * * * * /home/mays/drmays/health_check.sh
```

---

## 15. Backup Strategy

### Create Backup Script
```bash
cat > /home/mays/drmays/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/mays/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/mays/drmays"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U drmays_user drmays_db > $BACKUP_DIR/database_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz -C $PROJECT_DIR media/

# Backup project files (excluding venv and node_modules)
tar -czf $BACKUP_DIR/project_$DATE.tar.gz \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='logs' \
    -C $PROJECT_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/mays/drmays/backup.sh
```

### Add Backup to Crontab
```bash
crontab -e
# Add this line:
0 2 * * * /home/mays/drmays/backup.sh
```

---

## 16. Troubleshooting

### Common Commands

#### Check Service Status
```bash
sudo systemctl status drmays
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
```

#### Check Logs
```bash
sudo journalctl -u drmays -f
sudo tail -f /var/log/nginx/mayslife.uk.error.log
sudo tail -f /home/mays/drmays/logs/django.log
```

#### Restart Services
```bash
sudo systemctl restart drmays
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

#### Check Ports
```bash
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

#### Test Database Connection
```bash
cd /home/mays/drmays
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
python manage.py dbshell
```

#### Test Redis Connection
```bash
redis-cli ping
```

### Common Issues and Solutions

#### 1. Django App Not Starting
- Check if all dependencies are installed
- Verify database connection
- Check environment variables
- Review Django logs

#### 2. Nginx 502 Bad Gateway
- Check if Django app is running on port 8000
- Verify Nginx configuration
- Check firewall settings

#### 3. SSL Certificate Issues
- Verify domain DNS settings
- Check certificate expiration
- Renew certificate if needed

#### 4. Database Connection Issues
- Check PostgreSQL service status
- Verify database credentials
- Check database permissions

#### 5. Static Files Not Loading
- Run `python manage.py collectstatic`
- Check Nginx static file configuration
- Verify file permissions

---

## Final Verification Steps

### 1. Test Website Access
```bash
curl -I https://www.mayslife.uk
curl -I https://www.mayslife.uk/api/
```

### 2. Check All Services
```bash
sudo systemctl status drmays nginx postgresql redis-server
```

### 3. Verify SSL Certificate
```bash
openssl s_client -connect www.mayslife.uk:443 -servername www.mayslife.uk
```

### 4. Test API Endpoints
```bash
curl -X GET https://www.mayslife.uk/api/health/
```

### 5. Check Logs for Errors
```bash
sudo tail -f /var/log/nginx/mayslife.uk.error.log
sudo tail -f /home/mays/drmays/logs/django.log
```

---

## Maintenance Commands

### Update Application
```bash
cd /home/mays/drmays
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
npm install
npm run build
export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart drmays
```

### Monitor System Resources
```bash
htop
df -h
free -h
sudo netstat -tlnp
```

---

## Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall configured (UFW)
- [ ] Fail2ban configured
- [ ] SSH secured (key-based authentication)
- [ ] Database secured with strong password
- [ ] Environment variables properly configured
- [ ] Regular backups scheduled
- [ ] Monitoring and health checks in place
- [ ] Log rotation configured
- [ ] Rate limiting implemented
- [ ] Security headers configured

---

## Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update system packages
3. **Quarterly**: Review security settings
4. **Annually**: Review and update SSL certificates

### Emergency Contacts
- Server IP: 152.42.167.125
- Domain: www.mayslife.uk
- GitHub: https://github.com/sabrisabah/Nutrition-Mays.git

---

This configuration guide provides a complete setup for your Dr. Mays Nutrition platform on Ubuntu 24.04 LTS. Follow each section carefully, and your application will be fully functional with proper security, monitoring, and backup systems in place.
