# سكريبت تشغيل تطبيق د. ميس للتغذية
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   تشغيل تطبيق د. ميس للتغذية" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python موجود: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ خطأ: Python غير مثبت على النظام" -ForegroundColor Red
    Write-Host "يرجى تثبيت Python من https://python.org" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# التحقق من وجود Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js موجود: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ خطأ: Node.js غير مثبت على النظام" -ForegroundColor Red
    Write-Host "يرجى تثبيت Node.js من https://nodejs.org" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host ""
Write-Host "[1/6] تفعيل البيئة الافتراضية..." -ForegroundColor Yellow

# إنشاء البيئة الافتراضية إذا لم تكن موجودة
if (-not (Test-Path "myenv\Scripts\activate.ps1")) {
    Write-Host "إنشاء البيئة الافتراضية..." -ForegroundColor Yellow
    python -m venv myenv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ خطأ في إنشاء البيئة الافتراضية" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
}

# تفعيل البيئة الافتراضية
& "myenv\Scripts\activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ خطأ في تفعيل البيئة الافتراضية" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[2/6] تثبيت متطلبات Python..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ خطأ في تثبيت متطلبات Python" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[3/6] تثبيت متطلبات Node.js..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ خطأ في تثبيت متطلبات Node.js" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[4/6] تشغيل migrations لقاعدة البيانات..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ خطأ في تشغيل migrations" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[5/6] إنشاء مستخدم إداري..." -ForegroundColor Yellow
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('تم إنشاء مستخدم إداري: admin / admin123')
else:
    print('المستخدم الإداري موجود بالفعل')
"

Write-Host "[6/6] تشغيل الخوادم..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   التطبيق جاهز للاستخدام!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الواجهة الأمامية (React): http://localhost:3000" -ForegroundColor Green
Write-Host "الواجهة الخلفية (Django): http://localhost:8000" -ForegroundColor Green
Write-Host "لوحة الإدارة: http://localhost:8000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "بيانات الدخول للإدارة:" -ForegroundColor Yellow
Write-Host "اسم المستخدم: admin" -ForegroundColor White
Write-Host "كلمة المرور: admin123" -ForegroundColor White
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف الخوادم" -ForegroundColor Yellow
Write-Host ""

# تشغيل React في نافذة منفصلة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# انتظار قليل ثم تشغيل Django
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python manage.py runserver" -WindowStyle Normal

Write-Host ""
Write-Host "✓ تم تشغيل التطبيق بنجاح!" -ForegroundColor Green
Write-Host "افتح المتصفح واذهب إلى: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Read-Host "اضغط Enter للخروج"
