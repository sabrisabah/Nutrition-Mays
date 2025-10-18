import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const DailyMealPlanner = () => {
  const { user } = useAuth();
  const [mealTemplates, setMealTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState(null);
  const [patientMealPlans, setPatientMealPlans] = useState([]);
  const [showMealPlans, setShowMealPlans] = useState(false);
  
  // إضافة state للخطة المحددة من URL
  const [selectedMealPlanId, setSelectedMealPlanId] = useState(null);
  
  // إضافة state للفترة الزمنية
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [generatedMealPlan, setGeneratedMealPlan] = useState(null);
  
  // تحديد ما إذا كان المستخدم مريض أم طبيب
  const isPatient = user?.role === 'patient';

  // قراءة المعاملات من URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientParam = urlParams.get('patient');
    const planParam = urlParams.get('plan');
    
    if (patientParam) {
      setPatientId(patientParam);
      setSelectedPatient(patientParam);
    }
    
    if (planParam) {
      setSelectedMealPlanId(planParam);
    }
  }, []);

  // جلب بيانات الخطة المحددة
  useEffect(() => {
    if (selectedMealPlanId && selectedPatient) {
      // جلب بيانات الخطة المحددة
      api.get(`/api/meals/meal-plans/${selectedMealPlanId}/`)
        .then(response => {
          const plan = response.data;
          console.log('Selected meal plan:', plan);
          
          // تعيين بيانات الخطة
          if (plan.diet_plan) {
            // البحث عن القالب المناسب للنظام الغذائي
            const matchingTemplate = mealTemplates.find(template => 
              template.name_ar?.toLowerCase().includes(plan.diet_plan.toLowerCase()) ||
              template.name?.toLowerCase().includes(plan.diet_plan.toLowerCase())
            );
            
            if (matchingTemplate) {
              setSelectedTemplate(matchingTemplate);
            }
          }
          
          // تعيين التواريخ
          if (plan.start_date && plan.end_date) {
            // تحويل التواريخ إلى تنسيق YYYY-MM-DD
            const startDateFormatted = new Date(plan.start_date).toISOString().split('T')[0];
            const endDateFormatted = new Date(plan.end_date).toISOString().split('T')[0];
            setStartDate(startDateFormatted);
            setEndDate(endDateFormatted);
            console.log('Dates set:', { startDateFormatted, endDateFormatted });
          }
        })
        .catch(error => {
          console.error('Error fetching meal plan:', error);
        });
    }
  }, [selectedMealPlanId, selectedPatient, mealTemplates]);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#2c3e50'
    },
    card: {
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '20px',
      marginBottom: '20px'
    },
    button: {
      background: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      margin: '5px'
    },
    buttonSecondary: {
      background: '#95a5a6',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      margin: '2px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    templateCard: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      background: '#f9f9f9',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    templateCardSelected: {
      border: '2px solid #3498db',
      background: '#f0f8ff'
    },
    mealSchedule: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      marginTop: '20px'
    },
    mealCard: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '6px',
      border: '1px solid #e9ecef'
    },
    mealTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px',
      textAlign: 'center'
    },
    foodItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px',
      background: 'white',
      borderRadius: '4px',
      marginBottom: '5px',
      border: '1px solid #eee'
    },
    nutritionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '10px',
      marginTop: '20px'
    },
    nutritionCard: {
      background: '#e8f5e8',
      padding: '15px',
      borderRadius: '6px',
      textAlign: 'center',
      border: '1px solid #4caf50'
    },
    progressContainer: {
      width: '100%',
      height: '20px',
      backgroundColor: '#e0e0e0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginTop: '5px'
    },
    progressBar: {
      height: '100%',
      borderRadius: '10px',
      transition: 'width 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    nutritionDetail: {
      padding: '10px',
      background: 'white',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    nutritionValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '5px'
    },
    nutritionLabel: {
      fontSize: '12px',
      color: '#666',
      textTransform: 'uppercase'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: '#666'
    },
    summary: {
      background: '#e8f5e8',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '20px',
      border: '1px solid #4caf50'
    }
  };

  // محاكاة قوالب الوجبات اليومية
  const mockMealTemplates = [
    {
      id: 1,
      name: 'خطة يومية صحية - يوم 1',
      name_ar: 'خطة يومية صحية - يوم 1',
      description: 'خطة وجبات متوازنة مع التركيز على البروتين والخضروات',
      target_calories: 2000,
      meals: [
        {
          type: 'إفطار',
          name: 'إفطار صحي',
          foods: [
            { name: 'شوفان', amount: 50, calories: 34 },
            { name: 'حليب', amount: 200, calories: 84 }
          ]
        },
        {
          type: 'وجبة خفيفة صباحية',
          name: 'وجبة خفيفة صباحية',
          foods: [
            { name: 'تفاح', amount: 150, calories: 78 }
          ]
        },
        {
          type: 'غداء',
          name: 'غداء متوازن',
          foods: [
            { name: 'صدر دجاج', amount: 150, calories: 248 },
            { name: 'خضروات متنوعة', amount: 200, calories: 50 },
            { name: 'تمن بني', amount: 100, calories: 111 }
          ]
        },
        {
          type: 'وجبة خفيفة مسائية',
          name: 'وجبة خفيفة مسائية',
          foods: [
            { name: 'لبن كانون', amount: 150, calories: 89 }
          ]
        },
        {
          type: 'عشاء',
          name: 'عشاء خفيف',
          foods: [
            { name: 'شوربة عدس', amount: 250, calories: 290 },
            { name: 'زلاطة', amount: 100, calories: 20 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'خطة يومية صحية - يوم 2',
      name_ar: 'خطة يومية صحية - يوم 2',
      description: 'خطة وجبات مع التركيز على الأسماك والخضروات',
      target_calories: 1800,
      meals: [
        {
          type: 'إفطار',
          name: 'إفطار بروتيني',
          foods: [
            { name: 'بيض', amount: 100, calories: 155 },
            { name: 'خبز أسمر', amount: 50, calories: 124 },
            { name: 'خيار', amount: 100, calories: 16 },
            { name: 'طماطم', amount: 100, calories: 18 }
          ]
        },
        {
          type: 'وجبة خفيفة صباحية',
          name: 'وجبة خفيفة صباحية',
          foods: [
            { name: 'لوز', amount: 15, calories: 87 }
          ]
        },
        {
          type: 'غداء',
          name: 'غداء بحري',
          foods: [
            { name: 'سمك', amount: 150, calories: 309 },
            { name: 'زلاطة', amount: 150, calories: 30 },
            { name: 'خبز أسمر', amount: 30, calories: 74 }
          ]
        },
        {
          type: 'وجبة خفيفة مسائية',
          name: 'وجبة خفيفة مسائية',
          foods: [
            { name: 'فراولة', amount: 100, calories: 32 }
          ]
        },
        {
          type: 'عشاء',
          name: 'عشاء خفيف',
          foods: [
            { name: 'تونة', amount: 100, calories: 132 },
            { name: 'زلاطة', amount: 150, calories: 30 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'خطة يومية صحية - يوم 3',
      name_ar: 'خطة يومية صحية - يوم 3',
      description: 'خطة وجبات مع التركيز على الألبان والبروتين النباتي',
      target_calories: 1900,
      meals: [
        {
          type: 'إفطار',
          name: 'إفطار لبنية',
          foods: [
            { name: 'لبنة', amount: 100, calories: 59 },
            { name: 'خبز أسمر', amount: 50, calories: 124 },
            { name: 'زيت زيتون', amount: 10, calories: 88 }
          ]
        },
        {
          type: 'وجبة خفيفة صباحية',
          name: 'وجبة خفيفة صباحية',
          foods: [
            { name: 'برتقال', amount: 150, calories: 71 }
          ]
        },
        {
          type: 'غداء',
          name: 'غداء متوازن',
          foods: [
            { name: 'لحم بقري', amount: 120, calories: 300 },
            { name: 'خضار شوي', amount: 200, calories: 50 },
            { name: 'برغل', amount: 100, calories: 83 }
          ]
        },
        {
          type: 'وجبة خفيفة مسائية',
          name: 'وجبة خفيفة مسائية',
          foods: [
            { name: 'لبن كانون', amount: 150, calories: 89 }
          ]
        },
        {
          type: 'عشاء',
          name: 'عشاء خفيف',
          foods: [
            { name: 'بيض', amount: 100, calories: 155 },
            { name: 'خضروات على البخار', amount: 150, calories: 38 }
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    loadMealTemplates();
    if (isPatient) {
      // إذا كان المستخدم مريض، تعيينه كمريض مختار تلقائياً
      setSelectedPatient({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone
      });
      setPatientId(user.id);
    } else {
      // إذا كان طبيب، تحميل قائمة المرضى
    loadPatients();
    }
  }, [isPatient, user]);

  const loadMealTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/meals/meal-templates/');
      if (response.data && response.data.templates) {
        setMealTemplates(response.data.templates);
      } else {
        // استخدام البيانات المحاكاة كبديل
        setMealTemplates(mockMealTemplates);
      }
    } catch (error) {
      console.error('خطأ في تحميل قوالب الوجبات:', error);
      // استخدام البيانات المحاكاة في حالة الخطأ
      setMealTemplates(mockMealTemplates);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get('/api/meals/patients/');
      if (response.data && response.data.patients) {
        setPatients(response.data.patients);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('خطأ في تحميل قائمة المرضى:', error);
      setError('فشل في تحميل قائمة المرضى.');
      setPatients([]);
    }
  };

  const selectPatient = (patient) => {
    console.log('Selecting patient:', patient);
    try {
      setSelectedPatient(patient);
      setPatientId(patient.id);
      console.log('Patient selected successfully:', patient.id);
      loadPatientMealPlans(patient.id);
    } catch (error) {
      console.error('Error selecting patient:', error);
    }
  };

  const loadPatientMealPlans = async (patientId) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/meals/meal-plans/?patient=${patientId}`);
      setPatientMealPlans(response.data.results || []);
      setShowMealPlans(true);
    } catch (error) {
      console.error('خطأ في تحميل خطط الوجبات:', error);
      setError('فشل في تحميل خطط الوجبات');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    calculateNutrition(template);
  };

  // دالة لإنشاء وجبات مختلفة تماماً لكل يوم
  const createCompletelyDifferentMeals = (dietType, day) => {
    // قوالب وجبات مختلفة تماماً لكل يوم
    const dailyMealTemplates = {
      // النظام المتوسطي
      'متوسطي': [
        // اليوم 1 - فطور متوسطي تقليدي
        {
          name: 'فطور متوسطي تقليدي',
          ingredients: [
            { food_name_ar: 'خبز تنور', amount: 80, calories: 200, protein: 6, carbs: 40, fat: 2 },
            { food_name_ar: 'زيت زيتون', amount: 20, calories: 180, protein: 0, carbs: 0, fat: 20 },
            { food_name_ar: 'جبن أبيض', amount: 80, calories: 120, protein: 12, carbs: 2, fat: 8 },
            { food_name_ar: 'طماطم', amount: 60, calories: 15, protein: 1, carbs: 3, fat: 0 },
            { food_name_ar: 'خيار', amount: 40, calories: 8, protein: 0, carbs: 2, fat: 0 },
            { food_name_ar: 'زيتون أسود', amount: 15, calories: 25, protein: 0, carbs: 1, fat: 3 }
          ]
        },
        // اليوم 2 - فطور متوسطي صحي
        {
          name: 'فطور متوسطي صحي',
          ingredients: [
            { food_name_ar: 'خبز أسمر', amount: 70, calories: 175, protein: 7, carbs: 35, fat: 2 },
            { food_name_ar: 'أفوكادو', amount: 50, calories: 80, protein: 1, carbs: 4, fat: 7 },
            { food_name_ar: 'جبن فيتا', amount: 60, calories: 90, protein: 8, carbs: 1, fat: 6 },
            { food_name_ar: 'طماطم كرزية', amount: 80, calories: 20, protein: 1, carbs: 4, fat: 0 },
            { food_name_ar: 'خيار إنجليزي', amount: 50, calories: 10, protein: 0, carbs: 2, fat: 0 },
            { food_name_ar: 'زيتون أخضر', amount: 20, calories: 30, protein: 0, carbs: 1, fat: 3 }
          ]
        }
      ],
      // النظام الكيتو
      'كيتو': [
        // اليوم 1 - فطور كيتو تقليدي
        {
          name: 'فطور كيتو تقليدي',
          ingredients: [
            { food_name_ar: 'بيض مسلوق', amount: 100, calories: 155, protein: 13, carbs: 1, fat: 11 },
            { food_name_ar: 'جبن كريمي', amount: 50, calories: 150, protein: 3, carbs: 2, fat: 15 },
            { food_name_ar: 'زيت زيتون', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 },
            { food_name_ar: 'جوز عراقي', amount: 20, calories: 130, protein: 3, carbs: 2, fat: 13 },
            { food_name_ar: 'زيتون أسود', amount: 25, calories: 40, protein: 0, carbs: 1, fat: 4 }
          ]
        },
        // اليوم 2 - فطور كيتو صحي
        {
          name: 'فطور كيتو صحي',
          ingredients: [
            { food_name_ar: 'أومليت بالجبن', amount: 120, calories: 200, protein: 16, carbs: 2, fat: 15 },
            { food_name_ar: 'أفوكادو', amount: 60, calories: 96, protein: 1, carbs: 5, fat: 9 },
            { food_name_ar: 'لوز محمص', amount: 25, calories: 150, protein: 6, carbs: 3, fat: 13 },
            { food_name_ar: 'زيت جوز الهند', amount: 10, calories: 90, protein: 0, carbs: 0, fat: 10 },
            { food_name_ar: 'جبن شيدر', amount: 40, calories: 160, protein: 10, carbs: 1, fat: 13 }
          ]
        }
      ],
      // النظام البروتيني
      'بروتينية': [
        // اليوم 1 - فطور بروتيني تقليدي
        {
          name: 'فطور بروتيني تقليدي',
          ingredients: [
            { food_name_ar: 'بيض مسلوق', amount: 150, calories: 233, protein: 20, carbs: 2, fat: 16 },
            { food_name_ar: 'جبن أبيض', amount: 100, calories: 150, protein: 15, carbs: 2, fat: 10 },
            { food_name_ar: 'خبز تنور', amount: 60, calories: 150, protein: 5, carbs: 30, fat: 1 },
            { food_name_ar: 'زيت زيتون', amount: 10, calories: 90, protein: 0, carbs: 0, fat: 10 },
            { food_name_ar: 'طماطم', amount: 50, calories: 12, protein: 1, carbs: 2, fat: 0 }
          ]
        },
        // اليوم 2 - فطور بروتيني صحي
        {
          name: 'فطور بروتيني صحي',
          ingredients: [
            { food_name_ar: 'دجاج مشوي', amount: 80, calories: 160, protein: 30, carbs: 0, fat: 4 },
            { food_name_ar: 'جبن ريكوتا', amount: 80, calories: 120, protein: 12, carbs: 4, fat: 8 },
            { food_name_ar: 'خبز أسمر', amount: 50, calories: 125, protein: 5, carbs: 25, fat: 1 },
            { food_name_ar: 'لبن عراقي', amount: 100, calories: 60, protein: 6, carbs: 4, fat: 3 },
            { food_name_ar: 'جوز عراقي', amount: 15, calories: 98, protein: 2, carbs: 1, fat: 10 }
          ]
        }
      ]
    };

    // الحصول على قوالب الوجبات للنظام الغذائي المحدد
    const dietTypeLower = dietType.toLowerCase();
    let selectedDiet = 'متوسطي'; // افتراضي
    
    if (dietTypeLower.includes('كيتو') || dietTypeLower.includes('keto')) {
      selectedDiet = 'كيتو';
    } else if (dietTypeLower.includes('بروتينية') || dietTypeLower.includes('protein') || dietTypeLower.includes('عالي البروتين') || dietTypeLower.includes('high_protein')) {
      selectedDiet = 'بروتينية';
    } else if (dietTypeLower.includes('متوسطي') || dietTypeLower.includes('mediterranean')) {
      selectedDiet = 'متوسطي';
    }

    const dietTemplates = dailyMealTemplates[selectedDiet] || dailyMealTemplates['متوسطي'];
    const templateIndex = (day - 1) % dietTemplates.length;
    
    return dietTemplates[templateIndex];
  };

  // دالة لتوليد الوجبات اليومية المختلفة تماماً
  const generateDailyMealVariations = (dietType, days) => {
    const variations = [];
    
    console.log('generateDailyMealVariations called with:', { dietType, days, startDate });
    
    // قوالب وجبات مختلفة تماماً لكل يوم
    const dailyMealSets = {
      // النظام المتوسطي
      'متوسطي': [
        // اليوم 1
        [
          {
            name: 'فطور متوسطي تقليدي',
            ingredients: [
              { food_name_ar: 'خبز تنور', amount: 80, calories: 200, protein: 6, carbs: 40, fat: 2 },
              { food_name_ar: 'زيت زيتون', amount: 20, calories: 180, protein: 0, carbs: 0, fat: 20 },
              { food_name_ar: 'جبن أبيض', amount: 80, calories: 120, protein: 12, carbs: 2, fat: 8 },
              { food_name_ar: 'طماطم', amount: 60, calories: 15, protein: 1, carbs: 3, fat: 0 },
              { food_name_ar: 'خيار', amount: 40, calories: 8, protein: 0, carbs: 2, fat: 0 }
            ]
          },
          {
            name: 'غداء متوسطي تقليدي',
            ingredients: [
              { food_name_ar: 'سمك مشوي', amount: 150, calories: 300, protein: 45, carbs: 0, fat: 12 },
              { food_name_ar: 'رز بسمتي', amount: 120, calories: 400, protein: 8, carbs: 80, fat: 2 },
              { food_name_ar: 'خضار مشكلة', amount: 150, calories: 60, protein: 3, carbs: 12, fat: 1 },
              { food_name_ar: 'زيت زيتون', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 }
            ]
          },
          {
            name: 'عشاء متوسطي تقليدي',
            ingredients: [
              { food_name_ar: 'دجاج مشوي', amount: 120, calories: 240, protein: 36, carbs: 0, fat: 8 },
              { food_name_ar: 'خضار مطبوخة', amount: 120, calories: 48, protein: 2, carbs: 10, fat: 1 },
              { food_name_ar: 'لبن رائب', amount: 150, calories: 90, protein: 9, carbs: 6, fat: 5 }
            ]
          },
          {
            name: 'وجبة خفيفة متوسطية',
            ingredients: [
              { food_name_ar: 'جوز عراقي', amount: 20, calories: 130, protein: 3, carbs: 2, fat: 13 },
              { food_name_ar: 'فواكه طازجة', amount: 100, calories: 50, protein: 1, carbs: 12, fat: 0 }
            ]
          },
          {
            name: 'وجبة مسائية متوسطية',
            ingredients: [
              { food_name_ar: 'كباب عراقي', amount: 100, calories: 250, protein: 25, carbs: 5, fat: 15 },
              { food_name_ar: 'خضار طازجة', amount: 80, calories: 32, protein: 2, carbs: 6, fat: 1 }
            ]
          }
        ],
        // اليوم 2
        [
          {
            name: 'فطور متوسطي صحي',
            ingredients: [
              { food_name_ar: 'خبز أسمر', amount: 70, calories: 175, protein: 7, carbs: 35, fat: 2 },
              { food_name_ar: 'أفوكادو', amount: 50, calories: 80, protein: 1, carbs: 4, fat: 7 },
              { food_name_ar: 'جبن فيتا', amount: 60, calories: 90, protein: 8, carbs: 1, fat: 6 },
              { food_name_ar: 'طماطم كرزية', amount: 80, calories: 20, protein: 1, carbs: 4, fat: 0 }
            ]
          },
          {
            name: 'غداء متوسطي صحي',
            ingredients: [
              { food_name_ar: 'دجاج بالفرن', amount: 140, calories: 280, protein: 42, carbs: 0, fat: 10 },
              { food_name_ar: 'رز بني', amount: 100, calories: 350, protein: 7, carbs: 70, fat: 3 },
              { food_name_ar: 'خضار مشوية', amount: 130, calories: 52, protein: 3, carbs: 10, fat: 1 },
              { food_name_ar: 'زيتون أخضر', amount: 25, calories: 40, protein: 0, carbs: 1, fat: 4 }
            ]
          },
          {
            name: 'عشاء متوسطي صحي',
            ingredients: [
              { food_name_ar: 'سمك بالفرن', amount: 130, calories: 260, protein: 39, carbs: 0, fat: 10 },
              { food_name_ar: 'خضار مسلوقة', amount: 110, calories: 44, protein: 2, carbs: 9, fat: 1 },
              { food_name_ar: 'لبن عراقي', amount: 120, calories: 72, protein: 7, carbs: 5, fat: 4 }
            ]
          },
          {
            name: 'وجبة خفيفة صحية',
            ingredients: [
              { food_name_ar: 'لوز محمص', amount: 25, calories: 150, protein: 6, carbs: 3, fat: 13 },
              { food_name_ar: 'عسل طبيعي', amount: 15, calories: 60, protein: 0, carbs: 15, fat: 0 }
            ]
          },
          {
            name: 'وجبة مسائية صحية',
            ingredients: [
              { food_name_ar: 'كباب بالخضار', amount: 90, calories: 225, protein: 22, carbs: 8, fat: 12 },
              { food_name_ar: 'سلطة خضار', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 }
            ]
          }
        ]
      ],
      // النظام الكيتو
      'كيتو': [
        // اليوم 1
        [
          {
            name: 'فطور كيتو تقليدي',
            ingredients: [
              { food_name_ar: 'بيض مسلوق', amount: 100, calories: 155, protein: 13, carbs: 1, fat: 11 },
              { food_name_ar: 'جبن كريمي', amount: 50, calories: 150, protein: 3, carbs: 2, fat: 15 },
              { food_name_ar: 'زيت زيتون', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 },
              { food_name_ar: 'جوز عراقي', amount: 20, calories: 130, protein: 3, carbs: 2, fat: 13 }
            ]
          },
          {
            name: 'غداء كيتو تقليدي',
            ingredients: [
              { food_name_ar: 'لحم مشوي', amount: 150, calories: 375, protein: 45, carbs: 0, fat: 20 },
              { food_name_ar: 'خضار مشكلة', amount: 200, calories: 80, protein: 4, carbs: 16, fat: 1 },
              { food_name_ar: 'زيت زيتون', amount: 20, calories: 180, protein: 0, carbs: 0, fat: 20 }
            ]
          },
          {
            name: 'عشاء كيتو تقليدي',
            ingredients: [
              { food_name_ar: 'سمك مشوي', amount: 120, calories: 240, protein: 36, carbs: 0, fat: 10 },
              { food_name_ar: 'خضار مطبوخة', amount: 150, calories: 60, protein: 3, carbs: 12, fat: 1 },
              { food_name_ar: 'جبن أبيض', amount: 60, calories: 90, protein: 9, carbs: 1, fat: 6 }
            ]
          },
          {
            name: 'وجبة خفيفة كيتو',
            ingredients: [
              { food_name_ar: 'جوز عراقي', amount: 25, calories: 163, protein: 4, carbs: 3, fat: 16 },
              { food_name_ar: 'جبن كريمي', amount: 40, calories: 120, protein: 2, carbs: 2, fat: 12 }
            ]
          },
          {
            name: 'وجبة مسائية كيتو',
            ingredients: [
              { food_name_ar: 'كباب عراقي', amount: 100, calories: 250, protein: 25, carbs: 5, fat: 15 },
              { food_name_ar: 'خضار طازجة', amount: 80, calories: 32, protein: 2, carbs: 6, fat: 1 }
            ]
          }
        ],
        // اليوم 2
        [
          {
            name: 'فطور كيتو صحي',
            ingredients: [
              { food_name_ar: 'أومليت بالجبن', amount: 120, calories: 200, protein: 16, carbs: 2, fat: 15 },
              { food_name_ar: 'أفوكادو', amount: 60, calories: 96, protein: 1, carbs: 5, fat: 9 },
              { food_name_ar: 'لوز محمص', amount: 25, calories: 150, protein: 6, carbs: 3, fat: 13 }
            ]
          },
          {
            name: 'غداء كيتو صحي',
            ingredients: [
              { food_name_ar: 'دجاج بالفرن', amount: 140, calories: 280, protein: 42, carbs: 0, fat: 10 },
              { food_name_ar: 'خضار مشوية', amount: 180, calories: 72, protein: 4, carbs: 14, fat: 1 },
              { food_name_ar: 'زيت جوز الهند', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 }
            ]
          },
          {
            name: 'عشاء كيتو صحي',
            ingredients: [
              { food_name_ar: 'سمك بالفرن', amount: 130, calories: 260, protein: 39, carbs: 0, fat: 10 },
              { food_name_ar: 'خضار مسلوقة', amount: 160, calories: 64, protein: 3, carbs: 13, fat: 1 },
              { food_name_ar: 'جبن شيدر', amount: 50, calories: 200, protein: 12, carbs: 1, fat: 16 }
            ]
          },
          {
            name: 'وجبة خفيفة صحية',
            ingredients: [
              { food_name_ar: 'فستق محمص', amount: 20, calories: 120, protein: 4, carbs: 2, fat: 10 },
              { food_name_ar: 'جبن ريكوتا', amount: 60, calories: 90, protein: 9, carbs: 3, fat: 6 }
            ]
          },
          {
            name: 'وجبة مسائية صحية',
            ingredients: [
              { food_name_ar: 'كباب بالتوابل', amount: 90, calories: 225, protein: 22, carbs: 8, fat: 12 },
              { food_name_ar: 'سلطة خضار', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 }
            ]
          }
        ],
        // اليوم 3 - وجبات متنوعة
        [
          {
            name: 'فطور متوسطي متنوع',
            ingredients: [
              { food_name_ar: 'خبز كامل', amount: 75, calories: 188, protein: 6, carbs: 38, fat: 2 },
              { food_name_ar: 'جبن موزاريلا', amount: 70, calories: 105, protein: 10, carbs: 1, fat: 7 },
              { food_name_ar: 'زيت السمسم', amount: 18, calories: 162, protein: 0, carbs: 0, fat: 18 },
              { food_name_ar: 'طماطم مجففة', amount: 40, calories: 20, protein: 1, carbs: 4, fat: 0 },
              { food_name_ar: 'خيار لبناني', amount: 45, calories: 9, protein: 0, carbs: 2, fat: 0 }
            ]
          },
          {
            name: 'غداء متوسطي متنوع',
            ingredients: [
              { food_name_ar: 'سمك بالفرن', amount: 160, calories: 320, protein: 48, carbs: 0, fat: 12 },
              { food_name_ar: 'رز بري', amount: 110, calories: 385, protein: 7, carbs: 77, fat: 2 },
              { food_name_ar: 'خضار عراقية', amount: 140, calories: 56, protein: 3, carbs: 11, fat: 1 },
              { food_name_ar: 'زيتون أسود', amount: 30, calories: 50, protein: 0, carbs: 2, fat: 5 }
            ]
          },
          {
            name: 'عشاء متوسطي متنوع',
            ingredients: [
              { food_name_ar: 'دجاج بالكاري', amount: 130, calories: 260, protein: 39, carbs: 0, fat: 9 },
              { food_name_ar: 'خضار مسلوقة', amount: 130, calories: 52, protein: 2, carbs: 11, fat: 1 },
              { food_name_ar: 'لبن بالفواكه', amount: 140, calories: 84, protein: 8, carbs: 7, fat: 5 }
            ]
          },
          {
            name: 'وجبة خفيفة متنوعة',
            ingredients: [
              { food_name_ar: 'فستق محمص', amount: 25, calories: 150, protein: 5, carbs: 3, fat: 13 },
              { food_name_ar: 'عسل بالليمون', amount: 20, calories: 80, protein: 0, carbs: 20, fat: 0 }
            ]
          },
          {
            name: 'وجبة مسائية متنوعة',
            ingredients: [
              { food_name_ar: 'كباب بالرز', amount: 95, calories: 238, protein: 24, carbs: 6, fat: 14 },
              { food_name_ar: 'سلطة خضار', amount: 90, calories: 36, protein: 2, carbs: 7, fat: 1 }
            ]
          }
        ],
        // اليوم 3 - وجبات كيتو متنوعة
        [
          {
            name: 'فطور كيتو متنوع',
            ingredients: [
              { food_name_ar: 'بيض مقلي', amount: 120, calories: 186, protein: 16, carbs: 1, fat: 13 },
              { food_name_ar: 'جبن شيدر', amount: 60, calories: 240, protein: 15, carbs: 1, fat: 20 },
              { food_name_ar: 'زيت جوز الهند', amount: 12, calories: 108, protein: 0, carbs: 0, fat: 12 },
              { food_name_ar: 'لوز عراقي', amount: 25, calories: 163, protein: 4, carbs: 3, fat: 16 }
            ]
          },
          {
            name: 'غداء كيتو متنوع',
            ingredients: [
              { food_name_ar: 'لحم بالفرن', amount: 160, calories: 400, protein: 48, carbs: 0, fat: 22 },
              { food_name_ar: 'خضار مشوية', amount: 200, calories: 80, protein: 4, carbs: 16, fat: 1 },
              { food_name_ar: 'زيت زيتون', amount: 25, calories: 225, protein: 0, carbs: 0, fat: 25 }
            ]
          },
          {
            name: 'عشاء كيتو متنوع',
            ingredients: [
              { food_name_ar: 'سمك بالبهارات', amount: 140, calories: 280, protein: 42, carbs: 0, fat: 12 },
              { food_name_ar: 'خضار مطبوخة', amount: 170, calories: 68, protein: 3, carbs: 14, fat: 1 },
              { food_name_ar: 'جبن ريكوتا', amount: 70, calories: 105, protein: 10, carbs: 4, fat: 7 }
            ]
          },
          {
            name: 'وجبة خفيفة متنوعة',
            ingredients: [
              { food_name_ar: 'فستق عراقي', amount: 25, calories: 150, protein: 5, carbs: 3, fat: 13 },
              { food_name_ar: 'جبن كريمي', amount: 45, calories: 135, protein: 3, carbs: 2, fat: 14 }
            ]
          },
          {
            name: 'وجبة مسائية متنوعة',
            ingredients: [
              { food_name_ar: 'كباب بالخضار', amount: 105, calories: 263, protein: 26, carbs: 9, fat: 14 },
              { food_name_ar: 'خضار طازجة', amount: 85, calories: 34, protein: 2, carbs: 7, fat: 1 }
            ]
          }
        ]
      ],
      // النظام البروتيني
      'بروتينية': [
        // اليوم 1
        [
          {
            name: 'فطور بروتيني تقليدي',
            ingredients: [
              { food_name_ar: 'بيض مسلوق', amount: 150, calories: 233, protein: 20, carbs: 2, fat: 16 },
              { food_name_ar: 'جبن أبيض', amount: 100, calories: 150, protein: 15, carbs: 2, fat: 10 },
              { food_name_ar: 'خبز تنور', amount: 60, calories: 150, protein: 5, carbs: 30, fat: 1 },
              { food_name_ar: 'زيت زيتون', amount: 10, calories: 90, protein: 0, carbs: 0, fat: 10 }
            ]
          },
          {
            name: 'غداء بروتيني تقليدي',
            ingredients: [
              { food_name_ar: 'دجاج مشوي', amount: 180, calories: 360, protein: 54, carbs: 0, fat: 12 },
              { food_name_ar: 'رز بسمتي', amount: 100, calories: 350, protein: 7, carbs: 70, fat: 2 },
              { food_name_ar: 'خضار مشكلة', amount: 120, calories: 48, protein: 2, carbs: 10, fat: 1 },
              { food_name_ar: 'لبن عراقي', amount: 150, calories: 90, protein: 9, carbs: 6, fat: 5 }
            ]
          },
          {
            name: 'عشاء بروتيني تقليدي',
            ingredients: [
              { food_name_ar: 'لحم مشوي', amount: 140, calories: 350, protein: 42, carbs: 0, fat: 18 },
              { food_name_ar: 'خضار مطبوخة', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 },
              { food_name_ar: 'جبن ريكوتا', amount: 80, calories: 120, protein: 12, carbs: 4, fat: 8 }
            ]
          },
          {
            name: 'وجبة خفيفة بروتينية',
            ingredients: [
              { food_name_ar: 'جوز عراقي', amount: 30, calories: 195, protein: 5, carbs: 3, fat: 20 },
              { food_name_ar: 'جبن أبيض', amount: 60, calories: 90, protein: 9, carbs: 1, fat: 6 }
            ]
          },
          {
            name: 'وجبة مسائية بروتينية',
            ingredients: [
              { food_name_ar: 'كباب عراقي', amount: 120, calories: 300, protein: 30, carbs: 6, fat: 18 },
              { food_name_ar: 'خضار طازجة', amount: 80, calories: 32, protein: 2, carbs: 6, fat: 1 }
            ]
          }
        ],
        // اليوم 2
        [
          {
            name: 'فطور بروتيني صحي',
            ingredients: [
              { food_name_ar: 'دجاج مشوي', amount: 80, calories: 160, protein: 30, carbs: 0, fat: 4 },
              { food_name_ar: 'جبن ريكوتا', amount: 80, calories: 120, protein: 12, carbs: 4, fat: 8 },
              { food_name_ar: 'خبز أسمر', amount: 50, calories: 125, protein: 5, carbs: 25, fat: 1 },
              { food_name_ar: 'لبن عراقي', amount: 100, calories: 60, protein: 6, carbs: 4, fat: 3 }
            ]
          },
          {
            name: 'غداء بروتيني صحي',
            ingredients: [
              { food_name_ar: 'سمك مشوي', amount: 160, calories: 320, protein: 48, carbs: 0, fat: 12 },
              { food_name_ar: 'رز بني', amount: 80, calories: 280, protein: 6, carbs: 56, fat: 2 },
              { food_name_ar: 'خضار مشوية', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 },
              { food_name_ar: 'جبن أبيض', amount: 70, calories: 105, protein: 10, carbs: 1, fat: 7 }
            ]
          },
          {
            name: 'عشاء بروتيني صحي',
            ingredients: [
              { food_name_ar: 'لحم بالفرن', amount: 130, calories: 325, protein: 39, carbs: 0, fat: 17 },
              { food_name_ar: 'خضار مسلوقة', amount: 90, calories: 36, protein: 2, carbs: 7, fat: 1 },
              { food_name_ar: 'جبن شيدر', amount: 60, calories: 240, protein: 15, carbs: 1, fat: 20 }
            ]
          },
          {
            name: 'وجبة خفيفة صحية',
            ingredients: [
              { food_name_ar: 'لوز محمص', amount: 30, calories: 180, protein: 7, carbs: 4, fat: 16 },
              { food_name_ar: 'جبن كريمي', amount: 50, calories: 150, protein: 3, carbs: 2, fat: 15 }
            ]
          },
          {
            name: 'وجبة مسائية صحية',
            ingredients: [
              { food_name_ar: 'كباب بالخضار', amount: 110, calories: 275, protein: 27, carbs: 10, fat: 15 },
              { food_name_ar: 'سلطة خضار', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 }
            ]
          }
        ],
        // اليوم 3 - وجبات بروتينية متنوعة
        [
          {
            name: 'فطور بروتيني متنوع',
            ingredients: [
              { food_name_ar: 'أومليت بالجبن', amount: 140, calories: 233, protein: 19, carbs: 2, fat: 18 },
              { food_name_ar: 'جبن أبيض', amount: 90, calories: 135, protein: 14, carbs: 2, fat: 9 },
              { food_name_ar: 'خبز كامل', amount: 55, calories: 138, protein: 4, carbs: 28, fat: 1 },
              { food_name_ar: 'زيت زيتون', amount: 8, calories: 72, protein: 0, carbs: 0, fat: 8 }
            ]
          },
          {
            name: 'غداء بروتيني متنوع',
            ingredients: [
              { food_name_ar: 'لحم مفروم', amount: 170, calories: 425, protein: 51, carbs: 0, fat: 23 },
              { food_name_ar: 'رز بري', amount: 90, calories: 315, protein: 6, carbs: 63, fat: 2 },
              { food_name_ar: 'خضار مشكلة', amount: 110, calories: 44, protein: 2, carbs: 9, fat: 1 },
              { food_name_ar: 'لبن رائب', amount: 130, calories: 78, protein: 8, carbs: 5, fat: 4 }
            ]
          },
          {
            name: 'عشاء بروتيني متنوع',
            ingredients: [
              { food_name_ar: 'دجاج بالتوابل', amount: 150, calories: 300, protein: 45, carbs: 0, fat: 12 },
              { food_name_ar: 'خضار مطبوخة', amount: 95, calories: 38, protein: 2, carbs: 8, fat: 1 },
              { food_name_ar: 'جبن شيدر', amount: 70, calories: 280, protein: 17, carbs: 1, fat: 23 }
            ]
          },
          {
            name: 'وجبة خفيفة متنوعة',
            ingredients: [
              { food_name_ar: 'لوز محمص', amount: 35, calories: 210, protein: 8, carbs: 4, fat: 18 },
              { food_name_ar: 'جبن أبيض', amount: 70, calories: 105, protein: 10, carbs: 1, fat: 7 }
            ]
          },
          {
            name: 'وجبة مسائية متنوعة',
            ingredients: [
              { food_name_ar: 'كباب بالرز', amount: 115, calories: 288, protein: 29, carbs: 7, fat: 17 },
              { food_name_ar: 'خضار طازجة', amount: 85, calories: 34, protein: 2, carbs: 7, fat: 1 }
            ]
          }
        ]
      ],
      // النظام المتوازن
      'متوازن': [
        // اليوم 1
        [
          {
            name: 'فطور متوازن تقليدي',
            ingredients: [
              { food_name_ar: 'خبز تنور', amount: 80, calories: 200, protein: 6, carbs: 40, fat: 2 },
              { food_name_ar: 'جبن أبيض', amount: 80, calories: 120, protein: 12, carbs: 2, fat: 8 },
              { food_name_ar: 'زيت زيتون', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 },
              { food_name_ar: 'طماطم', amount: 60, calories: 15, protein: 1, carbs: 3, fat: 0 },
              { food_name_ar: 'خيار', amount: 40, calories: 8, protein: 0, carbs: 2, fat: 0 }
            ]
          },
          {
            name: 'غداء متوازن تقليدي',
            ingredients: [
              { food_name_ar: 'دجاج مشوي', amount: 150, calories: 300, protein: 45, carbs: 0, fat: 10 },
              { food_name_ar: 'رز بسمتي', amount: 120, calories: 400, protein: 8, carbs: 80, fat: 2 },
              { food_name_ar: 'خضار مشكلة', amount: 150, calories: 60, protein: 3, carbs: 12, fat: 1 },
              { food_name_ar: 'لبن عراقي', amount: 120, calories: 72, protein: 7, carbs: 5, fat: 4 }
            ]
          },
          {
            name: 'عشاء متوازن تقليدي',
            ingredients: [
              { food_name_ar: 'سمك مشوي', amount: 120, calories: 240, protein: 36, carbs: 0, fat: 10 },
              { food_name_ar: 'خضار مطبوخة', amount: 120, calories: 48, protein: 2, carbs: 10, fat: 1 },
              { food_name_ar: 'خبز أسمر', amount: 40, calories: 100, protein: 4, carbs: 20, fat: 1 }
            ]
          },
          {
            name: 'وجبة خفيفة متوازنة',
            ingredients: [
              { food_name_ar: 'فواكه طازجة', amount: 120, calories: 60, protein: 1, carbs: 15, fat: 0 },
              { food_name_ar: 'جوز عراقي', amount: 15, calories: 98, protein: 2, carbs: 1, fat: 10 }
            ]
          },
          {
            name: 'وجبة مسائية متوازنة',
            ingredients: [
              { food_name_ar: 'كباب عراقي', amount: 100, calories: 250, protein: 25, carbs: 5, fat: 15 },
              { food_name_ar: 'خضار طازجة', amount: 80, calories: 32, protein: 2, carbs: 6, fat: 1 }
            ]
          }
        ],
        // اليوم 2
        [
          {
            name: 'فطور متوازن صحي',
            ingredients: [
              { food_name_ar: 'خبز أسمر', amount: 70, calories: 175, protein: 7, carbs: 35, fat: 2 },
              { food_name_ar: 'جبن فيتا', amount: 60, calories: 90, protein: 8, carbs: 1, fat: 6 },
              { food_name_ar: 'زيت زيتون', amount: 12, calories: 108, protein: 0, carbs: 0, fat: 12 },
              { food_name_ar: 'طماطم كرزية', amount: 80, calories: 20, protein: 1, carbs: 4, fat: 0 }
            ]
          },
          {
            name: 'غداء متوازن صحي',
            ingredients: [
              { food_name_ar: 'لحم مشوي', amount: 140, calories: 350, protein: 42, carbs: 0, fat: 18 },
              { food_name_ar: 'رز بني', amount: 100, calories: 350, protein: 7, carbs: 70, fat: 3 },
              { food_name_ar: 'خضار مشوية', amount: 130, calories: 52, protein: 3, carbs: 10, fat: 1 },
              { food_name_ar: 'لبن رائب', amount: 100, calories: 60, protein: 6, carbs: 4, fat: 3 }
            ]
          },
          {
            name: 'عشاء متوازن صحي',
            ingredients: [
              { food_name_ar: 'دجاج بالفرن', amount: 110, calories: 220, protein: 33, carbs: 0, fat: 8 },
              { food_name_ar: 'خضار مسلوقة', amount: 110, calories: 44, protein: 2, carbs: 9, fat: 1 },
              { food_name_ar: 'خبز تنور', amount: 30, calories: 75, protein: 2, carbs: 15, fat: 1 }
            ]
          },
          {
            name: 'وجبة خفيفة صحية',
            ingredients: [
              { food_name_ar: 'لوز محمص', amount: 20, calories: 120, protein: 5, carbs: 2, fat: 10 },
              { food_name_ar: 'عسل طبيعي', amount: 10, calories: 40, protein: 0, carbs: 10, fat: 0 }
            ]
          },
          {
            name: 'وجبة مسائية صحية',
            ingredients: [
              { food_name_ar: 'كباب بالتوابل', amount: 90, calories: 225, protein: 22, carbs: 8, fat: 12 },
              { food_name_ar: 'سلطة خضار', amount: 100, calories: 40, protein: 2, carbs: 8, fat: 1 }
            ]
          }
        ],
        // اليوم 3 - وجبات متوازنة متنوعة
        [
          {
            name: 'فطور متوازن متنوع',
            ingredients: [
              { food_name_ar: 'خبز كامل', amount: 75, calories: 188, protein: 6, carbs: 38, fat: 2 },
              { food_name_ar: 'جبن موزاريلا', amount: 70, calories: 105, protein: 10, carbs: 1, fat: 7 },
              { food_name_ar: 'زيت السمسم', amount: 15, calories: 135, protein: 0, carbs: 0, fat: 15 },
              { food_name_ar: 'طماطم مجففة', amount: 50, calories: 25, protein: 1, carbs: 5, fat: 0 },
              { food_name_ar: 'خيار لبناني', amount: 45, calories: 9, protein: 0, carbs: 2, fat: 0 }
            ]
          },
          {
            name: 'غداء متوازن متنوع',
            ingredients: [
              { food_name_ar: 'لحم بالفرن', amount: 150, calories: 375, protein: 45, carbs: 0, fat: 20 },
              { food_name_ar: 'رز بري', amount: 110, calories: 385, protein: 7, carbs: 77, fat: 2 },
              { food_name_ar: 'خضار مشوية', amount: 140, calories: 56, protein: 3, carbs: 11, fat: 1 },
              { food_name_ar: 'لبن بالفواكه', amount: 120, calories: 72, protein: 7, carbs: 6, fat: 4 }
            ]
          },
          {
            name: 'عشاء متوازن متنوع',
            ingredients: [
              { food_name_ar: 'دجاج بالكاري', amount: 120, calories: 240, protein: 36, carbs: 0, fat: 8 },
              { food_name_ar: 'خضار مسلوقة', amount: 130, calories: 52, protein: 2, carbs: 11, fat: 1 },
              { food_name_ar: 'خبز أسمر', amount: 35, calories: 88, protein: 3, carbs: 18, fat: 1 }
            ]
          },
          {
            name: 'وجبة خفيفة متنوعة',
            ingredients: [
              { food_name_ar: 'فستق محمص', amount: 20, calories: 120, protein: 4, carbs: 2, fat: 10 },
              { food_name_ar: 'عسل بالليمون', amount: 15, calories: 60, protein: 0, carbs: 15, fat: 0 }
            ]
          },
          {
            name: 'وجبة مسائية متنوعة',
            ingredients: [
              { food_name_ar: 'كباب بالرز', amount: 100, calories: 250, protein: 25, carbs: 5, fat: 15 },
              { food_name_ar: 'سلطة خضار', amount: 90, calories: 36, protein: 2, carbs: 7, fat: 1 }
            ]
          }
        ]
      ]
    };

    // تحديد النظام الغذائي
    const dietTypeLower = dietType.toLowerCase();
    let selectedDiet = 'متوازن'; // افتراضي
    
    if (dietTypeLower.includes('كيتو') || dietTypeLower.includes('keto')) {
      selectedDiet = 'كيتو';
    } else if (dietTypeLower.includes('بروتينية') || dietTypeLower.includes('protein')) {
      selectedDiet = 'بروتينية';
    } else if (dietTypeLower.includes('متوسطي') || dietTypeLower.includes('mediterranean')) {
      selectedDiet = 'متوسطي';
    } else if (dietTypeLower.includes('متوازن') || dietTypeLower.includes('balanced')) {
      selectedDiet = 'متوازن';
    }

    const dietMealSets = dailyMealSets[selectedDiet] || dailyMealSets['متوسطي'];

    for (let day = 1; day <= days; day++) {
      // اختيار مجموعة وجبات مختلفة لكل يوم
      const mealSetIndex = (day - 1) % dietMealSets.length;
      const selectedMealSet = dietMealSets[mealSetIndex];
      
      // إنشاء وجبات مختلفة تماماً لكل يوم
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + (day - 1));
      
      console.log(`Day ${day}:`, { 
        startDate, 
        currentDate: currentDate.toISOString().split('T')[0],
        dateString: currentDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })
      });
      
      const dayVariation = {
        day: day,
        date: currentDate,
        dateString: currentDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          calendar: 'gregory'
        }),
        template: { name_ar: `${dietType} - اليوم ${day}`, name: `${dietType} - Day ${day}` },
        meals: selectedMealSet.map((meal, index) => ({
          ...meal,
          name: `${meal.name}`,
          day: day,
          template_name: `${dietType} - اليوم ${day}`,
          // إضافة معرف فريد لكل وجبة
          id: `day-${day}-meal-${index}`
        }))
      };
      variations.push(dayVariation);
    }
    
    return variations;
  };

  // دالة لحساب عدد الأيام بين تاريخين
  const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 لتضمين اليوم الأول
    return daysDiff;
  };

  // دالة لتوليد خطة الوجبات للفترة المحددة
  const generateMealPlanForDateRange = () => {
    if (!startDate || !endDate || !selectedTemplate) {
      alert('يرجى اختيار التاريخين وقالب الوجبات');
      return;
    }

    console.log('Generating meal plan with dates:', { startDate, endDate, selectedTemplate: selectedTemplate.name_ar });

    const days = calculateDaysBetween(startDate, endDate);
    if (days <= 0) {
      alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    if (days > 30) {
      alert('لا يمكن إنشاء خطة وجبات لأكثر من 30 يوم');
      return;
    }

    console.log('Calculated days:', days);

    const mealPlan = generateDailyMealVariations(selectedTemplate.name_ar || selectedTemplate.name, days);
    console.log('Generated meal plan:', mealPlan);
    setGeneratedMealPlan(mealPlan);
    setShowDateRange(true);
  };

  // دالة لتحديد الوجبات العراقية حسب نوع النظام الغذائي
  const getIraqiMealsByDietType = (templateName) => {
    const dietType = templateName?.toLowerCase() || '';
    
    if (dietType.includes('كيتو') || dietType.includes('keto')) {
      return {
        title: '🇮🇶 الوجبات العراقية الكيتو (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور كيتو عراقي',
            ingredients: ['خبز كيتو عراقي (50g)', 'جبن أبيض (100g)', 'زيت زيتون (20ml)', 'بيض مسلوق (2 حبة)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 380, protein: 25, carbs: 8, fat: 28 }
          },
          {
            name: '🍽️ غداء كيتو عراقي',
            ingredients: ['لحم مشوي (150g)', 'خضار مشكلة (120g)', 'زيت زيتون (15ml)', 'سلطة خضار (80g)', 'لبن رائب (100ml)'],
            nutrition: { calories: 520, protein: 45, carbs: 12, fat: 32 }
          },
          {
            name: '🌙 عشاء كيتو عراقي',
            ingredients: ['سمك مشوي (120g)', 'خضار مطبوخة (100g)', 'زيت زيتون (10ml)', 'جبن أبيض (60g)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 350, protein: 35, carbs: 6, fat: 20 }
          },
          {
            name: '🍯 وجبة خفيفة كيتو',
            ingredients: ['جوز عراقي (20g)', 'جبن كريمي (40g)', 'زيتون أسود (15g)', 'شاي بالحليب (100ml)'],
            nutrition: { calories: 280, protein: 12, carbs: 4, fat: 24 }
          },
          {
            name: '🌆 وجبة مسائية كيتو',
            ingredients: ['كباب عراقي (100g)', 'خضار طازجة (80g)', 'زيت زيتون (10ml)', 'لبن عراقي (80ml)'],
            nutrition: { calories: 320, protein: 28, carbs: 5, fat: 22 }
          }
        ]
      };
    } else if (dietType.includes('فقدان') || dietType.includes('weight_loss')) {
      return {
        title: '🇮🇶 الوجبات العراقية لإنقاص الوزن (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور خسارة وزن عراقي',
            ingredients: ['خبز تنور (60g)', 'جبن أبيض قليل الدسم (60g)', 'طماطم (40g)', 'خيار (30g)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 280, protein: 15, carbs: 35, fat: 8 }
          },
          {
            name: '🍽️ غداء خسارة وزن عراقي',
            ingredients: ['دجاج مشوي (100g)', 'رز بسمتي (80g)', 'خضار مشكلة (120g)', 'سلطة خضار (100g)'],
            nutrition: { calories: 450, protein: 35, carbs: 45, fat: 12 }
          },
          {
            name: '🌙 عشاء خسارة وزن عراقي',
            ingredients: ['شوربة عدس (150ml)', 'خبز صمون (40g)', 'خضار طازجة (80g)', 'لبن رائب (100ml)'],
            nutrition: { calories: 250, protein: 12, carbs: 35, fat: 6 }
          },
          {
            name: '🍯 وجبة خفيفة خسارة وزن',
            ingredients: ['فواكه طازجة (100g)', 'لبن قليل الدسم (150ml)', 'شاي عراقي (100ml)'],
            nutrition: { calories: 120, protein: 6, carbs: 20, fat: 2 }
          },
          {
            name: '🌆 وجبة مسائية خسارة وزن',
            ingredients: ['سمك مشوي (80g)', 'خضار مطبوخة (100g)', 'سلطة خضار (60g)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 200, protein: 20, carbs: 15, fat: 8 }
          }
        ]
      };
    } else if (dietType.includes('بروتينية') || dietType.includes('protein') || dietType.includes('عضلات') || dietType.includes('muscle') || dietType.includes('عالي البروتين') || dietType.includes('high_protein')) {
      return {
        title: '🇮🇶 الوجبات العراقية البروتينية (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور بروتيني عراقي',
            ingredients: ['بيض مسلوق (3 حبات)', 'جبن أبيض (100g)', 'خبز تنور (80g)', 'زيت زيتون (10ml)', 'طماطم (50g)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 450, protein: 35, carbs: 30, fat: 20 }
          },
          {
            name: '🍽️ غداء بروتيني عراقي',
            ingredients: ['لحم مشوي (150g)', 'رز بسمتي (100g)', 'خضار مشكلة (120g)', 'سلطة خضار (100g)', 'لبن رائب (100ml)'],
            nutrition: { calories: 650, protein: 55, carbs: 50, fat: 25 }
          },
          {
            name: '🌙 عشاء بروتيني عراقي',
            ingredients: ['سمك مشوي (120g)', 'خضار مطبوخة (100g)', 'جبن أبيض (60g)', 'خبز صمون (50g)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 420, protein: 40, carbs: 25, fat: 18 }
          },
          {
            name: '🍯 وجبة خفيفة بروتينية',
            ingredients: ['جوز عراقي (25g)', 'جبن كريمي (50g)', 'لبن عراقي (150ml)', 'شاي بالحليب (100ml)'],
            nutrition: { calories: 350, protein: 20, carbs: 15, fat: 25 }
          },
          {
            name: '🌆 وجبة مسائية بروتينية',
            ingredients: ['كباب عراقي (120g)', 'خضار طازجة (80g)', 'جبن أبيض (40g)', 'لبن عراقي (100ml)'],
            nutrition: { calories: 380, protein: 35, carbs: 20, fat: 22 }
          }
        ]
      };
    } else if (dietType.includes('زيادة') || dietType.includes('weight_gain')) {
      return {
        title: '🇮🇶 الوجبات العراقية لزيادة الوزن (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور زيادة وزن عراقي',
            ingredients: ['خبز تنور (120g)', 'جبن أبيض (100g)', 'زيت زيتون (20ml)', 'عسل طبيعي (15g)', 'شاي بالحليب (200ml)'],
            nutrition: { calories: 520, protein: 22, carbs: 55, fat: 25 }
          },
          {
            name: '🍽️ غداء زيادة وزن عراقي',
            ingredients: ['لحم مشوي (150g)', 'رز بسمتي (150g)', 'خضار مشكلة (100g)', 'مرق لحم (100ml)', 'خبز عراقي (80g)'],
            nutrition: { calories: 780, protein: 50, carbs: 85, fat: 28 }
          },
          {
            name: '🌙 عشاء زيادة وزن عراقي',
            ingredients: ['كباب عراقي (120g)', 'رز بسمتي (100g)', 'خضار مطبوخة (80g)', 'لبن عراقي (150ml)'],
            nutrition: { calories: 580, protein: 35, carbs: 60, fat: 22 }
          },
          {
            name: '🍯 وجبة خفيفة زيادة وزن',
            ingredients: ['حلاوة طحينية (60g)', 'جوز عراقي (25g)', 'عسل طبيعي (20g)', 'شاي بالحليب (150ml)'],
            nutrition: { calories: 420, protein: 10, carbs: 55, fat: 20 }
          },
          {
            name: '🌆 وجبة مسائية زيادة وزن',
            ingredients: ['دجاج مشوي (100g)', 'خبز تنور (100g)', 'زيت زيتون (15ml)', 'لبن عراقي (120ml)'],
            nutrition: { calories: 450, protein: 30, carbs: 45, fat: 20 }
          }
        ]
      };
    } else if (dietType.includes('متوسطي') || dietType.includes('mediterranean') || dietType.includes('متوسط')) {
      return {
        title: '🇮🇶 الوجبات العراقية المتوسطية (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور متوسطي عراقي',
            ingredients: ['خبز تنور (80g)', 'زيت زيتون (20ml)', 'جبن أبيض (80g)', 'طماطم (60g)', 'خيار (40g)', 'زيتون أسود (15g)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 450, protein: 20, carbs: 40, fat: 25 }
          },
          {
            name: '🍽️ غداء متوسطي عراقي',
            ingredients: ['سمك مشوي (150g)', 'رز بسمتي (120g)', 'خضار مشكلة (150g)', 'زيت زيتون (15ml)', 'سلطة خضار (100g)', 'ليمون (1 حبة)'],
            nutrition: { calories: 580, protein: 45, carbs: 60, fat: 20 }
          },
          {
            name: '🌙 عشاء متوسطي عراقي',
            ingredients: ['دجاج مشوي (120g)', 'خضار مطبوخة (120g)', 'زيت زيتون (10ml)', 'لبن رائب (150ml)', 'خبز صمون (50g)', 'زيتون أسود (20g)'],
            nutrition: { calories: 420, protein: 35, carbs: 30, fat: 18 }
          },
          {
            name: '🍯 وجبة خفيفة متوسطية',
            ingredients: ['جوز عراقي (20g)', 'فواكه طازجة (100g)', 'لبن عراقي (150ml)', 'عسل طبيعي (10g)', 'شاي عراقي (100ml)'],
            nutrition: { calories: 280, protein: 12, carbs: 35, fat: 12 }
          },
          {
            name: '🌆 وجبة مسائية متوسطية',
            ingredients: ['كباب عراقي (100g)', 'خضار طازجة (80g)', 'زيت زيتون (10ml)', 'جبن أبيض (60g)', 'خبز تنور (60g)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 380, protein: 30, carbs: 25, fat: 20 }
          }
        ]
      };
    } else if (dietType.includes('منخفض') || dietType.includes('low_carb') || dietType.includes('low_carbohydrate')) {
      return {
        title: '🇮🇶 الوجبات العراقية منخفضة الكربوهيدرات (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور منخفض الكربوهيدرات',
            ingredients: ['بيض مسلوق (3 حبات)', 'جبن أبيض (100g)', 'زيت زيتون (15ml)', 'طماطم (50g)', 'خيار (40g)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 380, protein: 30, carbs: 15, fat: 25 }
          },
          {
            name: '🍽️ غداء منخفض الكربوهيدرات',
            ingredients: ['لحم مشوي (150g)', 'خضار مشكلة (200g)', 'زيت زيتون (15ml)', 'سلطة خضار (120g)', 'جبن أبيض (60g)'],
            nutrition: { calories: 520, protein: 50, carbs: 20, fat: 30 }
          },
          {
            name: '🌙 عشاء منخفض الكربوهيدرات',
            ingredients: ['سمك مشوي (120g)', 'خضار مطبوخة (150g)', 'زيت زيتون (10ml)', 'لبن رائب (150ml)', 'جبن أبيض (50g)'],
            nutrition: { calories: 350, protein: 40, carbs: 12, fat: 18 }
          },
          {
            name: '🍯 وجبة خفيفة منخفضة الكربوهيدرات',
            ingredients: ['جوز عراقي (25g)', 'جبن كريمي (50g)', 'زيتون أسود (20g)', 'شاي عراقي (100ml)'],
            nutrition: { calories: 320, protein: 15, carbs: 8, fat: 28 }
          },
          {
            name: '🌆 وجبة مسائية منخفضة الكربوهيدرات',
            ingredients: ['كباب عراقي (100g)', 'خضار طازجة (100g)', 'زيت زيتون (10ml)', 'جبن أبيض (60g)', 'لبن عراقي (100ml)'],
            nutrition: { calories: 380, protein: 35, carbs: 10, fat: 25 }
          }
        ]
      };
    } else if (dietType.includes('سكري') || dietType.includes('diabetic') || dietType.includes('diabetes')) {
      return {
        title: '🇮🇶 الوجبات العراقية لمرضى السكري (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور مرضى السكري',
            ingredients: ['خبز تنور (60g)', 'جبن أبيض قليل الدسم (80g)', 'طماطم (50g)', 'خيار (40g)', 'زيت زيتون (10ml)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 320, protein: 18, carbs: 30, fat: 12 }
          },
          {
            name: '🍽️ غداء مرضى السكري',
            ingredients: ['دجاج مشوي (120g)', 'رز بسمتي (80g)', 'خضار مشكلة (150g)', 'سلطة خضار (100g)', 'زيت زيتون (10ml)'],
            nutrition: { calories: 480, protein: 40, carbs: 45, fat: 15 }
          },
          {
            name: '🌙 عشاء مرضى السكري',
            ingredients: ['سمك مشوي (100g)', 'خضار مطبوخة (120g)', 'لبن رائب (150ml)', 'خبز صمون (40g)', 'زيتون أسود (15g)'],
            nutrition: { calories: 350, protein: 30, carbs: 25, fat: 12 }
          },
          {
            name: '🍯 وجبة خفيفة مرضى السكري',
            ingredients: ['فواكه طازجة (100g)', 'لبن قليل الدسم (150ml)', 'جوز عراقي (10g)', 'شاي عراقي (100ml)'],
            nutrition: { calories: 180, protein: 8, carbs: 25, fat: 6 }
          },
          {
            name: '🌆 وجبة مسائية مرضى السكري',
            ingredients: ['كباب عراقي (80g)', 'خضار طازجة (80g)', 'جبن أبيض (50g)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 280, protein: 25, carbs: 15, fat: 15 }
          }
        ]
      };
    } else {
      // النظام المتوازن (افتراضي)
      return {
        title: '🇮🇶 الوجبات العراقية المتوازنة (5 وجبات)',
        meals: [
          {
            name: '🌅 فطور عراقي تقليدي',
            ingredients: ['خبز التنور (100g)', 'جبن أبيض عراقي (80g)', 'زيت زيتون (15ml)', 'طماطم طازجة (50g)', 'خيار (30g)', 'شاي عراقي (200ml)'],
            nutrition: { calories: 420, protein: 18, carbs: 45, fat: 18 }
          },
          {
            name: '🍽️ غداء عراقي أصيل',
            ingredients: ['رز بسمتي (150g)', 'دجاج مشوي (120g)', 'خضار مشكلة (100g)', 'مرق لحم (100ml)', 'سلطة خضار (80g)', 'خبز عراقي (50g)'],
            nutrition: { calories: 680, protein: 45, carbs: 75, fat: 22 }
          },
          {
            name: '🌙 عشاء عراقي خفيف',
            ingredients: ['شوربة عدس (200ml)', 'خبز صمون (60g)', 'لبن رائب (150ml)', 'خضار طازجة (60g)', 'زيتون أسود (20g)', 'تمر عراقي (3 حبات)'],
            nutrition: { calories: 380, protein: 16, carbs: 55, fat: 12 }
          },
          {
            name: '🍯 وجبة خفيفة عراقية',
            ingredients: ['حلاوة طحينية (40g)', 'جوز عراقي (15g)', 'شاي بالحليب (150ml)', 'بسكويت عراقي (25g)', 'عسل طبيعي (10g)'],
            nutrition: { calories: 320, protein: 8, carbs: 42, fat: 14 }
          },
          {
            name: '🌆 وجبة مسائية عراقية',
            ingredients: ['كباب عراقي (100g)', 'خبز تنور (80g)', 'بصل وطماطم (50g)', 'سلطة خضار (60g)', 'لبن عراقي (100ml)', 'شاي عراقي (150ml)'],
            nutrition: { calories: 450, protein: 28, carbs: 35, fat: 20 }
          }
        ]
      };
    }
  };

  const calculateNutrition = (template) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    console.log('Calculating nutrition for template:', template);

    if (template.meals) {
      template.meals.forEach(meal => {
        console.log('Processing meal:', meal);
        if (meal.ingredients) {
          meal.ingredients.forEach(ingredient => {
            console.log('Processing ingredient:', ingredient);
            
            // استخدام القيم المحسوبة مسبقاً من الـ API
            totalCalories += ingredient.calories || 0;
            totalProtein += ingredient.protein || 0;
            totalCarbs += ingredient.carbs || 0;
            totalFat += ingredient.fat || 0;
            totalFiber += ingredient.fiber || 0;
          });
        }
      });
    }

    const summary = {
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      total_fiber: Math.round(totalFiber * 10) / 10,
      target_calories: template.target_calories || 2000
    };

    console.log('Nutrition summary:', summary);
    setNutritionSummary(summary);
  };

  const getMealTypeIcon = (type) => {
    const icons = {
      'إفطار': '🌅',
      'وجبة خفيفة صباحية': '🍎',
      'غداء': '🍽️',
      'وجبة خفيفة مسائية': '🥜',
      'عشاء': '🌙'
    };
    return icons[type] || '🍴';
  };

  const getMealTypeId = (mealName) => {
    // تحديد نوع الوجبة بناءً على الاسم
    if (mealName.includes('فطور') || mealName.includes('breakfast')) {
      return 5; // breakfast
    } else if (mealName.includes('غداء') || mealName.includes('lunch')) {
      return 6; // lunch
    } else if (mealName.includes('عشاء') || mealName.includes('dinner')) {
      return 7; // dinner
    } else {
      return 8; // snack
    }
  };

  const saveMealPlan = async () => {
    if (!selectedTemplate || !selectedPatient) {
      alert('يرجى اختيار المريض والقالب أولاً');
      return;
    }
    
    setLoading(true);
    try {
      // إذا كان هناك خطة موجودة، حدث الوجبات
      if (selectedMealPlanId) {
        console.log('Updating existing meal plan:', selectedMealPlanId);
        
        // الحصول على الوجبات العراقية المقترحة
        const iraqiMeals = getIraqiMealsByDietType(selectedTemplate?.name_ar || selectedTemplate?.name);
        
        // تحويل الوجبات إلى التنسيق المطلوب
        const selectedMeals = iraqiMeals.meals.map((meal, index) => ({
          name: meal.name,
          meal_type_id: getMealTypeId(meal.name), // دالة للحصول على معرف نوع الوجبة
          day_of_week: 1, // الاثنين
          description: meal.name,
          instructions: 'اتبع التعليمات التقليدية للطبخ العراقي',
          prep_time: 30,
          ingredients: meal.ingredients.map(ingredient => {
            // تحليل المكون (مثال: "خبز التنور (100g)")
            const match = ingredient.match(/^(.+?)\s*\((\d+)(g|ml)\)$/);
            if (match) {
              return {
                food_name: match[1],
                amount: parseInt(match[2]),
                unit: match[3]
              };
            }
            return {
              food_name: ingredient,
              amount: 100,
              unit: 'g'
            };
          })
        }));
        
        console.log('Saving selected meals:', selectedMeals);
        
        // حفظ الوجبات المختارة
        const response = await api.post(`/api/meals/meal-plans/${selectedMealPlanId}/save-selected-meals/`, {
          selected_meals: selectedMeals
        });
        
        if (response.data) {
          const message = isPatient 
            ? `تم تحديث خطة الوجبات بنجاح لك!` 
            : `تم تحديث خطة الوجبات بنجاح للمريض: ${selectedPatient.name}!`;
          alert(message);
          console.log('تم تحديث خطة الوجبات:', response.data);
        }
      } else {
        // إنشاء خطة جديدة
        const today = new Date().toISOString().split('T')[0];
        const response = await api.post('/api/meals/meal-templates/create-plan/', {
          template_id: selectedTemplate.id,
          patient_id: selectedPatient.id,
          start_date: today
        });
        
        if (response.data) {
          const message = isPatient 
            ? `تم حفظ خطة الوجبات بنجاح لك!` 
            : `تم حفظ خطة الوجبات بنجاح للمريض: ${selectedPatient.name}!`;
          alert(message);
          console.log('تم إنشاء خطة الوجبات:', response.data);
        }
      }
      
      // إعادة تعيين الاختيارات
      try {
        resetSelections();
      } catch (error) {
        console.error('Error in resetSelections:', error);
      }
    } catch (error) {
      console.error('خطأ في حفظ خطة الوجبات:', error);
      alert('حدث خطأ في حفظ خطة الوجبات');
    } finally {
      setLoading(false);
    }
  };

  const resetSelections = () => {
    try {
      setSelectedTemplate(null);
      setSelectedPatient(null);
      setPatientId('');
      setNutritionSummary(null);
      console.log('Selections reset successfully');
    } catch (error) {
      console.error('Error resetting selections:', error);
    }
  };

  const getProgressBarWidth = (current, target) => {
    if (!target || target === 0) return '0%';
    const percentage = Math.min((current / target) * 100, 100);
    return `${percentage}%`;
  };

  const getProgressBarColor = (current, target) => {
    if (!target || target === 0) return { backgroundColor: '#e0e0e0' };
    const percentage = (current / target) * 100;
    
    if (percentage < 50) {
      return { backgroundColor: '#ff6b6b' }; // أحمر
    } else if (percentage < 80) {
      return { backgroundColor: '#ffa726' }; // برتقالي
    } else if (percentage <= 100) {
      return { backgroundColor: '#66bb6a' }; // أخضر
    } else {
      return { backgroundColor: '#ef5350' }; // أحمر داكن
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📅 مخطط الوجبات اليومية</h1>
        <p>
          {isPatient 
            ? 'اختر خطة وجبات يومية صحية ومتوازنة مناسبة لك' 
            : 'اختر المريض أولاً، ثم اختر خطة وجبات يومية صحية ومتوازنة'
          }
        </p>
        {selectedMealPlanId && (
          <div className="alert alert-info" style={{ marginTop: '20px' }}>
            <i className="fas fa-info-circle me-2"></i>
            <strong>تعديل خطة الوجبات:</strong> تم توجيهك هنا لتعديل خطة الوجبات المحددة. يمكنك الآن تعديل الوجبات العراقية لهذه الخطة.
          </div>
        )}
      </div>

      {/* قائمة المرضى - للطبيب فقط */}
      {!isPatient && (
      <div style={styles.card}>
        <h3>👥 اختيار المريض</h3>
        {loading && <div style={styles.loading}>جاري التحميل...</div>}
        {patients.length === 0 && !loading && (
          <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb', marginBottom: '20px' }}>
            <p><strong>⚠️ تحذير:</strong> لا توجد مرضى متاحين في النظام</p>
          </div>
        )}
        
          {patients.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                اختر المريض:
              </label>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const patientId = e.target.value;
                  if (patientId) {
                    const patient = patients.find(p => p.id === parseInt(patientId));
                    if (patient) {
                try {
                  selectPatient(patient);
                } catch (error) {
                  console.error('Error selecting patient:', error);
                      }
                    }
                  } else {
                    setSelectedPatient(null);
                    setPatientId(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- اختر المريض --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.email}
                  </option>
                ))}
              </select>
        </div>
          )}
        
        {selectedPatient && (
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #4caf50' }}>
            <h4>✅ المريض المختار: {selectedPatient.name}</h4>
            <p><strong>البريد الإلكتروني:</strong> {selectedPatient.email}</p>
            <p><strong>الهاتف:</strong> {selectedPatient.phone || 'غير محدد'}</p>
            <p><strong>معرف المريض:</strong> {selectedPatient.id}</p>
            <p>يمكنك الآن اختيار قالب الوجبة المناسب</p>
          </div>
        )}
      </div>
      )}

      {/* معلومات المريض - للمريض */}
      {isPatient && selectedPatient && (
        <div style={styles.card}>
          <h3>👤 معلوماتك الشخصية</h3>
          <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
            <h4>✅ مرحباً {selectedPatient.name}</h4>
            <p><strong>البريد الإلكتروني:</strong> {selectedPatient.email}</p>
            <p><strong>الهاتف:</strong> {selectedPatient.phone || 'غير محدد'}</p>
            <p>يمكنك الآن اختيار قالب الوجبة المناسب لك</p>
          </div>
        </div>
      )}

      {/* خطط الوجبات للمريض المختار */}
      {selectedPatient && showMealPlans && (
        <div style={styles.card}>
          <h3>📅 خطط الوجبات للمريض: {selectedPatient.name}</h3>
          {loading && <div style={styles.loading}>جاري تحميل خطط الوجبات...</div>}
          
          {patientMealPlans.length === 0 && !loading ? (
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
              <p><strong>⚠️ لا توجد خطط وجبات:</strong> هذا المريض لا يملك خطط وجبات حالياً</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {patientMealPlans.map((plan) => (
                <div key={plan.id} style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px', 
                  border: '1px solid #dee2e6' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#2c3e50' }}>📋 {
                      plan.title === 'weight_loss' ? 'إنقاص وزن' :
                      plan.title === 'weight_maintenance' ? 'تثبيت وزن' :
                      plan.title === 'weight_gain' ? 'زيادة وزن' :
                      plan.title === 'health_maintenance' ? 'الحفاظ على الصحة' :
                      plan.title === 'pregnant' ? 'حامل' :
                      plan.title === 'breastfeeding' ? 'مرضع' :
                      plan.title === 'diabetic' ? 'مرضى السكري' :
                      plan.title === 'keto' ? 'الكيتو' :
                      plan.title === 'balanced' ? 'المتوازن' :
                      plan.title === 'low_carb' ? 'منخفض الكربوهيدرات' :
                      plan.title === 'muscle_gain' ? 'بناء العضلات' :
                      plan.title === 'muscle_building' ? 'بناء العضلات' :
                      plan.title === 'high_protein' ? 'عالي البروتين' :
                      plan.title
                    }</h4>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: plan.is_active ? '#d4edda' : '#f8d7da',
                      color: plan.is_active ? '#155724' : '#721c24'
                    }}>
                      {plan.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>📅 من:</strong> {new Date(plan.start_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                    </p>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>📅 إلى:</strong> {new Date(plan.end_date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                    </p>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>🔥 السعرات المستهدفة:</strong> {plan.target_calories} سعرة/يوم
                    </p>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>🥩 البروتين:</strong> {plan.target_protein}g
                    </p>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>🍞 الكربوهيدرات:</strong> {plan.target_carbs}g
                    </p>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>
                      <strong>🥑 الدهون:</strong> {plan.target_fat}g
                    </p>
                  </div>
                  
                  {plan.description && (
                    <p style={{ margin: '10px 0', color: '#495057', fontSize: '14px' }}>
                      <strong>📝 الوصف:</strong> {plan.description}
                    </p>
                  )}
                  
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #dee2e6' }}>
                    <small style={{ color: '#6c757d' }}>
                      <strong>🕒 تم الإنشاء:</strong> {new Date(plan.created_at).toLocaleDateString('ar-SA', { calendar: 'gregory' })} في {new Date(plan.created_at).toLocaleTimeString('ar-SA')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.card}>
        <h3>🍽️ قوالب الوجبات المتاحة</h3>
        {!selectedPatient && !isPatient && (
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7', marginBottom: '20px' }}>
            <p><strong>⚠️ تنبيه:</strong> يرجى اختيار المريض أولاً من القائمة أعلاه</p>
          </div>
        )}
        {!selectedPatient && isPatient && (
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7', marginBottom: '20px' }}>
            <p><strong>⚠️ تنبيه:</strong> جاري تحميل معلوماتك الشخصية...</p>
          </div>
        )}
        {loading && <div style={styles.loading}>جاري التحميل...</div>}
        
        <div style={styles.grid}>
          {mealTemplates.map((template) => {
            // حساب القيم الغذائية الإجمالية للقالب
            const totalNutrition = template.meals ? template.meals.reduce((total, meal) => {
              if (meal.ingredients) {
                meal.ingredients.forEach(ingredient => {
                  const amount = ingredient.amount || 0;
                  const factor = amount / 100;
                  total.calories += (ingredient.calories || 0) * factor;
                  total.protein += (ingredient.protein || 0) * factor;
                  total.carbs += (ingredient.carbs || 0) * factor;
                  total.fat += (ingredient.fat || 0) * factor;
                  total.fiber += (ingredient.fiber || 0) * factor;
                });
              }
              return total;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }) : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

            return (
            <div 
              key={template.id}
              style={{
                ...styles.templateCard,
                ...(selectedTemplate?.id === template.id ? styles.templateCardSelected : {}),
                ...(!selectedPatient ? { opacity: 0.5, cursor: 'not-allowed' } : {})
              }}
              onClick={() => {
                if (selectedPatient) {
                  try {
                    selectTemplate(template);
                  } catch (error) {
                    console.error('Error selecting template:', error);
                  }
                }
              }}
            >
                <h4>🍽️ {template.name_ar || template.name}</h4>
                <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '15px' }}>
                  {template.description}
                </p>
                
                {/* القيم الغذائية الإجمالية */}
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  marginBottom: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '0.9em' }}>
                    📊 القيم الغذائية اليومية:
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '0.8em' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔥 السعرات:</span>
                      <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                        {Math.round(totalNutrition.calories)} سعرة
                      </span>
            </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🥩 البروتين:</span>
                      <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                        {Math.round(totalNutrition.protein * 10) / 10}g
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🍞 الكربوهيدرات:</span>
                      <span style={{ fontWeight: 'bold', color: '#f39c12' }}>
                        {Math.round(totalNutrition.carbs * 10) / 10}g
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🥑 الدهون:</span>
                      <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>
                        {Math.round(totalNutrition.fat * 10) / 10}g
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                      <span>🌾 الألياف:</span>
                      <span style={{ fontWeight: 'bold', color: '#16a085' }}>
                        {Math.round(totalNutrition.fiber * 10) / 10}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* معلومات إضافية */}
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>🎯 الهدف اليومي:</strong> {template.target_calories} سعرة حرارية
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>🍽️ عدد الوجبات:</strong> {template.meals ? template.meals.length : 0} وجبة
                  </p>
                  {template.meals && (
                    <p style={{ margin: '5px 0' }}>
                      <strong>📋 أنواع الوجبات:</strong> {template.meals.map(meal => meal.meal_type).join('، ')}
                    </p>
                  )}
                </div>

                {/* زر الاختيار */}
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  backgroundColor: selectedTemplate?.id === template.id ? '#28a745' : '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '0.9em',
                  fontWeight: 'bold'
                }}>
                  {selectedTemplate?.id === template.id ? '✅ مختار' : '👆 اضغط للاختيار'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTemplate && (
        <div style={styles.card}>
          <h3>جدول الوجبات: {selectedTemplate.name_ar || selectedTemplate.name}</h3>
          
          <div style={styles.mealSchedule}>
            {selectedTemplate.meals && selectedTemplate.meals.map((meal, index) => (
              <div key={index} style={styles.mealCard}>
                <div style={styles.mealTitle}>
                  {getMealTypeIcon(meal.meal_type)} {meal.meal_type}
                </div>
                <div>
                  <strong>{meal.name}</strong>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {meal.ingredients && meal.ingredients.map((ingredient, foodIndex) => (
                    <div key={foodIndex} style={styles.foodItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{ingredient.food_name}</span>
                        <span style={{ fontSize: '0.9em', color: '#666' }}>{ingredient.amount} جرام</span>
                      </div>
                          <div style={{ fontSize: '0.8em', color: '#555', marginTop: '5px' }}>
                            <span style={{ marginRight: '10px' }}>🔥 {Math.round(ingredient.calories || 0)} سعرة</span>
                            <span style={{ marginRight: '10px' }}>🥩 {Math.round((ingredient.protein || 0) * 10) / 10}ج بروتين</span>
                            <span style={{ marginRight: '10px' }}>🍞 {Math.round((ingredient.carbs || 0) * 10) / 10}ج كارب</span>
                            <span style={{ marginRight: '10px' }}>🥑 {Math.round((ingredient.fat || 0) * 10) / 10}ج دهون</span>
                            <span>🌾 {Math.round((ingredient.fiber || 0) * 10) / 10}ج ألياف</span>
                          </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* تحديد الفترة الزمنية */}
          <div style={styles.card}>
            <h3>📅 تحديد فترة خطة الوجبات</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              اختر الفترة الزمنية لإنشاء خطة وجبات يومية متنوعة لنفس النظام الغذائي
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  📅 تاريخ البداية:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  📅 تاريخ النهاية:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            
            {startDate && endDate && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '6px', border: '1px solid #4caf50' }}>
                <p style={{ margin: 0, color: '#2e7d32' }}>
                  <strong>📊 الفترة المحددة:</strong> {calculateDaysBetween(startDate, endDate)} يوم
                  <br />
                  <strong>من:</strong> {new Date(startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                  <br />
                  <strong>إلى:</strong> {new Date(endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
                </p>
              </div>
            )}
            
            <button
              onClick={generateMealPlanForDateRange}
              style={{
                ...styles.button,
                backgroundColor: '#28a745',
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              🍽️ إنشاء خطة الوجبات للفترة المحددة
            </button>
          </div>

          {/* عرض خطة الوجبات اليومية المولدة */}
          {showDateRange && generatedMealPlan && (
            <div style={styles.card}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px' }}>📅 خطة الوجبات اليومية للفترة المحددة</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                خطة وجبات يومية متنوعة لنظام {selectedTemplate?.name_ar || selectedTemplate?.name} 
                من {new Date(startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })} 
                إلى {new Date(endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}
              </p>
              
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {generatedMealPlan.map((dayPlan, dayIndex) => (
                  <div key={dayIndex} style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6' 
                  }}>
                    <h4 style={{ 
                      color: '#2c3e50', 
                      marginBottom: '15px', 
                      textAlign: 'center',
                      backgroundColor: '#e9ecef',
                      padding: '10px',
                      borderRadius: '6px'
                    }}>
                      📅 اليوم {dayPlan.day} - {dayPlan.dateString || dayPlan.date.toLocaleDateString('ar-SA', { 
                        calendar: 'gregory',
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    
                    {dayPlan.template && (
                      <div style={{ 
                        marginBottom: '15px', 
                        padding: '8px', 
                        backgroundColor: '#d4edda', 
                        borderRadius: '6px', 
                        border: '1px solid #4caf50',
                        textAlign: 'center'
                      }}>
                        <strong style={{ color: '#2e7d32' }}>
                          🍽️ قالب الوجبات: {dayPlan.template.name_ar || dayPlan.template.name}
                        </strong>
                        {dayPlan.template.description && (
                          <div style={{ fontSize: '0.9em', color: '#2e7d32', marginTop: '5px' }}>
                            {dayPlan.template.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                      {dayPlan.meals.map((meal, mealIndex) => (
                        <div key={mealIndex} style={{ 
                          backgroundColor: 'white', 
                          padding: '12px', 
                          borderRadius: '6px', 
                          border: '1px solid #ddd' 
                        }}>
                          <h5 style={{ color: '#d84315', marginBottom: '8px', fontSize: '0.9em' }}>
                            {meal.name}
                          </h5>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ fontSize: '0.8em' }}>المكونات:</strong>
                            <ul style={{ margin: '5px 0', paddingRight: '15px', fontSize: '0.8em' }}>
                              {meal.ingredients && meal.ingredients.map((ingredient, idx) => (
                                <li key={idx}>
                                  {ingredient.food_name_ar || ingredient.food_name} - {ingredient.amount}g
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🔥 {Math.round(meal.ingredients ? meal.ingredients.reduce((total, ing) => total + (ing.calories || 0), 0) : 0)} سعرة</span>
                              <span>🥩 {Math.round((meal.ingredients ? meal.ingredients.reduce((total, ing) => total + (ing.protein || 0), 0) : 0) * 10) / 10}g</span>
                              <span>🍞 {Math.round((meal.ingredients ? meal.ingredients.reduce((total, ing) => total + (ing.carbs || 0), 0) : 0) * 10) / 10}g</span>
                              <span>🥑 {Math.round((meal.ingredients ? meal.ingredients.reduce((total, ing) => total + (ing.fat || 0), 0) : 0) * 10) / 10}g</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* ملخص اليوم */}
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: '#e8f5e8', 
                      borderRadius: '6px', 
                      border: '1px solid #4caf50' 
                    }}>
                      <h6 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>📊 ملخص اليوم {dayPlan.day}:</h6>
                      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9em', color: '#2e7d32' }}>
                        <span>🔥 {Math.round(dayPlan.meals.reduce((total, meal) => {
                          return total + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.calories || 0), 0) : 0);
                        }, 0))} سعرة</span>
                        <span>🥩 {Math.round((dayPlan.meals.reduce((total, meal) => {
                          return total + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.protein || 0), 0) : 0);
                        }, 0)) * 10) / 10}g بروتين</span>
                        <span>🍞 {Math.round((dayPlan.meals.reduce((total, meal) => {
                          return total + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.carbs || 0), 0) : 0);
                        }, 0)) * 10) / 10}g كربوهيدرات</span>
                        <span>🥑 {Math.round((dayPlan.meals.reduce((total, meal) => {
                          return total + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.fat || 0), 0) : 0);
                        }, 0)) * 10) / 10}g دهون</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ملخص الفترة الكاملة */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '8px', 
                border: '1px solid #ffc107' 
              }}>
                <h5 style={{ color: '#856404', marginBottom: '10px' }}>📈 ملخص الفترة الكاملة:</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '0.9em', color: '#856404' }}>
                  <div>
                    <strong>📅 عدد الأيام:</strong> {generatedMealPlan.length} يوم
                  </div>
                  <div>
                    <strong>🔥 متوسط السعرات:</strong> {Math.round(generatedMealPlan.reduce((total, day) => {
                      return total + day.meals.reduce((dayTotal, meal) => {
                        return dayTotal + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.calories || 0), 0) : 0);
                      }, 0);
                    }, 0) / generatedMealPlan.length)} سعرة/يوم
                  </div>
                  <div>
                    <strong>🥩 متوسط البروتين:</strong> {Math.round((generatedMealPlan.reduce((total, day) => {
                      return total + day.meals.reduce((dayTotal, meal) => {
                        return dayTotal + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.protein || 0), 0) : 0);
                      }, 0);
                    }, 0) / generatedMealPlan.length) * 10) / 10}g/يوم
                  </div>
                  <div>
                    <strong>🍞 متوسط الكربوهيدرات:</strong> {Math.round((generatedMealPlan.reduce((total, day) => {
                      return total + day.meals.reduce((dayTotal, meal) => {
                        return dayTotal + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.carbs || 0), 0) : 0);
                      }, 0);
                    }, 0) / generatedMealPlan.length) * 10) / 10}g/يوم
                  </div>
                  <div>
                    <strong>🥑 متوسط الدهون:</strong> {Math.round((generatedMealPlan.reduce((total, day) => {
                      return total + day.meals.reduce((dayTotal, meal) => {
                        return dayTotal + (meal.ingredients ? meal.ingredients.reduce((mealTotal, ing) => mealTotal + (ing.fat || 0), 0) : 0);
                      }, 0);
                    }, 0) / generatedMealPlan.length) * 10) / 10}g/يوم
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الوجبات العراقية المقترحة */}
          {(() => {
            const iraqiMeals = getIraqiMealsByDietType(selectedTemplate?.name_ar || selectedTemplate?.name);
            const totalNutrition = iraqiMeals.meals.reduce((total, meal) => ({
              calories: total.calories + meal.nutrition.calories,
              protein: total.protein + meal.nutrition.protein,
              carbs: total.carbs + meal.nutrition.carbs,
              fat: total.fat + meal.nutrition.fat
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

            return (
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff8e1', borderRadius: '10px', border: '2px solid #ffb74d' }}>
                <h3 style={{ color: '#e65100', marginBottom: '20px', textAlign: 'center' }}>
                  {iraqiMeals.title}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  {iraqiMeals.meals.map((meal, index) => (
                    <div key={index} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <h4 style={{ color: '#d84315', marginBottom: '10px' }}>{meal.name}</h4>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>المكونات:</strong>
                        <ul style={{ margin: '5px 0', paddingRight: '20px' }}>
                          {meal.ingredients.map((ingredient, idx) => (
                            <li key={idx}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>🔥 السعرات: {meal.nutrition.calories}</span>
                          <span>🥩 البروتين: {meal.nutrition.protein}g</span>
                          <span>🍞 الكربوهيدرات: {meal.nutrition.carbs}g</span>
                          <span>🥑 الدهون: {meal.nutrition.fat}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ملخص الوجبات العراقية المخصص للمريض */}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #4caf50' }}>
                  <h4 style={{ color: '#2e7d32', marginBottom: '10px' }}>📊 ملخص الوجبات العراقية المخصصة للمريض:</h4>
                  
                  {/* معلومات المريض والنظام الغذائي */}
                  <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8f0', borderRadius: '6px', border: '1px solid #4caf50' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.9em' }}>
                      <div>
                        <strong>👤 المريض:</strong> {selectedPatient?.name || 'غير محدد'}
                      </div>
                      <div>
                        <strong>🎯 النظام الغذائي:</strong> {selectedTemplate?.name_ar || selectedTemplate?.name || 'غير محدد'}
                      </div>
                      <div>
                        <strong>📅 السعرات المستهدفة:</strong> {selectedTemplate?.target_calories || 'غير محدد'} سعرة/يوم
                      </div>
                      <div>
                        <strong>🏃 مستوى النشاط:</strong> {selectedPatient?.activity_level || 'متوسط'}
                      </div>
                    </div>
                  </div>

                  {/* القيم الغذائية المطلوبة */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '0.9em' }}>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1.2em' }}>
                        {selectedTemplate?.target_calories || totalNutrition.calories}
                      </div>
                      <div>🔥 السعرات المطلوبة</div>
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                        (الوجبات: {totalNutrition.calories})
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '1.2em' }}>
                        {Math.round((selectedTemplate?.target_calories || 2000) * 0.25 / 4)}g
                      </div>
                      <div>🥩 البروتين المطلوب</div>
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                        (الوجبات: {totalNutrition.protein}g)
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#f39c12', fontSize: '1.2em' }}>
                        {Math.round((selectedTemplate?.target_calories || 2000) * 0.45 / 4)}g
                      </div>
                      <div>🍞 الكربوهيدرات المطلوبة</div>
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                        (الوجبات: {totalNutrition.carbs}g)
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#8e44ad', fontSize: '1.2em' }}>
                        {Math.round((selectedTemplate?.target_calories || 2000) * 0.30 / 9)}g
                      </div>
                      <div>🥑 الدهون المطلوبة</div>
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                        (الوجبات: {totalNutrition.fat}g)
                      </div>
                    </div>
                  </div>

                  {/* تحليل التوافق */}
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
                    <h5 style={{ color: '#856404', marginBottom: '8px' }}>📈 تحليل التوافق مع احتياجات المريض:</h5>
                    <div style={{ fontSize: '0.9em', color: '#856404' }}>
                      <div style={{ marginBottom: '5px' }}>
                        <strong>السعرات الحرارية:</strong> 
                        {totalNutrition.calories >= (selectedTemplate?.target_calories || 2000) * 0.9 ? 
                          ' ✅ متوافقة مع الهدف' : 
                          ' ⚠️ أقل من المطلوب'
                        }
                        ({Math.round((totalNutrition.calories / (selectedTemplate?.target_calories || 2000)) * 100)}% من الهدف)
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <strong>البروتين:</strong> 
                        {totalNutrition.protein >= Math.round((selectedTemplate?.target_calories || 2000) * 0.25 / 4) * 0.9 ? 
                          ' ✅ كافي' : 
                          ' ⚠️ يحتاج زيادة'
                        }
                        ({Math.round((totalNutrition.protein / Math.round((selectedTemplate?.target_calories || 2000) * 0.25 / 4)) * 100)}% من المطلوب)
                      </div>
                      <div>
                        <strong>التوازن الغذائي:</strong> 
                        {Math.abs(totalNutrition.calories - (selectedTemplate?.target_calories || 2000)) <= 200 ? 
                          ' ✅ متوازن' : 
                          ' ⚠️ يحتاج تعديل'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedTemplate && (() => {
            // استخدام قيم الوجبات العراقية إذا كانت متوفرة، وإلا استخدام nutritionSummary
            const iraqiMeals = getIraqiMealsByDietType(selectedTemplate?.name_ar || selectedTemplate?.name);
            const iraqiTotalNutrition = iraqiMeals.meals.reduce((total, meal) => ({
              calories: total.calories + meal.nutrition.calories,
              protein: total.protein + meal.nutrition.protein,
              carbs: total.carbs + meal.nutrition.carbs,
              fat: total.fat + meal.nutrition.fat,
              fiber: total.fiber + (meal.nutrition.fiber || 0)
            }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

            // استخدام قيم الوجبات العراقية كقيم افتراضية
            const displayNutrition = nutritionSummary && nutritionSummary.total_calories > 0 ? nutritionSummary : {
              total_calories: iraqiTotalNutrition.calories,
              total_protein: iraqiTotalNutrition.protein,
              total_carbs: iraqiTotalNutrition.carbs,
              total_fat: iraqiTotalNutrition.fat,
              total_fiber: iraqiTotalNutrition.fiber,
              target_calories: selectedTemplate?.target_calories || 2000
            };

            return (
            <div>
              <h4>ملخص القيم الغذائية اليومية</h4>
              
              <div style={styles.nutritionGrid}>
                <div style={styles.nutritionCard}>
                  <div style={styles.nutritionValue}>
                      {displayNutrition.total_calories}
                  </div>
                  <div style={styles.nutritionLabel}>سعرة حرارية</div>
                </div>
                
                <div style={styles.nutritionCard}>
                  <div style={styles.nutritionValue}>
                      {displayNutrition.total_protein}ج
                  </div>
                  <div style={styles.nutritionLabel}>بروتين</div>
                </div>
                
                <div style={styles.nutritionCard}>
                  <div style={styles.nutritionValue}>
                      {displayNutrition.total_carbs}ج
                  </div>
                  <div style={styles.nutritionLabel}>كربوهيدرات</div>
                </div>
                
                <div style={styles.nutritionCard}>
                  <div style={styles.nutritionValue}>
                      {displayNutrition.total_fat}ج
                  </div>
                  <div style={styles.nutritionLabel}>دهون</div>
                </div>
                
                <div style={styles.nutritionCard}>
                  <div style={styles.nutritionValue}>
                      {displayNutrition.total_fiber}ج
                  </div>
                  <div style={styles.nutritionLabel}>ألياف</div>
                </div>
              </div>

              <div style={styles.summary}>
                <h4>📊 تحليل الخطة الغذائية:</h4>
                <p>
                    <strong>إجمالي السعرات:</strong> {displayNutrition.total_calories} من أصل {displayNutrition.target_calories} سعرة حرارية
                </p>
                <p>
                    <strong>نسبة الهدف:</strong> {Math.round((displayNutrition.total_calories / displayNutrition.target_calories) * 100)}%
                </p>
                <p>
                  <strong>التوزيع الغذائي:</strong> 
                    البروتين {displayNutrition.total_calories > 0 ? Math.round((displayNutrition.total_protein * 4 / displayNutrition.total_calories) * 100) : 0}% | 
                    الكربوهيدرات {displayNutrition.total_calories > 0 ? Math.round((displayNutrition.total_carbs * 4 / displayNutrition.total_calories) * 100) : 0}% | 
                    الدهون {displayNutrition.total_calories > 0 ? Math.round((displayNutrition.total_fat * 9 / displayNutrition.total_calories) * 100) : 0}%
                </p>
              </div>
              
                {/* تفاصيل إضافية للقيم الغذائية */}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h5>🔍 تفاصيل القيم الغذائية:</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div style={styles.nutritionDetail}>
                      <strong>السعرات الحرارية:</strong> {displayNutrition.total_calories} سعرة
                      <div style={styles.progressContainer}>
                        <div style={{
                          ...styles.progressBar,
                          width: getProgressBarWidth(displayNutrition.total_calories, displayNutrition.target_calories),
                          backgroundColor: getProgressBarColor(displayNutrition.total_calories, displayNutrition.target_calories).backgroundColor
                        }}>
                          {getProgressBarWidth(displayNutrition.total_calories, displayNutrition.target_calories)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.nutritionDetail}>
                      <strong>البروتين:</strong> {displayNutrition.total_protein} جرام
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        ({displayNutrition.total_calories > 0 ? ((displayNutrition.total_protein * 4) / displayNutrition.total_calories * 100).toFixed(1) : 0}% من السعرات)
                      </div>
                    </div>
                    
                    <div style={styles.nutritionDetail}>
                      <strong>الكربوهيدرات:</strong> {displayNutrition.total_carbs} جرام
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        ({displayNutrition.total_calories > 0 ? ((displayNutrition.total_carbs * 4) / displayNutrition.total_calories * 100).toFixed(1) : 0}% من السعرات)
                      </div>
                    </div>
                    
                    <div style={styles.nutritionDetail}>
                      <strong>الدهون:</strong> {displayNutrition.total_fat} جرام
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        ({displayNutrition.total_calories > 0 ? ((displayNutrition.total_fat * 9) / displayNutrition.total_calories * 100).toFixed(1) : 0}% من السعرات)
                      </div>
                    </div>
                    
                    <div style={styles.nutritionDetail}>
                      <strong>الألياف:</strong> {displayNutrition.total_fiber} جرام
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        (ممتاز للهضم)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              style={styles.button}
              onClick={saveMealPlan}
              disabled={loading || !selectedPatient}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ هذه الخطة'}
            </button>
            <button 
              style={styles.buttonSecondary}
              onClick={() => {
                try {
                  resetSelections();
                } catch (error) {
                  console.error('Error in resetSelections button:', error);
                }
              }}
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMealPlanner;
