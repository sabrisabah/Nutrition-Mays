# دليل التثبيت الشامل - نظام التغذية العراقية

## نظرة عامة
هذا دليل شامل لتثبيت وتشغيل نظام التغذية العراقية على كل من Windows و Ubuntu.

## متطلبات النظام

### Windows
- Windows 10/11
- Python 3.11+
- Node.js 18+
- Git

### Ubuntu
- Ubuntu 20.04 LTS أو أحدث
- Python 3.11+
- Node.js 18+
- Git
- Nginx (للإنتاج)

## التثبيت على Windows

### 1. تثبيت المتطلبات الأساسية

#### تثبيت Python
```bash
# تحميل Python من python.org
# أو استخدام Chocolatey
choco install python

# أو استخدام winget
winget install Python.Python.3.11
```

#### تثبيت Node.js
```bash
# تحميل Node.js من nodejs.org
# أو استخدام Chocolatey
choco install nodejs

# أو استخدام winget
winget install OpenJS.NodeJS
```

#### تثبيت Git
```bash
# تحميل Git من git-scm.com
# أو استخدام Chocolatey
choco install git
```

### 2. إعداد المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd 1212

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية
venv\Scripts\activate

# تثبيت متطلبات Python
pip install -r requirements_windows.txt

# تثبيت متطلبات Node.js
npm install
```

### 3. إعداد قاعدة البيانات

```bash
# تشغيل migrations
python manage.py migrate

# إنشاء superuser
python manage.py createsuperuser

# جمع الملفات الثابتة
python manage.py collectstatic --noinput
```

### 4. تشغيل التطبيق

#### وضع التطوير
```bash
# تشغيل Django (Terminal 1)
python manage.py runserver

# تشغيل React (Terminal 2)
npm run dev
```

#### الوصول للتطبيق
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

## التثبيت على Ubuntu

### 1. تحديث النظام

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. تثبيت المتطلبات الأساسية

```bash
# تثبيت Python و pip
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت Git
sudo apt install git -y

# تثبيت أدوات إضافية
sudo apt install build-essential libpq-dev -y
```

### 3. إعداد المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd 1212

# إنشاء بيئة افتراضية
python3.11 -m venv venv

# تفعيل البيئة الافتراضية
source venv/bin/activate

# تثبيت متطلبات Python
pip install -r requirements.txt

# تثبيت متطلبات Node.js
npm install
```

### 4. إعداد قاعدة البيانات

```bash
# تشغيل migrations
python manage.py migrate

# إنشاء superuser
python manage.py createsuperuser

# جمع الملفات الثابتة
python manage.py collectstatic --noinput
```

### 5. تشغيل التطبيق

#### وضع التطوير
```bash
# تشغيل Django
python manage.py runserver 0.0.0.0:8000

# تشغيل React (في terminal منفصل)
npm run dev
```

## النشر على Ubuntu (الإنتاج)

### 1. تثبيت Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. تثبيت Gunicorn

```bash
pip install gunicorn
```

### 3. إعداد Nginx

```bash
# إنشاء ملف التكوين
sudo nano /etc/nginx/sites-available/dr-mays-nutrition

# محتوى الملف:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

    location /static/ {
        alias /path/to/your/project/static/;
    }

    location /media/ {
        alias /path/to/your/project/media/;
    }
}

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/dr-mays-nutrition /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. إعداد Systemd Service

```bash
# إنشاء ملف الخدمة
sudo nano /etc/systemd/system/dr-mays-nutrition.service

# محتوى الملف:
[Unit]
Description=Dr Mays Nutrition Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/project
Environment="PATH=/path/to/your/project/venv/bin"
ExecStart=/path/to/your/project/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 dr_mays_nutrition.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target

# تفعيل الخدمة
sudo systemctl daemon-reload
sudo systemctl start dr-mays-nutrition
sudo systemctl enable dr-mays-nutrition
```

### 5. إعداد SSL (اختياري)

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com
```

## إعدادات مهمة

### متغيرات البيئة

#### Windows (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Ubuntu (.env)
```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=your-domain.com,localhost
```

### إعدادات Django

```python
# settings.py
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')
```

## أوامر مفيدة

### إدارة قاعدة البيانات
```bash
# إنشاء migrations
python manage.py makemigrations

# تطبيق migrations
python manage.py migrate

# إنشاء superuser
python manage.py createsuperuser

# جمع الملفات الثابتة
python manage.py collectstatic
```

### إدارة التطبيق
```bash
# تشغيل الخادم
python manage.py runserver

# تشغيل shell
python manage.py shell

# تشغيل tests
python manage.py test
```

### إدارة Node.js
```bash
# تثبيت dependencies
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل tests
npm test
```

## استكشاف الأخطاء

### مشاكل شائعة

#### خطأ في Python
```bash
# تحديث pip
pip install --upgrade pip

# إعادة تثبيت requirements
pip install -r requirements.txt --force-reinstall
```

#### خطأ في Node.js
```bash
# مسح cache
npm cache clean --force

# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

#### خطأ في قاعدة البيانات
```bash
# حذف قاعدة البيانات وإعادة إنشاءها
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### سجلات النظام

#### Ubuntu
```bash
# سجلات Nginx
sudo tail -f /var/log/nginx/error.log

# سجلات Django
tail -f logs/django.log

# سجلات Systemd
sudo journalctl -u dr-mays-nutrition -f
```

## الأمان

### إعدادات الإنتاج
```python
# settings.py للإنتاج
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### حماية الملفات
```bash
# تعيين صلاحيات آمنة
chmod 600 .env
chmod 755 static/
chmod 755 media/
```

## النسخ الاحتياطي

### قاعدة البيانات
```bash
# نسخ احتياطي
cp db.sqlite3 backup/db_$(date +%Y%m%d_%H%M%S).sqlite3

# استعادة
cp backup/db_20250101_120000.sqlite3 db.sqlite3
```

### الملفات
```bash
# نسخ احتياطي كامل
tar -czf backup/project_$(date +%Y%m%d_%H%M%S).tar.gz .
```

## التحديث

### تحديث الكود
```bash
# سحب التحديثات
git pull origin main

# تحديث dependencies
pip install -r requirements.txt
npm install

# تطبيق migrations
python manage.py migrate

# جمع الملفات الثابتة
python manage.py collectstatic --noinput

# إعادة تشغيل الخدمات
sudo systemctl restart dr-mays-nutrition
sudo systemctl reload nginx
```

## الدعم

### معلومات الاتصال
- المطور: AI Assistant
- البريد الإلكتروني: support@example.com
- التوثيق: README.md

### روابط مفيدة
- Django Documentation: https://docs.djangoproject.com/
- React Documentation: https://reactjs.org/docs/
- Nginx Documentation: https://nginx.org/en/docs/

---

**تاريخ الإنشاء**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**الإصدار**: 1.0
**المطور**: AI Assistant
