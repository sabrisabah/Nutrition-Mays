import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const PatientMealPlans = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // دالة لترجمة عناوين الخطط
  const translatePlanTitle = (title) => {
    const translations = {
      'weight_loss': 'إنقاص وزن',
      'weight_maintenance': 'تثبيت وزن',
      'weight_gain': 'زيادة وزن',
      'health_maintenance': 'الحفاظ على الصحة',
      'pregnant': 'حامل',
      'breastfeeding': 'مرضع',
      'diabetic': 'مرضى السكري',
      'keto': 'الكيتو',
      'balanced': 'المتوازن',
      'low_carb': 'منخفض الكربوهيدرات',
      'muscle_gain': 'بناء العضلات',
      'muscle_building': 'بناء العضلات'
    }
    return translations[title] || title
  }
  
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedMeals, setSelectedMeals] = useState([])
  const [showMealSelection, setShowMealSelection] = useState(false)

  // جلب ملف المريض للحصول على السعرات المطلوبة
  const { data: patientProfile } = useQuery(
    'patient-profile',
    () => api.get(`/api/accounts/patients/${user.id}/profile/`).then(res => res.data),
    { enabled: !!user?.id }
  )

  // جلب خطط الوجبات للمريض
  const { data: mealPlans, isLoading, error, refetch } = useQuery(
    'patient-meal-plans',
    () => api.get(`/api/meals/patients/${user.id}/meal-plans/`).then(res => {
      console.log('🔄 API response:', res.data)
      if (res.data && res.data.results && Array.isArray(res.data.results)) {
        console.log('✅ Found meal plans:', res.data.results.length)
        res.data.results.forEach((plan, index) => {
          console.log(`📋 Plan ${index + 1}: ${plan.title} - Diet: ${plan.diet_plan} - Meals: ${plan.meals?.length || 0}`)
          if (plan.meals && plan.meals.length > 0) {
            console.log(`🔍 Debug - Plan ${index + 1} meals breakdown:`)
            plan.meals.forEach((meal, mealIndex) => {
              console.log(`  🍽️ Meal ${mealIndex + 1}: ${meal.name} - Day: ${meal.day_of_week} - Total Nutrition:`, meal.total_nutrition)
            })
          }
        })
        return res.data.results
      }
      console.log('❌ No meal plans found or invalid response format')
      return []
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 10000,
      initialData: [],
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 3
    }
  )

  // وظائف إدارة اختيار الوجبات
  const isMealSelected = (meal, mealType) => {
    return selectedMeals.some(item => 
      item.meal.id === meal.id && item.mealType === mealType
    )
  }

  const handleMealSelection = (meal, mealType) => {
    console.log('🍽️ Selecting meal:', meal.name, 'Type:', mealType)
    console.log('🔍 Meal nutrition data:', {
      mealName: meal.name,
      nutrition_info: meal.nutrition_info,
      total_nutrition: meal.total_nutrition,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    })
    
    const existingIndex = selectedMeals.findIndex(item => 
      item.meal.id === meal.id && item.mealType === mealType
    )
    
    if (existingIndex >= 0) {
      // إزالة الوجبة من المختارة
      const newSelectedMeals = selectedMeals.filter((_, index) => index !== existingIndex)
      setSelectedMeals(newSelectedMeals)
      toast.info(`تم إلغاء اختيار ${meal.name}`)
    } else {
      // إضافة الوجبة للمختارة
      const newSelection = {
          meal: meal,
          mealType: mealType,
          selectedAt: new Date().toISOString()
    }
      setSelectedMeals([...selectedMeals, newSelection])
      toast.success(`تم اختيار ${meal.name}`)
  }
  }

  // حساب السعرات الحرارية للوجبة من المكونات مباشرة
  const calculateMealCaloriesFromIngredients = (meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      // إذا لم تكن هناك مكونات، استخدم القيم المحفوظة
      return meal.nutrition_info?.calories || 
             meal.total_nutrition?.calories || 
             meal.calories || 0
    }
    
    // حساب السعرات من المكونات مباشرة
    return meal.ingredients.reduce((total, ingredient) => {
      // محاولة الحصول على السعرات من المكون
      let ingredientCalories = ingredient.calories || 0
      
      // إذا لم تكن موجودة، احسبها من calories_per_100g و amount
      if (ingredientCalories === 0) {
        const caloriesPer100g = ingredient.calories_per_100g || 
                                ingredient.food?.calories_per_100g || 0
        const amount = ingredient.amount || ingredient.quantity || 0
        if (caloriesPer100g > 0 && amount > 0) {
          ingredientCalories = (caloriesPer100g * amount) / 100
        }
      }
      
      return total + ingredientCalories
    }, 0)
  }

  // حساب مجموع السعرات الحرارية للوجبات المختارة
  const calculateTotalCalories = () => {
    return selectedMeals.reduce((total, item) => {
      // حساب السعرات من المكونات مباشرة
      const mealCalories = calculateMealCaloriesFromIngredients(item.meal)
      return total + mealCalories
    }, 0)
  }

  // حساب TDEE من بيانات المريض (نفس الحساب في صفحة الطبيب)
  const calculateTDEE = () => {
    if (!patientProfile) {
      console.log('⚠️ calculateTDEE: patientProfile is null')
      return null
    }
    
    const weight = patientProfile.current_weight
    const height = patientProfile.height
    const gender = patientProfile.gender
    const activityLevel = patientProfile.activity_level
    
    console.log('📊 calculateTDEE - Input data:', {
      weight,
      height,
      gender,
      activityLevel,
      dateOfBirth: patientProfile.user?.date_of_birth
    })
    
    if (!weight || !height || !gender || !activityLevel) {
      console.log('⚠️ calculateTDEE: Missing required data', { weight, height, gender, activityLevel })
      return null
    }
    
    // حساب العمر (نفس الطريقة في صفحة الطبيب)
    const dateOfBirth = patientProfile.user?.date_of_birth
    let age = 30 // افتراضي
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }
    
    // حساب BMR باستخدام معادلة Mifflin-St Jeor (نفس المعادلة في صفحة الطبيب)
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    // معاملات النشاط البدني (نفس المعاملات في صفحة الطبيب)
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    }
    
    const multiplier = activityMultipliers[activityLevel] || 1.55
    const tdee = Math.round(bmr * multiplier)
    
    console.log('📊 calculateTDEE - Calculation:', {
      age,
      bmr,
      multiplier,
      tdee,
      formula: gender === 'male' 
        ? `(10 * ${weight}) + (6.25 * ${height}) - (5 * ${age}) + 5 = ${bmr}`
        : `(10 * ${weight}) + (6.25 * ${height}) - (5 * ${age}) - 161 = ${bmr}`,
      tdeeFormula: `${bmr} * ${multiplier} = ${tdee}`
    })
    
    return tdee
  }

  // حساب السعرات اليومية للمريض (TDEE + goal adjustment)
  // هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة
  const calculateDailyCalories = () => {
    const tdee = calculateTDEE()
    if (!tdee || tdee <= 0) return null
    
    const goal = patientProfile?.goal
    if (!goal) return tdee
    
    // تطبيق تعديل الهدف (نفس الحساب في الـ backend)
    const goalAdjustments = {
      'lose_weight': -500,
      'gain_weight': 500,
      'build_muscle': 300,
      'maintain_weight': 0,
      'improve_health': 0
    }
    
    const adjustment = goalAdjustments[goal] || 0
    const dailyCalories = tdee + adjustment
    
    // الحد الأدنى: 1200 سعرة حرارية
    const finalCalories = Math.max(dailyCalories, 1200)
    
    console.log('📊 calculateDailyCalories:', {
      tdee,
      goal,
      adjustment,
      dailyCalories,
      finalCalories
    })
    
    return finalCalories
  }

  // الحصول على السعرات المطلوبة (السعرات اليومية المحسوبة = TDEE + goal adjustment)
  // هذا هو نفس الحساب في صفحة الطبيب: السعرات اليومية المحسوبة
  const getRequiredCalories = () => {
    // أولاً: حساب السعرات اليومية من البيانات الحالية (TDEE + goal adjustment)
    const calculatedDailyCalories = calculateDailyCalories()
    if (calculatedDailyCalories && calculatedDailyCalories > 0) {
      console.log('📊 Using calculated daily calories (TDEE + goal adjustment):', calculatedDailyCalories)
      
      // التحقق من أن daily_calories المحفوظة تطابق السعرات المحسوبة
      if (patientProfile?.daily_calories && patientProfile.daily_calories !== calculatedDailyCalories) {
        console.log(`⚠️ daily_calories (${patientProfile.daily_calories}) doesn't match calculated (${calculatedDailyCalories}). Using calculated.`)
      }
      
      return calculatedDailyCalories
    }
    
    // Fallback: استخدام daily_calories المحفوظة إذا لم يكن الحساب متاحاً
    if (patientProfile?.daily_calories && patientProfile.daily_calories > 0) {
      console.log('📊 Using daily_calories from profile (calculation failed):', patientProfile.daily_calories)
      return patientProfile.daily_calories
    }
    
    // Fallback: استخدام السعرات من خطة الوجبات
    if (selectedPlan?.target_calories) {
      console.log('📊 Using target_calories from plan:', selectedPlan.target_calories)
      return selectedPlan.target_calories
    }
    
    console.log('⚠️ No required calories found')
    return null
  }

  const saveSelectedMeals = async () => {
      if (selectedMeals.length === 0) {
        toast.warning('يرجى اختيار وجبة واحدة على الأقل')
        return
      }

      // لا يوجد تحقق من السعرات - الـ backend سيقوم بتعديل المكونات تلقائياً لتطابق السعرات المطلوبة
      // يمكن للمريض حفظ الوجبات بأي سعرات، وسيتم التعديل التلقائي في الـ backend

    try {
      const nutrition_info = selectedMeals.map(item => {
        console.log('🔍 Patient - Sending meal data:', {
          mealName: item.meal.name,
          ingredients: item.meal.ingredients,
          ingredientsLength: item.meal.ingredients?.length || 0,
          mealData: item.meal
        })
        
        // إذا كانت المكونات فارغة، نحاول الحصول عليها من مصدر آخر
        let ingredients = item.meal.ingredients || []
        if (!ingredients || ingredients.length === 0) {
          console.log('⚠️ Patient - No ingredients found, trying alternative sources')
          // محاولة الحصول على المكونات من مصادر أخرى
          if (item.meal.meal_ingredients) {
            ingredients = item.meal.meal_ingredients
          } else if (item.meal.ingredients_list) {
            ingredients = item.meal.ingredients_list
          }
        }
        
        // التأكد من أن كل مكون يحتوي على البيانات الغذائية المطلوبة
        const enrichedIngredients = ingredients.map(ing => {
          // إذا كان المكون يحتوي على food object، استخرج البيانات منه
          if (ing.food && typeof ing.food === 'object') {
            return {
              ...ing,
              food_id: ing.food.id || ing.food_id || ing.id,
              food_name: ing.food.name || ing.food_name || ing.name,
              food_name_ar: ing.food.name_ar || ing.food_name_ar,
              amount: ing.amount || ing.quantity || 0,
              calories_per_100g: ing.calories_per_100g || ing.food.calories_per_100g || 0,
              protein_per_100g: ing.protein_per_100g || ing.food.protein_per_100g || 0,
              carbs_per_100g: ing.carbs_per_100g || ing.food.carbs_per_100g || 0,
              fat_per_100g: ing.fat_per_100g || ing.food.fat_per_100g || 0,
              calories: ing.calories || (ing.calories_per_100g && ing.amount ? (ing.calories_per_100g * ing.amount / 100) : 0),
              protein: ing.protein || (ing.protein_per_100g && ing.amount ? (ing.protein_per_100g * ing.amount / 100) : 0),
              carbs: ing.carbs || (ing.carbs_per_100g && ing.amount ? (ing.carbs_per_100g * ing.amount / 100) : 0),
              fat: ing.fat || (ing.fat_per_100g && ing.amount ? (ing.fat_per_100g * ing.amount / 100) : 0)
            }
          }
          // إذا كان المكون يحتوي على البيانات مباشرة
          return {
            ...ing,
            food_id: ing.food_id || ing.food?.id || ing.id,
            food_name: ing.food_name || ing.food?.name || ing.name,
            food_name_ar: ing.food_name_ar || ing.food?.name_ar,
            amount: ing.amount || ing.quantity || 0,
            calories_per_100g: ing.calories_per_100g || 0,
            protein_per_100g: ing.protein_per_100g || 0,
            carbs_per_100g: ing.carbs_per_100g || 0,
            fat_per_100g: ing.fat_per_100g || 0,
            calories: ing.calories || 0,
            protein: ing.protein || 0,
            carbs: ing.carbs || 0,
            fat: ing.fat || 0
          }
        })
        
        console.log('🔍 Patient - Final ingredients to send:', enrichedIngredients)
        
        // حساب السعرات الحرارية من المكونات مباشرة
        const calculatedCalories = calculateMealCaloriesFromIngredients(item.meal)
        const calculatedProtein = enrichedIngredients.reduce((sum, ing) => sum + (ing.protein || 0), 0)
        const calculatedCarbs = enrichedIngredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0)
        const calculatedFat = enrichedIngredients.reduce((sum, ing) => sum + (ing.fat || 0), 0)
        
        return {
          meal_id: item.meal.id,
          meal_name: item.meal.name,
          meal_type: item.mealType,
          nutrition_info: {
            calories: calculatedCalories,
            protein: calculatedProtein,
            carbs: calculatedCarbs,
            fat: calculatedFat
          },
          ingredients: enrichedIngredients,
          notes: item.meal.description || ''
        }
      })

      const response = await api.post(`/api/meals/patients/${user.id}/selected-meals/`, {
        meal_plan_id: selectedPlan.id,
        selected_meals: nutrition_info
      })

      if (response.data) {
        // Check if ingredients were adjusted
        if (response.data.adjustment_info && response.data.adjustment_info.adjusted) {
          const { original_calories, adjusted_calories, required_calories } = response.data.adjustment_info
          toast.success(
            `تم حفظ اختياراتك بنجاح! تم تعديل المكونات تلقائياً من ${original_calories} إلى ${adjusted_calories} سعرة لتطابق المطلوب (${required_calories} سعرة)`,
            { autoClose: 5000 }
          )
        } else {
          toast.success('تم حفظ اختياراتك بنجاح!')
        }
        setShowMealSelection(false)
        setSelectedMeals([])
        queryClient.invalidateQueries('patient-meal-plans')
      }
      } catch (error) {
      console.error('Error saving selected meals:', error)
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ في حفظ اختياراتك'
      toast.error(errorMessage)
      
      // إذا كان الخطأ متعلق بالسعرات الحرارية، عرض تفاصيل إضافية
      if (error.response?.data?.required_calories) {
        const { required_calories, total_calories, difference } = error.response.data
        console.log('Calories validation error:', { required_calories, total_calories, difference })
      }
    }
  }

  const getMealTypeText = (mealType) => {
    const types = {
      'breakfast': 'الإفطار',
      'Breakfast': 'الإفطار',
      'lunch': 'الغداء',
      'Lunch': 'الغداء',
      'dinner': 'العشاء',
      'Dinner': 'العشاء',
      'snack': 'وجبة خفيفة',
      'Snack': 'وجبة خفيفة',
      'Morning Snack': 'وجبة خفيفة صباحية',
      'Afternoon Snack': 'وجبة خفيفة بعد الظهر',
      'Evening Snack': 'وجبة خفيفة مسائية',
      'Pre-Workout': 'قبل التمرين',
      'Post-Workout': 'بعد التمرين'
    }
    return types[mealType] || mealType
  }

  const getDietPlanText = (dietPlan) => {
    const dietPlans = {
      'keto': 'الكيتو',
      'balanced': 'المتوازن',
      'muscle_gain': 'بناء العضلات',
      'diabetic': 'مرضى السكري',
      'low_carb': 'منخفض الكربوهيدرات',
      'high_protein': 'عالي البروتين',
      'weight_gain': 'زيادة الوزن',
      'muscle_building': 'بناء العضلات',
      'health_maintenance': 'الحفاظ على الصحة',
      'weight_maintenance': 'الحفاظ على الوزن',
      'diabetes': 'مرضى السكري',
      'heart_healthy': 'صحة القلب',
      'mediterranean': 'البحر الأبيض المتوسط',
      'vegetarian': 'نباتي',
      'vegan': 'نباتي صرف',
      'paleo': 'الباليو',
      'intermittent_fasting': 'الصيام المتقطع'
    }
    return dietPlans[dietPlan] || dietPlan
  }

  // دالة للحصول على الخطط الحالية
  const getCurrentPlans = () => {
    if (!mealPlans || !Array.isArray(mealPlans)) return []
      
    const today = new Date()
      today.setHours(0, 0, 0, 0)
    
    return mealPlans.filter(plan => {
      if (!plan.start_date || !plan.end_date) return false
      
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      
      return (startDate <= today && endDate >= today) || startDate > today
    }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
  }

  const currentPlans = getCurrentPlans()

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <LoadingSpinner />
            <p className="mt-3">جاري تحميل خطط الوجبات...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
      <div className="alert alert-danger">
              <h5>خطأ في تحميل البيانات</h5>
              <p>{error.message}</p>
              <button className="btn btn-primary" onClick={() => refetch()}>
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
           <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">
               <i className="fas fa-utensils me-2"></i>
                خطط الوجبات
              </h2>
              <button
              className="btn btn-outline-primary"
              onClick={() => refetch()}
            >
              <i className="fas fa-sync-alt me-2"></i>
              تحديث البيانات
              </button>
      </div>

          {currentPlans.length > 0 ? (
        <div className="row">
              {currentPlans.map((plan, index) => (
                <div key={index} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-primary">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                        <i className="fas fa-calendar-alt me-2"></i>
                        {translatePlanTitle(plan.title)}
                        </h5>
                  </div>
                  <div className="card-body">
                      <p><strong>النظام الغذائي:</strong> {plan.diet_plan_display || getDietPlanText(plan.diet_plan)}</p>
                      <p><strong>الفترة:</strong> من {new Date(plan.start_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })} إلى {new Date(plan.end_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                      <p><strong>عدد الوجبات:</strong> {plan.meals?.length || 0}</p>
                      </div>
                    <div className="card-footer">
                    <button 
                        className="btn btn-primary w-100"
                        onClick={() => {
                          setSelectedPlan(plan)
                          setShowMealSelection(true)
                        }}
                      >
                        <i className="fas fa-utensils me-2"></i>
                        عرض الوجبات
                    </button>
        </div>
                  </div>
                    </div>
              ))}
             </div>
          ) : (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <h5>لا توجد خطط وجبات متاحة</h5>
                <p>يرجى التواصل مع طبيبك لإنشاء خطة وجبات مناسبة لك.</p>
        </div>
                  </div>
          )}

          {/* Modal لاختيار الوجبات */}
          {showMealSelection && selectedPlan && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-utensils me-2"></i>
                      {translatePlanTitle(selectedPlan.title)}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                      onClick={() => setShowMealSelection(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                        <div className="card border-info">
                          <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          معلومات الخطة
                    </h6>
                    </div>
                      <div className="card-body">
                            <p><strong>النظام الغذائي:</strong> {selectedPlan.diet_plan_display || getDietPlanText(selectedPlan.diet_plan)}</p>
                            <p><strong>الفترة:</strong> من {new Date(selectedPlan.start_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })} إلى {new Date(selectedPlan.end_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                            <p><strong>الوصف:</strong> {selectedPlan.description || 'لا يوجد وصف'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-success">
                      <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                              <i className="fas fa-check-circle me-2"></i>
                              الوجبات المختارة
                    </h6>
                              </div>
                              <div className="card-body">
                            <p><strong>عدد الوجبات:</strong> {selectedMeals.length}</p>
                            <p><strong>الوجبات:</strong> {selectedMeals.map(item => item.meal.name).join(', ') || 'لا توجد'}</p>
                                      </div>
                                    </div>
                                      </div>
                      </div>
                      
                    {selectedPlan.meals && selectedPlan.meals.length > 0 ? (
                    <div className="row">
                      <div className="col-12">
                          <h6 className="mb-3">
                            <i className="fas fa-utensils me-2"></i>
                            الوجبات المتاحة حسب الأيام
                          </h6>
                          <p className="text-muted mb-4">
                            بناءً على النظام الغذائي المختار ({selectedPlan.diet_plan_display || getDietPlanText(selectedPlan.diet_plan)})، يمكنك اختيار الوجبات التي تريدها من المقترحات التالية:
                          </p>
                        
                           {/* تجميع الوجبات حسب الأيام */}
                        {(() => {
                             console.log('🔍 Debug - selectedPlan.meals:', selectedPlan.meals?.length, selectedPlan.meals)
                             
                             // تجميع الوجبات حسب day_of_week
                             const mealsByDay = {}
                             selectedPlan.meals.forEach(meal => {
                               const day = meal.day_of_week || 1
                               console.log(`🔍 Debug - Meal: ${meal.name}, Day: ${day}`)
                               if (!mealsByDay[day]) {
                                 mealsByDay[day] = []
                               }
                               mealsByDay[day].push(meal)
                             })
                             
                             console.log('🔍 Debug - mealsByDay:', mealsByDay)
                            
                            // ترتيب الأيام
                            const sortedDays = Object.keys(mealsByDay).sort((a, b) => parseInt(a) - parseInt(b))
                            
                            return sortedDays.map(day => {
                              const dayMeals = mealsByDay[day]
                              const dayNames = ['', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
                              const dayName = dayNames[parseInt(day)] || `اليوم ${day}`
                            
                            return (
                                <div key={day} className="mb-5">
                                  <div className="card border-primary">
                                    <div className="card-header bg-primary text-white">
                                  <h5 className="mb-0">
                                    <i className="fas fa-calendar-day me-2"></i>
                                        {dayName} - {dayMeals.length} وجبة
                                  </h5>
                                </div>
                                <div className="card-body">
                                  <div className="row">
                                        {dayMeals.map((meal, mealIndex) => (
                                          <div key={mealIndex} className="col-md-6 col-lg-4 mb-4">
                                            <div className="card h-100 border-success">
                                <div className="card-header bg-success text-white">
                                            <h6 className="mb-0">
                                    <i className="fas fa-utensils me-2"></i>
                                                  {meal.meal_type_name_ar || getMealTypeText(meal.meal_type_name || meal.meal_type || 'breakfast')}
                                            </h6>
                                            <small className="text-light">{meal.name}</small>
                                </div>
                                <div className="card-body">
                                            {meal.ingredients && meal.ingredients.length > 0 && (
                                                  <div className="mb-3">
                                                    <h6 className="text-primary mb-2">
                                                  <i className="fas fa-shopping-basket me-1"></i>
                                                  المكونات:
                                                </h6>
                                                <div className="ingredients-list">
                                                      {meal.ingredients.map((ingredient, idx) => {
                                                        // حساب سعرات المكون
                                                        const ingredientCalories = ingredient.calories || 
                                                          (ingredient.calories_per_100g && ingredient.amount ? 
                                                            (ingredient.calories_per_100g * ingredient.amount / 100) : 
                                                          (ingredient.food?.calories_per_100g && ingredient.amount ? 
                                                            (ingredient.food.calories_per_100g * ingredient.amount / 100) : 0))
                                                        const ingredientProtein = ingredient.protein || 
                                                          (ingredient.protein_per_100g && ingredient.amount ? 
                                                            (ingredient.protein_per_100g * ingredient.amount / 100) : 
                                                          (ingredient.food?.protein_per_100g && ingredient.amount ? 
                                                            (ingredient.food.protein_per_100g * ingredient.amount / 100) : 0))
                                                        
                                                        return (
                                                        <div key={idx} className="ingredient-item d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded small">
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-circle text-success me-1" style={{ fontSize: '0.4rem' }}></i>
                                                            <span className="fw-bold">
                                                              {ingredient.food_name_ar || ingredient.food_name || ingredient.food?.name_ar || ingredient.food?.name || ingredient.name || 'مكون غير محدد'}
                                                            </span>
                                                        </div>
                                                          <div className="text-muted">
                                                            <span className="badge bg-primary small">
                                                              {ingredient.amount || ingredient.quantity || 0}g
                                              </span>
                                                          {ingredient.notes && (
                                                              <small className="text-info ms-1">- {ingredient.notes}</small>
                                                          )}
                                                      </div>
                                                    </div>
                                                      )
                                                      })}
                                                </div>
                                              </div>
                                            )}
                                            {/* تم إخفاء السعرات الإجمالية للوجبة */}
                                          </div>
                                              
                                              <div className="card-footer">
                                                <button
                                                  className={`btn w-100 ${isMealSelected(meal, 'breakfast') ? 'btn-success' : 'btn-outline-success'}`}
                                                  onClick={() => handleMealSelection(meal, 'breakfast')}
                                                >
                                                  <i className={`fas ${isMealSelected(meal, 'breakfast') ? 'fa-check' : 'fa-plus'} me-2`}></i>
                                                  {isMealSelected(meal, 'breakfast') ? 'تم الاختيار' : 'اختيار الوجبة'}
                                                </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                          </div>
                                </div>
                              </div>
                            )
                          })
                        })()}
                    </div>
                  </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="alert alert-warning">
                          <h6>لا توجد وجبات متاحة لهذه الخطة</h6>
                          <p>يرجى التواصل مع طبيبك لإضافة وجبات لهذه الخطة.</p>
                </div>
                  </div>
                    )}


                    {/* عرض الوجبات المختارة */}
                {selectedMeals.length > 0 && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border-primary">
                        <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">
                            <i className="fas fa-shopping-cart me-2"></i>
                            الوجبات المختارة ({selectedMeals.length})
                            </h6>
                          </div>
                          <div className="card-body">
                          <div className="row">
                                {selectedMeals.map((selection, index) => {
                                  // حساب السعرات من المكونات مباشرة
                                  const mealCalories = calculateMealCaloriesFromIngredients(selection.meal)
                                  return (
                                  <div key={index} className="col-md-6 col-lg-4 mb-3">
                                <div className="card border-success">
                                      <div className="card-body">
                                        <h6 className="card-title text-success">
                                          <i className="fas fa-check-circle me-2"></i>
                                          {selection.meal.name}
                                        </h6>
                                        <p className="card-text small text-muted">
                                          نوع الوجبة: {getMealTypeText(selection.mealType)}
                                        </p>
                                        <p className="card-text small text-muted">
                                          تم الاختيار: {new Date(selection.selectedAt).toLocaleTimeString('ar-SA')}
                                        </p>
                                              </div>
                                              </div>
                                            </div>
                                  )
                                })}
                                        </div>
                    </div>
                </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                      onClick={() => setShowMealSelection(false)}
                >
                      إلغاء
                </button>
                           <button
                      type="button"
                      className="btn btn-success"
                             onClick={saveSelectedMeals}
                      disabled={selectedMeals.length === 0}
                           >
                             <i className="fas fa-save me-2"></i>
                      حفظ الاختيارات ({selectedMeals.length})
                           </button>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
    </div>
  )
}

export default PatientMealPlans
