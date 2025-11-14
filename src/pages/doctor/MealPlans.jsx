import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDateGregorian } from '../../utils/timeUtils'
import api from '../../services/api'

const DoctorMealPlans = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // دالة لتحويل نوع النظام إلى العربية
  const getPlanTypeInArabic = (planType) => {
    const planTypes = {
      'balanced': 'متوازن',
      'high_protein': 'عالي البروتين',
      'keto': 'كيتو دايت',
      'low_carb': 'منخفض الكربوهيدرات',
      'mediterranean': 'متوسطي',
      'vegetarian': 'نباتي',
      'vegan': 'نباتي صرف'
    }
    return planTypes[planType] || planType
  }
  
  // قائمة عناوين الخطط الغذائية
  const mealPlanTitles = [
    { value: '', label: 'اختر عنوان الخطة' },
    { value: 'weight_loss', label: 'إنقاص وزن' },
    { value: 'weight_maintenance', label: 'تثبيت وزن' },
    { value: 'weight_gain', label: 'زيادة وزن' },
    { value: 'health_maintenance', label: 'الحفاظ على الصحة' },
    { value: 'pregnant', label: 'حامل' },
    { value: 'breastfeeding', label: 'مرضع' },
    { value: 'muscle_building', label: 'بناء العضلات' }
  ]

  // قائمة الأنظمة الغذائية المتكاملة مع القيم الغذائية
  const dietPlans = [
    { value: '', label: 'اختر النظام الغذائي' },
    { 
      value: 'keto', 
      label: 'نظام الكيتو دايت',
      calories: 1500,
      protein: 100,
      carbs: 20,
      fat: 120
    },
    { 
      value: 'balanced', 
      label: 'النظام المتوازن',
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 70
    },
    { 
      value: 'weight_gain', 
      label: 'نظام زيادة الوزن',
      calories: 2500,
      protein: 150,
      carbs: 300,
      fat: 90
    },
    { 
      value: 'pregnant', 
      label: 'نظام الحامل',
      calories: 2200,
      protein: 140,
      carbs: 280,
      fat: 80
    },
    { 
      value: 'breastfeeding', 
      label: 'نظام المرضع',
      calories: 2400,
      protein: 160,
      carbs: 300,
      fat: 85
    },
    { 
      value: 'diabetes', 
      label: 'نظام السكري',
      calories: 1800,
      protein: 110,
      carbs: 180,
      fat: 75
    },
    { 
      value: 'weight_maintenance', 
      label: 'نظام تثبيت الوزن',
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 70
    }
  ]
  
  const [activeTab, setActiveTab] = useState('plans')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [mealPlanForm, setMealPlanForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    diet_plan: '',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fat: '',
    notes: ''
  })

  const [selectedMealPlan, setSelectedMealPlan] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [suggestedMeals, setSuggestedMeals] = useState([])
  const [selectedMeals, setSelectedMeals] = useState([])
  const [showMealSelectionModal, setShowMealSelectionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMealPlan, setEditingMealPlan] = useState(null)
  const [recentPatientsFilter, setRecentPatientsFilter] = useState('all')

  // View meal plan details
  const viewMealPlan = (plan) => {
    setSelectedMealPlan(plan)
    setShowViewModal(true)
  }

  // Edit meal plan
  const editMealPlan = (plan) => {
    console.log('Editing meal plan:', plan)
    console.log('Plan dates:', { start_date: plan.start_date, end_date: plan.end_date })
    setEditingMealPlan(plan)
    
    // Initialize edit form with current values
    const formData = {
      title: plan.title || '',
      description: plan.description || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      diet_plan: plan.diet_plan || '',
      target_calories: plan.target_calories || '',
      target_protein: plan.target_protein || '',
      target_carbs: plan.target_carbs || '',
      target_fat: plan.target_fat || '',
      notes: plan.notes || ''
    }
    
    console.log('Form data to be set:', formData)
    setMealPlanForm(formData)
    
    // Set selected patient
    setSelectedPatient(plan.patient || '')
    
    
    // Show edit modal
    setShowEditModal(true)
    setShowViewModal(false)
  }

  // Copy meal plan
  const copyMealPlan = (plan) => {
    console.log('Copying meal plan:', plan)
    // TODO: Implement copy functionality
    toast.info('نسخ خطة الوجبات - قيد التطوير')
  }

  // Update meal plan status
  const updateMealPlanStatusMutation = useMutation(
    ({ mealPlanId, status }) => api.post(`/api/meals/meal-plans/${mealPlanId}/update-status/`, { status }),
    {
      onSuccess: () => {
        toast.success('تم تحديث حالة خطة الوجبات بنجاح')
        queryClient.invalidateQueries('doctor-meal-plans')
      },
      onError: (error) => {
        toast.error('فشل في تحديث حالة خطة الوجبات')
        console.error('Error updating meal plan status:', error)
      }
    }
  )

  const updateMealPlanStatus = (mealPlanId, status) => {
    updateMealPlanStatusMutation.mutate({ mealPlanId, status })
  }

  // Fetch meal plans
  const { data: mealPlans, isLoading: plansLoading } = useQuery(
    'doctor-meal-plans',
    () => api.get('/api/meals/meal-plans/').then(res => {
      console.log('🔄 Fetched meal plans:', res.data.results)
      // تتبع التواريخ لكل خطة
      res.data.results.forEach((plan, index) => {
        console.log(`Plan ${index + 1} (ID: ${plan.id}): Start: ${plan.start_date}, End: ${plan.end_date}`)
        if (plan.meals && plan.meals.length > 0) {
          console.log(`🔍 Doctor - Plan ${index + 1} meals breakdown:`)
          plan.meals.forEach((meal, mealIndex) => {
            console.log(`  🍽️ Meal ${mealIndex + 1}: ${meal.name} - Ingredients: ${meal.ingredients?.length || 0}`)
            if (meal.ingredients && meal.ingredients.length > 0) {
              meal.ingredients.forEach((ingredient, ingIndex) => {
                console.log(`    🥘 Ingredient ${ingIndex + 1}: ${ingredient.food?.name_ar || ingredient.food_name_ar} (${ingredient.amount}g)`)
              })
            }
          })
        }
      })
      return res.data.results
    }),
    { 
      enabled: !!user,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache data
      refetchOnWindowFocus: true
    }
  )

  // Fetch patients
  const { data: patients, isLoading: patientsLoading, refetch: refetchPatients } = useQuery(
    'doctor-patients-list',
    async () => {
      try {
        // Try to get patients from the dedicated endpoint first
        const response = await api.get('/api/auth/patients/')
        if (response.data && response.data.length > 0) {
          const mappedPatients = response.data.map(patient => {
            const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            return {
              id: patient.id,
              name: name || patient.username || `مريض ${patient.id}`
            }
          })
          console.log('Patients loaded:', mappedPatients.length)
          return mappedPatients
        }
        
        // Fallback: get patients from appointments
        const appointmentsResponse = await api.get('/api/bookings/appointments/')
        const appointments = appointmentsResponse.data.results || []
        
        const uniquePatients = []
        const patientIds = new Set()
        
        for (const appointment of appointments) {
          if (!patientIds.has(appointment.patient)) {
            patientIds.add(appointment.patient)
            uniquePatients.push({
              id: appointment.patient,
              name: appointment.patient_name || `مريض ${appointment.patient}`
            })
          }
        }
        
        // If no patients found, return empty array
        if (uniquePatients.length === 0) {
          return []
        }
        
        return uniquePatients
      } catch (error) {
        console.error('Error fetching patients:', error)
        // Return empty array when there's an error
        return []
      }
    },
    { 
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true
    }
  )

  // Fetch food categories and foods
  const { data: foods, isLoading: foodsLoading } = useQuery(
    'foods-list',
    () => api.get('/api/meals/foods/').then(res => res.data.results),
    { enabled: !!user }
  )

  // Fetch meal types
  const { data: mealTypes, isLoading: mealTypesLoading } = useQuery(
    'meal-types',
    () => api.get('/api/meals/meal-types/').then(res => res.data),
    { enabled: !!user }
  )

  // Fetch meals for selected meal plan
  const { data: meals, isLoading: mealsLoading, refetch: refetchMeals, error: mealsError } = useQuery(
    ['meal-plan-meals', selectedMealPlan?.id],
    () => {
      if (!selectedMealPlan?.id) {
        throw new Error('No meal plan selected')
      }
      return api.get(`/api/meals/meal-plans/${selectedMealPlan.id}/meals/`).then(res => res.data)
    },
    { 
      enabled: !!selectedMealPlan?.id && !!user,
      staleTime: 5 * 60 * 1000,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching meals:', error)
        console.error('Error details:', error.response?.data)
        if (error.response?.status === 403) {
          toast.error('ليس لديك صلاحية لعرض الوجبات - يرجى تسجيل الدخول مرة أخرى')
        } else if (error.response?.status === 404) {
          console.log('No meals found for this plan')
        } else if (error.response?.status === 401) {
          toast.error('انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى')
        }
      }
    }
  )


  // Fetch recent patients (last 30 days)
  const { data: recentPatients, isLoading: recentPatientsLoading } = useQuery(
    'recent-patients',
    async () => {
      try {
        // Get patients from appointments in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const dateString = thirtyDaysAgo.toISOString().split('T')[0]
        
        const response = await api.get(`/api/bookings/appointments/?created_after=${dateString}`)
        const appointments = response.data.results || []
        
        // Extract unique patients with their registration info
        const uniquePatients = []
        const patientIds = new Set()
        
        appointments.forEach(appointment => {
          if (!patientIds.has(appointment.patient) && appointment.patient_name) {
            patientIds.add(appointment.patient)
            uniquePatients.push({
              id: appointment.patient,
              name: appointment.patient_name,
              first_appointment: appointment.scheduled_date,
              registration_date: appointment.created_at,
              appointment_type: appointment.appointment_type,
              status: appointment.status
            })
          }
        })
        
        // Sort by registration date (newest first)
        return uniquePatients.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
      } catch (error) {
        console.error('Error fetching recent patients:', error)
        return []
      }
    },
    { enabled: !!user }
  )

  // Create meal plan mutation
  const createMealPlanMutation = useMutation(
    (data) => api.post('/api/meals/meal-plans/', data),
    {
      onSuccess: (response) => {
        toast.success('تم إنشاء خطة الوجبات بنجاح')
        queryClient.invalidateQueries('doctor-meal-plans')
        queryClient.invalidateQueries('doctor-patients-list') // Refresh patients list
        setShowCreateModal(false)
        resetForm()
        
        // Auto-generate meals if diet plan is selected
        if (mealPlanForm.diet_plan && mealPlanForm.diet_plan !== '') {
          generateMealsForPlan(response.data.id, mealPlanForm.diet_plan)
        }
      },
      onError: (error) => {
        toast.error('فشل في إنشاء خطة الوجبات')
      }
    }
  )

  // Generate meals mutation
  const generateMealsMutation = useMutation(
    ({ mealPlanId, dietPlan }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
      
      return api.post(`/api/meals/meal-plans/${mealPlanId}/generate-meals/`, 
        { diet_plan: dietPlan },
        { signal: controller.signal }
      ).finally(() => clearTimeout(timeoutId))
    },
    {
      onSuccess: (response) => {
        console.log('Suggested meals generated successfully:', response.data)
        setSuggestedMeals(response.data.suggested_meals || [])
        setSelectedMeals([])
        setShowMealSelectionModal(true)
        toast.success(`تم إنشاء ${response.data.suggested_meals?.length || 0} وجبة مقترحة`)
        
        // إذا كانت النافذة مفتوحة للتعديل، أغلقها بعد إنشاء الوجبات
        if (showEditModal) {
          setShowEditModal(false)
          setEditingMealPlan(null)
          resetForm()
        }
      },
      onError: (error) => {
        console.error('Error generating meals:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        
        let errorMessage = 'فشل في إنشاء الوجبات تلقائياً'
        
        if (error.name === 'AbortError') {
          errorMessage = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage)
      }
    }
  )

  const generateMealsForPlan = (mealPlanId, dietPlan) => {
    console.log('Generating meals for plan:', mealPlanId, 'with diet:', dietPlan)
    console.log('User token:', localStorage.getItem('token'))
    console.log('User:', user)
    
    // Check if user is authenticated
    if (!user || !localStorage.getItem('token')) {
      toast.error('يرجى تسجيل الدخول أولاً')
      return
    }
    
    if (!dietPlan || dietPlan === '') {
      toast.error('يرجى اختيار نظام غذائي أولاً')
      return
    }
    
    if (!mealPlanId) {
      toast.error('خطأ في معرف خطة الوجبات')
      return
    }
    
    generateMealsMutation.mutate({ mealPlanId, dietPlan })
  }

  // Save selected meals mutation
  const saveSelectedMealsMutation = useMutation(
    ({ mealPlanId, selectedMeals }) => api.post(`/api/meals/meal-plans/${mealPlanId}/save-selected-meals/`, {
      selected_meals: selectedMeals
    }),
    {
      onSuccess: (response) => {
        console.log('Meals saved successfully:', response.data)
        toast.success(`تم حفظ ${response.data.meals.length} وجبة بنجاح`)
        setShowMealSelectionModal(false)
        setSuggestedMeals([])
        setSelectedMeals([])
        
        // حفظ mealPlanId قبل تعيين selectedMealPlan إلى null
        const currentMealPlanId = selectedMealPlan?.id
        
        // إعادة تعيين selectedMealPlan إلى null بعد حفظ الوجبات
        setSelectedMealPlan(null)
        
        // Invalidate queries to refresh the data
        if (currentMealPlanId) {
          queryClient.invalidateQueries(['meal-plan-meals', currentMealPlanId])
        }
        queryClient.invalidateQueries('doctor-meal-plans')
        
        // Refetch meals immediately only if we have a valid meal plan ID
        if (currentMealPlanId) {
          setTimeout(() => {
            // استخدام queryClient.refetchQueries مباشرة
            queryClient.refetchQueries(['meal-plan-meals', currentMealPlanId])
          }, 1000)
        }
      },
      onError: (error) => {
        console.error('Error saving meals:', error)
        toast.error('فشل في حفظ الوجبات المختارة')
      }
    }
  )

  // Update meal plan mutation
  const updateMealPlanMutation = useMutation(
    (data) => {
      console.log('🔄 Sending update request to:', `/api/meals/meal-plans/${editingMealPlan?.id}/`)
      console.log('🔄 Data being sent:', data)
      return api.put(`/api/meals/meal-plans/${editingMealPlan?.id}/`, data)
    },
    {
      onSuccess: (response, variables, context) => {
        console.log('✅ Update successful, response:', response.data)
        console.log('✅ Updated meal plan dates:', { 
          start_date: response.data.start_date, 
          end_date: response.data.end_date 
        })
        
        // إذا كان هناك callback مخصص (لإنشاء الوجبات)، لا تغلق النافذة بعد
        if (context?.onSuccess) {
          context.onSuccess()
          return
        }
        
        // إذا لم يكن هناك callback، أغلق النافذة كالمعتاد
        toast.success('تم تحديث خطة الوجبات بنجاح')
        queryClient.invalidateQueries('doctor-meal-plans')
        queryClient.invalidateQueries('doctor-patients-list') // Refresh patients list
        
        // إعادة جلب البيانات فوراً
        setTimeout(() => {
          console.log('🔄 Refetching meal plans after update...')
          queryClient.refetchQueries('doctor-meal-plans')
          // تحديث بيانات المريض أيضاً
          queryClient.invalidateQueries('patient-meal-plans')
          queryClient.invalidateQueries('patient-meal-selections')
        }, 100)
        
        setShowEditModal(false)
        setEditingMealPlan(null)
        resetForm()
      },
      onError: (error) => {
        console.error('❌ Error updating meal plan:', error)
        console.error('❌ Error response:', error.response?.data)
        toast.error('فشل في تحديث خطة الوجبات: ' + (error.response?.data?.error || error.message))
      }
    }
  )

  const resetForm = () => {
    console.log('Resetting form...')
    setMealPlanForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      diet_plan: '',
      target_calories: '',
      target_protein: '',
      target_carbs: '',
      target_fat: '',
      notes: ''
    })
    setSelectedPatient('')
    console.log('Form reset complete.')
  }




  // دالة لحساب السعرات بناءً على بيانات المريض
  const calculateCaloriesForPatient = (dietPlan, patient) => {
    if (!patient || !patient.patient_profile) {
      // إذا لم تكن هناك بيانات مريض، استخدم القيم الافتراضية
      return {
        calories: dietPlan.calories,
        protein: dietPlan.protein,
        carbs: dietPlan.carbs,
        fat: dietPlan.fat
      }
    }

    const profile = patient.patient_profile
    const { current_weight, height, goal, activity_level, gender } = profile
    const age = patient.age || patient.user?.age || 30

    // حساب العمر من تاريخ الميلاد إذا كان متوفراً
    let calculatedAge = age
    if (patient.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
    }

    // حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor
    let bmr
    if (gender === 'male') {
      bmr = (10 * current_weight) + (6.25 * height) - (5 * calculatedAge) + 5
    } else {
      bmr = (10 * current_weight) + (6.25 * height) - (5 * calculatedAge) - 161
    }
    bmr = Math.round(bmr)

    // حساب إجمالي استهلاك الطاقة اليومي (TDEE)
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    }
    const multiplier = activityMultipliers[activity_level] || 1.55
    const tdee = Math.round(bmr * multiplier)

    // حساب السعرات المستهدفة حسب الهدف
    const goalMultipliers = {
      'lose_weight': 0.8,
      'maintain_weight': 1.0,
      'gain_weight': 1.1,
      'build_muscle': 1.15,
      'improve_health': 0.9
    }
    const goalMultiplier = goalMultipliers[goal] || 1.0
    const targetCalories = Math.round(tdee * goalMultiplier)

    // حساب البروتين
    const proteinPerKg = {
      'lose_weight': 2.2,
      'maintain_weight': 1.6,
      'gain_weight': 1.8,
      'build_muscle': 2.0,
      'improve_health': 1.8
    }
    const proteinPerKgValue = proteinPerKg[goal] || 1.6
    const protein = Math.round(current_weight * proteinPerKgValue)

    // حساب الدهون
    const fatPercentage = {
      'lose_weight': 0.25,
      'maintain_weight': 0.30,
      'gain_weight': 0.35,
      'build_muscle': 0.25,
      'improve_health': 0.30
    }
    const percentage = fatPercentage[goal] || 0.30
    const fatCalories = targetCalories * percentage
    const fat = Math.round(fatCalories / 9)

    // حساب الكربوهيدرات
    const proteinCalories = protein * 4
    const fatCaloriesTotal = fat * 9
    const carbCalories = targetCalories - proteinCalories - fatCaloriesTotal
    const carbs = Math.round(carbCalories / 4)

    return {
      calories: targetCalories,
      protein: protein,
      carbs: carbs,
      fat: fat
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    // إذا تم تغيير النظام الغذائي، احسب القيم الغذائية تلقائياً
    if (name === 'diet_plan' && value) {
      const selectedDietPlan = dietPlans.find(plan => plan.value === value)
      if (selectedDietPlan) {
        // احسب السعرات بناءً على بيانات المريض المختار
        const selectedPatientData = patients?.find(p => p.id.toString() === selectedPatient.toString())
        const calculatedNutrition = calculateCaloriesForPatient(selectedDietPlan, selectedPatientData)
        
        setMealPlanForm({
          ...mealPlanForm,
          [name]: value,
          target_calories: calculatedNutrition.calories,
          target_protein: calculatedNutrition.protein,
          target_carbs: calculatedNutrition.carbs,
          target_fat: calculatedNutrition.fat
        })
        return
      }
    }
    
    // إذا تم تغيير المريض، احسب السعرات بناءً على النظام الغذائي المختار
    if (name === 'patient' && value && mealPlanForm.diet_plan) {
      const selectedDietPlan = dietPlans.find(plan => plan.value === mealPlanForm.diet_plan)
      if (selectedDietPlan) {
        const selectedPatientData = patients?.find(p => p.id.toString() === value.toString())
        const calculatedNutrition = calculateCaloriesForPatient(selectedDietPlan, selectedPatientData)
        
        setMealPlanForm({
          ...mealPlanForm,
          [name]: value,
          target_calories: calculatedNutrition.calories,
          target_protein: calculatedNutrition.protein,
          target_carbs: calculatedNutrition.carbs,
          target_fat: calculatedNutrition.fat
        })
        return
      }
    }
    
    // إذا تم تغيير عنوان الخطة، احسب القيم الغذائية بناءً على العنوان والنظام الغذائي
    if (name === 'title' && value && mealPlanForm.diet_plan) {
      const selectedDietPlan = dietPlans.find(plan => plan.value === mealPlanForm.diet_plan)
      if (selectedDietPlan) {
        const selectedPatientData = patients?.find(p => p.id.toString() === selectedPatient.toString())
        const calculatedNutrition = calculateCaloriesForPatient(selectedDietPlan, selectedPatientData)
        
        setMealPlanForm({
          ...mealPlanForm,
          [name]: value,
          target_calories: calculatedNutrition.calories,
          target_protein: calculatedNutrition.protein,
          target_carbs: calculatedNutrition.carbs,
          target_fat: calculatedNutrition.fat
        })
        return
      }
    }
    
    setMealPlanForm({
      ...mealPlanForm,
      [name]: value
    })
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      toast.error('يرجى اختيار المريض')
      return
    }
    
    
    const data = {
      ...mealPlanForm,
      patient: selectedPatient
    }
    
    console.log('Creating meal plan with data:', data)
    createMealPlanMutation.mutate(data)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      toast.error('يرجى اختيار المريض')
      return
    }
    
    if (!editingMealPlan) {
      toast.error('خطأ: لم يتم تحديد خطة الوجبات للتعديل')
      return
    }
    
    console.log('Submitting edit for meal plan:', editingMealPlan.id)
    console.log('Form data:', mealPlanForm)
    console.log('Current meal plan dates:', { 
      start_date: editingMealPlan.start_date, 
      end_date: editingMealPlan.end_date 
    })
    
    const data = {
      ...mealPlanForm,
      patient: selectedPatient
    }
    
    console.log('Data to be sent:', data)
    
    // إذا كان هناك نظام غذائي محدد، قم بإنشاء الوجبات تلقائياً بعد التحديث
    if (data.diet_plan) {
      updateMealPlanMutation.mutate(data, {
        onSuccess: () => {
          // بعد تحديث الخطة بنجاح، قم بإنشاء الوجبات تلقائياً
          console.log('Meal plan updated successfully, now generating meals...')
          toast.info('تم تحديث الخطة، جاري إنشاء الوجبات...')
          generateMealsMutation.mutate({
            mealPlanId: editingMealPlan.id,
            dietPlan: data.diet_plan
          })
        }
      })
    } else {
      // إذا لم يكن هناك نظام غذائي، قم بالتحديث فقط
      updateMealPlanMutation.mutate(data)
    }
  }


  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    })
  }

  const getDaysAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const getNextWeekDate = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  }

  // دالة لتجميع الوجبات حسب اليوم ونوع الوجبة
  const organizeMealsByDay = (meals) => {
    if (!meals) return {}
    
    const organized = {}
    const days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
    
    meals.forEach(meal => {
      const dayName = days[meal.day_of_week] || `اليوم ${meal.day_of_week + 1}`
      
      if (!organized[dayName]) {
        organized[dayName] = {}
      }
      
      const mealTypeName = meal.meal_type?.name_ar || meal.meal_type?.name || 'وجبة'
      if (!organized[dayName][mealTypeName]) {
        organized[dayName][mealTypeName] = []
      }
      
      organized[dayName][mealTypeName].push(meal)
    })
    
    return organized
  }

  // دالة لتجميع الوجبات المقترحة حسب اليوم ونوع الوجبة
  const organizeSuggestedMealsByDay = (meals) => {
    if (!meals) return {}
    
    const organized = {}
    const days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
    
    meals.forEach(meal => {
      const dayName = days[meal.day_of_week] || `اليوم ${meal.day_of_week + 1}`
      
      if (!organized[dayName]) {
        organized[dayName] = {}
      }
      
      const mealTypeName = meal.meal_type_name_ar || meal.meal_type_name || 'وجبة'
      if (!organized[dayName][mealTypeName]) {
        organized[dayName][mealTypeName] = []
      }
      
      organized[dayName][mealTypeName].push(meal)
    })
    
    return organized
  }

  // دالة لحساب إجمالي القيم الغذائية للوجبة
  const calculateMealNutrition = (meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      }
    }

    return meal.ingredients.reduce((total, ingredient) => {
      const amount = ingredient.amount || 0
      const food = ingredient.food
      
      if (!food) return total
      
      const factor = amount / 100
      return {
        calories: total.calories + (food.calories_per_100g * factor),
        protein: total.protein + (food.protein_per_100g * factor),
        carbs: total.carbs + (food.carbs_per_100g * factor),
        fat: total.fat + (food.fat_per_100g * factor),
        fiber: total.fiber + (food.fiber_per_100g * factor)
      }
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    })
  }

  // دالة لحساب إجمالي القيم الغذائية للوجبة المقترحة
  const calculateSuggestedMealNutrition = (meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      }
    }

    return meal.ingredients.reduce((total, ingredient) => {
      const amount = ingredient.amount || 0
      
      if (!ingredient) return total
      
      const factor = amount / 100
      const calories = parseFloat(ingredient.calories_per_100g) || 0
      const protein = parseFloat(ingredient.protein_per_100g) || 0
      const carbs = parseFloat(ingredient.carbs_per_100g) || 0
      const fat = parseFloat(ingredient.fat_per_100g) || 0
      const fiber = parseFloat(ingredient.fiber_per_100g) || 0
      
      return {
        calories: Math.round((total.calories + (calories * factor)) * 100) / 100,
        protein: Math.round((total.protein + (protein * factor)) * 100) / 100,
        carbs: Math.round((total.carbs + (carbs * factor)) * 100) / 100,
        fat: Math.round((total.fat + (fat * factor)) * 100) / 100,
        fiber: Math.round((total.fiber + (fiber * factor)) * 100) / 100
      }
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    })
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showMealSelectionModal) {
        setShowMealSelectionModal(false)
        setSuggestedMeals([])
        setSelectedMeals([])
      }
    }

    if (showMealSelectionModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showMealSelectionModal])

  // Debug logging
  console.log('=== COMPONENT RENDER ===')

  if (plansLoading || patientsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="fade-in">
        <style>{`
          .avatar-sm {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          
          .meal-selection-modal {
            z-index: 9999 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          .meal-selection-modal .modal-dialog {
            z-index: 10000 !important;
          }
          
          .meal-selection-modal .modal-content {
            z-index: 10001 !important;
          }
          
          /* Ensure modal appears above everything */
          .meal-selection-modal {
            backdrop-filter: blur(2px);
          }
          
          /* Prevent any other elements from appearing above modal */
          .meal-selection-modal * {
            position: relative;
            z-index: inherit;
          }
          
          /* Ensure modal is always on top */
          .meal-selection-modal {
            pointer-events: auto;
          }
          
          /* Smooth animation */
          .meal-selection-modal {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          /* Custom checkbox styling */
          .meal-selection-modal .form-check-input {
            width: 20px !important;
            height: 20px !important;
            background-color: #c0c0c0 !important;
            border: 2px solid #a0a0a0 !important;
            border-radius: 4px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            transition: all 0.3s ease !important;
          }
          
          .meal-selection-modal .form-check-input:checked {
            background-color: #28a745 !important;
            border-color: #28a745 !important;
            box-shadow: 0 2px 6px rgba(40, 167, 69, 0.4) !important;
          }
          
          .meal-selection-modal .form-check-input:focus {
            box-shadow: 0 0 0 0.2rem rgba(192, 192, 192, 0.5) !important;
            border-color: #a0a0a0 !important;
          }
          
          .meal-selection-modal .form-check-input:hover {
            background-color: #d0d0d0 !important;
            border-color: #909090 !important;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3) !important;
            transform: translateY(-1px) !important;
          }
          
          .meal-selection-modal .form-check-input:checked:hover {
            background-color: #218838 !important;
            border-color: #218838 !important;
            box-shadow: 0 3px 8px rgba(40, 167, 69, 0.5) !important;
          }
          
          /* Checkbox label styling */
          .meal-selection-modal .form-check-label {
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          
          .meal-selection-modal .form-check-label:hover {
            color: #007bff !important;
          }
          
          /* Meal item hover effect */
          .meal-selection-modal .meal-item:hover {
            background-color: rgba(0, 123, 255, 0.05) !important;
            border-radius: 8px !important;
            padding: 8px !important;
            margin: -8px !important;
            transition: all 0.3s ease !important;
          }
          
          /* Selected meal item styling */
          .meal-selection-modal .meal-item.selected {
            background-color: rgba(40, 167, 69, 0.1) !important;
            border: 2px solid #28a745 !important;
            border-radius: 8px !important;
          }
          
          /* Checkbox animation */
          .meal-selection-modal .form-check-input {
            position: relative !important;
          }
          
          .meal-selection-modal .form-check-input::after {
            content: '✓' !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: bold !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
          }
          
          .meal-selection-modal .form-check-input:checked::after {
            opacity: 1 !important;
          }
          
          /* Enhanced checkbox styling */
          .meal-selection-modal .form-check-input {
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
          }
          
          /* Checkbox focus ring */
          .meal-selection-modal .form-check-input:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(192, 192, 192, 0.3) !important;
          }
          
          /* Checkbox active state */
          .meal-selection-modal .form-check-input:active {
            transform: scale(0.95) !important;
          }
          
          /* Checkbox checked state with animation */
          .meal-selection-modal .form-check-input:checked {
            animation: checkmark 0.3s ease-in-out !important;
          }
          
          @keyframes checkmark {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}</style>
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-utensils text-success me-2"></i>
                خطط الوجبات
              </h2>
              <p className="text-muted">إنشاء وإدارة خطط الوجبات للمرضى</p>
            </div>
            <button
              className="btn btn-success"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              خطة وجبات جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <i className="fas fa-list me-2"></i>
            خطط الوجبات
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'foods' ? 'active' : ''}`}
            onClick={() => setActiveTab('foods')}
          >
            <i className="fas fa-apple-alt me-2"></i>
            قاعدة الأطعمة
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'recent-patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent-patients')}
          >
            <i className="fas fa-user-plus me-2"></i>
            المرضى الجدد
          </button>
        </li>
      </ul>

      {/* Meal Plans Tab */}
      {activeTab === 'plans' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">خطط الوجبات المنشأة</h5>
          </div>
          <div className="card-body">
            {mealPlans?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>عنوان الخطة</th>
                      <th>المريض</th>
                      <th>تاريخ البداية</th>
                      <th>تاريخ النهاية</th>
                      <th>الحالة</th>
                      <th>حالة الاستلام</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mealPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <div>
                            <div className="fw-bold">
                              {mealPlanTitles.find(title => title.value === plan.title)?.label || 
                               (plan.title === 'weight_loss' ? 'إنقاص وزن' : 
                                plan.title === 'muscle_building' ? 'بناء العضلات' : plan.title)}
                            </div>
                            <small className="text-muted">{plan.description}</small>
                          </div>
                        </td>
                        <td>{plan.patient_name}</td>
                        <td>
                          {formatDateGregorian(plan.start_date)}
                          <br />
                          <small className="text-muted">Raw: {plan.start_date}</small>
                        </td>
                        <td>
                          {formatDateGregorian(plan.end_date)}
                          <br />
                          <small className="text-muted">Raw: {plan.end_date}</small>
                        </td>
                        <td>
                          <span className={`badge ${plan.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {plan.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            plan.status === 'waiting' ? 'bg-warning' :
                            plan.status === 'delivered' ? 'bg-info' :
                            plan.status === 'acknowledged' ? 'bg-success' :
                            plan.status === 'in_progress' ? 'bg-primary' :
                            plan.status === 'completed' ? 'bg-success' :
                            plan.status === 'cancelled' ? 'bg-danger' :
                            'bg-secondary'
                          }`}>
                            {plan.status === 'waiting' ? 'في الانتظار' :
                             plan.status === 'delivered' ? 'تم التسليم' :
                             plan.status === 'acknowledged' ? 'تم الاستلام' :
                             plan.status === 'in_progress' ? 'قيد التنفيذ' :
                             plan.status === 'completed' ? 'مكتمل' :
                             plan.status === 'cancelled' ? 'ملغي' :
                             plan.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => viewMealPlan(plan)}
                              title="عرض التفاصيل"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => editMealPlan(plan)}
                              title="تعديل الخطة"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => {
                                // توجيه إلى نظام الوجبات العراقية
                                window.location.href = `/iraqi-nutrition/meal-planner?patient=${plan.patient}&plan=${plan.id}`
                              }}
                              title="تعديل في نظام الوجبات العراقية"
                            >
                              <i className="fas fa-utensils"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-info"
                              onClick={() => copyMealPlan(plan)}
                              title="نسخ الخطة"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                            {plan.status === 'delivered' && (
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => updateMealPlanStatus(plan.id, 'acknowledged')}
                                title="تأكيد استلام المريض"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            {plan.status === 'acknowledged' && (
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => updateMealPlanStatus(plan.id, 'in_progress')}
                                title="بدء التنفيذ"
                              >
                                <i className="fas fa-play"></i>
                              </button>
                            )}
                            {plan.status === 'in_progress' && (
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => updateMealPlanStatus(plan.id, 'completed')}
                                title="إكمال الخطة"
                              >
                                <i className="fas fa-flag-checkered"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-utensils text-muted fs-1 mb-3"></i>
                <h5 className="text-muted">لا توجد خطط وجبات</h5>
                <p className="text-muted">ابدأ بإنشاء خطة وجبات جديدة لمرضاك</p>
                <button
                  className="btn btn-success"
                  onClick={() => setShowCreateModal(true)}
                >
                  إنشاء خطة جديدة
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Foods Tab */}
      {activeTab === 'foods' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">قاعدة بيانات الأطعمة</h5>
          </div>
          <div className="card-body">
            {foodsLoading ? (
              <div className="text-center py-5">
                <LoadingSpinner size="lg" />
              </div>
            ) : foods?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>الطعام</th>
                      <th>الفئة</th>
                      <th>السعرات (100غ)</th>
                      <th>البروتين (100غ)</th>
                      <th>الكربوهيدرات (100غ)</th>
                      <th>الدهون (100غ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.slice(0, 20).map((food) => (
                      <tr key={food.id}>
                        <td>
                          <div>
                            <div className="fw-bold">{food.name}</div>
                            {food.name_ar && <small className="text-muted">{food.name_ar}</small>}
                          </div>
                        </td>
                        <td>{food.category_name}</td>
                        <td>{food.calories_per_100g}</td>
                        <td>{food.protein_per_100g}g</td>
                        <td>{food.carbs_per_100g}g</td>
                        <td>{food.fat_per_100g}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-apple-alt text-muted fs-1 mb-3"></i>
                <h5 className="text-muted">لا توجد أطعمة</h5>
                <p className="text-muted">لم يتم إضافة أطعمة لقاعدة البيانات بعد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Patients Tab */}
      {activeTab === 'recent-patients' && (
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-user-plus text-success me-2"></i>
                المرضى الجدد
              </h5>
              <div className="d-flex align-items-center gap-3">
                <select
                  className="form-select form-select-sm"
                  value={recentPatientsFilter}
                  onChange={(e) => setRecentPatientsFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">جميع المرضى</option>
                  <option value="confirmed">مواعيد مؤكدة</option>
                  <option value="pending">في الانتظار</option>
                  <option value="completed">مكتملة</option>
                </select>
                <div className="text-muted">
                  <small>آخر 30 يوم</small>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {recentPatientsLoading ? (
              <div className="text-center py-5">
                <LoadingSpinner size="lg" />
              </div>
            ) : recentPatients?.length > 0 ? (
              <>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>معلومات:</strong> هذه قائمة بالمرضى الذين سجلوا وحجزوا مواعيد خلال آخر 30 يوم. 
                  يمكنك إنشاء خطط وجبات لهم من خلال النقر على "إنشاء خطة وجبات".
                </div>
                
                {(() => {
                  const filteredPatients = recentPatients.filter(patient => {
                    if (recentPatientsFilter === 'all') return true
                    return patient.status === recentPatientsFilter
                  })
                  
                  return (
                    <>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>اسم المريض</th>
                              <th>تاريخ التسجيل</th>
                              <th>أول موعد</th>
                              <th>نوع الموعد</th>
                              <th>حالة الموعد</th>
                              <th>خطة الوجبات</th>
                              <th>الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                <i className="fas fa-user"></i>
                              </div>
                              <div>
                                <div className="fw-bold">{patient.name}</div>
                                <small className="text-muted">ID: {patient.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">{formatDateGregorian(patient.registration_date)}</div>
                              <small className="text-muted">
                                منذ {getDaysAgo(patient.registration_date)} يوم
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {formatDateGregorian(patient.first_appointment)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              patient.appointment_type === 'consultation' ? 'bg-info' :
                              patient.appointment_type === 'follow_up' ? 'bg-success' :
                              patient.appointment_type === 'emergency' ? 'bg-danger' :
                              'bg-secondary'
                            }`}>
                              {patient.appointment_type === 'consultation' ? 'استشارة' :
                               patient.appointment_type === 'follow_up' ? 'متابعة' :
                               patient.appointment_type === 'emergency' ? 'طوارئ' :
                               patient.appointment_type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              patient.status === 'confirmed' ? 'bg-success' :
                              patient.status === 'pending' ? 'bg-warning' :
                              patient.status === 'completed' ? 'bg-info' :
                              patient.status === 'cancelled' ? 'bg-danger' :
                              'bg-secondary'
                            }`}>
                              {patient.status === 'confirmed' ? 'مؤكد' :
                               patient.status === 'pending' ? 'في الانتظار' :
                               patient.status === 'completed' ? 'مكتمل' :
                               patient.status === 'cancelled' ? 'ملغي' :
                               patient.status}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {patient.has_meal_plan ? 'لديه خطة وجبات' : 'بدون خطة وجبات'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => {
                                  setSelectedPatient(patient.id)
                                  setShowCreateModal(true)
                                }}
                                title="إنشاء خطة وجبات"
                              >
                                <i className="fas fa-utensils me-1"></i>
                                خطة وجبات
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  // TODO: Navigate to patient profile
                                  toast.info('عرض الملف الشخصي - قيد التطوير')
                                }}
                                title="عرض الملف الشخصي"
                              >
                                <i className="fas fa-user me-1"></i>
                                الملف
                              </button>
                            </div>
                          </td>
                            </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredPatients.length === 0 && (
                        <div className="text-center py-4">
                          <i className="fas fa-filter text-muted fs-2 mb-3"></i>
                          <h6 className="text-muted">لا توجد نتائج</h6>
                          <p className="text-muted">لا يوجد مرضى بهذه الحالة في آخر 30 يوم</p>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-light rounded">
                        <h6 className="mb-2">
                          <i className="fas fa-chart-bar text-primary me-2"></i>
                          إحصائيات المرضى الجدد
                        </h6>
                        <div className="row text-center">
                          <div className="col-md-3">
                            <div className="fw-bold text-primary fs-4">{recentPatients.length}</div>
                            <small className="text-muted">إجمالي المرضى الجدد</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-success fs-4">
                              {recentPatients.filter(p => p.status === 'confirmed').length}
                            </div>
                            <small className="text-muted">مواعيد مؤكدة</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-warning fs-4">
                              {recentPatients.filter(p => p.status === 'pending').length}
                            </div>
                            <small className="text-muted">في الانتظار</small>
                          </div>
                          <div className="col-md-3">
                            <div className="fw-bold text-info fs-4">
                              {recentPatients.filter(p => p.status === 'completed').length}
                            </div>
                            <small className="text-muted">مكتملة</small>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-user-plus text-muted fs-1 mb-3"></i>
                <h5 className="text-muted">لا يوجد مرضى جدد</h5>
                <p className="text-muted">لم يسجل أي مرضى جدد خلال آخر 30 يوم</p>
                <div className="alert alert-info mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>نصيحة:</strong> المرضى سيظهرون هنا بعد أن يسجلوا ويحجزوا مواعيد معك.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

             {/* Create Meal Plan Modal */}
       {showCreateModal && (
         <div className="modal show d-block" style={{ 
           backgroundColor: 'rgba(0,0,0,0.5)', 
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100%',
           height: '100%',
           zIndex: 9998
         }}>
           <div className="modal-dialog modal-xl" style={{ zIndex: 9999 }}>
             <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">إنشاء خطة وجبات جديدة</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false)
                    // لا نعيد تعيين النموذج عند الإغلاق - نحتفظ بالبيانات
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        المريض *
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => refetchPatients()}
                          disabled={patientsLoading}
                          title="تحديث قائمة المرضى"
                        >
                          <i className={`fas fa-sync-alt ${patientsLoading ? 'fa-spin' : ''}`}></i>
                        </button>
                      </label>
                      <select
                        className="form-select"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        required
                        disabled={patientsLoading}
                      >
                        <option value="">
                          {patientsLoading ? 'جاري التحميل...' : 'اختر المريض'}
                        </option>
                        {patients?.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                      {patients && patients.length > 0 ? (
                        <div className="form-text">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            {patients.length} مريض متاح
                          </small>
                        </div>
                      ) : !patientsLoading && (
                        <div className="form-text">
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            لا توجد مرضى متاحين. تأكد من أن المرضى قد حجزوا مواعيد معك.
                          </small>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => refetchPatients()}
                            >
                              <i className="fas fa-sync-alt me-1"></i>
                              إعادة تحميل
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">عنوان الخطة *</label>
                      <select
                        name="title"
                        className="form-select"
                        value={mealPlanForm.title}
                        onChange={handleFormChange}
                        required
                      >
                        {mealPlanTitles.map((title) => (
                          <option key={title.value} value={title.value}>
                            {title.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">وصف الخطة</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        value={mealPlanForm.description}
                        onChange={handleFormChange}
                        placeholder="وصف مختصر عن أهداف وخصائص هذه الخطة..."
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ البداية *</label>
                      <input
                        type="date"
                        name="start_date"
                        className="form-control"
                        value={mealPlanForm.start_date}
                        onChange={handleFormChange}
                        min={getTomorrowDate()}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ النهاية *</label>
                      <input
                        type="date"
                        name="end_date"
                        className="form-control"
                        value={mealPlanForm.end_date}
                        onChange={handleFormChange}
                        min={getNextWeekDate()}
                        required
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">النظام الغذائي المتكامل</label>
                      <select
                        name="diet_plan"
                        className="form-control"
                        value={mealPlanForm.diet_plan}
                        onChange={handleFormChange}
                      >
                        {dietPlans.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">السعرات المستهدفة يومياً *</label>
                      <input
                        type="number"
                        name="target_calories"
                        className="form-control"
                        value={mealPlanForm.target_calories}
                        onChange={handleFormChange}
                        required
                        placeholder="1800"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">البروتين المستهدف (غرام) *</label>
                      <input
                        type="number"
                        name="target_protein"
                        className="form-control"
                        value={mealPlanForm.target_protein}
                        onChange={handleFormChange}
                        required
                        placeholder="120"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابه تلقائياً عند اختيار النظام الغذائي
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الكربوهيدرات المستهدفة (غرام) *</label>
                      <input
                        type="number"
                        name="target_carbs"
                        className="form-control"
                        value={mealPlanForm.target_carbs}
                        onChange={handleFormChange}
                        required
                        placeholder="200"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الدهون المستهدفة (غرام) *</label>
                      <input
                        type="number"
                        name="target_fat"
                        className="form-control"
                        value={mealPlanForm.target_fat}
                        onChange={handleFormChange}
                        required
                        placeholder="60"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">ملاحظات إضافية</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        rows="2"
                        value={mealPlanForm.notes}
                        onChange={handleFormChange}
                        placeholder="ملاحظات خاصة حول الخطة أو المريض..."
                      />
                    </div>
                  </div>

                </div>
                <div className="modal-footer">
                                                        <button
                     type="button"
                     className="btn btn-outline-danger me-2"
                     onClick={() => {
                       if (window.confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
                         resetForm()
                       }
                     }}
                   >
                     <i className="fas fa-trash me-1"></i>
                     مسح النموذج
                   </button>
                   <button
                     type="button"
                     className="btn btn-secondary me-2"
                     onClick={() => {
                       setShowCreateModal(false)
                       // لا نعيد تعيين النموذج عند الإلغاء - نحتفظ بالبيانات
                     }}
                   >
                     إلغاء
                   </button>
                   <button
                     type="submit"
                     className="btn btn-success"
                     disabled={createMealPlanMutation.isLoading}
                   >
                    {createMealPlanMutation.isLoading ? (
                      <LoadingSpinner size="sm" color="light" />
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        حفظ خطة الوجبات
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


             {/* View Meal Plan Details Modal */}
       {showViewModal && selectedMealPlan && (
         <div className="modal show d-block" style={{ 
           backgroundColor: 'rgba(0,0,0,0.5)', 
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100%',
           height: '100%',
           zIndex: 9996
         }}>
           <div className="modal-dialog modal-xl" style={{ zIndex: 9997 }}>
             <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye text-primary me-2"></i>
                  تفاصيل خطة الوجبات: {selectedMealPlan.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowViewModal(false)
                    // لا نعيد تعيين selectedMealPlan إلى null إذا كان modal الوجبات المقترحة مفتوحاً
                    if (!showMealSelectionModal) {
                      setSelectedMealPlan(null)
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">عنوان الخطة:</label>
                    <p className="form-control-plaintext">
                      {mealPlanTitles.find(title => title.value === selectedMealPlan.title)?.label || selectedMealPlan.title}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">المريض:</label>
                    <p className="form-control-plaintext">{selectedMealPlan.patient_name}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">تاريخ البداية:</label>
                    <p className="form-control-plaintext">{formatDateGregorian(selectedMealPlan.start_date)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">تاريخ النهاية:</label>
                    <p className="form-control-plaintext">{formatDateGregorian(selectedMealPlan.end_date)}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">الحالة:</label>
                    <p className="form-control-plaintext">
                      <span className={`badge ${selectedMealPlan.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedMealPlan.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">النظام الغذائي:</label>
                    <p className="form-control-plaintext">
                      {selectedMealPlan.diet_plan ? 
                        dietPlans.find(plan => plan.value === selectedMealPlan.diet_plan)?.label || selectedMealPlan.diet_plan
                        : 'لم يتم تحديد نظام غذائي'
                      }
                    </p>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">وصف الخطة:</label>
                    <p className="form-control-plaintext">
                      {selectedMealPlan.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">ملاحظات:</label>
                    <p className="form-control-plaintext">
                      {selectedMealPlan.notes || 'لا توجد ملاحظات'}
                    </p>
                  </div>
                </div>

                {/* Meals Section */}
                <div className="border-top pt-4 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                      <i className="fas fa-utensils text-success me-2"></i>
                      الوجبات المخططة
                    </h6>
                    <button
                      className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                console.log('Retry button clicked')
                                if (selectedMealPlan?.id) {
                                  queryClient.refetchQueries(['meal-plan-meals', selectedMealPlan.id])
                                }
                              }}
                      disabled={mealsLoading}
                    >
                      <i className={`fas fa-sync-alt ${mealsLoading ? 'fa-spin' : ''}`}></i>
                      تحديث
                    </button>
                  </div>
                  
                  {mealsLoading ? (
                    <div className="text-center py-4">
                      <LoadingSpinner size="lg" />
                      <p className="text-muted mt-2">جاري تحميل الوجبات...</p>
                    </div>
                  ) : meals && meals.length > 0 ? (
                    <div className="meals-container">
                      {(() => {
                        const organizedMeals = organizeMealsByDay(meals)
                        const days = Object.keys(organizedMeals)
                        
                        return days.map(dayName => (
                          <div key={dayName} className="day-meals mb-4">
                            <h6 className="day-header bg-light p-2 rounded mb-3">
                              <i className="fas fa-calendar-day text-primary me-2"></i>
                              {dayName}
                            </h6>
                            
                            <div className="row">
                              {Object.entries(organizedMeals[dayName]).map(([mealType, mealsList]) => (
                                <div key={mealType} className="col-md-6 col-lg-4 mb-3">
                                  <div className="card h-100">
                                    <div className="card-header bg-success text-white">
                                      <h6 className="mb-0">
                                        <i className="fas fa-utensils me-2"></i>
                                        {mealType}
                                      </h6>
                                    </div>
                                    <div className="card-body">
                                      {mealsList.map((meal, index) => {
                                        const nutrition = calculateMealNutrition(meal)
                                        return (
                                          <div key={meal.id || index} className="meal-item mb-3">
                                            <h6 className="meal-name text-primary">
                                              {meal.name}
                                            </h6>
                                            
                                            {meal.description && (
                                              <p className="meal-description text-muted small mb-2">
                                                {meal.description}
                                              </p>
                                            )}
                                            
                                            {meal.instructions && (
                                              <div className="meal-instructions mb-2">
                                                <small className="text-muted">
                                                  <i className="fas fa-list-ul me-1"></i>
                                                  <strong>طريقة التحضير:</strong>
                                                </small>
                                                <p className="small text-muted mb-1">
                                                  {meal.instructions}
                                                </p>
                                              </div>
                                            )}
                                            
                                            {meal.prep_time && (
                                              <div className="prep-time mb-2">
                                                <small className="text-muted">
                                                  <i className="fas fa-clock me-1"></i>
                                                  وقت التحضير: {meal.prep_time} دقيقة
                                                </small>
                                              </div>
                                            )}
                                            
                                            {/* المكونات */}
                                            {(() => {
                                              console.log('🔍 Doctor - Meal ingredients debug:', meal.name, meal.ingredients)
                                              return null
                                            })()}
                                            {meal.ingredients && meal.ingredients.length > 0 && (
                                              <div className="ingredients mb-2">
                                                <small className="text-muted">
                                                  <i className="fas fa-shopping-basket me-1"></i>
                                                  <strong>المكونات:</strong>
                                                </small>
                                                <ul className="list-unstyled small mb-1">
                                                  {meal.ingredients.map((ingredient, idx) => (
                                                    <li key={idx} className="text-muted">
                                                      • {ingredient.food?.name_ar || ingredient.food?.name} 
                                                      ({ingredient.amount}g)
                                                      {ingredient.notes && (
                                                        <span className="text-info"> - {ingredient.notes}</span>
                                                      )}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            {/* القيم الغذائية */}
                                            <div className="nutrition-info">
                                              <small className="text-muted">
                                                <i className="fas fa-chart-pie me-1"></i>
                                                <strong>القيم الغذائية:</strong>
                                              </small>
                                              <div className="row small text-muted">
                                                <div className="col-6">
                                                  <div>السعرات: {Math.round(nutrition.calories)}</div>
                                                  <div>البروتين: {Math.round(nutrition.protein)}g</div>
                                                </div>
                                                <div className="col-6">
                                                  <div>الكربوهيدرات: {Math.round(nutrition.carbs)}g</div>
                                                  <div>الدهون: {Math.round(nutrition.fat)}g</div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  ) : (
                    <div className="alert alert-warning text-center py-4">
                      <div className="mb-3">
                        <i className="fas fa-utensils text-warning" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <h6 className="alert-heading mb-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        لا توجد وجبات مخططة
                      </h6>
                      <p className="mb-3">
                        لم يتم إنشاء وجبات لهذه الخطة بعد
                      </p>
                      {mealsError && (
                        <div className="alert alert-danger">
                          <small>
                            <i className="fas fa-exclamation-circle me-1"></i>
                            خطأ في تحميل الوجبات: {mealsError.message}
                          </small>
                          <div className="mt-2">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                              console.log('Manual refresh triggered')
                              if (selectedMealPlan?.id) {
                                queryClient.refetchQueries(['meal-plan-meals', selectedMealPlan.id])
                              }
                            }}
                            >
                              <i className="fas fa-retry"></i>
                              إعادة المحاولة
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {selectedMealPlan.diet_plan && selectedMealPlan.diet_plan !== '' ? (
                        <div>
                          <p className="mb-3">
                            يمكنك إنشاء وجبات تلقائياً بناءً على النظام الغذائي المختار
                          </p>
                          <button
                            className="btn btn-success me-2"
                            onClick={() => {
                              if (selectedMealPlan?.id && selectedMealPlan?.diet_plan) {
                                generateMealsForPlan(selectedMealPlan.id, selectedMealPlan.diet_plan)
                              } else {
                                toast.error('خطأ: لم يتم تحديد خطة الوجبات أو النظام الغذائي')
                              }
                            }}
                            disabled={generateMealsMutation.isLoading}
                          >
                            <i className={`fas fa-magic ${generateMealsMutation.isLoading ? 'fa-spin' : ''}`}></i>
                            {generateMealsMutation.isLoading ? 'جاري الإنشاء...' : 'إنشاء وجبات تلقائياً'}
                          </button>
                          {generateMealsMutation.isLoading && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => {
                                generateMealsMutation.reset()
                                toast.info('تم إلغاء العملية')
                              }}
                            >
                              <i className="fas fa-times"></i>
                              إلغاء
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary me-2"
                            onClick={() => {
                              console.log('Manual edit triggered for plan:', selectedMealPlan)
                              setEditingMealPlan(selectedMealPlan)
                              
                              // Initialize edit form with current values
                              setMealPlanForm({
                                title: selectedMealPlan.title || '',
                                description: selectedMealPlan.description || '',
                                start_date: selectedMealPlan.start_date || '',
                                end_date: selectedMealPlan.end_date || '',
                                diet_plan: selectedMealPlan.diet_plan || '',
                                target_calories: selectedMealPlan.target_calories || '',
                                target_protein: selectedMealPlan.target_protein || '',
                                target_carbs: selectedMealPlan.target_carbs || '',
                                target_fat: selectedMealPlan.target_fat || '',
                                notes: selectedMealPlan.notes || ''
                              })
                              
                              // Set selected patient
                              setSelectedPatient(selectedMealPlan.patient || '')
                              
                              setShowEditModal(true)
                            }}
                          >
                            <i className="fas fa-edit"></i>
                            تعديل الخطة يدوياً
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              console.log('Manual refresh triggered')
                              if (selectedMealPlan?.id) {
                                queryClient.refetchQueries(['meal-plan-meals', selectedMealPlan.id])
                              }
                            }}
                            disabled={mealsLoading}
                          >
                            <i className={`fas fa-sync-alt ${mealsLoading ? 'fa-spin' : ''}`}></i>
                            تحديث الوجبات
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-3">
                            يرجى اختيار نظام غذائي أولاً لإنشاء وجبات تلقائياً
                          </p>
                          <button
                            className="btn btn-outline-primary me-2"
                            onClick={() => {
                              console.log('Manual edit triggered for plan:', selectedMealPlan)
                              setEditingMealPlan(selectedMealPlan)
                              
                              // Initialize edit form with current values
                              setMealPlanForm({
                                title: selectedMealPlan.title || '',
                                description: selectedMealPlan.description || '',
                                start_date: selectedMealPlan.start_date || '',
                                end_date: selectedMealPlan.end_date || '',
                                diet_plan: selectedMealPlan.diet_plan || '',
                                target_calories: selectedMealPlan.target_calories || '',
                                target_protein: selectedMealPlan.target_protein || '',
                                target_carbs: selectedMealPlan.target_carbs || '',
                                target_fat: selectedMealPlan.target_fat || '',
                                notes: selectedMealPlan.notes || ''
                              })
                              
                              // Set selected patient
                              setSelectedPatient(selectedMealPlan.patient || '')
                              
                              setShowEditModal(true)
                            }}
                          >
                            <i className="fas fa-edit"></i>
                            تعديل الخطة واختيار النظام الغذائي
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              console.log('Manual refresh triggered')
                              if (selectedMealPlan?.id) {
                                queryClient.refetchQueries(['meal-plan-meals', selectedMealPlan.id])
                              }
                            }}
                            disabled={mealsLoading}
                          >
                            <i className={`fas fa-sync-alt ${mealsLoading ? 'fa-spin' : ''}`}></i>
                            تحديث الوجبات
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
                             <div className="modal-footer">
                 <button
                   type="button"
                   className="btn btn-outline-danger me-2"
                   onClick={() => {
                     if (window.confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
                       resetForm()
                     }
                   }}
                 >
                   <i className="fas fa-trash me-1"></i>
                   مسح النموذج
                 </button>
                 <button
                   type="button"
                   className="btn btn-secondary me-2"
                   onClick={() => {
                     setShowViewModal(false)
                     // لا نعيد تعيين selectedMealPlan إلى null إذا كان modal الوجبات المقترحة مفتوحاً
                     if (!showMealSelectionModal) {
                       setSelectedMealPlan(null)
                     }
                   }}
                 >
                   إغلاق
                 </button>
                 <button
                   type="button"
                   className="btn btn-success"
                   onClick={() => editMealPlan(selectedMealPlan)}
                 >
                  <i className="fas fa-edit me-2"></i>
                  تعديل الخطة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Edit Meal Plan Modal */}
       {showEditModal && editingMealPlan && (
         <div className="modal show d-block" style={{ 
           backgroundColor: 'rgba(0,0,0,0.5)', 
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100%',
           height: '100%',
           zIndex: 9997
         }}>
           <div className="modal-dialog modal-xl" style={{ zIndex: 9998 }}>
             <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-edit text-success me-2"></i>
                  تعديل خطة الوجبات: {editingMealPlan.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMealPlan(null)
                    resetForm()
                  }}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        المريض *
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => refetchPatients()}
                          disabled={patientsLoading}
                          title="تحديث قائمة المرضى"
                        >
                          <i className={`fas fa-sync-alt ${patientsLoading ? 'fa-spin' : ''}`}></i>
                        </button>
                      </label>
                      <select
                        className="form-select"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        required
                        disabled={patientsLoading}
                      >
                        <option value="">
                          {patientsLoading ? 'جاري التحميل...' : 'اختر المريض'}
                        </option>
                        {patients?.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name}
                          </option>
                        ))}
                      </select>
                      {patients && patients.length > 0 ? (
                        <div className="form-text">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            {patients.length} مريض متاح
                          </small>
                        </div>
                      ) : !patientsLoading && (
                        <div className="form-text">
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            لا توجد مرضى متاحين. تأكد من أن المرضى قد حجزوا مواعيد معك.
                          </small>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => refetchPatients()}
                            >
                              <i className="fas fa-sync-alt me-1"></i>
                              إعادة تحميل
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">عنوان الخطة *</label>
                      <select
                        name="title"
                        className="form-select"
                        value={mealPlanForm.title}
                        onChange={handleFormChange}
                        required
                      >
                        {mealPlanTitles.map((title) => (
                          <option key={title.value} value={title.value}>
                            {title.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">وصف الخطة</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        value={mealPlanForm.description}
                        onChange={handleFormChange}
                        placeholder="وصف مختصر عن أهداف وخصائص هذه الخطة..."
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ البداية *</label>
                      <input
                        type="date"
                        name="start_date"
                        className="form-control"
                        value={mealPlanForm.start_date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">تاريخ النهاية *</label>
                      <input
                        type="date"
                        name="end_date"
                        className="form-control"
                        value={mealPlanForm.end_date}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">النظام الغذائي المتكامل</label>
                      <select
                        name="diet_plan"
                        className="form-control"
                        value={mealPlanForm.diet_plan}
                        onChange={handleFormChange}
                      >
                        {dietPlans.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">السعرات المستهدفة يومياً *</label>
                      <input
                        type="number"
                        name="target_calories"
                        className="form-control"
                        value={mealPlanForm.target_calories}
                        onChange={handleFormChange}
                        required
                        placeholder="1800"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">البروتين المستهدف (غرام) *</label>
                      <input
                        type="number"
                        name="target_protein"
                        className="form-control"
                        value={mealPlanForm.target_protein}
                        onChange={handleFormChange}
                        required
                        placeholder="120"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابه تلقائياً عند اختيار النظام الغذائي
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الكربوهيدرات المستهدفة (غرام) *</label>
                      <input
                        type="number"
                        name="target_carbs"
                        className="form-control"
                        value={mealPlanForm.target_carbs}
                        onChange={handleFormChange}
                        required
                        placeholder="200"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">الدهون المستهدفة (غرام) *</label>
                      <input
                        type="number"
                        name="target_fat"
                        className="form-control"
                        value={mealPlanForm.target_fat}
                        onChange={handleFormChange}
                        required
                        placeholder="60"
                      />
                      <small className="text-muted">
                        <i className="fas fa-magic me-1"></i>
                        يتم حسابها تلقائياً بناءً على بيانات المريض والنظام الغذائي المختار
                      </small>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">ملاحظات إضافية</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        rows="2"
                        value={mealPlanForm.notes}
                        onChange={handleFormChange}
                        placeholder="ملاحظات خاصة حول الخطة أو المريض..."
                      />
                    </div>
                  </div>


                </div>
                                 <div className="modal-footer">
                   <button
                     type="button"
                     className="btn btn-outline-danger me-2"
                     onClick={() => {
                       if (window.confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
                         resetForm()
                       }
                     }}
                   >
                     <i className="fas fa-trash me-1"></i>
                     مسح النموذج
                   </button>
                   <button
                     type="button"
                     className="btn btn-secondary me-2"
                     onClick={() => {
                       setShowEditModal(false)
                       setEditingMealPlan(null)
                       // لا نعيد تعيين النموذج عند الإلغاء - نحتفظ بالبيانات
                     }}
                   >
                     إلغاء
                   </button>
                   
                   {mealPlanForm.diet_plan && mealPlanForm.diet_plan !== '' && (
                     <>
                       <button
                         type="button"
                         className="btn btn-primary me-2"
                         onClick={() => {
                           if (editingMealPlan?.id) {
                             generateMealsForPlan(editingMealPlan.id, mealPlanForm.diet_plan)
                           }
                         }}
                         disabled={generateMealsMutation.isLoading}
                       >
                         <i className={`fas fa-magic ${generateMealsMutation.isLoading ? 'fa-spin' : ''}`}></i>
                         {generateMealsMutation.isLoading ? 'جاري الإنشاء...' : 'إنشاء وجبات تلقائياً'}
                       </button>
                       {generateMealsMutation.isLoading && (
                         <button
                           type="button"
                           className="btn btn-outline-danger btn-sm me-2"
                           onClick={() => {
                             generateMealsMutation.reset()
                             toast.info('تم إلغاء العملية')
                           }}
                         >
                           <i className="fas fa-times"></i>
                           إلغاء
                         </button>
                       )}
                     </>
                   )}
                   
                   <button
                     type="submit"
                     className="btn btn-success"
                     disabled={updateMealPlanMutation.isLoading}
                   >
                    {updateMealPlanMutation.isLoading ? (
                      <LoadingSpinner size="sm" color="light" />
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        حفظ التعديلات
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal اختيار الوجبات المقترحة */}
      {showMealSelectionModal && (
        <div 
          className="modal show d-block meal-selection-modal" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMealSelectionModal(false)
              setSuggestedMeals([])
              setSelectedMeals([])
            }
          }}
        >
          <div className="modal-dialog modal-xl" style={{ zIndex: 10000, marginTop: '2rem' }}>
            <div className="modal-content" style={{ zIndex: 10001, maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-utensils text-primary me-2"></i>
                  الوجبات المقترحة للعلم
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowMealSelectionModal(false)
                    setSuggestedMeals([])
                    setSelectedMeals([])
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  الوجبات المقترحة للعلم فقط. هذه الوجبات معروضة للمراجعة ولا يمكن اختيارها.
                </div>
                
                {suggestedMeals.length > 0 ? (
                  <div className="meals-selection-container">
                    {(() => {
                      const organizedMeals = organizeSuggestedMealsByDay(suggestedMeals)
                      const days = Object.keys(organizedMeals)
                      
                      return days.map(dayName => (
                        <div key={dayName} className="day-meals mb-4">
                          <h6 className="day-header bg-light p-2 rounded mb-3">
                            <i className="fas fa-calendar-day text-primary me-2"></i>
                            {dayName}
                          </h6>
                          
                          <div className="row">
                            {Object.entries(organizedMeals[dayName]).map(([mealType, mealsList]) => (
                              <div key={mealType} className="col-md-6 col-lg-4 mb-3">
                                <div className="card h-100">
                                  <div className="card-header bg-success text-white">
                                    <h6 className="mb-0">
                                      <i className="fas fa-utensils me-2"></i>
                                      {mealType}
                                    </h6>
                                  </div>
                                  <div className="card-body">
                                    {mealsList.map((meal, index) => {
                                      const isSelected = selectedMeals.some(selected => 
                                        selected.day_of_week === meal.day_of_week && 
                                        selected.meal_type_id === meal.meal_type_id
                                      )
                                      const nutrition = calculateSuggestedMealNutrition(meal)
                                      console.log('Meal nutrition:', meal.name, nutrition)
                                      console.log('Meal ingredients:', meal.ingredients)
                                      
                                      return (
                                        <div key={index} className="meal-item mb-3 p-2" style={{ 
                                          border: '2px solid #e9ecef',
                                          borderRadius: '8px',
                                          backgroundColor: '#f8f9fa',
                                          transition: 'all 0.3s ease',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                          <div className="meal-display">
                                            <div className="meal-info">
                                              <div className="meal-details">
                                                <h6 className="meal-name">{meal.name}</h6>
                                                <p className="meal-description small text-muted mb-2">
                                                  {meal.description}
                                                </p>
                                                
                                                {(() => {
                                                  console.log('🔍 Doctor - Suggested meal ingredients debug:', meal.name, meal.ingredients)
                                                  return null
                                                })()}
                                                {meal.ingredients && meal.ingredients.length > 0 && (
                                                  <div className="ingredients mb-2">
                                                    <small className="text-muted">
                                                      <i className="fas fa-list me-1"></i>
                                                      <strong>المكونات:</strong>
                                                    </small>
                                                    <div className="ingredients-list">
                                                      {meal.ingredients.map((ingredient, idx) => (
                                                        <div key={idx} className="ingredient-item small">
                                                          • {ingredient.food_name_ar || ingredient.food_name} ({ingredient.amount}g)
                                                          <br />
                                                          <small className="text-info">
                                                            سعرات: {Math.round((parseFloat(ingredient.calories_per_100g) || 0) * (ingredient.amount / 100))} | 
                                                            بروتين: {Math.round((parseFloat(ingredient.protein_per_100g) || 0) * (ingredient.amount / 100))}g
                                                          </small>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                <div className="nutrition-info">
                                                  <small className="text-muted">
                                                    <i className="fas fa-chart-pie me-1"></i>
                                                    <strong>القيم الغذائية الإجمالية:</strong>
                                                  </small>
                                                  <div className="row small text-muted">
                                                    <div className="col-6">
                                                      <div>السعرات: {Math.round(nutrition.calories || 0)}</div>
                                                      <div>البروتين: {Math.round(nutrition.protein || 0)}g</div>
                                                    </div>
                                                    <div className="col-6">
                                                      <div>الكربوهيدرات: {Math.round(nutrition.carbs || 0)}g</div>
                                                      <div>الدهون: {Math.round(nutrition.fat || 0)}g</div>
                                                    </div>
                                                  </div>
                                                  {nutrition.calories === 0 && (
                                                    <div className="text-warning small">
                                                      <i className="fas fa-exclamation-triangle me-1"></i>
                                                      لا توجد قيم غذائية متوفرة
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-utensils text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-2">لا توجد وجبات مقترحة</p>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', borderTop: '1px solid #dee2e6' }}>
                <div className="text-center w-100">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    الوجبات المقترحة للعلم فقط - لا يمكن اختيارها
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMealSelectionModal(false)
                    setSuggestedMeals([])
                    setSelectedMeals([])
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorMealPlans
