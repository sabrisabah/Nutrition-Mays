# إصلاح عرض السعرات الحرارية اليومية

## المشكلة
كانت السعرات الحرارية تظهر تلقائياً محسوبة في واجهة الطبيب حتى لو لم يدخل الطبيب سعرات مخصصة.

## الحل المطبق

### 1. تحديث واجهة عرض ملف المريض
**الملف**: `src/pages/doctor/PatientProfile.jsx`

**التغييرات**:
- إزالة عرض السعرات المحسوبة تلقائياً في وضع العرض
- عرض "غير محدد" فقط إذا لم يتم إدخال سعرات مخصصة
- إضافة رسالة توضيحية للطبيب حول كيفية تحديد السعرات المخصصة
- إضافة كلمة "(مخصصة)" عند عرض السعرات المخصصة

### 2. إنشاء Serializer جديد للمرضى
**الملف**: `accounts/serializers.py`

**إضافة**:
```python
class UserWithPatientProfileSerializer(serializers.ModelSerializer):
    daily_calories = serializers.SerializerMethodField()
    
    def get_daily_calories(self, obj):
        """Get daily calories from patient profile if user is a patient"""
        if hasattr(obj, 'patient_profile') and obj.patient_profile:
            return obj.patient_profile.daily_calories
        return None
```

### 3. تحديث API endpoint قائمة المرضى
**الملف**: `accounts/views.py`

**التغييرات**:
- استخدام `UserWithPatientProfileSerializer` بدلاً من `UserSerializer`
- إضافة `select_related('patient_profile')` لتحسين الأداء
- تضمين بيانات السعرات الحرارية في استجابة API

### 4. تحديث واجهة اختيار المريض
**الملف**: `src/components/DailyMealPlanner.jsx`

**التغييرات**:
- تصحيح مسار البيانات من `selectedPatient.patient_profile?.daily_calories` إلى `selectedPatient.daily_calories`
- إضافة كلمة "(مخصصة)" عند عرض السعرات

## النتيجة النهائية

### في صفحة ملف المريض:
- **إذا لم يتم تحديد سعرات مخصصة**: يظهر "غير محدد" مع رسالة توضيحية
- **إذا تم تحديد سعرات مخصصة**: يظهر العدد مع كلمة "(مخصصة)"

### في واجهة اختيار المريض:
- **إذا لم يتم تحديد سعرات مخصصة**: لا يظهر أي شيء
- **إذا تم تحديد سعرات مخصصة**: يظهر العدد مع كلمة "(مخصصة)"

### في وضع التعديل:
- يظهر حقل إدخال للسعرات المخصصة
- يظهر السعرات المحسوبة كمرجع فقط (لا يتم حفظها تلقائياً)

## الملفات المعدلة

1. `src/pages/doctor/PatientProfile.jsx` - إصلاح عرض السعرات
2. `accounts/serializers.py` - إضافة serializer جديد
3. `accounts/views.py` - تحديث API endpoint
4. `src/components/DailyMealPlanner.jsx` - تصحيح مسار البيانات

## الاختبار

لاختبار الإصلاح:
1. انتقل إلى ملف مريض لم يتم تحديد سعرات حرارية مخصصة له
2. تأكد من ظهور "غير محدد" بدلاً من السعرات المحسوبة
3. في واجهة اختيار المريض، تأكد من عدم ظهور السعرات
4. قم بتحديد سعرات مخصصة وتأكد من ظهورها مع كلمة "(مخصصة)"
