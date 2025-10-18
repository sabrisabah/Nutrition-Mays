# Dr. Mays Nutrition Application - Ubuntu 24.04 Installation Guide 2025

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Install Dependencies](#install-dependencies)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Web Server Configuration](#web-server-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Service Configuration](#service-configuration)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Ubuntu 24.04 LTS (recommended)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **CPU**: 2 cores minimum
- **Network**: Public IP address with domain name

### Recommended VPS Providers
- DigitalOcean
- Linode
- Vultr
- AWS EC2
- Google Cloud Platform

---

## 🚀 Initial Server Setup

### 1. Connect to Your Server
```bash
# Connect via SSH
ssh root@YOUR_SERVER_IP

# Or with key file
ssh -i /path/to/your/key.pem root@YOUR_SERVER_IP
```

### 2. Update System
```bash
# Update package list
apt update

# Upgrade system packages
apt upgrade -y

# Install essential packages
apt install -y curl wget git vim htop unzip software-properties-common
```

### 3. Create Application User
```bash
# Create user for the application
adduser mays

# Add user to sudo group
usermod -aG sudo mays

# Switch to the new user
su - mays
```

### 4. Configure Firewall
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

---

## 📦 Install Dependencies

### 1. Install Python 3.12
```bash
# Add Python 3.12 repository
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.12 and pip
sudo apt install -y python3.12 python3.12-venv python3.12-dev python3-pip

# Install build essentials
sudo apt install -y build-essential libssl-dev libffi-dev libjpeg-dev libpng-dev
```

### 2. Install Node.js and npm
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Database
```bash
# Install SQLite3 (default database)
sudo apt install -y sqlite3

# Optional: Install PostgreSQL for production
sudo apt install -y postgresql postgresql-contrib
```

### 4. Install Redis (Optional)
```bash
# Install Redis
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 5. Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ Database Setup

### SQLite Setup (Default)
```bash
# SQLite is already installed and ready to use
# No additional configuration needed
```

### PostgreSQL Setup (Optional)
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE drmays_nutrition;
CREATE USER mays_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO mays_user;
\q

# Install PostgreSQL adapter for Python
sudo apt install -y python3-psycopg2
```

---

## 🚀 Application Deployment

### 1. Create Project Directory
```bash
# Create application directory
sudo mkdir -p /srv/mayslife
sudo chown mays:mays /srv/mayslife
cd /srv/mayslife
```

### 2. Clone or Upload Project
```bash
# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/dr-mays-nutrition.git Nutrition-Mays
cd Nutrition-Mays

# Option B: Upload via SCP (from local machine)
# scp -r /path/to/local/project root@YOUR_SERVER_IP:/srv/mayslife/Nutrition-Mays
```

### 3. Create Virtual Environment
```bash
# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 4. Install Python Dependencies
```bash
# Install requirements
pip install -r requirements.txt

# If requirements.txt doesn't exist, install manually:
pip install django djangorestframework django-cors-headers django-filter
pip install gunicorn psycopg2-binary python-decouple
```

### 5. Configure Environment Variables
```bash
# Create environment file
cat > .env << 'EOF'
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,YOUR_SERVER_IP
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL: DATABASE_URL=postgresql://mays_user:password@localhost/drmays_nutrition
EOF
```

### 6. Configure Django Settings
```bash
# Create production settings
cat > dr_mays_nutrition/settings_production.py << 'EOF'
import os
from pathlib import Path
from decouple import config

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
    'corsheaders.middleware.CorsMiddleware',
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
        'DIRS': [],
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

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
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = 'accounts.User'
EOF
```

### 7. Run Database Migrations
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 8. Build Frontend (if applicable)
```bash
# Install frontend dependencies
npm install

# Build frontend
npm run build

# Copy built files to Django static directory
cp -r dist/* static/
```

---

## 🌐 Web Server Configuration

### 1. Configure Nginx
```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/mayslife << 'EOF'
server {
    listen 80;
    server_name mayslife.uk www.mayslife.uk;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mayslife.uk www.mayslife.uk;

    # SSL Configuration (will be added after certificate setup)
    # ssl_certificate /etc/letsencrypt/live/mayslife.uk/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/mayslife.uk/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location /static/ {
        alias /srv/mayslife/Nutrition-Mays/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /srv/mayslife/Nutrition-Mays/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Django application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/mayslife /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate Setup

### 1. Install Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. Update Nginx Configuration
```bash
# Certbot should automatically update your Nginx configuration
# Verify the configuration
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ Service Configuration

### 1. Create Systemd Service
```bash
# Create service file
sudo cat > /etc/systemd/system/drmays.service << 'EOF'
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target

[Service]
Type=exec
User=mays
Group=www-data
WorkingDirectory=/srv/mayslife/Nutrition-Mays
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
Environment=PATH=/srv/mayslife/Nutrition-Mays/venv/bin
ExecStart=/srv/mayslife/Nutrition-Mays/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable drmays.service
sudo systemctl start drmays.service
```

### 2. Set Proper Permissions
```bash
# Set ownership
sudo chown -R mays:www-data /srv/mayslife/Nutrition-Mays

# Set permissions
sudo chmod -R 755 /srv/mayslife/Nutrition-Mays
sudo chmod -R 775 /srv/mayslife/Nutrition-Mays/media
sudo chmod -R 775 /srv/mayslife/Nutrition-Mays/staticfiles
```

---

## 🧪 Testing & Verification

### 1. Check Service Status
```bash
# Check Django service
sudo systemctl status drmays.service

# Check Nginx service
sudo systemctl status nginx

# Check logs
sudo journalctl -u drmays.service -f
```

### 2. Test Application
```bash
# Test API endpoints
curl -I https://mayslife.uk/api/auth/login/
curl -I https://mayslife.uk/admin/login/

# Test static files
curl -I https://mayslife.uk/static/admin/css/base.css
```

### 3. Create Test User
```bash
# Create superuser
cd /srv/mayslife/Nutrition-Mays
source venv/bin/activate
python manage.py createsuperuser
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start
```bash
# Check service logs
sudo journalctl -u drmays.service --lines=50

# Check Django configuration
cd /srv/mayslife/Nutrition-Mays
source venv/bin/activate
python manage.py check
```

#### 2. Static Files Not Loading
```bash
# Recollect static files
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R mays:www-data /srv/mayslife/Nutrition-Mays/staticfiles
```

#### 3. Database Issues
```bash
# Check database
python manage.py dbshell

# Run migrations
python manage.py migrate
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

#### 5. Permission Issues
```bash
# Fix ownership
sudo chown -R mays:www-data /srv/mayslife/Nutrition-Mays

# Fix permissions
sudo chmod -R 755 /srv/mayslife/Nutrition-Mays
```

### Log Locations
- **Django logs**: `sudo journalctl -u drmays.service`
- **Nginx logs**: `/var/log/nginx/error.log`
- **System logs**: `/var/log/syslog`

---

## 🔄 Maintenance

### 1. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python packages
cd /srv/mayslife/Nutrition-Mays
source venv/bin/activate
pip install --upgrade pip
pip list --outdated
```

### 2. Backup Strategy
```bash
# Create backup script
cat > /srv/mayslife/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/srv/mayslife/backups"
PROJECT_DIR="/srv/mayslife/Nutrition-Mays"

mkdir -p $BACKUP_DIR

# Backup database
cp $PROJECT_DIR/db.sqlite3 $BACKUP_DIR/db_$DATE.sqlite3

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz -C $PROJECT_DIR media/

# Backup project files
tar -czf $BACKUP_DIR/project_$DATE.tar.gz -C /srv/mayslife Nutrition-Mays/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite3" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /srv/mayslife/backup.sh

# Add to crontab for daily backups
crontab -e
# Add this line: 0 2 * * * /srv/mayslife/backup.sh
```

### 3. Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor disk usage
df -h

# Monitor memory usage
free -h

# Monitor running processes
htop
```

### 4. Security Updates
```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📞 Support

### Useful Commands
```bash
# Restart services
sudo systemctl restart drmays.service
sudo systemctl restart nginx

# Check service status
sudo systemctl status drmays.service
sudo systemctl status nginx

# View logs
sudo journalctl -u drmays.service -f
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
python manage.py check
```

### Emergency Recovery
```bash
# If everything breaks, restore from backup
cd /srv/mayslife
tar -xzf backups/project_YYYYMMDD_HHMMSS.tar.gz
tar -xzf backups/media_YYYYMMDD_HHMMSS.tar.gz
cp backups/db_YYYYMMDD_HHMMSS.sqlite3 Nutrition-Mays/db.sqlite3
sudo systemctl restart drmays.service
```

---

## ✅ Final Checklist

- [ ] Server updated and secured
- [ ] All dependencies installed
- [ ] Application deployed and configured
- [ ] Database migrations completed
- [ ] Static files collected
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] Django service running
- [ ] Firewall configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools installed
- [ ] Application tested and working

---

**🎉 Congratulations! Your Dr. Mays Nutrition application is now successfully deployed on Ubuntu 24.04!**

For additional support or questions, refer to the troubleshooting section or check the application logs.
