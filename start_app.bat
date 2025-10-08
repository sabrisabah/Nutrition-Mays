@echo off
echo ========================================
echo    تشغيل تطبيق د. ميس للتغذية
echo ========================================
echo.

REM التحقق من وجود Python
python --version >nul 2>&1
if errorlevel 1 (
    echo خطأ: Python غير مثبت على النظام
    echo يرجى تثبيت Python من https://python.org
    pause
    exit /b 1
)

REM التحقق من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo خطأ: Node.js غير مثبت على النظام
    echo يرجى تثبيت Node.js من https://nodejs.org
    pause
    exit /b 1
)

echo [1/6] تفعيل البيئة الافتراضية...
if not exist "myenv\Scripts\activate.bat" (
    echo إنشاء البيئة الافتراضية...
    python -m venv myenv
    if errorlevel 1 (
        echo خطأ في إنشاء البيئة الافتراضية
        pause
        exit /b 1
    )
)

call myenv\Scripts\activate.bat
if errorlevel 1 (
    echo خطأ في تفعيل البيئة الافتراضية
    pause
    exit /b 1
)

echo [2/6] تثبيت متطلبات Python...
pip install -r requirements.txt
if errorlevel 1 (
    echo خطأ في تثبيت متطلبات Python
    pause
    exit /b 1
)

echo [3/6] تثبيت متطلبات Node.js...
npm install
if errorlevel 1 (
    echo خطأ في تثبيت متطلبات Node.js
    pause
    exit /b 1
)

echo [4/6] تشغيل migrations لقاعدة البيانات...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo خطأ في تشغيل migrations
    pause
    exit /b 1
)

echo [5/6] إنشاء مستخدم إداري (إذا لم يكن موجوداً)...
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('تم إنشاء مستخدم إداري: admin / admin123')
else:
    print('المستخدم الإداري موجود بالفعل')
"

echo [6/6] تشغيل الخوادم...
echo.
echo ========================================
echo    التطبيق جاهز للاستخدام!
echo ========================================
echo.
echo الواجهة الأمامية (React): http://localhost:3000
echo الواجهة الخلفية (Django): http://localhost:8000
echo لوحة الإدارة: http://localhost:8000/admin
echo.
echo بيانات الدخول للإدارة:
echo اسم المستخدم: admin
echo كلمة المرور: admin123
echo.
echo اضغط Ctrl+C لإيقاف الخوادم
echo.

REM تشغيل React في نافذة منفصلة
start "React Frontend" cmd /k "npm run dev"

REM انتظار قليل ثم تشغيل Django
timeout /t 3 /nobreak >nul
start "Django Backend" cmd /k "python manage.py runserver"

echo.
echo تم تشغيل التطبيق بنجاح!
echo افتح المتصفح واذهب إلى: http://localhost:3000
echo.
pause
