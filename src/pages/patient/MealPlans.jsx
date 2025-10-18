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
  const { data: mealPlans, isLoading, error } = useQuery(
    'patient-meal-plans',
    () => api.get(`/api/meals/patients/${user.id}/meal-plans/`).then(res => {
      console.log('API response:', res.data)
      // API يعيد {count, next, previous, results: []}
      // نحتاج إلى استخراج results من الاستجابة
      if (res.data && res.data.results && Array.isArray(res.data.results)) {
        console.log('Found meal plans:', res.data.results.length)
        return res.data.results
      }
      console.log('No meal plans found or invalid response format')
      return []
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000, // تحديث كل 30 ثانية
      initialData: [], // بيانات أولية فارغة
    }
  )

  // وظائف إدارة اختيار الوجبات
  const handleMealSelection = (meal, mealType) => {
    console.log('handleMealSelection called with:', { meal: meal.name, mealType, selectedMeals })
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
            calories: item.meal.calories,
            protein: item.meal.protein,
            carbs: item.meal.carbs,
            fat: item.meal.fat
          },
          ingredients: item.meal.ingredients || [],
          notes: item.meal.description || ''
        }))
      })

      console.log('Meal selections saved successfully:', response.data)
      toast.success('تم حفظ اختياراتك بنجاح')
      setShowMealSelection(false)
        queryClient.invalidateQueries('patient-meal-plans')
      // Also invalidate doctor's view
      queryClient.invalidateQueries('patient-meal-selections')
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
    const meals = {
      'keto': {
        'breakfast': [
          {
            name: 'فطور الكيتو الكلاسيكي',
            description: 'فطور غني بالدهون ومنخفض الكربوهيدرات',
            calories: 450,
            protein: 25,
            carbs: 8,
            fat: 35,
            ingredients: ['بيض مقلي بالزبدة', 'أفوكادو', 'جبن شيدر', 'لحم بقري']
          },
          {
            name: 'فطور الكيتو السريع',
            description: 'فطور سريع ومشبع',
            calories: 380,
            protein: 20,
            carbs: 6,
            fat: 30,
            ingredients: ['جبن كريمي', 'لحم بقري', 'زيتون', 'قهوة بالزبدة']
          }
        ],
        'lunch': [
          {
            name: 'سلطة الكيتو',
            description: 'سلطة غنية بالدهون الصحية',
            calories: 520,
            protein: 30,
            carbs: 12,
            fat: 40,
            ingredients: [
              { name: 'خضار ورقية', amount: 100, nutrition: { calories: 20, protein: 2 } },
              { name: 'أفوكادو', amount: 80, nutrition: { calories: 160, protein: 2 } },
              { name: 'جبن فيتا', amount: 50, nutrition: { calories: 150, protein: 8 } },
              { name: 'زيت الزيتون', amount: 15, nutrition: { calories: 135, protein: 0 } }
            ]
          }
        ],
        'dinner': [
          {
             name: 'سمك مع الخضار',
             description: 'سمك مشوي مع خضار منخفضة الكربوهيدرات',
            calories: 480,
             protein: 35,
            carbs: 8,
            fat: 32,
             ingredients: [
               { name: 'سمك السلمون', amount: 150, nutrition: { calories: 300, protein: 25 } },
               { name: 'بروكلي', amount: 100, nutrition: { calories: 35, protein: 3 } },
               { name: 'زيت جوز الهند', amount: 10, nutrition: { calories: 90, protein: 0 } },
               { name: 'ليمون', amount: 20, nutrition: { calories: 5, protein: 0 } }
             ]
           }
         ],
         'snack': [
           {
             name: 'وجبة خفيفة كيتو',
             description: 'وجبة خفيفة غنية بالدهون الصحية',
             calories: 200,
             protein: 8,
             carbs: 4,
             fat: 18,
             ingredients: [
               { name: 'جبن كريمي', amount: 60, nutrition: { calories: 120, protein: 2 } },
               { name: 'لوز', amount: 20, nutrition: { calories: 120, protein: 4 } },
               { name: 'زيتون', amount: 30, nutrition: { calories: 40, protein: 0 } },
               { name: 'أفوكادو', amount: 50, nutrition: { calories: 100, protein: 1 } }
             ]
           },
           {
             name: 'وجبة خفيفة سريعة',
             description: 'وجبة خفيفة سريعة ومناسبة',
             calories: 150,
             protein: 6,
             carbs: 3,
             fat: 14,
             ingredients: [
               { name: 'جبن شيدر', amount: 40, nutrition: { calories: 160, protein: 10 } },
               { name: 'زيتون أسود', amount: 20, nutrition: { calories: 30, protein: 0 } },
               { name: 'بذور الشيا', amount: 10, nutrition: { calories: 50, protein: 2 } }
             ]
          }
        ]
      },
      'balanced': {
        'breakfast': [
          {
            name: 'فطور متوازن',
            description: 'فطور صحي ومتوازن',
            calories: 400,
            protein: 20,
            carbs: 45,
            fat: 15,
            ingredients: [
              { name: 'شوفان', amount: 50, nutrition: { calories: 200, protein: 7 } },
              { name: 'حليب', amount: 200, nutrition: { calories: 100, protein: 8 } },
              { name: 'فواكه', amount: 100, nutrition: { calories: 60, protein: 1 } },
              { name: 'عسل', amount: 20, nutrition: { calories: 60, protein: 0 } }
            ]
          }
        ],
        'lunch': [
          {
            name: 'دجاج مع الأرز',
            description: 'دجاج مشوي مع أرز بني',
            calories: 450,
            protein: 30,
            carbs: 50,
            fat: 12,
            ingredients: [
              { name: 'دجاج', amount: 150, nutrition: { calories: 250, protein: 30 } },
              { name: 'أرز بني', amount: 100, nutrition: { calories: 110, protein: 2 } },
              { name: 'خضار', amount: 80, nutrition: { calories: 30, protein: 2 } },
              { name: 'زيت الزيتون', amount: 10, nutrition: { calories: 90, protein: 0 } }
            ]
          }
        ],
        'dinner': [
          {
             name: 'سمك مع الخضار المشكلة',
             description: 'وجبة خفيفة ومتوازنة',
             calories: 420,
            protein: 25,
            carbs: 35,
             fat: 18,
             ingredients: [
               { name: 'سمك مشوي', amount: 120, nutrition: { calories: 200, protein: 25 } },
               { name: 'خضار مشكلة', amount: 100, nutrition: { calories: 40, protein: 3 } },
               { name: 'زيت الزيتون', amount: 15, nutrition: { calories: 135, protein: 0 } },
               { name: 'ليمون', amount: 20, nutrition: { calories: 5, protein: 0 } }
             ]
           }
         ],
         'snack': [
           {
             name: 'وجبة خفيفة متوازنة',
             description: 'وجبة خفيفة صحية ومتوازنة',
             calories: 180,
             protein: 8,
             carbs: 25,
             fat: 6,
             ingredients: [
               { name: 'موز', amount: 80, nutrition: { calories: 80, protein: 1 } },
               { name: 'لوز', amount: 15, nutrition: { calories: 90, protein: 3 } },
               { name: 'عسل', amount: 10, nutrition: { calories: 30, protein: 0 } },
               { name: 'زبادي', amount: 100, nutrition: { calories: 60, protein: 5 } }
             ]
           },
           {
             name: 'وجبة خفيفة فواكه',
             description: 'وجبة خفيفة من الفواكه الطازجة',
             calories: 120,
             protein: 3,
             carbs: 28,
             fat: 2,
             ingredients: [
               { name: 'تفاح', amount: 100, nutrition: { calories: 50, protein: 0 } },
               { name: 'برتقال', amount: 80, nutrition: { calories: 40, protein: 1 } },
               { name: 'جوز', amount: 10, nutrition: { calories: 65, protein: 1 } },
               { name: 'عسل', amount: 5, nutrition: { calories: 15, protein: 0 } }
             ]
           }
         ]
       },
       'weight_loss': {
        'breakfast': [
          {
             name: 'فطور خسارة الوزن',
             description: 'فطور منخفض السعرات وعالي البروتين',
            calories: 300,
             protein: 25,
            carbs: 20,
             fat: 12,
             ingredients: [
               { name: 'بيض مسلوق', amount: 100, nutrition: { calories: 155, protein: 13 } },
               { name: 'خضار ورقية', amount: 50, nutrition: { calories: 10, protein: 1 } },
               { name: 'جبن قليل الدسم', amount: 30, nutrition: { calories: 60, protein: 8 } },
               { name: 'طماطم', amount: 60, nutrition: { calories: 10, protein: 0 } }
             ]
          }
        ],
        'lunch': [
          {
             name: 'سلطة خسارة الوزن',
             description: 'سلطة غنية بالبروتين ومنخفضة السعرات',
             calories: 250,
             protein: 20,
            carbs: 15,
             fat: 8,
             ingredients: [
               { name: 'دجاج مشوي', amount: 100, nutrition: { calories: 165, protein: 31 } },
               { name: 'خضار ورقية', amount: 80, nutrition: { calories: 15, protein: 2 } },
               { name: 'طماطم', amount: 60, nutrition: { calories: 10, protein: 0 } },
               { name: 'خيار', amount: 50, nutrition: { calories: 8, protein: 0 } }
             ]
          }
        ],
        'dinner': [
          {
             name: 'سمك مع الخضار للرجيم',
             description: 'وجبة عشاء خفيفة ومناسبة للرجيم',
             calories: 280,
            protein: 30,
            carbs: 12,
             fat: 10,
             ingredients: [
               { name: 'سمك أبيض', amount: 120, nutrition: { calories: 120, protein: 25 } },
               { name: 'بروكلي', amount: 80, nutrition: { calories: 30, protein: 3 } },
               { name: 'جزر', amount: 60, nutrition: { calories: 25, protein: 1 } },
               { name: 'ليمون', amount: 15, nutrition: { calories: 4, protein: 0 } }
             ]
           }
         ],
         'snack': [
           {
             name: 'وجبة خفيفة للرجيم',
             description: 'وجبة خفيفة منخفضة السعرات',
             calories: 100,
             protein: 8,
             carbs: 12,
             fat: 2,
             ingredients: [
               { name: 'زبادي قليل الدسم', amount: 150, nutrition: { calories: 80, protein: 8 } },
               { name: 'توت', amount: 50, nutrition: { calories: 25, protein: 0 } },
               { name: 'بذور الشيا', amount: 5, nutrition: { calories: 25, protein: 1 } }
             ]
           },
           {
             name: 'وجبة خفيفة خضار',
             description: 'وجبة خفيفة من الخضار الطازجة',
             calories: 80,
             protein: 4,
             carbs: 15,
             fat: 1,
             ingredients: [
               { name: 'خيار', amount: 80, nutrition: { calories: 12, protein: 1 } },
               { name: 'جزر', amount: 60, nutrition: { calories: 25, protein: 1 } },
               { name: 'طماطم', amount: 50, nutrition: { calories: 9, protein: 0 } },
               { name: 'ليمون', amount: 10, nutrition: { calories: 3, protein: 0 } }
             ]
          }
        ]
      }
    }
    return meals[dietPlan] || meals['balanced']
  }

  const getCurrentPlans = () => {
    try {
      console.log('getCurrentPlans called with mealPlans:', mealPlans)
      
      if (!mealPlans || !Array.isArray(mealPlans)) {
        console.log('mealPlans is not an array:', mealPlans)
        return []
      }
      
      if (mealPlans.length === 0) {
        console.log('No meal plans available')
        return []
      }
      
    const today = new Date()
      today.setHours(0, 0, 0, 0)
    
    const activePlans = mealPlans.filter(plan => {
        console.log('Processing plan:', plan.id, plan.title, 'is_active:', plan.is_active)
        
        if (!plan || !plan.start_date || !plan.end_date) {
          console.log('Invalid plan:', plan)
          return false
        }
        
        try {
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          
          // تعديل المنطق: اعتبار الخطة نشطة إذا كانت:
          // 1. نشطة في النظام (is_active = true)
          // 2. لم تنته بعد (end_date >= today)
          // 3. تبدأ اليوم أو قبل ذلك (start_date <= today + 1 day) - نعطي يوم واحد من المرونة
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          const isCurrent = plan.is_active && endDate >= today && startDate <= tomorrow
          console.log(`Plan ${plan.id}: start=${startDate.toISOString()}, end=${endDate.toISOString()}, today=${today.toISOString()}, tomorrow=${tomorrow.toISOString()}, is_active=${plan.is_active}, isCurrent=${isCurrent}`)
          return isCurrent
        } catch (dateError) {
          console.error('Error processing plan dates:', dateError, plan)
          return false
        }
      })
      
      console.log('Active plans found:', activePlans.length)
      const sortedPlans = activePlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const result = sortedPlans.length > 0 ? [sortedPlans[0]] : []
      console.log('Returning current plans:', result.length)
      return result
    } catch (error) {
      console.error('Error in getCurrentPlans:', error)
      return []
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    console.error('Error loading meal plans:', error)
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        فشل في تحميل خطط الوجبات: {error.message || 'خطأ غير معروف'}
      </div>
    )
  }

  const currentPlans = getCurrentPlans()

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
              className="btn btn-outline-primary me-2"
                onClick={() => {
                queryClient.invalidateQueries('patient-meal-plans')
                toast.info('جاري تحديث البيانات...')
                }}
              >
              <i className="fas fa-sync me-2"></i>
              تحديث
              </button>
              <button
              className="btn btn-outline-success"
              onClick={async () => {
                try {
                  // إنشاء اختيارات وهمية للاختبار
                  const testSelections = [
                    {
                      meal: {
                        name: 'فطور تجريبي',
                        calories: 400,
                        protein: 20,
                        carbs: 45,
                        fat: 15,
                        description: 'وجبة تجريبية'
                      },
                      mealType: 'breakfast',
                      selectedAt: new Date().toISOString(),
                      key: 'test-breakfast'
                    }
                  ]
                  
                  if (user && user.id && selectedPlan && selectedPlan.id) {
                    const response = await api.post(`/api/meals/patients/${user.id}/selected-meals/`, {
                      meal_plan_id: selectedPlan.id,
                      selected_meals: testSelections.map(item => ({
                        meal_name: item.meal.name,
                        meal_type: item.mealType,
                        selected_at: item.selectedAt,
                        nutrition_info: {
                          calories: item.meal.calories,
                          protein: item.meal.protein,
                          carbs: item.meal.carbs,
                          fat: item.meal.fat
                        },
                        notes: item.meal.description || ''
                      }))
                    })
                    console.log('Test selections saved:', response.data)
                    toast.success('تم حفظ الاختيارات التجريبية')
                    queryClient.invalidateQueries('patient-meal-selections')
                  } else {
                    toast.error('بيانات المستخدم أو الخطة غير متوفرة')
                  }
                } catch (error) {
                  console.error('Error saving test selections:', error)
                  toast.error('فشل في حفظ الاختيارات التجريبية')
                }
              }}
            >
              <i className="fas fa-flask me-2"></i>
              اختبار الحفظ
              </button>
      </div>

          {/* معلومات التشخيص */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-info">
                <h6 className="mb-2">
                  <i className="fas fa-info-circle me-2"></i>
                  معلومات التشخيص
                </h6>
                <p className="mb-1">
                  <strong>معرف المستخدم:</strong> {user ? user.id : 'غير محدد'}
                </p>
                <p className="mb-1">
                  <strong>عدد خطط الوجبات:</strong> {mealPlans ? mealPlans.length : 'غير محدد'}
                </p>
                <p className="mb-1">
                  <strong>الخطط النشطة:</strong> {currentPlans.length}
                </p>
                <p className="mb-1">
                  <strong>الوجبات المختارة:</strong> {selectedMeals.length}
                </p>
                <p className="mb-1">
                  <strong>الخطة المحددة:</strong> {selectedPlan ? `ID: ${selectedPlan.id}` : 'غير محددة'}
                </p>
                <p className="mb-0">
                  <strong>حالة التحميل:</strong> {isLoading ? 'جاري التحميل...' : 'مكتمل'}
                </p>
              </div>
            </div>
          </div>

          {currentPlans.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-calendar-plus text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">لا توجد خطط وجبات نشطة</h5>
              <p className="text-muted">
                سيتم عرض خطط الوجبات التي ينشئها طبيبك هنا
              </p>
               {mealPlans && mealPlans.length > 0 && (
                 <div className="alert alert-warning mt-3">
                   <h6>خطط موجودة:</h6>
                   {mealPlans.map((plan, index) => {
                     const startDate = new Date(plan.start_date)
                     const endDate = new Date(plan.end_date)
                     const today = new Date()
                     const isUpcoming = startDate > today
                     const isActive = plan.is_active
                     const isExpired = endDate < today
                     
                     return (
                       <div key={index} className="mb-2 p-2 border rounded">
                         <strong>{translatePlanTitle(plan.title)}</strong> - 
                         من {startDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })} إلى {endDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}
              <br />
                         <small className={`badge ${isActive ? 'bg-success' : 'bg-secondary'} me-1`}>
                           نشط: {isActive ? 'نعم' : 'لا'}
                         </small>
                         <small className={`badge ${isUpcoming ? 'bg-info' : isExpired ? 'bg-danger' : 'bg-primary'} me-1`}>
                           {isUpcoming ? 'قادمة' : isExpired ? 'منتهية' : 'جارية'}
                         </small>
                         {isUpcoming && (
                           <small className="text-info">
                             <i className="fas fa-clock me-1"></i>
                             تبدأ خلال {Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))} يوم
                           </small>
                         )}
            </div>
                     )
                   })}
        </div>
      )}
            </div>
          ) : (
        <div className="row">
              {currentPlans.map((plan) => (
                <div key={plan.id} className="col-12 mb-4">
                  <div className="card border-success">
                  <div className="card-header bg-success text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="fas fa-utensils me-2"></i>
                          {translatePlanTitle(plan.title)}
                        </h5>
                        <span className="badge bg-light text-success">
                          {getDietPlanText(plan.diet_plan)}
                        </span>
                      </div>
                  </div>
                  <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                           <p className="text-muted mb-2">
                             <i className="fas fa-calendar me-2"></i>
                             من {new Date(plan.start_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })} إلى {new Date(plan.end_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}
                           </p>
                          <p className="text-muted mb-2">
                            <i className="fas fa-fire me-2"></i>
                            السعرات المستهدفة: {plan.target_calories} سعرة حرارية
                          </p>
                      </div>
                        <div className="col-md-6">
                          <div className="d-flex gap-2">
                    <button 
                              className="btn btn-primary"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
        </div>
                  </div>
                    </div>
              ))}
             </div>
          )}
        </div>
                  </div>

      {/* Modal لعرض تفاصيل الخطة */}
      {selectedPlan && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-utensils me-2"></i>
                  {translatePlanTitle(selectedPlan.title)}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPlan(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card border-primary">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          معلومات الخطة
                    </h6>
                    </div>
                      <div className="card-body">
                        <p><strong>النظام الغذائي:</strong> {getDietPlanText(selectedPlan.diet_plan)}</p>
                        <p><strong>السعرات المستهدفة:</strong> {selectedPlan.target_calories} سعرة حرارية</p>
                         <p><strong>المدة:</strong> من {new Date(selectedPlan.start_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })} إلى {new Date(selectedPlan.end_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-success">
                      <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                          <i className="fas fa-utensils me-2"></i>
                      الوجبات المخططة
                    </h6>
                    {selectedPlan.meals && selectedPlan.meals.length > 0 && (
                          <span className="badge bg-light text-success">
                        {selectedPlan.meals.length} وجبة
                      </span>
                    )}
                              </div>
                              <div className="card-body">
                        {selectedPlan.meals && selectedPlan.meals.length > 0 ? (
                          <p className="text-success">
                            <i className="fas fa-check me-2"></i>
                            تم تخطيط {selectedPlan.meals.length} وجبة
                          </p>
                        ) : (
                          <p className="text-warning">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            لم يتم تخطيط الوجبات بعد
                          </p>
                        )}
                                      </div>
                                    </div>
                                      </div>
                      </div>
                      
                 {/* عرض الوجبات المقترحة دائماً */}
                    <div className="row">
                      <div className="col-12">
                        <div className="alert alert-success">
                          <h6 className="alert-heading">
                            <i className="fas fa-utensils me-2"></i>
                         خطة الوجبات المقترحة للاختيار
                          </h6>
                          <p className="mb-0">
                         بناءً على النظام الغذائي المختار ({selectedPlan.diet_plan})، يمكنك اختيار الوجبات التي تريدها من المقترحات التالية:
                          </p>
                     </div>
                   </div>
                        </div>
                        
                        {/* Multi-day Meal Suggestions */}
                        {(() => {
                          const startDate = new Date(selectedPlan.start_date)
                          const endDate = new Date(selectedPlan.end_date)
                          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
                          
                          return Array.from({ length: daysDiff }, (_, dayIndex) => {
                            const currentDate = new Date(startDate)
                            currentDate.setDate(startDate.getDate() + dayIndex)
                            const dateString = currentDate.toLocaleDateString('ar-SA', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              calendar: 'gregory'
                            })
                            
                            return (
                              <div key={dayIndex} className="card mb-4 border-info">
                                <div className="card-header bg-info text-white">
                                  <h5 className="mb-0">
                                    <i className="fas fa-calendar-day me-2"></i>
                                    اليوم {dayIndex + 1} - {dateString}
                                  </h5>
                                  <small>اختر الوجبات لهذا اليوم من المقترحات التالية</small>
                                </div>
                                <div className="card-body">
                        {(() => {
                          // استخدام الوجبات الحقيقية من قاعدة البيانات إذا كانت متوفرة
                          const realMeals = selectedPlan.meals || []
                          console.log('الوجبات الحقيقية:', realMeals)
                          const dietMeals = realMeals.length > 0 ? 
                            realMeals.reduce((acc, meal) => {
                              const mealType = meal.meal_type_name || meal.meal_type_name_ar || 'breakfast'
                              console.log('نوع الوجبة:', mealType, 'للوجبة:', meal.name)
                              if (!acc[mealType]) acc[mealType] = []
                              acc[mealType].push(meal)
                              return acc
                            }, {}) : 
                            getSampleMealsForDietPlan(selectedPlan.diet_plan)
                          console.log('الوجبات المجمعة:', dietMeals)
                          
                                    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
                          
                          return mealTypes.map((mealType, typeIndex) => {
                            const mealsForType = dietMeals[mealType] || []
                            if (mealsForType.length === 0) return null
                            
                            return (
                                        <div key={typeIndex} className="card mb-3 border-success">
                                <div className="card-header bg-success text-white">
                                            <h6 className="mb-0">
                                    <i className="fas fa-utensils me-2"></i>
                                              {getMealTypeText(mealType)}
                                            </h6>
                                            <small>اختر من {mealsForType.length} خيارات مقترحة</small>
                                </div>
                                <div className="card-body">
                                  <div className="row">
                                    {mealsForType.map((meal, mealIndex) => (
                                      <div key={mealIndex} className="col-md-4 mb-4">
                                        <div className="card h-100" style={{
                                          border: isMealSelected(meal, mealType) ? '2px solid #28a745' : '1px solid #dee2e6',
                                          borderRadius: '12px',
                                          boxShadow: isMealSelected(meal, mealType) ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                                          transition: 'all 0.3s ease'
                                        }}>
                                          {/* Header */}
                                          <div className="card-header" style={{
                                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                            color: 'white',
                                            borderRadius: '12px 12px 0 0',
                                            border: 'none'
                                          }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                              <div>
                                                <h6 className="mb-0 fw-bold">
                                                  <i className="fas fa-utensils me-2"></i>
                                                  {getMealTypeText(mealType)}
                                                </h6>
                                                <small className="opacity-75">وجبة صحية متوازنة</small>
                                          </div>
                                              <button
                                                className={`btn btn-sm ${isMealSelected(meal, mealType) ? 'btn-light text-success' : 'btn-outline-light'}`}
                                                onClick={() => {
                                                  console.log('تم النقر على زر الاختيار:', meal.name, mealType)
                                                  handleMealSelection(meal, mealType)
                                                }}
                                                style={{ borderRadius: '20px' }}
                                              >
                                                <i className={`fas ${isMealSelected(meal, mealType) ? 'fa-check' : 'fa-plus'}`}></i>
                                                {isMealSelected(meal, mealType) ? 'مختار' : 'اختر'}
                                              </button>
                                            </div>
                                          </div>
                                          
                                          {/* Body */}
                                          <div className="card-body p-3">
                                            {/* Meal Title */}
                                            <h5 className="card-title text-dark fw-bold mb-2">{meal.name}</h5>
                                            
                                            {/* Description */}
                                            {meal.description && (
                                              <p className="text-muted small mb-3">{meal.description}</p>
                                            )}
                                            
                                            {/* Ingredients Section */}
                                            {meal.ingredients && meal.ingredients.length > 0 && (
                                              <div className="ingredients-section mb-3">
                                                <h6 className="text-primary mb-2 fw-bold">
                                                  <i className="fas fa-shopping-basket me-1"></i>
                                                  المكونات:
                                                </h6>
                                                <div className="ingredients-list">
                                                  {meal.ingredients.map((ingredient, idx) => (
                                                    <div key={idx} className="ingredient-item mb-2">
                                                      <div className="d-flex justify-content-between align-items-center p-2" style={{
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e9ecef'
                                                      }}>
                                                        <div className="d-flex align-items-center">
                                                          <i className="fas fa-circle text-success me-2" style={{ fontSize: '0.5rem' }}></i>
                                                          <span className="fw-bold text-dark">
                                                            {ingredient.food_name_ar || ingredient.food_name || ingredient.food?.name_ar || ingredient.food?.name || ingredient.name || 'مكون غير محدد'}
                                                          </span>
                                                        </div>
                                                        <div className="text-muted d-flex align-items-center">
                                                          <span className="badge bg-primary me-2">
                                                            {ingredient.amount || ingredient.quantity || 0}g
                                                          </span>
                                                          <small className="text-info">
                                                            سعرات: {Math.round(ingredient.calories || ingredient.calories_per_100g || 0)} | بروتين: {Math.round(ingredient.protein || ingredient.protein_per_100g || 0)}g
                                                          </small>
                                                          {ingredient.notes && (
                                                            <small className="text-info ms-1">- {ingredient.notes}</small>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Nutrition Info */}
                                            <div className="nutrition-info">
                                              <h6 className="text-success mb-2 fw-bold">
                                                <i className="fas fa-chart-pie me-1"></i>
                                                القيم الغذائية الإجمالية:
                                              </h6>
                                              <div className="row g-2">
                                                <div className="col-6">
                                                  <div className="p-2 text-center" style={{
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    borderRadius: '8px'
                                                  }}>
                                                    <div className="fw-bold fs-6">{Math.round(meal.total_nutrition?.calories || meal.calories || 0)}</div>
                                                    <small>سعرة</small>
                                                  </div>
                                                </div>
                                                <div className="col-6">
                                                  <div className="p-2 text-center" style={{
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    borderRadius: '8px'
                                                  }}>
                                                    <div className="fw-bold fs-6">{Math.round(meal.total_nutrition?.protein || meal.protein || 0)}g</div>
                                                  <small>بروتين</small>
                                                </div>
                                              </div>
                                                <div className="col-6">
                                                  <div className="p-2 text-center" style={{
                                                    backgroundColor: '#17a2b8',
                                                    color: 'white',
                                                    borderRadius: '8px'
                                                  }}>
                                                    <div className="fw-bold fs-6">{Math.round(meal.total_nutrition?.carbs || meal.carbs || 0)}g</div>
                                                  <small>كربوهيدرات</small>
                                                </div>
                                              </div>
                                                <div className="col-6">
                                                  <div className="p-2 text-center" style={{
                                                    backgroundColor: '#ffc107',
                                                    color: 'white',
                                                    borderRadius: '8px'
                                                  }}>
                                                    <div className="fw-bold fs-6">{Math.round(meal.total_nutrition?.fat || meal.fat || 0)}g</div>
                                                  <small>دهون</small>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                            
                                            {/* Warning if no nutrition data */}
                                            {(!meal.calories && !meal.total_nutrition?.calories) && (
                                              <div className="alert alert-warning d-flex align-items-center mt-3" style={{ fontSize: '0.8rem' }}>
                                                <i className="fas fa-exclamation-triangle me-2"></i>
                                                <span>لا توجد قيم غذائية متوفرة</span>
                                              </div>
                                            )}
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
                            )
                          })
                        })()}
                        
                {/* عرض حالة الاختيارات للتشخيص */}
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="alert alert-info">
                      <h6 className="mb-2">
                        <i className="fas fa-info-circle me-2"></i>
                        حالة الاختيارات (للتشخيص)
                      </h6>
                      <p className="mb-1">
                        <strong>عدد الوجبات المختارة:</strong> {selectedMeals.length}
                      </p>
                      <p className="mb-2">
                        <strong>الوجبات المختارة:</strong> {selectedMeals.map(item => item.meal.name).join(', ') || 'لا توجد'}
                      </p>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          console.log('Current selectedMeals state:', selectedMeals)
                          console.log('Current selectedMeals length:', selectedMeals.length)
                        }}
                      >
                        <i className="fas fa-bug me-1"></i>
                        اختبار الحالة
                      </button>
                    </div>
                  </div>
                </div>

                {/* زر حفظ الاختيارات */}
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
                                                  سعرات: {Math.round(ingredient.calories || ingredient.calories_per_100g || 0)} | بروتين: {Math.round(ingredient.protein || ingredient.protein_per_100g || 0)}g
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
  )
}

export default PatientMealPlans
