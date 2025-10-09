# Dr. Mays Nutrition System - Ubuntu Installation Guide

## 🚀 Quick Installation

### Prerequisites
- Ubuntu 20.04+ server
- Root or sudo access
- Domain name pointing to your server (optional for SSL)

### One-Command Installation

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup_app.sh -o setup_app.sh
chmod +x setup_app.sh
./setup_app.sh
```

### Manual Installation

1. **Upload the setup script to your server:**
   ```bash
   scp setup_app.sh ubuntu@158.178.143.50:/home/ubuntu/
   ```

2. **SSH into your server:**
   ```bash
   ssh ubuntu@158.178.143.50
   ```

3. **Make the script executable and run it:**
   ```bash
   chmod +x setup_app.sh
   ./setup_app.sh
   ```

## 📋 What the Script Installs

### System Packages
- Python 3.12
- Node.js 18.x
- PostgreSQL
- Redis
- Nginx
- Certbot (for SSL)

### Python Packages
- Django 5.2.7
- Django REST Framework
- PostgreSQL adapter
- Gunicorn
- Redis client
- And all other required dependencies

### Services Configured
- Django application (Gunicorn)
- Nginx web server
- PostgreSQL database
- Redis cache
- SSL certificate (Let's Encrypt)

## 🔧 Configuration

### Database
The script preserves your existing database configuration. It uses:
- **Database**: `drmays_db`
- **Username**: `drmays_user`
- **Password**: `NewStrong!Passw0rd2025`
- **Host**: `localhost`
- **Port**: `5432`

### Environment Variables
The script creates a `.env` file with default settings. Update it if needed:
```bash
nano /var/www/drmays/Nutrition-Mays/.env
```

### Admin Access
- **URL**: `https://mayslife.uk/admin/`
- **Username**: `admin`
- **Password**: `admin123`

## 🌐 Access Points

After installation, your application will be available at:
- **Main Website**: `https://mayslife.uk`
- **Admin Panel**: `https://mayslife.uk/admin/`
- **API Endpoints**: `https://mayslife.uk/api/`

## 🔍 Troubleshooting

### Check Service Status
```bash
# Check all services
sudo systemctl status drmays nginx postgresql redis-server

# Check Django logs
sudo journalctl -u drmays -f

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart Django application
sudo systemctl restart drmays

# Restart Nginx
sudo systemctl restart nginx

# Restart all services
sudo systemctl restart drmays nginx postgresql redis-server
```

### Common Issues

1. **Permission Errors**
   ```bash
   sudo chown -R www-data:www-data /var/www/drmays
   sudo chmod -R 755 /var/www/drmays
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test database connection
   sudo -u postgres psql -c "SELECT version();"
   ```

3. **Static Files Not Loading**
   ```bash
   cd /var/www/drmays/Nutrition-Mays
   . venv/bin/activate
   python3 manage.py collectstatic --noinput
   ```

## 📁 Important Directories

- **Project Root**: `/var/www/drmays/Nutrition-Mays`
- **Static Files**: `/var/www/drmays/staticfiles`
- **Media Files**: `/var/www/drmays/media`
- **Logs**: `/var/log/drmays`
- **Nginx Config**: `/etc/nginx/sites-available/drmays`

## 🔄 Updates and Maintenance

### Update the Application
```bash
cd /var/www/drmays/Nutrition-Mays
. venv/bin/activate
git pull origin main
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py collectstatic --noinput
sudo systemctl restart drmays
```

### Backup Database
```bash
sudo -u postgres pg_dump drmays_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Monitor System Resources
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop
```

## 🛡️ Security Notes

- The script installs SSL certificates automatically
- Firewall rules should be configured separately
- Regular security updates are recommended
- Database credentials should be changed from defaults

## 📞 Support

If you encounter any issues:
1. Check the logs using the troubleshooting commands above
2. Verify all services are running
3. Check file permissions
4. Ensure your domain DNS is pointing to the server

## 🎉 Success!

Once the installation is complete, you should see:
- ✅ All services running
- ✅ Website accessible at your domain
- ✅ Admin panel working
- ✅ SSL certificate installed

Your Dr. Mays Nutrition System is now ready for production use!
