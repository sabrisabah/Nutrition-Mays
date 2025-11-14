import React, { useState, useEffect, useCallback } from 'react'
import { BMRCalculator } from '../../utils/bmrCalculator'

const EnhancedNutritionCalculator = ({ patientProfile, onNutritionCalculated }) => {
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

  const [calculationDetails, setCalculationDetails] = useState({
    formula: '',
    activityDescription: '',
    activityDescriptionAr: '',
    validationErrors: []
  })

  // حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor المحسنة
  const calculateBMR = useCallback((weight, height, age, gender) => {
    const result = BMRCalculator.calculateBMR({ weight, height, age, gender })
    
    if (!result.success) {
      console.error('BMR calculation failed:', result.errors)
      return { bmr: 0, errors: result.errors }
    }
    
    return { bmr: result.bmr, errors: [] }
  }, [])

  // حساب إجمالي استهلاك الطاقة اليومي (TDEE) باستخدام الحاسبة المحسنة
  const calculateTDEE = useCallback((bmr, activityLevel) => {
    const result = BMRCalculator.calculateTDEE(bmr, activityLevel)
    
    if (!result.success) {
      console.error('TDEE calculation failed:', result.errors)
      return { 
        tdee: 0, 
        multiplier: 1.55, 
        description: '', 
        descriptionAr: '',
        errors: result.errors 
      }
    }
    
    return {
      tdee: result.tdee,
      multiplier: result.multiplier,
      description: result.description,
      descriptionAr: result.descriptionAr,
      errors: []
    }
  }, [])

  // حساب السعرات اليومية المطلوبة (استخدام TDEE مباشرة)
  const calculateDailyCalories = useCallback((tdee, goal) => {
    // استخدام TDEE مباشرة كالسعرات اليومية المطلوبة
    // يمكن تعديل هذا حسب الهدف إذا لزم الأمر
    return Math.round(tdee)
  }, [])

  // حساب البروتين (1.6-2.2 جم لكل كيلوغرام من وزن الجسم)
  const calculateProtein = useCallback((weight, goal) => {
    if (!weight) return 0
    
    const proteinPerKg = {
      'lose_weight': 2.2,        // خسارة الوزن
      'maintain_weight': 1.6,    // الحفاظ على الوزن
      'gain_weight': 1.8,        // زيادة الوزن
      'build_muscle': 2.2,       // بناء العضلات
      'improve_health': 1.8      // تحسين الصحة
    }
    
    const proteinPerKgValue = proteinPerKg[goal] || 1.6
    return Math.round(weight * proteinPerKgValue)
  }, [])

  // حساب الدهون (25-35% من السعرات اليومية)
  const calculateFat = useCallback((targetCalories, goal) => {
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
  }, [])

  // حساب الكربوهيدرات (الباقي من السعرات)
  const calculateCarbs = useCallback((targetCalories, protein, fat) => {
    if (!targetCalories || !protein || !fat) return 0
    
    const proteinCalories = protein * 4  // 4 سعرات لكل جرام بروتين
    const fatCalories = fat * 9          // 9 سعرات لكل جرام دهون
    const carbCalories = targetCalories - proteinCalories - fatCalories
    
    return Math.round(carbCalories / 4) // 4 سعرات لكل جرام كربوهيدرات
  }, [])

  // حساب الألياف (14 جم لكل 1000 سعرة حرارية)
  const calculateFiber = useCallback((targetCalories) => {
    if (!targetCalories) return 0
    return Math.round((targetCalories / 1000) * 14)
  }, [])

  // حساب الماء (35 مل لكل كيلوغرام من وزن الجسم)
  const calculateWater = useCallback((weight) => {
    if (!weight) return 0
    return Math.round(weight * 35)
  }, [])

  // حساب جميع القيم عند تغيير بيانات المريض
  useEffect(() => {
    if (!patientProfile) return

    const { current_weight, height, goal, activity_level } = patientProfile
    const age = patientProfile.user?.age || patientProfile.age || 30 // استخدام العمر الفعلي للمريض
    const gender = patientProfile.gender || 'male'

    // حساب العمر من تاريخ الميلاد إذا كان متوفراً
    let calculatedAge = age
    if (patientProfile.user?.date_of_birth) {
      calculatedAge = BMRCalculator.calculateAge(patientProfile.user.date_of_birth)
    }

    // استخدام الحاسبة المحسنة لحساب BMR و TDEE
    const bmrResult = calculateBMR(current_weight, height, calculatedAge, gender)
    const tdeeResult = calculateTDEE(bmrResult.bmr, activity_level)
    
    // حساب السعرات اليومية المطلوبة
    const dailyCalories = calculateDailyCalories(tdeeResult.tdee, goal)
    
    // حساب المغذيات الكبرى
    const protein = calculateProtein(current_weight, goal)
    const fat = calculateFat(dailyCalories, goal)
    const carbs = calculateCarbs(dailyCalories, protein, fat)
    const fiber = calculateFiber(dailyCalories)
    const water = calculateWater(current_weight)

    const newNutritionData = {
      bmr: bmrResult.bmr,
      tdee: tdeeResult.tdee,
      targetCalories: dailyCalories,
      protein,
      carbs,
      fat,
      fiber,
      water
    }

    // حفظ تفاصيل الحساب
    const newCalculationDetails = {
      formula: bmrResult.bmr > 0 ? 
        (gender === 'male' 
          ? `(10 × ${current_weight}) + (6.25 × ${height}) - (5 × ${calculatedAge}) + 5`
          : `(10 × ${current_weight}) + (6.25 × ${height}) - (5 × ${calculatedAge}) - 161`)
        : '',
      activityDescription: tdeeResult.description,
      activityDescriptionAr: tdeeResult.descriptionAr,
      validationErrors: [...bmrResult.errors, ...tdeeResult.errors]
    }

    setNutritionData(newNutritionData)
    setCalculationDetails(newCalculationDetails)
    
    // إرسال البيانات للمكون الأب
    if (onNutritionCalculated) {
      onNutritionCalculated(newNutritionData)
    }

    // تسجيل تفاصيل الحساب في وحدة التحكم للتطوير
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ENHANCED NUTRITION CALCULATION ===')
      console.log('Patient Profile:', patientProfile)
      console.log('BMR Result:', bmrResult)
      console.log('TDEE Result:', tdeeResult)
      console.log('Final Nutrition Data:', newNutritionData)
      console.log('Calculation Details:', newCalculationDetails)
    }
  }, [patientProfile, calculateBMR, calculateTDEE, calculateTargetCalories, calculateProtein, calculateFat, calculateCarbs, calculateFiber, calculateWater, onNutritionCalculated])

  // دالة للحصول على وصف الهدف
  const getGoalDescription = (goal) => {
    const descriptions = {
      'lose_weight': 'خسارة الوزن',
      'maintain_weight': 'الحفاظ على الوزن',
      'gain_weight': 'زيادة الوزن',
      'build_muscle': 'بناء العضلات',
      'improve_health': 'تحسين الصحة'
    }
    return descriptions[goal] || 'غير محدد'
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-calculator text-primary me-2"></i>
          حساب الاحتياجات الغذائية المحسن
          <small className="text-muted ms-2">(معادلة Mifflin-St Jeor)</small>
        </h5>
      </div>
      <div className="card-body">
        {/* عرض أخطاء التحقق إن وجدت */}
        {calculationDetails.validationErrors.length > 0 && (
          <div className="alert alert-warning">
            <h6 className="alert-heading">
              <i className="fas fa-exclamation-triangle me-2"></i>
              تحذيرات في البيانات:
            </h6>
            <ul className="mb-0">
              {calculationDetails.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">معدل الأيض الأساسي (BMR)</label>
              <div className="form-control-plaintext bg-light p-2 rounded">
                {nutritionData.bmr} سعرة حرارية/يوم
              </div>
              <small className="text-muted">الطاقة المطلوبة للوظائف الأساسية</small>
              {calculationDetails.formula && (
                <div className="mt-1">
                  <small className="text-info">
                    <i className="fas fa-info-circle me-1"></i>
                    المعادلة: {calculationDetails.formula}
                  </small>
                </div>
              )}
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">إجمالي استهلاك الطاقة (TDEE)</label>
              <div className="form-control-plaintext bg-light p-2 rounded">
                {nutritionData.tdee} سعرة حرارية/يوم
              </div>
              <small className="text-muted">
                {calculationDetails.activityDescriptionAr || 'بما في ذلك النشاط البدني'}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold text-success">السعرات اليومية المطلوبة</label>
              <div className="form-control-plaintext bg-success bg-opacity-10 p-2 rounded border border-success">
                {nutritionData.targetCalories} سعرة حرارية/يوم
              </div>
              <small className="text-muted">
                السعرات اليومية المطلوبة للحفاظ على الوزن الحالي
              </small>
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

        {/* معلومات إضافية عن الحساب */}
        <div className="alert alert-info mt-3">
          <h6 className="alert-heading">
            <i className="fas fa-info-circle me-2"></i>
            معلومات عن الحساب:
          </h6>
          <ul className="mb-0">
            <li><strong>معادلة BMR:</strong> Mifflin-St Jeor (الأكثر دقة للبالغين الأصحاء)</li>
            <li><strong>نطاق الدقة:</strong> ±10% من القيمة المقاسة</li>
            <li><strong>مستوى النشاط:</strong> {calculationDetails.activityDescriptionAr}</li>
            <li><strong>الهدف:</strong> {getGoalDescription(patientProfile?.goal)}</li>
          </ul>
        </div>
        
        <div className="alert alert-warning mt-2">
          <h6 className="alert-heading">
            <i className="fas fa-exclamation-triangle me-2"></i>
            ملاحظات مهمة:
          </h6>
          <ul className="mb-0">
            <li>هذه الحسابات مبنية على معادلات علمية معتمدة</li>
            <li>يُنصح بمراجعة الطبيب قبل تطبيق أي نظام غذائي</li>
            <li>قد تحتاج للتعديل حسب الحالة الصحية الفردية</li>
            <li>يُنصح بتوزيع الوجبات على 3-5 وجبات يومياً</li>
            <li>تأكد من شرب كمية كافية من الماء يومياً</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EnhancedNutritionCalculator
