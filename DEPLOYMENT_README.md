# Dr. Mays Nutrition Platform - Complete Deployment Guide

## 🚀 Quick Start

This repository contains everything you need to deploy the Dr. Mays Nutrition Platform on Ubuntu 24.04 LTS with full SSL, domain configuration, and production-ready setup.

### Server Information
- **IP Address**: 152.42.167.125
- **Domain**: www.mayslife.uk
- **GitHub Repository**: https://github.com/sabrisabah/Nutrition-Mays.git
- **Ubuntu Version**: 24.04 LTS

## 📋 Prerequisites

Before starting, ensure you have:
1. Ubuntu 24.04 LTS server with root access
2. Domain name (mayslife.uk) pointing to your server IP
3. SSH access to the server
4. Basic knowledge of Linux commands

## 🛠️ Deployment Steps

### Step 1: Initial Server Setup
```bash
# Connect to your server
ssh root@152.42.167.125

# Download and run the deployment script
wget https://raw.githubusercontent.com/sabrisabah/Nutrition-Mays/main/deploy_to_ubuntu.sh
chmod +x deploy_to_ubuntu.sh
./deploy_to_ubuntu.sh
```

### Step 2: SSL Certificate Setup
```bash
# Run the SSL setup script
wget https://raw.githubusercontent.com/sabrisabah/Nutrition-Mays/main/setup_ssl_and_finalize.sh
chmod +x setup_ssl_and_finalize.sh
./setup_ssl_and_finalize.sh
```

### Step 3: Manual Configuration
After the automated setup, you need to:

1. **Update Email Configuration**
   ```bash
   sudo nano /home/mays/drmays/.env
   ```
   Update these values:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   ```

2. **Configure Payment Providers**
   Update these values in the `.env` file:
   ```
   ZAINCASH_MERCHANT_ID=your_zaincash_merchant_id
   ZAINCASH_SECRET_KEY=your_zaincash_secret_key
   ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init
   
   ASIAHAWALA_MERCHANT_ID=your_asiahawala_merchant_id
   ASIAHAWALA_SECRET_KEY=your_asiahawala_secret_key
   ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init
   ```

3. **Restart Services**
   ```bash
   sudo systemctl restart drmays
   sudo systemctl restart nginx
   ```

## 🔧 Manual Installation (Alternative)

If you prefer manual installation, follow the detailed guide in `UBUNTU_24_04_FULL_CONFIGURATION_GUIDE.md`.

## 📁 Project Structure

```
/home/mays/drmays/
├── accounts/                 # User management
├── bookings/                 # Appointment system
├── meal_plans/              # Nutrition planning
├── payments/                # Payment processing
├── reports/                 # Reporting system
├── notifications/           # Notification system
├── src/                     # React frontend
├── static/                  # Static files
├── media/                   # User uploads
├── logs/                    # Application logs
├── .env                     # Environment variables
└── requirements.txt         # Python dependencies
```

## 🌐 Services and Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80, 443 | Web server and reverse proxy |
| Django | 8000 | Backend API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache and message broker |
| Celery | - | Background tasks |

## 🔒 Security Features

- ✅ SSL/TLS encryption with Let's Encrypt
- ✅ Firewall configuration (UFW)
- ✅ Fail2ban intrusion prevention
- ✅ Rate limiting on API endpoints
- ✅ Security headers
- ✅ Database security
- ✅ Regular security updates

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check all services
sudo systemctl status drmays nginx postgresql redis-server

# Check application health
curl https://www.mayslife.uk/health/

# Check logs
sudo tail -f /var/log/nginx/mayslife.uk.error.log
sudo tail -f /home/mays/drmays/logs/django.log
```

### Backup
Automated daily backups are configured:
- Database backups
- Media files
- Project files
- 7-day retention policy

### Updates
```bash
# Update application
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

## 🚨 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   sudo systemctl restart drmays
   sudo systemctl restart nginx
   ```

2. **SSL Certificate Issues**
   ```bash
   sudo certbot renew --dry-run
   sudo systemctl reload nginx
   ```

3. **Database Connection Issues**
   ```bash
   sudo systemctl restart postgresql
   sudo -u postgres psql -c "SELECT 1;"
   ```

4. **Static Files Not Loading**
   ```bash
   cd /home/mays/drmays
   source venv/bin/activate
   export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production
   python manage.py collectstatic --noinput
   ```

### Log Locations
- Application logs: `/home/mays/drmays/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - User registration

### Patient Management
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient
- `GET /api/patients/{id}/` - Get patient details
- `PUT /api/patients/{id}/` - Update patient

### Meal Plans
- `GET /api/meal-plans/` - List meal plans
- `POST /api/meal-plans/` - Create meal plan
- `GET /api/meal-plans/{id}/` - Get meal plan details

### Appointments
- `GET /api/appointments/` - List appointments
- `POST /api/appointments/` - Create appointment
- `PUT /api/appointments/{id}/` - Update appointment

### Payments
- `POST /api/payments/` - Process payment
- `GET /api/payments/{id}/` - Get payment status

## 📱 Frontend Features

- Responsive design for all devices
- Multi-language support (English/Arabic)
- Real-time notifications
- Interactive nutrition calculator
- Appointment scheduling
- Payment processing
- Patient management dashboard
- Doctor management interface

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
# Core settings
DEBUG=False
SECRET_KEY=your_secret_key
ALLOWED_HOSTS=www.mayslife.uk,mayslife.uk,152.42.167.125

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Payment providers
ZAINCASH_MERCHANT_ID=your_merchant_id
ZAINCASH_SECRET_KEY=your_secret_key
ASIAHAWALA_MERCHANT_ID=your_merchant_id
ASIAHAWALA_SECRET_KEY=your_secret_key
```

### Nginx Configuration
Located at: `/etc/nginx/sites-available/mayslife.uk`

### Systemd Services
- `drmays.service` - Django application
- `drmays-celery.service` - Celery worker
- `drmays-celery-beat.service` - Celery scheduler

## 📞 Support

For support and questions:
- GitHub Issues: https://github.com/sabrisabah/Nutrition-Mays/issues
- Email: admin@mayslife.uk
- Server IP: 152.42.167.125

## 📄 License

This project is proprietary software. All rights reserved.

## 🎯 Next Steps

After successful deployment:

1. **Test all functionality**
   - User registration and login
   - Patient management
   - Meal plan creation
   - Appointment scheduling
   - Payment processing

2. **Configure monitoring**
   - Set up alerts for service failures
   - Monitor disk space and memory usage
   - Set up log monitoring

3. **Security audit**
   - Review firewall rules
   - Check SSL certificate status
   - Verify backup procedures

4. **Performance optimization**
   - Monitor response times
   - Optimize database queries
   - Configure caching strategies

---

**🎉 Congratulations! Your Dr. Mays Nutrition Platform is now live at https://www.mayslife.uk**
