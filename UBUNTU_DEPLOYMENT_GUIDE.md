# Ubuntu Deployment Guide for Dr. Mays Nutrition System
## Domain: mayslife.uk | IP: 158.178.143.50

This guide will help you deploy the Dr. Mays Nutrition System on your Ubuntu server with the domain name `mayslife.uk` and IP address `158.178.143.50`.

## 🚀 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ (recommended 22.04 LTS)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores

### Domain Setup
1. Point your domain `mayslife.uk` to IP `158.178.143.50`
2. Ensure both `mayslife.uk` and `www.mayslife.uk` point to the same IP
3. Wait for DNS propagation (can take up to 48 hours)

## 📋 Step 1: Server Preparation

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Required Packages
```bash
# Install essential packages
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
sudo apt install -y nginx redis-server supervisor git curl wget
sudo apt install -y postgresql postgresql-contrib postgresql-client
sudo apt install -y certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
python3 --version
node --version
npm --version
```

## 📋 Step 2: Database Setup

### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE drmays_nutrition;
CREATE USER drmays_user WITH PASSWORD 'Passw0rd2025';
GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;
ALTER USER drmays_user CREATEDB;
\q

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

## 📋 Step 3: Application Setup

### Create Application Directory
```bash
# Create application directory
sudo mkdir -p /var/www/drmays
sudo chown $USER:$USER /var/www/drmays
cd /var/www/drmays

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/sabrisabah/Nutrition-Mays.git

# Or if you're uploading files directly
# Upload your project files to /var/www/drmays/
```

### Setup Python Environment
```bash
cd /var/www/drmays

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Install Node.js dependencies
npm install
```

## 📋 Step 4: Environment Configuration

### Create Production Environment File
```bash
nano .env
```

Add the following content:
```env
# Django Settings
DEBUG=False
SECRET_KEY=_23km%sr*_20d-7c%pcv+q+9jjn2l=efdfew)kwgjw$23(rvlv
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50

# Database Configuration
DATABASE_URL=postgresql://drmays_user:P@ssw0rd@1000@localhost/drmays_nutrition

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
```

### Update Django Settings for Production
```bash
nano dr_mays_nutrition/settings.py
```

Add these production settings at the end of the file:
```python
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
```

## 📋 Step 5: Database Migration and Setup

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create sample data (optional)
python manage.py setup_sample_patients
python manage.py setup_sample_doctors
python manage.py create_sample_meal_plans
```

## 📋 Step 6: Build Frontend

```bash
# Build React application
npm run build

# Verify build was successful
ls -la dist/
```

## 📋 Step 7: Gunicorn Configuration

### Create Gunicorn Config
```bash
nano gunicorn.conf.py
```

Add the following content:
```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

## 📋 Step 8: Systemd Services

### Create Django Service
```bash
sudo nano /etc/systemd/system/drmays.service
```

Add the following content:
```ini
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
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Create Celery Worker Service
```bash
sudo nano /etc/systemd/system/drmays-celery.service
```

Add the following content:
```ini
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
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Create Celery Beat Service
```bash
sudo nano /etc/systemd/system/drmays-celery-beat.service
```

Add the following content:
```ini
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
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## 📋 Step 9: Nginx Configuration

### Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/mayslife.uk
```

Add the following content:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mayslife.uk www.mayslife.uk;
    return 301 https://$server_name$request_uri;
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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Frontend Routes
    location / {
        root /var/www/drmays/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
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
```

### Enable the Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 📋 Step 10: SSL Certificate Setup

### Install SSL Certificate with Let's Encrypt
```bash
# Get SSL certificate
sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📋 Step 11: Set Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/drmays

# Set proper permissions
sudo chmod -R 755 /var/www/drmays
sudo chmod -R 644 /var/www/drmays/staticfiles
sudo chmod -R 644 /var/www/drmays/dist
```

## 📋 Step 12: Start Services

### Enable and Start All Services
```bash
# Enable services
sudo systemctl enable drmays.service
sudo systemctl enable drmays-celery.service
sudo systemctl enable drmays-celery-beat.service
sudo systemctl enable redis-server
sudo systemctl enable postgresql
sudo systemctl enable nginx

# Start services
sudo systemctl start redis-server
sudo systemctl start postgresql
sudo systemctl start nginx
sudo systemctl start drmays.service
sudo systemctl start drmays-celery.service
sudo systemctl start drmays-celery-beat.service

# Check service status
sudo systemctl status drmays.service
sudo systemctl status drmays-celery.service
sudo systemctl status drmays-celery-beat.service
sudo systemctl status nginx
```

## 📋 Step 13: Firewall Configuration

```bash
# Install UFW if not already installed
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (if needed for external access)
sudo ufw enable

# Check firewall status
sudo ufw status
```

## 📋 Step 14: Monitoring and Logs

### Check Application Logs
```bash
# Django application logs
sudo journalctl -u drmays.service -f

# Celery logs
sudo journalctl -u drmays-celery.service -f
sudo journalctl -u drmays-celery-beat.service -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog
```

### Monitor System Resources
```bash
# Check system resources
htop
df -h
free -h

# Check service status
sudo systemctl status drmays.service
sudo systemctl status nginx
sudo systemctl status redis-server
sudo systemctl status postgresql
```

## 🎉 Step 15: Verify Deployment

### Test Your Application
1. **Visit your website**: https://mayslife.uk
2. **Test API**: https://mayslife.uk/api/
3. **Test Admin**: https://mayslife.uk/admin/
4. **Check SSL**: https://www.ssllabs.com/ssltest/analyze.html?d=mayslife.uk

### Common Issues and Solutions

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -c "SELECT version();"
```

#### 2. Static Files Not Loading
```bash
# Collect static files again
cd /var/www/drmays
source venv/bin/activate
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data /var/www/drmays/staticfiles
```

#### 3. Celery Not Working
```bash
# Check Redis connection
redis-cli ping

# Restart Celery services
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service
```

#### 4. Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Maintenance and Updates

### Update Application
```bash
# Create backup
sudo cp -r /var/www/drmays /var/www/drmays-backup-$(date +%Y%m%d)

# Update code
cd /var/www/drmays
git pull origin main

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt
npm install
npm run build

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service
```

### Backup Script
```bash
# Create backup script
nano /var/www/drmays/backup.sh
```

Add the following content:
```bash
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
```

```bash
# Make script executable
chmod +x /var/www/drmays/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /var/www/drmays/backup.sh
```

## 🎯 Final Checklist

- [ ] Domain `mayslife.uk` points to `158.178.143.50`
- [ ] SSL certificate is installed and working
- [ ] All services are running (Django, Celery, Redis, PostgreSQL, Nginx)
- [ ] Application is accessible at https://mayslife.uk
- [ ] Admin panel is accessible at https://mayslife.uk/admin/
- [ ] API is working at https://mayslife.uk/api/
- [ ] Static files are loading correctly
- [ ] Database is connected and working
- [ ] Celery tasks are processing
- [ ] Firewall is configured
- [ ] Backup system is in place

## 📞 Support

If you encounter any issues during deployment:

1. Check the logs: `sudo journalctl -u drmays.service -f`
2. Verify all services are running: `sudo systemctl status drmays.service`
3. Test database connection: `sudo -u postgres psql -c "SELECT version();"`
4. Check Nginx configuration: `sudo nginx -t`

Your Dr. Mays Nutrition System should now be successfully deployed and accessible at https://mayslife.uk! 🎉
