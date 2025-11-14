import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import NutritionCalculator from '../../components/nutrition/NutritionCalculator'
import DietPlansSystem from '../../components/nutrition/DietPlansSystem'
import PatientMealSelections from '../../components/doctor/PatientMealSelections'
import GoalCalorieSuggestions from '../../components/nutrition/GoalCalorieSuggestions'
import api from '../../services/api'

const DoctorPatientProfile = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { patientId } = useParams()
  const queryClient = useQueryClient()
  
  
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [nutritionData, setNutritionData] = useState(null)
  const [measurementNutritionData, setMeasurementNutritionData] = useState(null)
  const [selectedDietPlan, setSelectedDietPlan] = useState(null)
  const [profileForm, setProfileForm] = useState({
    gender: '',
    height: '',
    current_weight: '',
    target_weight: '',
    activity_level: '',
    goal: '',
    medical_conditions: '',
    dietary_restrictions: '',
    medications: '',
    daily_calories: ''
  })
  const [measurementForm, setMeasurementForm] = useState({
    weight: '',
    body_fat_percentage: '',
    muscle_mass: '',
    waist_circumference: '',
    hip_circumference: '',
    chest_circumference: '',
    arm_circumference: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    blood_sugar: '',
    activity_level: '',
    notes: '',
    auto_update_profile: true
  })
  const [calculatedAdjustedWeight, setCalculatedAdjustedWeight] = useState(null)

  // Fetch patient profile
  const { data: profile, isLoading: profileLoading } = useQuery(
    ['patient-profile', patientId],
    () => api.get(`/api/auth/doctor-patient-profile/?patient_id=${patientId}`).then(res => res.data),
    { enabled: !!patientId }
  )

  // Update profile form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        gender: profile.gender || '',
        height: profile.height || '',
        current_weight: profile.current_weight || '',
        target_weight: profile.target_weight || '',
        activity_level: profile.activity_level || '',
        goal: profile.goal || '',
        medical_conditions: profile.medical_conditions || '',
        dietary_restrictions: profile.dietary_restrictions || '',
        medications: profile.medications || '',
        daily_calories: profile.daily_calories || ''
      })
    }
  }, [profile])

  // Fetch measurements
  const { data: measurements, isLoading: measurementsLoading } = useQuery(
    ['patient-measurements', patientId],
    () => api.get(`/api/auth/measurements/?patient_id=${patientId}`).then(res => res.data.results),
    { enabled: !!patientId }
  )

  // Fetch medical documents
  const { data: documents, isLoading: documentsLoading } = useQuery(
    ['medical-documents', patientId],
    () => api.get(`/api/auth/medical-documents/?patient_id=${patientId}`).then(res => res.data.results),
    { enabled: !!patientId }
  )

  // Update patient profile mutation (for doctor)
  const updateProfileMutation = useMutation(
    (data) => api.put(`/api/auth/doctor-patient-profile/?patient_id=${patientId}`, data),
    {
      onSuccess: () => {
        toast.success('تم تحديث ملف المريض بنجاح')
        queryClient.invalidateQueries(['patient-profile', patientId])
        setIsEditingProfile(false)
      },
      onError: (error) => {
        toast.error('فشل في تحديث ملف المريض')
        console.error('Update profile error:', error)
      }
    }
  )

  // Add measurement mutation (for doctor)
  const measurementMutation = useMutation(
    (data) => {
      console.log('API call data:', { ...data, patient_id: patientId })
      console.log('User token:', localStorage.getItem('token'))
      console.log('User info:', user)
      return api.post('/api/auth/measurements/', { ...data, patient_id: parseInt(patientId) })
    },
    {
      onSuccess: (response, variables) => {
        toast.success('تم إضافة القياس بنجاح')
        queryClient.invalidateQueries(['patient-measurements', patientId])
        queryClient.invalidateQueries(['patient-profile', patientId]) // إعادة تحميل ملف المريض
        
        // تحديث ملف المريض بالوزن الجديد إذا كان متوفراً
        if (variables.weight && profile) {
          const updatedProfile = {
            ...profile,
            current_weight: parseFloat(variables.weight)
          }
          // تحديث مستوى النشاط إذا كان متوفراً
          if (variables.activity_level) {
            updatedProfile.activity_level = variables.activity_level
          }
          
          // تحديث البيانات المحلية
          queryClient.setQueryData(['patient-profile', patientId], updatedProfile)
          
          // تحديث نموذج الملف الشخصي أيضاً
          setProfileForm(prev => ({
            ...prev,
            current_weight: parseFloat(variables.weight),
            activity_level: variables.activity_level || prev.activity_level
          }))
          
          // إعادة حساب التغذية مع البيانات الجديدة
          const newNutritionData = calculateNutritionFromMeasurement(variables)
          if (newNutritionData) {
            setMeasurementNutritionData(newNutritionData)
          }
        }
        
        setMeasurementForm({
          weight: '',
          body_fat_percentage: '',
          muscle_mass: '',
          waist_circumference: '',
          hip_circumference: '',
          chest_circumference: '',
          arm_circumference: '',
          blood_pressure_systolic: '',
          blood_pressure_diastolic: '',
          blood_sugar: '',
          activity_level: '',
          notes: ''
        })
        setMeasurementNutritionData(null)
      },
      onError: (error) => {
        console.error('Measurement error:', error)
        console.error('Error response:', error.response)
        console.error('Error message:', error.message)
        console.error('Error status:', error.response?.status)
        console.error('Error data:', error.response?.data)
        
        if (error.response?.status === 400) {
          toast.error('بيانات غير صحيحة: ' + (error.response.data?.detail || 'تحقق من البيانات المدخلة'))
        } else if (error.response?.status === 401) {
          toast.error('غير مصرح لك بإضافة قياسات')
        } else if (error.response?.status === 500) {
          toast.error('خطأ في الخادم: ' + (error.response.data?.detail || 'حدث خطأ غير متوقع'))
        } else {
          toast.error('فشل في إضافة القياس: ' + (error.message || 'خطأ غير معروف'))
        }
      }
    }
  )

  const handleMeasurementSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!measurementForm.weight || measurementForm.weight === '') {
      toast.error('الوزن مطلوب')
      return
    }
    
    // Validate patient ID
    if (!patientId || isNaN(parseInt(patientId))) {
      toast.error('معرف المريض غير صحيح')
      return
    }
    
    const data = { ...measurementForm }
    // Remove empty fields and convert numeric fields
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key]
      } else if (['weight', 'body_fat_percentage', 'muscle_mass', 'waist_circumference', 'hip_circumference', 'chest_circumference', 'arm_circumference', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar'].includes(key)) {
        // Convert numeric fields to numbers
        data[key] = parseFloat(data[key])
        if (isNaN(data[key])) {
          delete data[key]
        }
      }
    })
    
    console.log('Submitting measurement data:', data)
    console.log('Patient ID:', patientId)
    console.log('Final data to send:', { ...data, patient_id: patientId })
    console.log('Data types:', {
      weight: typeof data.weight,
      patient_id: typeof patientId,
      weight_value: data.weight
    })
    
    measurementMutation.mutate(data)
  }

  // دالة لحساب Adjusted Body Weight
  const calculateAdjustedBodyWeight = (weight, height, gender) => {
    if (!weight || !height || !gender) return null
    
    // Convert height from cm to inches
    const heightInches = height / 2.54
    
    // Calculate Ideal Body Weight (IBW) using Devine formula
    let ibw
    if (gender === 'male') {
      ibw = 50 + (2.3 * (heightInches - 60))
    } else { // female
      ibw = 45.5 + (2.3 * (heightInches - 60))
    }
    
    // Calculate Adjusted Body Weight
    const abw = ibw + (0.4 * (weight - ibw))
    
    return Math.round(abw * 10) / 10 // Round to 1 decimal place
  }

  const handleMeasurementChange = (e) => {
    const newForm = {
      ...measurementForm,
      [e.target.name]: e.target.value
    }
    setMeasurementForm(newForm)
    
    // حساب التغذية تلقائياً عند تغيير الوزن أو مستوى النشاط
    if (e.target.name === 'weight' || e.target.name === 'activity_level') {
      const nutritionData = calculateNutritionFromMeasurement(newForm)
      setMeasurementNutritionData(nutritionData)
    }
    
    // حساب Adjusted Body Weight عند تغيير الوزن
    if (e.target.name === 'weight' && profile) {
      const adjustedWeight = calculateAdjustedBodyWeight(
        parseFloat(e.target.value),
        profile.height,
        profile.gender
      )
      setCalculatedAdjustedWeight(adjustedWeight)
    }
  }

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    })
  }

  const handleCalorieGoalSelect = (goalData) => {
    // تطبيق السعرات والهدف المختار من جدول الاقتراحات
    setProfileForm({
      ...profileForm,
      daily_calories: goalData.calories.toString(),
      goal: goalData.goal
    })
    toast.info(`تم تطبيق: ${goalData.label} - ${goalData.calories} سعرة حرارية`)
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    const data = { ...profileForm }
    // Convert numeric fields
    data.height = parseFloat(data.height) || 0
    data.current_weight = parseFloat(data.current_weight) || 0
    data.target_weight = data.target_weight ? parseFloat(data.target_weight) : null
    data.daily_calories = data.daily_calories ? parseInt(data.daily_calories) : null
    updateProfileMutation.mutate(data)
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    // Reset form to original data
    if (profile) {
      setProfileForm({
        gender: profile.gender || '',
        height: profile.height || '',
        current_weight: profile.current_weight || '',
        target_weight: profile.target_weight || '',
        activity_level: profile.activity_level || '',
        goal: profile.goal || '',
        medical_conditions: profile.medical_conditions || '',
        dietary_restrictions: profile.dietary_restrictions || '',
        medications: profile.medications || '',
        daily_calories: profile.daily_calories || ''
      })
    }
  }

  // دالة لاستقبال بيانات التغذية المحسوبة
  const handleNutritionCalculated = useCallback((data) => {
    setNutritionData(data)
    console.log('Nutrition data calculated:', data)
  }, [])

  // دالة لاستقبال النظام الغذائي المختار
  const handleDietPlanSelected = useCallback((dietPlanData) => {
    setSelectedDietPlan(dietPlanData)
    console.log('Diet plan selected:', dietPlanData)
    toast.success(`تم اختيار ${dietPlanData.plan.name} للمريض`)
  }, [])

  // دالة لحساب بيانات التغذية من ملف المريض
  const calculateNutritionFromProfile = (patientProfile) => {
    if (!patientProfile) return null

    const { current_weight, height, goal, activity_level, gender } = patientProfile
    const age = patientProfile.user?.age || 30

    // حساب العمر من تاريخ الميلاد إذا كان متوفراً
    let calculatedAge = age
    if (patientProfile.user?.date_of_birth) {
      const birthDate = new Date(patientProfile.user.date_of_birth)
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
    // استخدام إجمالي استهلاك الطاقة كقيمة أساسية (سيتم تخفيضها عند اختيار النظام الغذائي)
    const targetCalories = Math.round(tdee)

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

    // حساب الألياف والماء
    const fiber = Math.round((targetCalories / 1000) * 14)
    const water = Math.round(current_weight * 35)

    return {
      bmr,
      tdee,
      targetCalories,
      protein,
      carbs,
      fat,
      fiber,
      water
    }
  }

  // حساب بيانات التغذية تلقائياً عند تحميل ملف المريض
  useEffect(() => {
    if (profile && !nutritionData) {
      const calculatedNutrition = calculateNutritionFromProfile(profile)
      setNutritionData(calculatedNutrition)
    }
  }, [profile, nutritionData])

  // تحديث بيانات التغذية عند فتح تبويب الأنظمة الغذائية
  useEffect(() => {
    if (activeTab === 'diet-plans' && profile) {
      const calculatedNutrition = calculateNutritionFromProfile(profile)
      setNutritionData(calculatedNutrition)
    }
  }, [activeTab, profile])

  // دالة لحساب العمر من تاريخ الميلاد
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // دالة لحساب الوزن المثالي (معادلة Devine)
  const calculateIdealWeight = (height, gender) => {
    if (!height) return null
    
    let idealWeight
    if (gender === 'male') {
      // للرجال: الوزن المثالي = 50 + 2.3 × (الطول بالبوصة - 60)
      idealWeight = 50 + (2.3 * ((height / 2.54) - 60))
    } else {
      // للنساء: الوزن المثالي = 45.5 + 2.3 × (الطول بالبوصة - 60)
      idealWeight = 45.5 + (2.3 * ((height / 2.54) - 60))
    }
    
    return Math.round(idealWeight * 10) / 10 // تقريب لرقم عشري واحد
  }


  // دالة لحساب التغذية بناءً على القياسات الجديدة
  const calculateNutritionFromMeasurement = (measurementData) => {
    if (!profile || !measurementData.weight) return null

    const { weight, activity_level } = measurementData
    const { height, goal, gender } = profile
    const age = profile.user?.age || 30

    // حساب العمر من تاريخ الميلاد إذا كان متوفراً
    let calculatedAge = age
    if (profile.user?.date_of_birth) {
      const birthDate = new Date(profile.user.date_of_birth)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
    }

    // استخدام مستوى النشاط من القياس إذا كان متوفراً، وإلا من الملف الشخصي
    const finalActivityLevel = activity_level || profile.activity_level || 'moderate'

    // حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * calculatedAge) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * calculatedAge) - 161
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
    const multiplier = activityMultipliers[finalActivityLevel] || 1.55
    const tdee = Math.round(bmr * multiplier)

    // حساب السعرات المستهدفة حسب الهدف
    // استخدام إجمالي استهلاك الطاقة كقيمة أساسية (سيتم تخفيضها عند اختيار النظام الغذائي)
    const targetCalories = Math.round(tdee)

    // حساب البروتين
    const proteinPerKg = {
      'lose_weight': 2.2,
      'maintain_weight': 1.6,
      'gain_weight': 1.8,
      'build_muscle': 2.0,
      'improve_health': 1.8
    }
    const proteinPerKgValue = proteinPerKg[goal] || 1.6
    const protein = Math.round(weight * proteinPerKgValue)

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

    // حساب الألياف والماء
    const fiber = Math.round((targetCalories / 1000) * 14)
    const water = Math.round(weight * 35)

    return {
      bmr,
      tdee,
      targetCalories,
      protein,
      carbs,
      fat,
      fiber,
      water,
      weight: weight,
      activityLevel: finalActivityLevel
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--'
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return dateString || '--'
    }
  }

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null
    const heightInM = height / 100
    return (weight / (heightInM * heightInM)).toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (!bmi) return { text: '--', class: 'text-muted' }
    if (bmi < 18.5) return { text: 'نقص في الوزن', class: 'text-info' }
    if (bmi < 25) return { text: 'وزن طبيعي', class: 'text-success' }
    if (bmi < 30) return { text: 'زيادة في الوزن', class: 'text-warning' }
    return { text: 'سمنة', class: 'text-danger' }
  }

  // دالة لحساب السعرات الحرارية اليومية
  const calculateDailyCalories = (weight, height, gender, activityLevel, goal, patientAge = null) => {
    if (!weight || !height || !gender || !activityLevel) return null
    
    // حساب العمر من بيانات المريض الفعلية
    const age = patientAge || 30
    
    // حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    // معاملات النشاط البدني
    const activityMultipliers = {
      'sedentary': 1.2,      // قليل النشاط
      'light': 1.375,        // نشاط خفيف
      'moderate': 1.55,      // نشاط متوسط
      'active': 1.725,       // نشاط عالي
      'very_active': 1.9     // نشاط عالي جداً
    }
    
    const activityMultiplier = activityMultipliers[activityLevel] || 1.55
    
    // حساب السعرات الحرارية اليومية المطلوبة (استخدام TDEE مباشرة)
    let dailyCalories = bmr * activityMultiplier
    
    // استخدام TDEE مباشرة كالسعرات اليومية المطلوبة
    // لا تعديل حسب الهدف - السعرات اليومية المطلوبة للحفاظ على الوزن الحالي
    
    return Math.round(dailyCalories)
  }

  if (profileLoading || measurementsLoading || documentsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
          <h2 className="mb-0">
            <i className="fas fa-user text-primary me-2"></i>
            ملف المريض - {profile?.user?.first_name} {profile?.user?.last_name}
          </h2>
          <p className="text-muted">عرض وإدارة ملف المريض الصحي والقياسات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user me-2"></i>
            المعلومات الشخصية والصحية
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'measurements' ? 'active' : ''}`}
            onClick={() => setActiveTab('measurements')}
          >
            <i className="fas fa-weight me-2"></i>
            القياسات والمتابعة
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <i className="fas fa-file-medical me-2"></i>
            الوثائق الطبية
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <i className="fas fa-calculator me-2"></i>
            حساب التغذية
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'diet-plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('diet-plans')}
          >
            <i className="fas fa-utensils me-2"></i>
            الأنظمة الغذائية
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'meal-selections' ? 'active' : ''}`}
            onClick={() => setActiveTab('meal-selections')}
          >
            <i className="fas fa-shopping-cart me-2"></i>
            اختيارات المريض
          </button>
        </li>
      </ul>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">المعلومات الأساسية</h5>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => setIsEditingProfile(true)}
                  style={{ 
                    backgroundColor: '#dc3545', 
                    borderColor: '#dc3545',
                    color: 'white',
                    fontWeight: 'bold',
                    display: isEditingProfile ? 'none' : 'block'
                  }}
                >
                  <i className="fas fa-edit me-1"></i>
                  تعديل
                </button>
              </div>
              <div className="card-body">
                {profile ? (
                  isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit}>
                      <div className="row">
                        <div className="col-6 mb-3">
                          <small className="text-muted">الاسم الكامل:</small>
                          <div className="fw-bold">{profile.user?.first_name} {profile.user?.last_name}</div>
                        </div>
                        <div className="col-6 mb-3">
                          <small className="text-muted">العمر:</small>
                          <div className="fw-bold text-primary">
                            {calculateAge(profile.user?.date_of_birth) || 'غير محدد'} سنة
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <small className="text-muted">رقم الهاتف:</small>
                          <div className="fw-bold text-info">
                            {profile.user?.phone || 'غير محدد'}
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">الجنس</label>
                          <select
                            name="gender"
                            className="form-control"
                            value={profileForm.gender}
                            onChange={handleProfileChange}
                          >
                            <option value="">اختر الجنس</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                          </select>
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">الطول (سم)</label>
                          <input
                            type="number"
                            name="height"
                            className="form-control"
                            value={profileForm.height}
                            onChange={handleProfileChange}
                            min="100"
                            max="250"
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">الوزن الحالي (كغ)</label>
                          <input
                            type="number"
                            step="0.1"
                            name="current_weight"
                            className="form-control"
                            value={profileForm.current_weight}
                            onChange={handleProfileChange}
                            min="20"
                            max="300"
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <small className="text-muted">الوزن المثالي:</small>
                          <div className="fw-bold text-success">
                            {calculateIdealWeight(profileForm.height, profileForm.gender) || '--'} كغ
                          </div>
                          <small className="text-muted">محسوب حسب الطول والجنس</small>
                        </div>
                      </div>
                      
                      {/* جدول تحديد الهدف والسعرات المقترحة */}
                      <div className="row">
                        <div className="col-12 mb-3">
                          <GoalCalorieSuggestions 
                            onCalorieSelect={handleCalorieGoalSelect}
                            selectedGoal={profileForm.goal}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <label className="form-label">الهدف</label>
                          <select
                            name="goal"
                            className="form-control"
                            value={profileForm.goal}
                            onChange={handleProfileChange}
                          >
                            <option value="">اختر الهدف</option>
                            <option value="lose_weight">خسارة الوزن</option>
                            <option value="gain_weight">زيادة الوزن</option>
                            <option value="maintain_weight">تثبيت الوزن</option>
                            <option value="build_muscle">بناء العضلات</option>
                            <option value="improve_health">تحسين الصحة</option>
                          </select>
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">مستوى النشاط</label>
                          <select
                            name="activity_level"
                            className="form-control"
                            value={profileForm.activity_level}
                            onChange={handleProfileChange}
                          >
                            <option value="">اختر مستوى النشاط</option>
                            <option value="sedentary">قليل النشاط</option>
                            <option value="light">نشاط خفيف</option>
                            <option value="moderate">نشاط متوسط</option>
                            <option value="active">نشاط عالي</option>
                            <option value="very_active">نشاط عالي جداً</option>
                          </select>
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">السعرات الحرارية اليومية المخصصة</label>
                          <input
                            type="number"
                            name="daily_calories"
                            className="form-control"
                            value={profileForm.daily_calories}
                            onChange={handleProfileChange}
                            min="800"
                            max="5000"
                            placeholder="أدخل السعرات الحرارية المطلوبة"
                          />
                          <small className="text-muted">السعرات المحسوبة: {calculateDailyCalories(profileForm.current_weight, profileForm.height, profileForm.gender, profileForm.activity_level, profileForm.goal, calculateAge(profile.user?.date_of_birth)) || '--'} سعرة حرارية</small>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          إلغاء
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={updateProfileMutation.isLoading}
                        >
                          {updateProfileMutation.isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                      </div>
                    </form>
                  ) : (
                  <div>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <small className="text-muted">الاسم الكامل:</small>
                        <div className="fw-bold">{profile.user?.first_name} {profile.user?.last_name}</div>
                      </div>
                      <div className="col-6 mb-3">
                          <small className="text-muted">العمر:</small>
                          <div className="fw-bold text-primary">
                            {calculateAge(profile.user?.date_of_birth) || 'غير محدد'} سنة
                          </div>
                        </div>
                        <div className="col-6 mb-3">
                          <small className="text-muted">رقم الهاتف:</small>
                          <div className="fw-bold text-info">
                            {profile.user?.phone || 'غير محدد'}
                          </div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">الجنس:</small>
                        <div>{profile.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">الطول:</small>
                        <div>{profile.height} سم</div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">الوزن الحالي:</small>
                        <div className="fw-bold">{profile.current_weight} كغ</div>
                      </div>
                      <div className="col-6 mb-3">
                          <small className="text-muted">الوزن المثالي:</small>
                          <div className="fw-bold text-success">
                            {calculateIdealWeight(profile.height, profile.gender) || '--'} كغ
                          </div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">مؤشر كتلة الجسم:</small>
                        <div>
                          {(() => {
                            const bmi = calculateBMI(profile.current_weight, profile.height)
                            const category = getBMICategory(bmi)
                            return (
                              <span className={category.class}>
                                {bmi} - {category.text}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">مستوى النشاط:</small>
                        <div>
                          {profile.activity_level === 'sedentary' && 'قليل الحركة'}
                          {profile.activity_level === 'light' && 'نشاط خفيف'}
                          {profile.activity_level === 'moderate' && 'نشاط متوسط'}
                          {profile.activity_level === 'active' && 'نشط'}
                          {profile.activity_level === 'very_active' && 'نشط جداً'}
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <small className="text-muted">السعرات الحرارية اليومية:</small>
                        <div className="fw-bold text-warning">
                          {profile.daily_calories ? 
                            `${profile.daily_calories} سعرة حرارية (مخصصة)` : 
                            `${calculateDailyCalories(profile.current_weight, profile.height, profile.gender, profile.activity_level, profile.goal, calculateAge(profile.user?.date_of_birth)) || '--'} سعرة حرارية (محسوبة)`
                          }
                        </div>
                        {!profile.daily_calories && (
                          <small className="text-muted">
                            <i className="fas fa-calculator me-1"></i>
                            محسوبة تلقائياً حسب الوزن والطول والنشاط والهدف
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <p className="text-muted">لم يتم إكمال الملف الشخصي</p>
                )}
                
              </div>
            </div>
          </div>
          
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">المعلومات الطبية</h5>
              </div>
              <div className="card-body">
                {profile ? (
                  isEditingProfile ? (
                    <div>
                      <div className="mb-3">
                        <label className="form-label">الحالات المرضية</label>
                        <textarea
                          name="medical_conditions"
                          className="form-control"
                          rows="3"
                          value={profileForm.medical_conditions}
                          onChange={handleProfileChange}
                          placeholder="اذكر أي حالات مرضية أو حساسية..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">القيود الغذائية</label>
                        <textarea
                          name="dietary_restrictions"
                          className="form-control"
                          rows="3"
                          value={profileForm.dietary_restrictions}
                          onChange={handleProfileChange}
                          placeholder="اذكر أي قيود غذائية أو حساسية طعام..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">الأدوية الحالية</label>
                        <textarea
                          name="medications"
                          className="form-control"
                          rows="3"
                          value={profileForm.medications}
                          onChange={handleProfileChange}
                          placeholder="اذكر الأدوية التي يتناولها المريض حالياً..."
                        />
                      </div>
                      <div className="row">
                      </div>
                    </div>
                  ) : (
                  <div>
                    <div className="mb-3">
                      <small className="text-muted">الهدف:</small>
                      <div className="fw-bold">
                        {profile.goal === 'lose_weight' && 'إنقاص الوزن'}
                        {profile.goal === 'gain_weight' && 'زيادة الوزن'}
                        {profile.goal === 'maintain_weight' && 'تثبيت الوزن'}
                        {profile.goal === 'build_muscle' && 'بناء العضلات'}
                        {profile.goal === 'improve_health' && 'تحسين الصحة'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">الحالات المرضية:</small>
                      <div>{profile.medical_conditions || 'لا توجد'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">القيود الغذائية:</small>
                      <div>{profile.dietary_restrictions || 'لا توجد'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">الأدوية الحالية:</small>
                      <div>{profile.medications || 'لا توجد'}</div>
                    </div>
                  </div>
                  )
                ) : (
                  <p className="text-muted">لم يتم إكمال المعلومات الطبية</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurements Tab - Only for Doctor */}
      {activeTab === 'measurements' && (
        <div>
          {/* Add New Measurement */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">إضافة قياس جديد للمريض</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleMeasurementSubmit}>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label">الوزن (كغ) *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      className="form-control"
                      value={measurementForm.weight}
                      onChange={handleMeasurementChange}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">الوزن المعدل (كغ)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={calculatedAdjustedWeight || ''}
                      readOnly
                      placeholder="يتم حسابه تلقائياً"
                    />
                    <small className="text-muted">
                      <i className="fas fa-calculator me-1"></i>
                      ABW = IBW + 0.4 × (الوزن الفعلي - IBW)
                    </small>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">نسبة الدهون (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="body_fat_percentage"
                      className="form-control"
                      value={measurementForm.body_fat_percentage}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">كتلة العضلات (كغ)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="muscle_mass"
                      className="form-control"
                      value={measurementForm.muscle_mass}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">محيط الخصر (سم)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="waist_circumference"
                      className="form-control"
                      value={measurementForm.waist_circumference}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">محيط الورك (سم)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="hip_circumference"
                      className="form-control"
                      value={measurementForm.hip_circumference}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">محيط الصدر (سم)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="chest_circumference"
                      className="form-control"
                      value={measurementForm.chest_circumference}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">محيط الذراع (سم)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="arm_circumference"
                      className="form-control"
                      value={measurementForm.arm_circumference}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">ضغط الدم (العالي)</label>
                    <input
                      type="number"
                      name="blood_pressure_systolic"
                      className="form-control"
                      value={measurementForm.blood_pressure_systolic}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">ضغط الدم (المنخفض)</label>
                    <input
                      type="number"
                      name="blood_pressure_diastolic"
                      className="form-control"
                      value={measurementForm.blood_pressure_diastolic}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">سكر الدم</label>
                    <input
                      type="number"
                      step="0.1"
                      name="blood_sugar"
                      className="form-control"
                      value={measurementForm.blood_sugar}
                      onChange={handleMeasurementChange}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">مستوى النشاط البدني</label>
                    <select
                      name="activity_level"
                      className="form-control"
                      value={measurementForm.activity_level}
                      onChange={handleMeasurementChange}
                    >
                      <option value="">اختر مستوى النشاط</option>
                      <option value="sedentary">قليل النشاط</option>
                      <option value="light">نشاط خفيف</option>
                      <option value="moderate">نشاط متوسط</option>
                      <option value="active">نشاط عالي</option>
                      <option value="very_active">نشاط عالي جداً</option>
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">ملاحظات طبية</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={measurementForm.notes}
                      onChange={handleMeasurementChange}
                      placeholder="ملاحظات الطبيب حول القياسات..."
                    />
                  </div>
                </div>
                
                {/* عرض التغذية المحسوبة بناءً على القياسات */}
                {measurementNutritionData && (
                  <div className="mt-4 p-3 bg-light rounded border">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-calculator me-2"></i>
                      الاحتياجات الغذائية المحسوبة بناءً على القياسات الجديدة
                    </h6>
                    <div className="row">
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">الوزن الجديد:</small>
                        <div className="fw-bold text-success">{measurementNutritionData.weight} كغ</div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">مستوى النشاط:</small>
                        <div className="fw-bold text-info">
                          {measurementNutritionData.activityLevel === 'sedentary' && 'قليل النشاط'}
                          {measurementNutritionData.activityLevel === 'light' && 'نشاط خفيف'}
                          {measurementNutritionData.activityLevel === 'moderate' && 'نشاط متوسط'}
                          {measurementNutritionData.activityLevel === 'active' && 'نشاط عالي'}
                          {measurementNutritionData.activityLevel === 'very_active' && 'نشاط عالي جداً'}
                        </div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">السعرات المستهدفة:</small>
                        <div className="fw-bold text-primary">{measurementNutritionData.targetCalories} سعرة/يوم</div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">البروتين:</small>
                        <div className="fw-bold text-warning">{measurementNutritionData.protein} جم/يوم</div>
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">الكربوهيدرات:</small>
                        <div className="fw-bold text-info">{measurementNutritionData.carbs} جم/يوم</div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">الدهون:</small>
                        <div className="fw-bold text-danger">{measurementNutritionData.fat} جم/يوم</div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">الألياف:</small>
                        <div className="fw-bold text-secondary">{measurementNutritionData.fiber} جم/يوم</div>
                      </div>
                      <div className="col-md-3 mb-2">
                        <small className="text-muted">الماء:</small>
                        <div className="fw-bold text-primary">{measurementNutritionData.water} مل/يوم</div>
                      </div>
                    </div>
                    <div className="alert alert-info mt-3 mb-0">
                      <small>
                        <i className="fas fa-info-circle me-1"></i>
                        هذه الحسابات مبنية على الوزن ومستوى النشاط الجديدين. سيتم تحديثها تلقائياً عند حفظ القياس.
                      </small>
                    </div>
                  </div>
                )}
                
                <div className="text-end mt-3">
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={measurementMutation.isLoading}
                  >
                    {measurementMutation.isLoading ? <LoadingSpinner size="sm" color="light" /> : 'إضافة القياس'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Measurements History */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">تاريخ القياسات والمتابعة</h5>
            </div>
            <div className="card-body">
              {measurements?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الوزن (كغ)</th>
                        <th>الوزن المعدل (كغ)</th>
                        <th>نسبة الدهون</th>
                        <th>محيط الخصر</th>
                        <th>ضغط الدم</th>
                        <th>سكر الدم</th>
                        <th>مستوى النشاط</th>
                        <th>ملاحظات الطبيب</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((measurement) => (
                        <tr key={measurement.id}>
                          <td>{formatDate(measurement.measured_at)}</td>
                          <td className="fw-bold">{measurement.weight}</td>
                          <td className="text-info fw-bold">{measurement.adjusted_body_weight || '--'}</td>
                          <td>{measurement.body_fat_percentage || '--'}</td>
                          <td>{measurement.waist_circumference || '--'}</td>
                          <td>
                            {measurement.blood_pressure_systolic && measurement.blood_pressure_diastolic
                              ? `${measurement.blood_pressure_systolic}/${measurement.blood_pressure_diastolic}`
                              : '--'
                            }
                          </td>
                          <td>{measurement.blood_sugar || '--'}</td>
                          <td>
                            {measurement.activity_level === 'sedentary' && 'قليل النشاط'}
                            {measurement.activity_level === 'light' && 'نشاط خفيف'}
                            {measurement.activity_level === 'moderate' && 'نشاط متوسط'}
                            {measurement.activity_level === 'active' && 'نشاط عالي'}
                            {measurement.activity_level === 'very_active' && 'نشاط عالي جداً'}
                            {!measurement.activity_level && '--'}
                          </td>
                          <td>{measurement.notes || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-weight text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد قياسات مسجلة لهذا المريض</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">الوثائق الطبية</h5>
          </div>
          <div className="card-body">
            {documents?.length > 0 ? (
              <div className="row">
                {documents.map((document) => (
                  <div key={document.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start mb-2">
                          <i className="fas fa-file-medical text-primary fs-4 me-2"></i>
                          <div className="flex-grow-1">
                            <h6 className="card-title mb-1">{document.title}</h6>
                            <small className="text-muted">
                              {document.document_type} - {formatDate(document.uploaded_at)}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            رفع بواسطة: {document.uploaded_by_name}
                          </small>
                          <a 
                            href={document.document} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            عرض
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-file-medical text-muted fs-2 mb-3"></i>
                <p className="text-muted">لا توجد وثائق طبية</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nutrition Tab */}
      {activeTab === 'nutrition' && (
        <div className="row">
          <div className="col-12">
            <NutritionCalculator 
              patientProfile={profile}
              onNutritionCalculated={handleNutritionCalculated}
            />
          </div>
        </div>
      )}

      {/* Diet Plans Tab */}
      {activeTab === 'diet-plans' && (
        <div className="row">
          <div className="col-12">
            <DietPlansSystem 
              patientProfile={profile}
              nutritionData={nutritionData}
              onDietPlanSelected={handleDietPlanSelected}
            />
          </div>
        </div>
      )}

      {/* Patient Meal Selections Tab */}
      {activeTab === 'meal-selections' && (
        <div className="row">
          <div className="col-12">
            <PatientMealSelections patientId={profile?.user?.id} />
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorPatientProfile
