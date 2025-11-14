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

  // جلب خطط الوجبات للمريض
  const { data: mealPlans, isLoading, error, refetch } = useQuery(
    'patient-meal-plans',
    () => api.get(`/api/meals/patients/${user.id}/meal-plans/`).then(res => {
      console.log('🔄 API response:', res.data)
      // API يعيد {count, next, previous, results: []}
      // نحتاج إلى استخراج results من الاستجابة
      if (res.data && res.data.results && Array.isArray(res.data.results)) {
        console.log('✅ Found meal plans:', res.data.results.length)
        res.data.results.forEach((plan, index) => {
          console.log(`📋 Plan ${index + 1}: ${plan.title} - Diet: ${plan.diet_plan} - Meals: ${plan.meals?.length || 0}`)
          if (plan.meals && plan.meals.length > 0) {
            plan.meals.forEach((meal, mealIndex) => {
              console.log(`  🍽️ Meal ${mealIndex + 1}: ${meal.name} - Total Nutrition:`, meal.total_nutrition)
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
      refetchInterval: 10000, // تحديث كل 10 ثواني
      initialData: [], // بيانات أولية فارغة
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache data
      refetchOnWindowFocus: true,
      refetchOnMount: true, // Always refetch when component mounts
      retry: 3 // Retry failed requests
    }
  )

  // وظائف إدارة اختيار الوجبات
  const handleMealSelection = (meal, mealType) => {
    console.log('handleMealSelection called with:', { meal: meal.name, mealType, selectedMeals })
    console.log('Meal nutrition data in selection:', {
      mealName: meal.name,
      nutrition_info: meal.nutrition_info,
      total_nutrition: meal.total_nutrition,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    })
    
    const mealKey = `${mealType}-${meal.name}`
    const isSelected = selectedMeals.some(selected => selected.key === mealKey)
    
    console.log('Current selection state:', { mealKey, isSelected, selectedMeals })
    
    if (isSelected) {
      // إزالة الوجبة من الاختيارات
      setSelectedMeals(prev => {
        const newSelections = prev.filter(selected => selected.key !== mealKey)
        console.log('Removing meal, new selections:', newSelections)
        return newSelections
      })
      toast.info(`تم إلغاء اختيار: ${meal.name}`)
      
      // تحديث فوري للبيانات عند إلغاء اختيار وجبة
      setTimeout(() => {
        queryClient.refetchQueries('patient-meal-plans')
        console.log('Data refreshed after meal deselection')
      }, 100)
    } else {
      // إضافة الوجبة للاختيارات
      setSelectedMeals(prev => {
        const newSelections = [...prev, {
          key: mealKey,
          meal: meal,
          mealType: mealType,
          selectedAt: new Date().toISOString()
        }]
        console.log('Adding meal, new selections:', newSelections)
        return newSelections
      })
      toast.success(`تم اختيار: ${meal.name}`)
      
      // تحديث فوري للبيانات عند اختيار وجبة جديدة
      setTimeout(() => {
        queryClient.refetchQueries('patient-meal-plans')
        console.log('Data refreshed after meal selection')
      }, 100)
    }
  }

  const isMealSelected = (meal, mealType) => {
    const mealKey = `${mealType}-${meal.name}`
    return selectedMeals.some(selected => selected.key === mealKey)
  }

  const saveSelectedMeals = async () => {
    try {
      if (selectedMeals.length === 0) {
        toast.warning('يرجى اختيار وجبة واحدة على الأقل')
        return
      }

      // التحقق من البيانات المطلوبة
      if (!user || !user.id) {
        console.error('User not found or user.id is missing')
        toast.error('خطأ: بيانات المستخدم غير متوفرة')
        return
      }

      if (!selectedPlan || !selectedPlan.id) {
        console.error('Selected plan not found or plan.id is missing')
        toast.error('خطأ: خطة الوجبات غير محددة')
        return
      }

      console.log('Saving meal selections:', {
        patientId: user.id,
        mealPlanId: selectedPlan.id,
        selectedMeals: selectedMeals,
        user: user,
        selectedPlan: selectedPlan
      })

      // إرسال الوجبات المختارة للخادم
      const response = await api.post(`/api/meals/patients/${user.id}/selected-meals/`, {
        meal_plan_id: selectedPlan.id,
        selected_meals: selectedMeals.map(item => ({
          meal_name: item.meal.name,
          meal_type: item.mealType,
          selected_at: item.selectedAt,
          nutrition_info: {
            calories: item.meal.nutrition_info?.calories || item.meal.total_nutrition?.calories || item.meal.calories || 0,
            protein: item.meal.nutrition_info?.protein || item.meal.total_nutrition?.protein || item.meal.protein || 0,
            carbs: item.meal.nutrition_info?.carbs || item.meal.total_nutrition?.carbs || item.meal.carbs || 0,
            fat: item.meal.nutrition_info?.fat || item.meal.total_nutrition?.fat || item.meal.fat || 0
          },
          ingredients: item.meal.ingredients || [],
          notes: item.meal.description || ''
        }))
      })

      console.log('Meal selections saved successfully:', response.data)
      toast.success('تم حفظ اختياراتك بنجاح')
      setShowMealSelection(false)
      
      // تحديث فوري للبيانات
        queryClient.invalidateQueries('patient-meal-plans')
      queryClient.invalidateQueries('patient-meal-selections')
      
      // إعادة جلب البيانات فوراً
      setTimeout(() => {
        queryClient.refetchQueries('patient-meal-plans')
        queryClient.refetchQueries('patient-meal-selections')
        console.log('Data refreshed after meal selection save')
      }, 100)
      } catch (error) {
      console.error('Error saving meal selections:', error)
      console.error('Error details:', error.response?.data)
      toast.error('فشل في حفظ الاختيارات: ' + (error.response?.data?.error || error.message))
    }
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

  const getSampleMealsForDietPlan = (dietPlan) => {
    const sampleMeals = {
      'keto': ['فطور كيتو', 'غداء كيتو', 'عشاء كيتو'],
      'balanced': ['فطور متوازن', 'غداء متوازن', 'عشاء متوازن'],
      'high_protein': ['فطور بروتيني', 'غداء بروتيني', 'عشاء بروتيني'],
      'low_carb': ['فطور منخفض الكربوهيدرات', 'غداء منخفض الكربوهيدرات', 'عشاء منخفض الكربوهيدرات'],
      'mediterranean': ['فطور متوسطي', 'غداء متوسطي', 'عشاء متوسطي'],
      'vegetarian': ['فطور نباتي', 'غداء نباتي', 'عشاء نباتي']
    }
    return sampleMeals[dietPlan] || ['فطور', 'غداء', 'عشاء']
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
      
      // إضافة الخطط المستقبلية أيضاً
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
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered')
                  refetch()
                }}
                disabled={isLoading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
              </button>
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => {
                  queryClient.invalidateQueries('patient-meal-plans')
                  toast.info('جاري تحديث البيانات...')
                }}
              >
                <i className="fas fa-refresh me-1"></i>
                تحديث فوري
              </button>
            </div>
          </div>

          {currentPlans.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <h5>لا توجد خطط وجبات متاحة</h5>
                <p>يرجى التواصل مع طبيبك لإنشاء خطة وجبات مناسبة لك.</p>
            </div>
            </div>
          ) : (
        <div className="row">
              {currentPlans.map((plan, index) => (
                <div key={plan.id || index} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-primary">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                        <i className="fas fa-calendar-alt me-2"></i>
                        {translatePlanTitle(plan.title)}
                        </h5>
                  </div>
                  <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-4">
                          <small className="text-muted">النظام الغذائي</small>
                          <div className="fw-bold text-info">{plan.diet_plan_display || plan.diet_plan || 'غير محدد'}</div>
                      </div>
                        <div className="col-4">
                          <small className="text-muted">تاريخ البداية</small>
                          <div className="fw-bold">{new Date(plan.start_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted">تاريخ النهاية</small>
                          <div className="fw-bold">{new Date(plan.end_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">الوصف</small>
                        <p className="mb-0">{plan.description || 'لا يوجد وصف متاح'}</p>
                      </div>

                      {plan.meals && plan.meals.length > 0 && (
                        <div className="mb-3">
                          <small className="text-muted">الوجبات المتاحة</small>
                          <div className="mt-1">
                            {plan.meals.slice(0, 3).map((meal, mealIndex) => (
                              <span key={mealIndex} className="badge bg-success me-1 mb-1">
                                {meal.name}
                              </span>
                            ))}
                            {plan.meals.length > 3 && (
                              <span className="badge bg-secondary">
                                +{plan.meals.length - 3} أخرى
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge ${plan.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                          {plan.status === 'active' ? 'نشط' : 'في الانتظار'}
                        </span>
                    <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedPlan(plan)
                            setShowMealSelection(true)
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                      عرض التفاصيل
                    </button>
              </div>
        </div>
                  </div>
                    </div>
              ))}
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
                            // تجميع الوجبات حسب day_of_week
                            const mealsByDay = {}
                            selectedPlan.meals.forEach(meal => {
                              const day = meal.day_of_week || 1
                              if (!mealsByDay[day]) {
                                mealsByDay[day] = []
                              }
                              mealsByDay[day].push(meal)
                            })
                            
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
                                                  {meal.name}
                                                </h6>
                                              </div>
                                              <div className="card-body">
                                                {meal.ingredients && meal.ingredients.length > 0 && (
                                                  <div className="mb-3">
                                                    <h6 className="text-primary mb-2">
                                                      <i className="fas fa-shopping-basket me-1"></i>
                                                      المكونات:
                                                    </h6>
                                                    <div className="ingredients-list">
                                                      {meal.ingredients.slice(0, 3).map((ingredient, idx) => (
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
                                                            <small className="text-info ms-1">
                                                              سعرات: {Math.round((ingredient.calories_per_100g * (ingredient.amount || 0) / 100) || 0)} | بروتين: {Math.round((ingredient.protein_per_100g * (ingredient.amount || 0) / 100) || 0)}g
                                                            </small>
                                                            {ingredient.notes && (
                                                              <small className="text-info ms-1">- {ingredient.notes}</small>
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                      {meal.ingredients.length > 3 && (
                                                        <small className="text-muted d-block mt-2">
                                                          {meal.ingredients.length - 3} مكونات أخرى
                                                        </small>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
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
                                )
                              })
                            })()}
                          </div>
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
                            {selectedMeals.map((item, index) => (
                              <div key={index} className="col-md-6 mb-3">
                                <div className="card border-success">
                                  <div className="card-body p-3">
                                    <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-check-circle text-success me-2"></i>
                                  <span className="fw-bold">{item.meal.name}</span>
                                  <small className="text-muted ms-2">({item.mealType})</small>
                                    </div>
                                    
                                    {/* عرض المكونات */}
                                    {item.meal.ingredients && item.meal.ingredients.length > 0 && (
                                      <div className="ingredients-section">
                                        <h6 className="text-primary mb-2 small">
                                          <i className="fas fa-shopping-basket me-1"></i>
                                          المكونات:
                                        </h6>
                                        <div className="ingredients-list">
                                          {item.meal.ingredients.map((ingredient, idx) => (
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
                                                    <small className="text-info ms-1">
                                                      سعرات: {Math.round((ingredient.calories_per_100g * (ingredient.amount || 0) / 100) || 0)} | بروتين: {Math.round((ingredient.protein_per_100g * (ingredient.amount || 0) / 100) || 0)}g
                                                    </small>
                                                {ingredient.notes && (
                                                  <small className="text-info ms-1">- {ingredient.notes}</small>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                         <div className="card-footer">
                           <div className="text-center mb-2">
                             <small className="text-success">
                               <i className="fas fa-check-circle me-1"></i>
                               تم اختيار {selectedMeals.length} وجبة - اضغط حفظ لإرسال اختياراتك للطبيب
                             </small>
                      </div>
                           <button
                             className="btn btn-success w-100"
                             onClick={saveSelectedMeals}
                           >
                             <i className="fas fa-save me-2"></i>
                             حفظ الاختيارات وإرسالها للطبيب
                           </button>
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
                  onClick={() => setSelectedPlan(null)}
                >
                  <i className="fas fa-times me-2"></i>
                  إغلاق
                </button>
                 <div className="text-center">
                   <small className="text-success">
                     <i className="fas fa-utensils me-1"></i>
                     اختر الوجبات التي تريدها من المقترحات
                   </small>
                 </div>
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
