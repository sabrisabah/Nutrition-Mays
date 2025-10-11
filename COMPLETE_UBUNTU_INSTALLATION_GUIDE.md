# Dr. Mays Nutrition System - Complete Ubuntu 22.04 LTS Installation Guide

## 🚀 Complete Installation Guide for Ubuntu 22.04 LTS

**Server Details:**
- **OS**: Ubuntu 22.04 LTS
- **Domain**: mayslife.uk
- **IP Address**: 152.42.167.125
- **Application Path**: /srv/mayslife/Nutrition-Mays

---

## 📋 Prerequisites

- Ubuntu 22.04 LTS server
- Root or sudo access
- Domain `mayslife.uk` pointing to `152.42.167.125`
- SSL certificate (already configured)

---

## 🔧 Step 1: System Update and User Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Create Application User
```bash
# Create user for the application
sudo adduser maysuser

# Add to sudo group
sudo usermod -aG sudo maysuser

# Create application directory
sudo mkdir -p /srv/mayslife
sudo chown -R maysuser:maysuser /srv/mayslife

# Switch to the application user
sudo su - maysuser
```

### 1.3 Verify User Setup
```bash
whoami  # Should show: maysuser
pwd     # Should show: /home/maysuser
```

---

## 🐍 Step 2: Install System Packages

### 2.1 Install Essential Packages
```bash
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
    postgresql \
    postgresql-contrib \
    redis-server \
    supervisor \
    certbot \
    python3-certbot-nginx
```

### 2.2 Install Python 3.12
```bash
# Add Python 3.12 repository
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.12
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Set Python 3.12 as default
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1
```

### 2.3 Install Node.js 18.x
```bash
# Add Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installations
python3 --version  # Should show Python 3.12.x
node --version     # Should show v18.x.x
npm --version      # Should show 9.x.x
```

---

## 🗄️ Step 3: Database Setup

### 3.1 Start PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE drmays_db;
CREATE USER drmays_user WITH PASSWORD 'NewStrong!Passw0rd2025';
GRANT ALL PRIVILEGES ON DATABASE drmays_db TO drmays_user;
ALTER USER drmays_user CREATEDB;
\q
```

### 3.3 Configure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and uncomment/modify these lines:
# listen_addresses = 'localhost'
# port = 5432

# Edit authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line for local connections:
# local   all             drmays_user                            md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🔴 Step 4: Redis Setup

### 4.1 Start Redis
```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4.2 Test Redis
```bash
redis-cli ping  # Should return: PONG
```

---

## 📁 Step 5: Project Setup

### 5.1 Navigate to Project Directory
```bash
cd /srv/mayslife
```

### 5.2 Upload Your Project Files
**Option A: If you have the files locally, upload them:**
```bash
# From your local machine (not on server):
scp -r C:\Project\1212/* maysuser@152.42.167.125:/srv/mayslife/Nutrition-Mays/
```

**Option B: If using Git:**
```bash
# Clone your repository
git clone <your-repository-url> Nutrition-Mays
cd Nutrition-Mays
```

### 5.3 Set Proper Permissions
```bash
sudo chown -R maysuser:maysuser /srv/mayslife
chmod +x manage.py
```

---

## 🐍 Step 6: Python Virtual Environment

### 6.1 Create Virtual Environment
```bash
cd /srv/mayslife/Nutrition-Mays
python3 -m venv venv
```

### 6.2 Activate Virtual Environment
```bash
source venv/bin/activate
```

### 6.3 Upgrade pip
```bash
pip install --upgrade pip
```

---

## 📦 Step 7: Install Python Dependencies

### 7.1 Create requirements.txt
```bash
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
```

### 7.2 Install Dependencies
```bash
pip install -r requirements.txt
```

---

## ⚙️ Step 8: Django Configuration

### 8.1 Create Environment File
```bash
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=your-secret-key-here-change-this-in-production
DATABASE_URL=postgresql://drmays_user:NewStrong!Passw0rd2025@localhost:5432/drmays_db
ALLOWED_HOSTS=152.42.167.125,mayslife.uk,localhost,127.0.0.1
EOF
```

### 8.2 Configure Django Settings
```bash
# Backup original settings
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup

# Add production settings
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings
DEBUG = False

# Database configuration
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

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/srv/mayslife/staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = '/srv/mayslife/media'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
    "http://152.42.167.125",
]

# Allowed hosts
ALLOWED_HOSTS = [
    '152.42.167.125',
    'mayslife.uk',
    'www.mayslife.uk',
    'localhost',
    '127.0.0.1',
]

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
        'dr_mays_nutrition': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF
```

### 8.3 Configure URLs
```bash
# Remove any existing static file serving
sed -i '/urlpatterns += static/d' dr_mays_nutrition/urls.py

# Add proper static file serving
cat >> dr_mays_nutrition/urls.py << 'EOF'

# Only serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF
```

---

## 🗄️ Step 9: Database Migrations

### 9.1 Run Migrations
```bash
python3 manage.py makemigrations
python3 manage.py migrate
```

### 9.2 Create Superuser
```bash
python3 manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@mayslife.uk', 'admin123')
    print("Superuser created: admin/admin123")
else:
    print("Superuser already exists")
EOF
```

---

## 📁 Step 10: Static Files

### 10.1 Collect Static Files
```bash
python3 manage.py collectstatic --noinput
```

### 10.2 Create Media Directory
```bash
sudo mkdir -p /srv/mayslife/media
sudo chown -R maysuser:maysuser /srv/mayslife/media
sudo chmod -R 755 /srv/mayslife/media
```

---

## 🚀 Step 11: Gunicorn Configuration

### 11.1 Create Gunicorn Config
```bash
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
```

### 11.2 Create Log Directory
```bash
sudo mkdir -p /var/log/mayslife
sudo chown maysuser:maysuser /var/log/mayslife
```

---

## 🔧 Step 12: Systemd Service

### 12.1 Create Django Service
```bash
sudo tee /etc/systemd/system/drmays.service > /dev/null << EOF
[Unit]
Description=Dr. Mays Nutrition Django Application
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=exec
User=maysuser
Group=maysuser
WorkingDirectory=/srv/mayslife/Nutrition-Mays
Environment=PATH=/srv/mayslife/Nutrition-Mays/venv/bin:/usr/local/bin:/usr/bin:/bin
Environment=DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings
ExecStartPre=/bin/sleep 10
ExecStart=/srv/mayslife/Nutrition-Mays/venv/bin/gunicorn --config /srv/mayslife/Nutrition-Mays/gunicorn.conf.py dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
SyslogIdentifier=drmays

[Install]
WantedBy=multi-user.target
EOF
```

### 12.2 Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable drmays
sudo systemctl start drmays
```

---

## 🌐 Step 13: Nginx Configuration

### 13.1 Create Nginx Site Configuration
```bash
sudo tee /etc/nginx/sites-available/drmays > /dev/null << 'EOF'
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
```

### 13.2 Enable Site and Test Configuration
```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/drmays /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 14: SSL Configuration (Update Existing)

### 14.1 Update SSL Configuration
Since you already have SSL configured, update your existing SSL configuration to include the Django app:

```bash
# Update your existing SSL site configuration
sudo nano /etc/nginx/sites-available/your-existing-ssl-config

# Add these location blocks to your existing server block:
# location /static/ {
#     alias /srv/mayslife/staticfiles/;
#     expires 1y;
#     add_header Cache-Control "public, immutable";
# }
# 
# location /media/ {
#     alias /srv/mayslife/media/;
#     expires 1y;
#     add_header Cache-Control "public";
# }
# 
# location / {
#     proxy_pass http://127.0.0.1:8000;
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
#     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#     proxy_set_header X-Forwarded-Proto $scheme;
#     proxy_redirect off;
# }
```

### 14.2 Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 Step 15: Final Verification

### 15.1 Check Service Status
```bash
# Check all services
sudo systemctl status drmays nginx postgresql redis-server

# Check Django logs
sudo journalctl -u drmays -f

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### 15.2 Test Application
```bash
# Test health endpoint
curl http://localhost/health/

# Test Django application
curl http://localhost/

# Test with domain (if DNS is configured)
curl https://mayslife.uk/
```

---

## 🎉 Installation Complete!

### Access Information
- **Website**: https://mayslife.uk
- **Admin Panel**: https://mayslife.uk/admin/
- **Admin Credentials**: admin / admin123

### Important Directories
- **Project**: /srv/mayslife/Nutrition-Mays
- **Static Files**: /srv/mayslife/staticfiles
- **Media Files**: /srv/mayslife/media
- **Logs**: /var/log/mayslife

### Management Commands
```bash
# Check status
sudo systemctl status drmays

# Restart application
sudo systemctl restart drmays

# View logs
sudo journalctl -u drmays -f

# Update application
cd /srv/mayslife/Nutrition-Mays
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py collectstatic --noinput
sudo systemctl restart drmays
```

---

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   sudo chown -R maysuser:maysuser /srv/mayslife
   sudo chmod -R 755 /srv/mayslife
   ```

2. **Database Connection Issues**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT version();"
   ```

3. **Static Files Not Loading**
   ```bash
   cd /srv/mayslife/Nutrition-Mays
   source venv/bin/activate
   python3 manage.py collectstatic --noinput
   ```

4. **Service Not Starting**
   ```bash
   sudo journalctl -u drmays -f
   sudo systemctl status drmays
   ```

---

## ✅ Success Checklist

- [ ] All services running (drmays, nginx, postgresql, redis-server)
- [ ] Website accessible at https://mayslife.uk
- [ ] Admin panel working at https://mayslife.uk/admin/
- [ ] SSL certificate working
- [ ] Static files loading correctly
- [ ] Database connected and migrations applied
- [ ] Logs showing no errors

Your Dr. Mays Nutrition System is now ready for production use! 🚀
