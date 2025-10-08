import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  ar: {
    // Navigation
    'dashboard': 'لوحة التحكم',
    'profile': 'الملف الشخصي',
    'appointments': 'المواعيد',
    'meal_plans': 'خطط الوجبات',
    'payments': 'المدفوعات',
    'patients': 'المرضى',
    'doctors': 'الأطباء',
    'users': 'المستخدمين',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    'logout': 'تسجيل الخروج',
    
    // Common
    'welcome': 'مرحباً',
    'loading': 'جاري التحميل...',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'edit': 'تعديل',
    'delete': 'حذف',
    'view': 'عرض',
    'search': 'بحث',
    'filter': 'تصفية',
    'export': 'تصدير',
    'import': 'استيراد',
    'add': 'إضافة',
    'create': 'إنشاء',
    'update': 'تحديث',
    'submit': 'إرسال',
    'close': 'إغلاق',
    'yes': 'نعم',
    'no': 'لا',
    'confirm': 'تأكيد',
    
    // Auth
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'confirm_password': 'تأكيد كلمة المرور',
    'first_name': 'الاسم الأول',
    'last_name': 'اسم العائلة',
    'phone': 'رقم الهاتف',
    'role': 'الدور',
    'patient': 'مريض',
    'doctor': 'طبيب',
    'admin': 'مدير',
    'accountant': 'محاسب',
    
    // Patient
    'my_appointments': 'مواعيدي',
    'my_meal_plans': 'خطط وجباتي',
    'my_payments': 'مدفوعاتي',
    'book_appointment': 'حجز موعد',
    'medical_history': 'التاريخ الطبي',
    'measurements': 'القياسات',
    'progress': 'التقدم',
    
    // Doctor
    'my_patients': 'مرضاي',
    'create_meal_plan': 'إنشاء خطة وجبات',
    'patient_appointments': 'مواعيد المرضى',
    'availability': 'الأوقات المتاحة',
    
    // Admin
    'financial_dashboard': 'لوحة الحسابات',
    'user_management': 'إدارة المستخدمين',
    'payment_management': 'إدارة المدفوعات',
    'system_reports': 'تقارير النظام',
    
    // Status
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'paid': 'مدفوع',
    'unpaid': 'غير مدفوع',
    'active': 'نشط',
    'inactive': 'غير نشط',
  },
  en: {
    // Navigation
    'dashboard': 'Dashboard',
    'profile': 'Profile',
    'appointments': 'Appointments',
    'meal_plans': 'Meal Plans',
    'payments': 'Payments',
    'patients': 'Patients',
    'doctors': 'Doctors',
    'users': 'Users',
    'reports': 'Reports',
    'settings': 'Settings',
    'logout': 'Logout',
    
    // Common
    'welcome': 'Welcome',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'edit': 'Edit',
    'delete': 'Delete',
    'view': 'View',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'import': 'Import',
    'add': 'Add',
    'create': 'Create',
    'update': 'Update',
    'submit': 'Submit',
    'close': 'Close',
    'yes': 'Yes',
    'no': 'No',
    'confirm': 'Confirm',
    
    // Auth
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'phone': 'Phone',
    'role': 'Role',
    'patient': 'Patient',
    'doctor': 'Doctor',
    'admin': 'Admin',
    'accountant': 'Accountant',
    
    // Patient
    'my_appointments': 'My Appointments',
    'my_meal_plans': 'My Meal Plans',
    'my_payments': 'My Payments',
    'book_appointment': 'Book Appointment',
    'medical_history': 'Medical History',
    'measurements': 'Measurements',
    'progress': 'Progress',
    
    // Doctor
    'my_patients': 'My Patients',
    'create_meal_plan': 'Create Meal Plan',
    'patient_appointments': 'Patient Appointments',
    'availability': 'Availability',
    
    // Admin
    'financial_dashboard': 'Financial Dashboard',
    'user_management': 'User Management',
    'payment_management': 'Payment Management',
    'system_reports': 'System Reports',
    
    // Status
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'paid': 'Paid',
    'unpaid': 'Unpaid',
    'active': 'Active',
    'inactive': 'Inactive',
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar'
  })

  const direction = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    direction,
    toggleLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export { LanguageContext }
