# Quick Start Guide - Ubuntu Deployment
## Domain: mayslife.uk | IP: 158.178.143.50

This is a quick start guide for deploying the Dr. Mays Nutrition System on your Ubuntu server.

## 🚀 Prerequisites

1. **Domain Setup**: Ensure `mayslife.uk` and `www.mayslife.uk` point to IP `158.178.143.50`
2. **Server Access**: SSH access to your Ubuntu server
3. **Project Files**: Upload your project files to the server

## 📋 Quick Deployment Steps

### Step 1: Upload Files to Server
```bash
# On your local machine, upload files to server
scp -r . user@158.178.143.50:/home/user/drmays-temp/
```

### Step 2: Connect to Server
```bash
ssh user@158.178.143.50
```

### Step 3: Run Deployment Script
```bash
# Navigate to project directory
cd /home/user/drmays-temp

# Make scripts executable
chmod +x deploy-ubuntu.sh update-app.sh

# Run deployment script
./deploy-ubuntu.sh
```

### Step 4: Create Superuser (After Deployment)
```bash
# Create admin user
sudo -u www-data /var/www/drmays/venv/bin/python /var/www/drmays/manage.py createsuperuser
```

## 🔧 Manual Configuration (If Script Fails)

### 1. Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
sudo apt install -y nginx redis-server postgresql postgresql-contrib
sudo apt install -y certbot python3-certbot-nginx nodejs npm
```

### 2. Setup Database
```bash
sudo -u postgres psql
CREATE DATABASE drmays_nutrition;
CREATE USER drmays_user WITH PASSWORD 'drmays_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;
ALTER USER drmays_user CREATEDB;
\q
```

### 3. Setup Application
```bash
# Create directory
sudo mkdir -p /var/www/drmays
sudo chown $USER:$USER /var/www/drmays

# Copy files
cp -r . /var/www/drmays/
cd /var/www/drmays

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Setup Node.js
npm install
npm run build

# Setup environment
cp production.env .env
# Edit .env with your settings

# Run migrations
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4. Setup Services
```bash
# Copy service files
sudo cp drmays.service /etc/systemd/system/
sudo cp drmays-celery.service /etc/systemd/system/
sudo cp drmays-celery-beat.service /etc/systemd/system/

# Copy Nginx config
sudo cp nginx-mayslife.conf /etc/nginx/sites-available/mayslife.uk
sudo ln -s /etc/nginx/sites-available/mayslife.uk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable drmays drmays-celery drmays-celery-beat nginx redis-server postgresql
sudo systemctl start redis-server postgresql nginx drmays drmays-celery drmays-celery-beat
```

### 5. Setup SSL
```bash
sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk
```

## 🎯 Verification

After deployment, verify everything is working:

1. **Website**: https://mayslife.uk
2. **Admin Panel**: https://mayslife.uk/admin/
3. **API**: https://mayslife.uk/api/

### Check Services
```bash
sudo systemctl status drmays.service
sudo systemctl status nginx
sudo systemctl status redis-server
sudo systemctl status postgresql
```

### View Logs
```bash
# Application logs
sudo journalctl -u drmays.service -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updates

To update your application:
```bash
cd /var/www/drmays
./update-app.sh
```

## 🆘 Troubleshooting

### Common Issues:

1. **Domain not resolving**: Check DNS settings
2. **SSL certificate issues**: Run `sudo certbot --nginx -d mayslife.uk -d www.mayslife.uk`
3. **Database connection**: Check PostgreSQL is running
4. **Static files not loading**: Run `python manage.py collectstatic --noinput`
5. **Services not starting**: Check logs with `sudo journalctl -u service-name -f`

### Reset Everything:
```bash
sudo systemctl stop drmays drmays-celery drmays-celery-beat nginx
sudo rm -rf /var/www/drmays
# Then run deployment script again
```

## 📞 Support

If you encounter issues:
1. Check the logs: `sudo journalctl -u drmays.service -f`
2. Verify domain DNS: `nslookup mayslife.uk`
3. Test database: `sudo -u postgres psql -c "SELECT version();"`
4. Check Nginx: `sudo nginx -t`

Your Dr. Mays Nutrition System should now be running at https://mayslife.uk! 🎉
