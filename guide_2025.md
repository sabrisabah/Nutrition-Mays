# دليل تشغيل نظام د. ميس للتغذية والعافية - 2025
# Dr MAYS Nutrition & Wellness System - 2025 Guide

## 📋 نظرة عامة على النظام

نظام د. ميس للتغذية والعافية هو نظام متكامل يضم:
- **واجهة المريض**: إدارة الملفات الصحية، حجز المواعيد، متابعة خطط الوجبات
- **واجهة الطبيب**: إدارة المرضى، إنشاء خطط الوجبات، جدولة المواعيد
- **واجهة الإدارة**: التحكم الكامل، التقارير المالية، إدارة المستخدمين
- **نظام الدفع**: دعم وسائل الدفع المحلية (ZainCash, AsiaHawala, QiCard, Switch)
- **نظام الإشعارات**: إشعارات فورية، رسائل SMS، بريد إلكتروني

## 🏗️ هيكل المشروع

```
dr-mays-nutrition/
├── Backend (Django 4.2)
│   ├── accounts/              # إدارة المستخدمين والملفات
│   ├── meal_plans/           # خطط الوجبات والأطعمة
│   ├── bookings/             # المواعيد والحجوزات
│   ├── payments/             # المدفوعات والفواتير
│   ├── notifications/        # الإشعارات والدردشة
│   ├── reports/              # التقارير والإحصائيات
│   └── manage.py
├── Frontend (React 18)
│   ├── src/
│   │   ├── components/       # المكونات المشتركة
│   │   ├── pages/           # صفحات التطبيق
│   │   ├── contexts/        # إدارة الحالة
│   │   ├── hooks/           # React Hooks مخصصة
│   │   ├── services/        # خدمات API
│   │   └── utils/           # وظائف مساعدة
│   └── package.json
├── requirements.txt          # متطلبات Python
├── package.json             # متطلبات Node.js
└── README.md
```

## 🔧 متطلبات النظام

### الحد الأدنى للمتطلبات:
- **نظام التشغيل**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **المعالج**: Intel Core i3 أو AMD Ryzen 3
- **الذاكرة**: 8GB RAM (16GB موصى به)
- **التخزين**: 15GB مساحة فارغة
- **الاتصال**: اتصال بالإنترنت

### البرمجيات المطلوبة:
- **Python 3.9+** (Python 3.11 موصى به)
- **Node.js 18+** (Node.js 20 LTS موصى به)
- **Git** (للاستنساخ والتطوير)
- **Redis** (اختياري - للوظائف المتقدمة)

## 📥 التثبيت والإعداد

### 1. تثبيت Python 3.11

#### Windows:
```cmd
# تحميل من python.org
# أو باستخدام Chocolatey
choco install python --version=3.11.0 -y
```

#### macOS:
```bash
# باستخدام Homebrew
brew install python@3.11
```

#### Ubuntu/Linux:
```bash
# إضافة PPA
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-pip
```

### 2. تثبيت Node.js 20 LTS

#### Windows:
```cmd
# تحميل من nodejs.org
# أو باستخدام Chocolatey
choco install nodejs -y
```

#### macOS:
```bash
# باستخدام Homebrew
brew install node@20
```

#### Ubuntu/Linux:
```bash
# باستخدام NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. تثبيت Git

#### Windows:
```cmd
# تحميل من git-scm.com
# أو باستخدام Chocolatey
choco install git -y
```

#### macOS:
```bash
# باستخدام Homebrew
brew install git
```

#### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install git
```

### 4. تثبيت Redis (اختياري)

#### Windows:
```cmd
# باستخدام Chocolatey
choco install redis-64 -y
# أو تحميل من GitHub releases
```

#### macOS:
```bash
# باستخدام Homebrew
brew install redis
```

#### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install redis-server
```

## 🚀 إعداد المشروع

### 1. استنساخ المشروع

```bash
# استنساخ المشروع
git clone https://github.com/your-username/dr-mays-nutrition.git
cd dr-mays-nutrition
```

### 2. إعداد البيئة الافتراضية

#### Windows:
```cmd
# إنشاء بيئة افتراضية
python -m venv myenv

# تفعيل البيئة الافتراضية
myenv\Scripts\activate
```

#### macOS/Linux:
```bash
# إنشاء بيئة افتراضية
python3.11 -m venv myenv

# تفعيل البيئة الافتراضية
source myenv/bin/activate
```

### 3. تثبيت متطلبات Python

```bash
# ترقية pip
python -m pip install --upgrade pip

# تثبيت المتطلبات
pip install -r requirements.txt
```

### 4. تثبيت متطلبات Node.js

```bash
# تثبيت حزم Node.js
npm install
```

### 5. إعداد قاعدة البيانات

```bash
# إنشاء الهجرات
python manage.py makemigrations

# تطبيق الهجرات
python manage.py migrate

# إنشاء مستخدم إداري
python manage.py createsuperuser
```

عند إنشاء المستخدم الإداري، أدخل:
- **Username**: admin
- **Email**: admin@drmays.com
- **Password**: admin123 (أو كلمة مرور قوية)

### 6. إنشاء البيانات التجريبية

```bash
# إنشاء بيانات تجريبية
python manage.py setup_sample_patients
python manage.py setup_sample_doctors
python manage.py create_sample_meal_plans
python manage.py setup_foods
python manage.py setup_meal_types
```

## 🎯 تشغيل النظام

### الطريقة الأولى - تشغيل يدوي (مستحسن للتطوير)

#### 1. تشغيل Redis (إذا كان مثبتاً)

```bash
# Windows
redis-server

# macOS/Linux
redis-server
```

#### 2. تشغيل Celery Worker (في terminal منفصل)

```bash
# تفعيل البيئة الافتراضية أولاً
# Windows
myenv\Scripts\activate
# macOS/Linux
source myenv/bin/activate

# تشغيل Celery Worker
celery -A dr_mays_nutrition worker --loglevel=info
```

#### 3. تشغيل Celery Beat (في terminal منفصل)

```bash
# تفعيل البيئة الافتراضية أولاً
# Windows
myenv\Scripts\activate
# macOS/Linux
source myenv/bin/activate

# تشغيل Celery Beat
celery -A dr_mays_nutrition beat --loglevel=info
```

#### 4. تشغيل Django Backend (في terminal منفصل)

```bash
# تفعيل البيئة الافتراضية أولاً
# Windows
myenv\Scripts\activate
# macOS/Linux
source myenv/bin/activate

# تشغيل Django
python manage.py runserver
```

#### 5. تشغيل React Frontend (في terminal منفصل)

```bash
# تشغيل React
npm run dev
```

### الطريقة الثانية - تشغيل تلقائي (مستحسن للإنتاج)

#### Windows - استخدام ملفات .bat

```cmd
# تشغيل النظام الكامل
start_complete_system.bat

# أو تشغيل النظام المتكامل فقط
start_integrated_system.bat

# أو تشغيل النظام المتكامل مع الخيارات
python manage.py start_integrated_system --daemon
```

#### macOS/Linux - استخدام سكريبتات shell

```bash
# تشغيل النظام الكامل
./start_complete_system.sh

# أو تشغيل النظام المتكامل فقط
./start_integrated_system.sh
```

### الطريقة الثالثة - تشغيل مبسط (للمبتدئين)

```bash
# تشغيل Django فقط
python manage.py runserver

# في terminal منفصل - تشغيل React
npm run dev
```

## 🌐 الوصول للنظام

بعد تشغيل جميع الخدمات، يمكنك الوصول للنظام عبر:

### الروابط الرئيسية:
- **الواجهة الأمامية**: http://localhost:3000
- **واجهة الإدارة**: http://localhost:8000/admin
- **API**: http://localhost:8000/api/

### حسابات تجريبية:
- **المدير**: 
  - Username: `admin`
  - Password: `admin123`
- **مريض تجريبي**: 
  - Username: `patient_demo`
  - Password: `password123`
- **طبيب تجريبي**: 
  - Username: `doctor_demo`
  - Password: `password123`

## 🔧 استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### 1. خطأ "python is not recognized"
```bash
# Windows - إضافة Python إلى PATH
# Control Panel > System > Advanced System Settings > Environment Variables
# أضف: C:\Users\YourUsername\AppData\Local\Programs\Python\Python311\
# و: C:\Users\YourUsername\AppData\Local\Programs\Python\Python311\Scripts\

# أو إعادة تثبيت Python مع تحديد "Add to PATH"
```

#### 2. خطأ "node is not recognized"
```bash
# إعادة تثبيت Node.js
# أو إضافة Node.js يدوياً إلى PATH
```

#### 3. خطأ في تثبيت الحزم
```bash
# تحديث pip
python -m pip install --upgrade pip

# Windows - تثبيت Microsoft Visual C++ Build Tools
# من: https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

#### 4. خطأ في قاعدة البيانات
```bash
# حذف قاعدة البيانات وإعادة إنشائها
rm db.sqlite3  # Linux/macOS
del db.sqlite3  # Windows
python manage.py migrate
python manage.py createsuperuser
```

#### 5. خطأ في Redis
```bash
# إذا لم يكن Redis مثبتاً، يمكن تجاهله للتطوير
# أو تثبيته من: https://github.com/microsoftarchive/redis/releases
```

#### 6. خطأ في Celery
```bash
# إذا كان هناك خطأ في Celery، يمكن تشغيل النظام بدونه
# فقط شغل Django و React
```

#### 7. خطأ في المنافذ
```bash
# تحقق من أن المنافذ 3000 و 8000 غير مستخدمة
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Linux/macOS
lsof -i :3000
lsof -i :8000
```

## 📱 اختبار النظام

### 1. اختبار الواجهة الأمامية:
1. اذهب إلى http://localhost:3000
2. جرب تسجيل الدخول بحساب المريض
3. تصفح الميزات المختلفة:
   - عرض خطط الوجبات
   - حجز المواعيد
   - متابعة التقدم

### 2. اختبار واجهة الإدارة:
1. اذهب إلى http://localhost:8000/admin
2. سجل دخول بحساب المدير
3. تصفح إدارة المستخدمين والبيانات

### 3. اختبار API:
1. اذهب إلى http://localhost:8000/api/
2. جرب الطلبات المختلفة
3. تحقق من التوثيق

## 🎯 نصائح مفيدة

### 1. استخدام Visual Studio Code:
```bash
# تثبيت VS Code
# Windows
choco install vscode -y
# macOS
brew install --cask visual-studio-code
# Ubuntu
sudo snap install --classic code

# فتح المشروع في VS Code
code .
```

### 2. استخدام Terminal متقدم:
```bash
# Windows - Windows Terminal
choco install microsoft-windows-terminal -y

# macOS - iTerm2
brew install --cask iterm2

# Ubuntu - Zsh + Oh My Zsh
sudo apt install zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### 3. إعداد اختصارات:
- أنشئ اختصار لملف `start_system.bat` (Windows)
- ضعه على سطح المكتب للوصول السريع

### 4. مراقبة الأداء:
- استخدم Task Manager (Windows) أو Activity Monitor (macOS)
- استخدم htop (Linux) لمراقبة العمليات

## 🔄 التحديثات والصيانة

### تحديث النظام:
```bash
# سحب التحديثات
git pull origin main

# تحديث المتطلبات
pip install -r requirements.txt
npm install

# تطبيق الهجرات
python manage.py migrate
```

### نسخ احتياطي:
```bash
# نسخ احتياطي لقاعدة البيانات
cp db.sqlite3 backup_$(date +%Y%m%d_%H%M%S).sqlite3

# نسخ احتياطي للملفات
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

## 📞 الدعم

إذا واجهت أي مشاكل:

1. **تحقق من السجلات**: اقرأ رسائل الخطأ في Terminal
2. **تحقق من المتطلبات**: تأكد من تثبيت جميع البرمجيات المطلوبة
3. **تحقق من المنافذ**: تأكد من أن المنافذ 3000 و 8000 غير مستخدمة
4. **أعد تشغيل النظام**: أحياناً إعادة التشغيل تحل المشاكل

### معلومات الاتصال:
- **البريد الإلكتروني**: support@drmays.com
- **الهاتف**: +964-XXX-XXX-XXXX
- **GitHub Issues**: [رابط المشروع]/issues

## 📚 موارد إضافية

### التوثيق:
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)

### أدوات مفيدة:
- [Postman](https://www.postman.com/) - لاختبار API
- [Redis Desktop Manager](https://rdm.dev/) - لإدارة Redis
- [DBeaver](https://dbeaver.io/) - لإدارة قاعدة البيانات

---

**نظام د. ميس للتغذية والعافية**  
*نظام متكامل لإدارة التغذية والعافية* 🌟

**ملاحظة**: هذا الدليل مخصص للتطوير المحلي. للإنتاج، يرجى مراجعة `DEPLOYMENT_GUIDE.md`

**آخر تحديث**: يناير 2025
