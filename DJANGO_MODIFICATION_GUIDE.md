# 🐍 Django Modification Guide - Avoiding Common Errors

## 📋 Table of Contents
1. [Understanding Django Settings Structure](#understanding-django-settings-structure)
2. [Common Django Errors and Solutions](#common-django-errors-and-solutions)
3. [Safe Django Settings Modification](#safe-django-settings-modification)
4. [Environment Configuration](#environment-configuration)
5. [Database Configuration](#database-configuration)
6. [Static Files Configuration](#static-files-configuration)
7. [Service Configuration](#service-configuration)
8. [Testing and Validation](#testing-and-validation)
9. [Troubleshooting Steps](#troubleshooting-steps)

---

## 🏗️ Understanding Django Settings Structure

### Basic Django Settings File Structure
```python
# dr_mays_nutrition/settings.py

import os
from pathlib import Path
from decouple import config

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Allowed hosts
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Your apps here
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
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

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

---

## ❌ Common Django Errors and Solutions

### 1. **IndentationError: unexpected indent**
```python
# ❌ WRONG - Extra indentation
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
    DEBUG = True

# ✅ CORRECT - No extra indentation
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
DEBUG = True
```

### 2. **ImproperlyConfigured: Empty static prefix not permitted**
```python
# ❌ WRONG - Empty STATIC_URL
STATIC_URL = ''

# ✅ CORRECT - Valid STATIC_URL
STATIC_URL = '/static/'
```

### 3. **ModuleNotFoundError: No module named 'decouple'**
```bash
# Install the missing package
pip install python-decouple
```

### 4. **Database connection errors**
```python
# ❌ WRONG - Missing database configuration
DATABASES = {}

# ✅ CORRECT - Proper database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'drmays_nutrition',
        'USER': 'drmays_user',
        'PASSWORD': 'NewStrong!Passw0rd2025',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## 🔧 Safe Django Settings Modification

### Step 1: Always Create a Backup
```bash
# Create backup before making changes
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup-$(date +%Y%m%d_%H%M%S)
```

### Step 2: Use Environment Variables
```python
# Use python-decouple for environment variables
from decouple import config

# Safe way to get configuration
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
```

### Step 3: Validate Settings After Changes
```bash
# Test Django configuration
python3 manage.py check --deploy

# Test database connection
python3 manage.py check --database default

# Test syntax
python3 -m py_compile dr_mays_nutrition/settings.py
```

---

## 🌍 Environment Configuration

### Create .env File
```bash
# .env file
DEBUG=False
SECRET_KEY=django-insecure-change-this-in-production-temp-key
ALLOWED_HOSTS=mayslife.uk,www.mayslife.uk,158.178.143.50
DATABASE_URL=postgresql://drmays_user:NewStrong!Passw0rd2025@localhost/drmays_nutrition
REDIS_URL=redis://localhost:6379
```

### Load Environment Variables in Settings
```python
# In settings.py
from decouple import config
import dj_database_url

# Load from environment
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Database from environment
DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL', default='postgresql://drmays_user:NewStrong!Passw0rd2025@localhost/drmays_nutrition')
    )
}
```

---

## 🗄️ Database Configuration

### PostgreSQL Configuration
```python
# Production database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'drmays_nutrition',
        'USER': 'drmays_user',
        'PASSWORD': 'NewStrong!Passw0rd2025',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'prefer',
        },
    }
}
```

### Using dj-database-url
```python
# Alternative using dj-database-url
import dj_database_url

DATABASES = {
    'default': dj_database_url.parse('postgresql://drmays_user:NewStrong!Passw0rd2025@localhost/drmays_nutrition')
}
```

---

## 📁 Static Files Configuration

### Development vs Production
```python
# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Only add STATICFILES_DIRS if the directory exists
if (BASE_DIR / 'static').exists() and (BASE_DIR / 'static') != (BASE_DIR / 'staticfiles'):
    STATICFILES_DIRS = [
        BASE_DIR / 'static',
    ]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### URLs Configuration
```python
# In urls.py - Only serve static files in development
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Your URL patterns here
]

# Only serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

---

## ⚙️ Service Configuration

### Celery Configuration
```python
# Celery settings
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
```

### Add Celery Apps to INSTALLED_APPS
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_celery_beat',
    'django_celery_results',
    # Your apps here
]
```

### Logging Configuration
```python
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
```

---

## 🧪 Testing and Validation

### 1. Syntax Validation
```bash
# Check Python syntax
python3 -m py_compile dr_mays_nutrition/settings.py
```

### 2. Django Configuration Check
```bash
# Check Django configuration
python3 manage.py check --deploy

# Check specific database
python3 manage.py check --database default
```

### 3. Database Connection Test
```bash
# Test database connection
python3 manage.py dbshell
```

### 4. Static Files Test
```bash
# Collect static files
python3 manage.py collectstatic --noinput

# Check if static files are collected
ls -la staticfiles/
```

---

## 🔍 Troubleshooting Steps

### Step 1: Check Service Status
```bash
# Check all services
sudo systemctl status drmays.service
sudo systemctl status drmays-celery.service
sudo systemctl status drmays-celery-beat.service
```

### Step 2: Check Service Logs
```bash
# Check service logs
sudo journalctl -u drmays.service -f
sudo journalctl -u drmays-celery.service -f
sudo journalctl -u drmays-celery-beat.service -f
```

### Step 3: Test Manual Startup
```bash
# Test Gunicorn manually
cd /var/www/drmays
source venv/bin/activate
gunicorn --config gunicorn.conf.py dr_mays_nutrition.wsgi:application

# Test Celery manually
celery -A dr_mays_nutrition worker --loglevel=info
```

### Step 4: Check File Permissions
```bash
# Check file permissions
ls -la /var/www/drmays/
ls -la /var/www/drmays/venv/bin/gunicorn
ls -la /var/www/drmays/venv/bin/celery
```

### Step 5: Check Dependencies
```bash
# Check if packages are installed
pip list | grep -E "(django|gunicorn|celery|psycopg2|redis|decouple)"
```

---

## 📝 Best Practices

### 1. Always Use Environment Variables
```python
# ✅ GOOD - Use environment variables
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this')
DEBUG = config('DEBUG', default=False, cast=bool)

# ❌ BAD - Hardcoded values
SECRET_KEY = 'django-insecure-hardcoded-key'
DEBUG = True
```

### 2. Validate Settings After Changes
```bash
# Always run these after making changes
python3 -m py_compile dr_mays_nutrition/settings.py
python3 manage.py check --deploy
```

### 3. Use Proper Indentation
```python
# ✅ GOOD - Proper indentation
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
}

# ❌ BAD - Incorrect indentation
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
    }
```

### 4. Test Before Production
```bash
# Test locally first
python3 manage.py runserver
python3 manage.py check --deploy
```

---

## 🚀 Quick Fix Commands

### Fix Common Issues
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays

# Fix indentation issues
sed -i 's/^    # /# /g' dr_mays_nutrition/settings.py
sed -i 's/^    ALLOWED_HOSTS/ALLOWED_HOSTS/g' dr_mays_nutrition/settings.py

# Restart services
sudo systemctl restart drmays.service
sudo systemctl restart drmays-celery.service
sudo systemctl restart drmays-celery-beat.service
```

### Validate Everything
```bash
# Complete validation
python3 -m py_compile dr_mays_nutrition/settings.py && \
python3 manage.py check --deploy && \
python3 manage.py check --database default && \
echo "✅ All checks passed!"
```

---

## 📞 Emergency Recovery

### If Django Won't Start
```bash
# 1. Check syntax
python3 -m py_compile dr_mays_nutrition/settings.py

# 2. Check configuration
python3 manage.py check --deploy

# 3. Check database
python3 manage.py check --database default

# 4. Check logs
sudo journalctl -u drmays.service -f
```

### If Services Keep Failing
```bash
# 1. Stop all services
sudo systemctl stop drmays.service drmays-celery.service drmays-celery-beat.service

# 2. Fix permissions
sudo chown -R www-data:www-data /var/www/drmays
sudo chmod -R 755 /var/www/drmays

# 3. Test manually
cd /var/www/drmays
source venv/bin/activate
python3 manage.py check --deploy

# 4. Start services one by one
sudo systemctl start drmays.service
sleep 5
sudo systemctl start drmays-celery.service
sleep 5
sudo systemctl start drmays-celery-beat.service
```

---

## 🎯 Summary

### Key Points to Remember:
1. **Always backup** before making changes
2. **Use environment variables** for configuration
3. **Validate settings** after every change
4. **Check syntax** with `python3 -m py_compile`
5. **Test configuration** with `python3 manage.py check --deploy`
6. **Use proper indentation** in Python files
7. **Test services manually** before using systemd
8. **Check logs** when services fail
9. **Fix permissions** if services can't access files
10. **Restart services** after making changes

### Common Commands:
```bash
# Validation
python3 -m py_compile dr_mays_nutrition/settings.py
python3 manage.py check --deploy

# Service management
sudo systemctl status drmays.service
sudo systemctl restart drmays.service
sudo journalctl -u drmays.service -f

# Manual testing
cd /var/www/drmays && source venv/bin/activate
gunicorn --config gunicorn.conf.py dr_mays_nutrition.wsgi:application
```

This guide should help you avoid common Django errors and properly modify your Django configuration! 🚀
