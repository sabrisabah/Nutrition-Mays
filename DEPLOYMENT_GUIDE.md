# دليل التنصيب - نظام د. ميس للتغذية والعافية

## نظرة عامة

هذا الدليل يوضح كيفية تنصيب وتشغيل نظام د. ميس للتغذية والعافية في بيئات مختلفة، من التطوير المحلي إلى الإنتاج على الخوادم.

## 📋 متطلبات النظام

### الحد الأدنى للمتطلبات
- **المعالج**: 2 Core CPU
- **الذاكرة**: 4GB RAM
- **التخزين**: 20GB مساحة فارغة
- **نظام التشغيل**: Ubuntu 20.04+ / CentOS 8+ / Windows 10+

### البرمجيات المطلوبة
- **Python**: 3.8 أو أحدث
- **Node.js**: 16.x أو أحدث
- **Redis**: 6.0 أو أحدث
- **Git**: لإدارة الكود
- **Nginx**: لخدمة الملفات الثابتة (للإنتاج)

## 🚀 التنصيب المحلي (Development)

### 1. تحضير البيئة

#### على Windows:
```powershell
# تحميل Python من python.org
# تحميل Node.js من nodejs.org
# تحميل Git من git-scm.com

# فتح PowerShell كمدير
# تشغيل الأوامر التالية
```

#### على Ubuntu/Linux:
```bash
# تشغيل سكريبت التنصيب التلقائي
chmod +x ubuntu_setup.sh
./ubuntu_setup.sh
```

#### على macOS:
```bash
# تثبيت Homebrew إذا لم يكن مثبتاً
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# تثبيت المتطلبات
brew install python@3.9 node redis git
```

### 2. تحضير المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd dr-mays-nutrition

# إنشاء بيئة افتراضية لـ Python
python -m venv myenv

# تفعيل البيئة الافتراضية
# على Windows:
myenv\Scripts\activate
# على Linux/macOS:
source myenv/bin/activate

# تثبيت متطلبات Python
pip install -r requirements.txt

# تثبيت متطلبات Node.js
npm install
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء ملف البيئة
cp .env.example .env

# تحرير ملف البيئة
# Windows:
notepad .env
# Linux/macOS:
nano .env

# تشغيل الهجرات
python manage.py makemigrations
python manage.py migrate

# إنشاء مستخدم إداري
python manage.py createsuperuser

# إنشاء بيانات تجريبية
python manage.py setup_sample_patients
python manage.py setup_sample_doctors
python manage.py create_sample_meal_plans
```

### 4. تشغيل التطبيق

```bash
# تشغيل Redis (في terminal منفصل)
redis-server

# تشغيل Celery Worker (في terminal منفصل)
celery -A dr_mays_nutrition worker --loglevel=info

# تشغيل Celery Beat (في terminal منفصل)
celery -A dr_mays_nutrition beat --loglevel=info

# تشغيل Django Backend (في terminal منفصل)
python manage.py runserver

# تشغيل React Frontend (في terminal منفصل)
npm run dev
```

### 5. الوصول للتطبيق

- **الواجهة الأمامية**: http://localhost:3000
- **واجهة الإدارة**: http://localhost:8000/admin
- **API**: http://localhost:8000/api/

## 🏭 التنصيب للإنتاج (Production)

### 1. إعداد الخادم

#### على Ubuntu 20.04+:

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت المتطلبات الأساسية
sudo apt install python3 python3-pip python3-venv python3-dev build-essential nginx redis-server supervisor git -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# تثبيت PostgreSQL (اختياري - بدلاً من SQLite)
sudo apt install postgresql postgresql-contrib -y
```

### 2. إعداد قاعدة البيانات (PostgreSQL)

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة بيانات ومستخدم
CREATE DATABASE drmays_nutrition;
CREATE USER drmays_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE drmays_nutrition TO drmays_user;
\q
```

### 3. تحضير التطبيق

```bash
# إنشاء مجلد التطبيق
sudo mkdir -p /var/www/drmays
sudo chown $USER:$USER /var/www/drmays

# نسخ الكود
cd /var/www/drmays
git clone <repository-url> .

# إنشاء بيئة افتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المتطلبات
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# تثبيت Frontend
npm install
npm run build
```

### 4. إعداد متغيرات البيئة

```bash
# إنشاء ملف البيئة للإنتاج
nano .env
```

```env
# إعدادات Django
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# قاعدة البيانات
DATABASE_URL=postgresql://drmays_user:secure_password_here@localhost/drmays_nutrition

# Redis
REDIS_URL=redis://localhost:6379

# إعدادات البريد الإلكتروني
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# إعدادات الدفع
ZAINCASH_MERCHANT_ID=your-merchant-id
ZAINCASH_SECRET_KEY=your-secret-key
ZAINCASH_API_URL=https://api.zaincash.iq/transaction/init

ASIAHAWALA_MERCHANT_ID=your-merchant-id
ASIAHAWALA_SECRET_KEY=your-secret-key
ASIAHAWALA_API_URL=https://api.asiahawala.com/transaction/init
```

### 5. إعداد Django للإنتاج

```bash
# تحديث إعدادات Django
nano dr_mays_nutrition/settings.py
```

```python
# إضافة في نهاية الملف
import dj_database_url

# قاعدة البيانات
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='sqlite:///db.sqlite3'))
}

# الأمان
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# الملفات الثابتة
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS للإنتاج
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 6. إعداد Gunicorn

```bash
# إنشاء ملف إعداد Gunicorn
nano gunicorn.conf.py
```

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

### 7. إعداد Supervisor

```bash
# إنشاء ملف إعداد Supervisor للتطبيق
sudo nano /etc/supervisor/conf.d/drmays.conf
```

```ini
[program:drmays]
command=/var/www/drmays/venv/bin/gunicorn --config gunicorn.conf.py dr_mays_nutrition.wsgi:application
directory=/var/www/drmays
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/drmays.log

[program:drmays-celery]
command=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition worker --loglevel=info
directory=/var/www/drmays
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/drmays-celery.log

[program:drmays-celery-beat]
command=/var/www/drmays/venv/bin/celery -A dr_mays_nutrition beat --loglevel=info
directory=/var/www/drmays
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/drmays-celery-beat.log
```

### 8. إعداد Nginx

```bash
# إنشاء ملف إعداد Nginx
sudo nano /etc/nginx/sites-available/drmays
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # إعادة توجيه HTTP إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # شهادات SSL
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # الملفات الثابتة
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

    # API و Admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # الواجهة الأمامية
    location / {
        root /var/www/drmays/dist;
        try_files $uri $uri/ /index.html;
    }

    # أمان إضافي
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 9. تفعيل الإعدادات

```bash
# تفعيل موقع Nginx
sudo ln -s /etc/nginx/sites-available/drmays /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# تحديث Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start drmays
sudo supervisorctl start drmays-celery
sudo supervisorctl start drmays-celery-beat

# تشغيل الخدمات
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔧 إعداد SSL Certificate

### باستخدام Let's Encrypt (Certbot):

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# تجديد تلقائي
sudo crontab -e
# إضافة السطر التالي:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 مراقبة الأداء

### 1. مراقبة الخدمات

```bash
# حالة Supervisor
sudo supervisorctl status

# حالة Nginx
sudo systemctl status nginx

# حالة Redis
sudo systemctl status redis-server

# مراقبة الموارد
htop
df -h
free -h
```

### 2. مراقبة التطبيق

```bash
# سجلات Django
tail -f /var/log/drmays.log

# سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# سجلات Celery
tail -f /var/log/drmays-celery.log
```

## 🔄 التحديثات والصيانة

### 1. تحديث التطبيق

```bash
# نسخ احتياطي
sudo cp -r /var/www/drmays /var/www/drmays-backup-$(date +%Y%m%d)

# تحديث الكود
cd /var/www/drmays
git pull origin main

# تحديث المتطلبات
source venv/bin/activate
pip install -r requirements.txt

# تحديث Frontend
npm install
npm run build

# تحديث قاعدة البيانات
python manage.py makemigrations
python manage.py migrate

# جمع الملفات الثابتة
python manage.py collectstatic --noinput

# إعادة تشغيل الخدمات
sudo supervisorctl restart drmays
sudo supervisorctl restart drmays-celery
sudo supervisorctl restart drmays-celery-beat
```

### 2. النسخ الاحتياطي

```bash
# إنشاء سكريبت النسخ الاحتياطي
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/drmays"
DATE=$(date +%Y%m%d_%H%M%S)

# إنشاء مجلد النسخ الاحتياطي
mkdir -p $BACKUP_DIR

# نسخ قاعدة البيانات
pg_dump drmays_nutrition > $BACKUP_DIR/database_$DATE.sql

# نسخ الملفات
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/drmays

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# جعل السكريبت قابل للتنفيذ
chmod +x backup.sh

# إضافة للمهام المجدولة
crontab -e
# إضافة:
0 2 * * * /var/www/drmays/backup.sh
```

## 🐳 التنصيب باستخدام Docker

### 1. إنشاء Dockerfile

```dockerfile
# Dockerfile
FROM python:3.9-slim

# تثبيت متطلبات النظام
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# تعيين مجلد العمل
WORKDIR /app

# نسخ متطلبات Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ الكود
COPY . .

# جمع الملفات الثابتة
RUN python manage.py collectstatic --noinput

# تعيين المنفذ
EXPOSE 8000

# تشغيل التطبيق
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "dr_mays_nutrition.wsgi:application"]
```

### 2. إنشاء docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: drmays_nutrition
      POSTGRES_USER: drmays_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: gunicorn --bind 0.0.0.0:8000 dr_mays_nutrition.wsgi:application
    volumes:
      - .:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://drmays_user:secure_password@db:5432/drmays_nutrition
      - REDIS_URL=redis://redis:6379

  celery:
    build: .
    command: celery -A dr_mays_nutrition worker --loglevel=info
    volumes:
      - .:/app
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://drmays_user:secure_password@db:5432/drmays_nutrition
      - REDIS_URL=redis://redis:6379

  celery-beat:
    build: .
    command: celery -A dr_mays_nutrition beat --loglevel=info
    volumes:
      - .:/app
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://drmays_user:secure_password@db:5432/drmays_nutrition
      - REDIS_URL=redis://redis:6379

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 3. تشغيل Docker

```bash
# بناء وتشغيل الخدمات
docker-compose up -d

# تشغيل الهجرات
docker-compose exec web python manage.py migrate

# إنشاء مستخدم إداري
docker-compose exec web python manage.py createsuperuser

# مراقبة السجلات
docker-compose logs -f
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### 1. خطأ في قاعدة البيانات
```bash
# فحص اتصال قاعدة البيانات
python manage.py dbshell

# إعادة تعيين الهجرات
python manage.py migrate --fake-initial
```

#### 2. مشاكل في الملفات الثابتة
```bash
# جمع الملفات الثابتة
python manage.py collectstatic --clear --noinput

# فحص صلاحيات المجلدات
sudo chown -R www-data:www-data /var/www/drmays/staticfiles
```

#### 3. مشاكل في Redis
```bash
# فحص حالة Redis
redis-cli ping

# إعادة تشغيل Redis
sudo systemctl restart redis-server
```

#### 4. مشاكل في Celery
```bash
# فحص حالة Celery
sudo supervisorctl status drmays-celery

# إعادة تشغيل Celery
sudo supervisorctl restart drmays-celery
```

## 📞 الدعم والمساعدة

### معلومات الاتصال:
- **البريد الإلكتروني**: support@drmays.com
- **الهاتف**: +964-XXX-XXX-XXXX
- **الموقع**: https://drmays.com

### موارد إضافية:
- [وثائق Django](https://docs.djangoproject.com/)
- [وثائق React](https://reactjs.org/docs/)
- [وثائق Nginx](https://nginx.org/en/docs/)
- [وثائق Redis](https://redis.io/documentation)

---

**نظام د. ميس للتغذية والعافية**  
*نظام متكامل لإدارة التغذية والعافية مع أحدث التقنيات* 🌟
