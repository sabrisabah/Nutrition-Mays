import React, { useState, useEffect, useCallback } from 'react'

const NutritionCalculator = ({ patientProfile, onNutritionCalculated }) => {
  const [nutritionData, setNutritionData] = useState({
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    water: 0
  })

  // حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor
  const calculateBMR = (weight, height, age, gender) => {
    if (!weight || !height || !age) return 0
    
    // الوزن بالكيلوغرام، الطول بالسنتيمتر، العمر بالسنوات
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    return Math.round(bmr)
  }

  // حساب إجمالي استهلاك الطاقة اليومي (TDEE)
  const calculateTDEE = (bmr, activityLevel) => {
    const activityMultipliers = {
      'sedentary': 1.2,      // قليل النشاط
      'light': 1.375,        // نشاط خفيف
      'moderate': 1.55,      // نشاط متوسط
      'active': 1.725,       // نشاط عالي
      'very_active': 1.9     // نشاط عالي جداً
    }
    
    const multiplier = activityMultipliers[activityLevel] || 1.55
    return Math.round(bmr * multiplier)
  }

  // حساب السعرات المستهدفة حسب الهدف
  const calculateTargetCalories = (tdee, goal) => {
    // طرح 500 سعرة حرارية من إجمالي استهلاك الطاقة
    return Math.round(tdee - 500)
  }

  // حساب البروتين (1.6-2.2 جم لكل كيلوغرام من وزن الجسم)
  const calculateProtein = (weight, goal) => {
    if (!weight) return 0
    
    const proteinPerKg = {
      'lose_weight': 2.2,        // خسارة الوزن
      'maintain_weight': 1.6,    // الحفاظ على الوزن
      'gain_weight': 1.8,        // زيادة الوزن
      'build_muscle': 2.0,       // بناء العضلات
      'improve_health': 1.8      // تحسين الصحة
    }
    
    const proteinPerKgValue = proteinPerKg[goal] || 1.6
    return Math.round(weight * proteinPerKgValue)
  }

  // حساب الدهون (25-35% من السعرات اليومية)
  const calculateFat = (targetCalories, goal) => {
    if (!targetCalories) return 0
    
    const fatPercentage = {
      'lose_weight': 0.25,       // خسارة الوزن
      'maintain_weight': 0.30,   // الحفاظ على الوزن
      'gain_weight': 0.35,       // زيادة الوزن
      'build_muscle': 0.25,      // بناء العضلات
      'improve_health': 0.30     // تحسين الصحة
    }
    
    const percentage = fatPercentage[goal] || 0.30
    const fatCalories = targetCalories * percentage
    return Math.round(fatCalories / 9) // 9 سعرات لكل جرام دهون
  }

  // حساب الكربوهيدرات (الباقي من السعرات)
  const calculateCarbs = (targetCalories, protein, fat) => {
    if (!targetCalories || !protein || !fat) return 0
    
    const proteinCalories = protein * 4  // 4 سعرات لكل جرام بروتين
    const fatCalories = fat * 9          // 9 سعرات لكل جرام دهون
    const carbCalories = targetCalories - proteinCalories - fatCalories
    
    return Math.round(carbCalories / 4) // 4 سعرات لكل جرام كربوهيدرات
  }

  // حساب الألياف (14 جم لكل 1000 سعرة حرارية)
  const calculateFiber = (targetCalories) => {
    if (!targetCalories) return 0
    return Math.round((targetCalories / 1000) * 14)
  }

  // حساب الماء (35 مل لكل كيلوغرام من وزن الجسم)
  const calculateWater = (weight) => {
    if (!weight) return 0
    return Math.round(weight * 35)
  }

  // حساب جميع القيم عند تغيير بيانات المريض
  useEffect(() => {
    if (!patientProfile) return

    const { current_weight, height, goal, activity_level } = patientProfile
    const age = patientProfile.user?.age || 30 // افتراضي 30 سنة
    const gender = patientProfile.gender || 'male'

    // حساب العمر من تاريخ الميلاد إذا كان متوفراً
    let calculatedAge = age
    if (patientProfile.user?.date_of_birth) {
      const birthDate = new Date(patientProfile.user.date_of_birth)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
    }

    const bmr = calculateBMR(current_weight, height, calculatedAge, gender)
    const tdee = calculateTDEE(bmr, activity_level)
    const targetCalories = calculateTargetCalories(tdee, goal)
    const protein = calculateProtein(current_weight, goal)
    const fat = calculateFat(targetCalories, goal)
    const carbs = calculateCarbs(targetCalories, protein, fat)
    const fiber = calculateFiber(targetCalories)
    const water = calculateWater(current_weight)

    const newNutritionData = {
      bmr,
      tdee,
      targetCalories,
      protein,
      carbs,
      fat,
      fiber,
      water
    }

    setNutritionData(newNutritionData)
    
    // إرسال البيانات للمكون الأب
    if (onNutritionCalculated) {
      onNutritionCalculated(newNutritionData)
    }
  }, [patientProfile])

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-calculator text-primary me-2"></i>
          حساب الاحتياجات الغذائية
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">معدل الأيض الأساسي (BMR)</label>
              <div className="form-control-plaintext bg-light p-2 rounded">
                {nutritionData.bmr} سعرة حرارية/يوم
              </div>
              <small className="text-muted">الطاقة المطلوبة للوظائف الأساسية</small>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">إجمالي استهلاك الطاقة (TDEE)</label>
              <div className="form-control-plaintext bg-light p-2 rounded">
                {nutritionData.tdee} سعرة حرارية/يوم
              </div>
              <small className="text-muted">بما في ذلك النشاط البدني</small>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold text-success">السعرات المستهدفة</label>
              <div className="form-control-plaintext bg-success bg-opacity-10 p-2 rounded border border-success">
                {nutritionData.targetCalories} سعرة حرارية/يوم
              </div>
              <small className="text-muted">حسب الهدف المحدد</small>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold text-primary">البروتين</label>
              <div className="form-control-plaintext bg-primary bg-opacity-10 p-2 rounded border border-primary">
                {nutritionData.protein} جم/يوم
              </div>
              <small className="text-muted">للبناء والإصلاح</small>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold text-warning">الكربوهيدرات</label>
              <div className="form-control-plaintext bg-warning bg-opacity-10 p-2 rounded border border-warning">
                {nutritionData.carbs} جم/يوم
              </div>
              <small className="text-muted">للطاقة والنشاط</small>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold text-danger">الدهون</label>
              <div className="form-control-plaintext bg-danger bg-opacity-10 p-2 rounded border border-danger">
                {nutritionData.fat} جم/يوم
              </div>
              <small className="text-muted">للهرمونات والامتصاص</small>
            </div>
          </div>
        </div>
        
        <div className="row mt-3">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold text-info">الألياف</label>
              <div className="form-control-plaintext bg-info bg-opacity-10 p-2 rounded border border-info">
                {nutritionData.fiber} جم/يوم
              </div>
              <small className="text-muted">لصحة الجهاز الهضمي</small>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold text-info">الماء</label>
              <div className="form-control-plaintext bg-info bg-opacity-10 p-2 rounded border border-info">
                {nutritionData.water} مل/يوم
              </div>
              <small className="text-muted">للترطيب والوظائف الحيوية</small>
            </div>
          </div>
        </div>
        
        <div className="alert alert-info mt-3">
          <h6 className="alert-heading">
            <i className="fas fa-info-circle me-2"></i>
            ملاحظات مهمة:
          </h6>
          <ul className="mb-0">
            <li>هذه الحسابات مبنية على معادلات علمية معتمدة</li>
            <li>يُنصح بمراجعة الطبيب قبل تطبيق أي نظام غذائي</li>
            <li>قد تحتاج للتعديل حسب الحالة الصحية الفردية</li>
            <li>يُنصح بتوزيع الوجبات على 3-5 وجبات يومياً</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default NutritionCalculator
