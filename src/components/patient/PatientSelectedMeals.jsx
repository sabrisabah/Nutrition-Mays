import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { toast } from 'react-toastify'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'
import api from '../../services/api'

const PatientSelectedMeals = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // جلب ملف المريض للحصول على السعرات المطلوبة
  const { data: patientProfile } = useQuery(
    ['patient-profile', user?.id],
    () => api.get(`/api/accounts/patients/${user?.id}/profile/`).then(res => {
      const profile = res.data
      console.log('📊 Patient Profile loaded:', {
        daily_calories: profile?.daily_calories,
        calculated_daily_calories: profile?.calculated_daily_calories,
        nutrition_targets: profile?.nutrition_targets
      })
      return profile
    }),
    { enabled: !!user?.id }
  )

  // جلب اختيارات المريض
  const { data: mealSelectionsData, isLoading, error } = useQuery(
    ['patient-selected-meals', user?.id, selectedDate],
    () => api.get(`/api/meals/patients/${user?.id}/selected-meals/?date=${selectedDate}`).then(res => {
      console.log('Patient selected meals API response:', res.data)
      
      // الـ API يرسل كائن يحتوي على selections و required_calories
      const responseData = res.data
      const selections = responseData?.selections || responseData || []
      const requiredCalories = responseData?.required_calories
      
      console.log('📊 Extracted data:', {
        selectionsCount: Array.isArray(selections) ? selections.length : 0,
        requiredCalories: requiredCalories,
        isArray: Array.isArray(responseData)
      })
      
      if (Array.isArray(selections) && selections.length > 0) {
        // Log calories for each selection
        selections.forEach((selection, index) => {
          console.log(`Selection ${index + 1}: ${selection.meal_name} - Calories: ${selection.calories}, Ingredients: ${selection.ingredients?.length || 0}`)
        })
        console.log('First selection ingredients:', selections[0]?.ingredients)
      }
      
      // إرجاع الكائن الكامل مع selections و required_calories
      return {
        selections: selections,
        required_calories: requiredCalories
      }
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000, // تحديث كل 30 ثانية
    }
  )
  
  // استخراج selections و required_calories من البيانات
  const mealSelections = mealSelectionsData?.selections || []
  const apiRequiredCalories = mealSelectionsData?.required_calories

  // حساب السعرات الحرارية للمكون
  const calculateIngredientCalories = (ingredient) => {
    // إذا كانت السعرات موجودة مباشرة
    if (ingredient.calories && ingredient.calories > 0) {
      return ingredient.calories
    }
    
    // حساب من calories_per_100g و amount
    const caloriesPer100g = ingredient.calories_per_100g || 0
    const amount = ingredient.amount || ingredient.quantity || 0
    
    if (caloriesPer100g > 0 && amount > 0) {
      return (caloriesPer100g * amount) / 100
    }
    
    return 0
  }

  // حساب السعرات الحرارية للوجبة
  const calculateMealCalories = (selection) => {
    // أولاً: استخدام السعرات المحفوظة في قاعدة البيانات (بعد التعديل التلقائي)
    // هذه هي القيم الصحيحة التي تم تعديلها تلقائياً في الـ backend
    if (selection.calories && selection.calories > 0) {
      return selection.calories
    }
    
    // ثانياً: استخدام nutrition_info.calories
    if (selection.nutrition_info?.calories && selection.nutrition_info.calories > 0) {
      return selection.nutrition_info.calories
    }
    
    // ثالثاً: إذا لم تكن موجودة، احسب من المكونات
    if (!selection.ingredients || selection.ingredients.length === 0) {
      return 0
    }
    
    const calculated = selection.ingredients.reduce((total, ingredient) => {
      return total + calculateIngredientCalories(ingredient)
    }, 0)
    
    console.log(`📊 Meal: ${selection.meal_name} - Saved: ${selection.calories}, Nutrition_info: ${selection.nutrition_info?.calories}, Calculated: ${calculated}`)
    
    return calculated
  }

  // حساب المجموع الإجمالي
  const calculateTotalCalories = () => {
    if (!mealSelections || mealSelections.length === 0) return 0
    return mealSelections.reduce((total, selection) => {
      return total + calculateMealCalories(selection)
    }, 0)
  }

  // حساب السعرات اليومية للمريض (TDEE + goal adjustment)
  const calculateDailyCalories = () => {
    if (!patientProfile) return null
    
    const weight = patientProfile.current_weight
    const height = patientProfile.height
    const gender = patientProfile.gender
    const activityLevel = patientProfile.activity_level
    const goal = patientProfile.goal
    
    if (!weight || !height || !gender || !activityLevel) return null
    
    // حساب العمر
    const dateOfBirth = patientProfile.user?.date_of_birth
    let age = 30
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }
    
    // حساب BMR
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    // حساب TDEE
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    }
    const multiplier = activityMultipliers[activityLevel] || 1.55
    const tdee = Math.round(bmr * multiplier)
    
    // تطبيق goal adjustment
    const goalAdjustments = {
      'lose_weight': -500,
      'gain_weight': 500,
      'build_muscle': 300,
      'maintain_weight': 0,
      'improve_health': 0
    }
    const adjustment = goalAdjustments[goal] || 0
    const dailyCalories = tdee + adjustment
    
    // الحد الأدنى: 1200 سعرة
    const finalCalories = Math.max(dailyCalories, 1200)
    
    return finalCalories
  }

  // الحصول على السعرات المطلوبة (السعرات اليومية المحسوبة = TDEE + goal adjustment)
  // هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة (مثل 2242)
  const getRequiredCalories = () => {
    // أولاً: استخدام required_calories من الـ API response (Daily calories = TDEE + goal adjustment)
    // هذا هو السعرات اليومية المحسوبة (مثل 2242 = TDEE - 500 لخسارة الوزن)
    if (apiRequiredCalories && apiRequiredCalories > 0) {
      console.log('📊 Using required_calories from API (Daily calories):', apiRequiredCalories)
      return apiRequiredCalories
    }
    
    // ثانياً: حساب السعرات اليومية من البيانات الحالية (TDEE + goal adjustment)
    const calculatedDailyCalories = calculateDailyCalories()
    if (calculatedDailyCalories && calculatedDailyCalories > 0) {
      console.log('📊 Using calculated daily calories (TDEE + goal adjustment):', calculatedDailyCalories)
      return calculatedDailyCalories
    }
    
    // ثالثاً: استخدام daily_calories المحفوظة
    if (patientProfile?.daily_calories && patientProfile.daily_calories > 0) {
      console.log('📊 Using daily_calories from profile:', patientProfile.daily_calories)
      return patientProfile.daily_calories
    }
    
    // رابعاً: استخدام calculated_daily_calories إذا كان متوفراً
    if (patientProfile?.calculated_daily_calories && patientProfile.calculated_daily_calories > 0) {
      console.log('📊 Using calculated_daily_calories from profile:', patientProfile.calculated_daily_calories)
      return patientProfile.calculated_daily_calories
    }
    
    console.log('⚠️ No required calories found')
    return null
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getMealTypeText = (mealType) => {
    const types = {
      'breakfast': 'الإفطار',
      'lunch': 'الغداء', 
      'dinner': 'العشاء',
      'snack': 'وجبة خفيفة'
    }
    return types[mealType] || mealType
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        فشل في تحميل وجباتك المختارة
      </div>
    )
  }

  return (
    <div className="patient-selected-meals">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-shopping-cart me-2"></i>
                وجباتك المختارة
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">اختر التاريخ:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-end h-100">
                    <div className="alert alert-info mb-0 w-100">
                      <small>
                        <i className="fas fa-info-circle me-1"></i>
                        آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mealSelections && mealSelections.length > 0 ? (
        <div className="row">
          {mealSelections.map((selection, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 border-success">
                <div className="card-header bg-success text-white">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-utensils me-2"></i>
                    <div>
                      <h6 className="mb-0">{getMealTypeText(selection.meal_type)}</h6>
                      <small>{formatDate(selection.selected_at)}</small>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <h5 className="card-title text-primary">{selection.meal_name}</h5>
                  <p className="card-text text-muted small">
                    تم الاختيار: {new Date(selection.selected_at).toLocaleTimeString('ar-SA')}
                  </p>
                  
                  {/* عرض المكونات */}
                  {(() => {
                    console.log('Rendering selection:', selection.meal_name, 'Ingredients:', selection.ingredients)
                    // التحقق من وجود المكونات وتنظيف البيانات
                    const validIngredients = selection.ingredients?.filter(ingredient => 
                      ingredient && (ingredient.food_name_ar || ingredient.food_name || ingredient.name)
                    ) || []
                    
                    return validIngredients.length > 0 ? (
                      <div className="ingredients-section mb-3">
                        <h6 className="text-primary mb-2">
                          <i className="fas fa-shopping-basket me-1"></i>
                          المكونات:
                        </h6>
                        <div className="ingredients-list">
                          {validIngredients.map((ingredient, idx) => {
                            console.log('Rendering ingredient:', ingredient)
                            // التعامل مع البيانات المختلفة من الـ API
                            const ingredientName = ingredient.food_name_ar || ingredient.food_name || ingredient.name || 'مكون غير محدد'
                            const ingredientAmount = ingredient.amount || ingredient.quantity || 0
                            
                            // حساب السعرات والبروتين بشكل صحيح
                            const ingredientCalories = calculateIngredientCalories(ingredient)
                            const ingredientProtein = ingredient.protein || 
                              (ingredient.protein_per_100g && ingredientAmount ? 
                                (ingredient.protein_per_100g * ingredientAmount / 100) : 0)
                            
                            return (
                              <div key={idx} className="ingredient-item d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-circle text-success me-2" style={{ fontSize: '0.5rem' }}></i>
                                  <span className="fw-bold">{ingredientName}</span>
                                </div>
                                <div className="text-muted">
                                  <span className="badge bg-primary">
                                    {ingredientAmount}g
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        لا توجد مكونات متوفرة لهذه الوجبة
                      </div>
                    )
                  })()}

                  {/* تم إخفاء السعرات الإجمالية للوجبة */}

                </div>
                <div className="card-footer">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {new Date(selection.selected_at).toLocaleTimeString('ar-SA')}
                    </small>
                    <span className="badge bg-success">
                      <i className="fas fa-check me-1"></i>
                      مختار
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="text-muted mt-3">لا توجد وجبات مختارة</h5>
              <p className="text-muted">
                لم تختر أي وجبات لهذا التاريخ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      {mealSelections && mealSelections.length > 0 && (() => {
        const totalCalories = calculateTotalCalories()
        const requiredCalories = getRequiredCalories()
        const difference = requiredCalories !== null ? totalCalories - requiredCalories : null
        const isWithinTolerance = difference !== null && Math.abs(difference) <= 5
        
        // Debug logging
        console.log('📊 Calories Summary:', {
          totalCalories: Math.round(totalCalories),
          requiredCalories: requiredCalories,
          difference: difference ? Math.round(difference) : null,
          isWithinTolerance,
          selectionsCount: mealSelections.length,
          selectionsCalories: mealSelections.map(s => ({
            name: s.meal_name,
            savedCalories: s.calories,
            calculatedCalories: calculateMealCalories(s)
          }))
        })
        
        return (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-info">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-chart-bar me-2"></i>
                    إحصائيات وجباتك المختارة
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row text-center mb-3">
                    <div className="col-md-3">
                      <div className="p-3">
                        <div className="fw-bold text-primary fs-4">{mealSelections.length}</div>
                        <small className="text-muted">إجمالي الوجبات المختارة</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <div className="fw-bold text-success fs-4">
                          {mealSelections.filter(s => s.meal_type === 'breakfast').length}
                        </div>
                        <small className="text-muted">وجبات إفطار</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <div className="fw-bold text-info fs-4">
                          {mealSelections.filter(s => s.meal_type === 'lunch').length}
                        </div>
                        <small className="text-muted">وجبات غداء</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <div className="fw-bold text-warning fs-4">
                          {mealSelections.filter(s => s.meal_type === 'dinner').length}
                        </div>
                        <small className="text-muted">وجبات عشاء</small>
                      </div>
                    </div>
                  </div>
                  
                  {/* تم إخفاء إحصائيات السعرات الحرارية */}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default PatientSelectedMeals
