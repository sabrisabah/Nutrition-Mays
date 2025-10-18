import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { toast } from 'react-toastify'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'
import api from '../../services/api'

const PatientSelectedMeals = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // جلب اختيارات المريض
  const { data: mealSelections, isLoading, error } = useQuery(
    ['patient-selected-meals', user?.id, selectedDate],
    () => api.get(`/api/meals/patients/${user?.id}/selected-meals/?date=${selectedDate}`).then(res => {
      console.log('Patient selected meals API response:', res.data)
      console.log('Number of selections:', res.data?.length || 0)
      if (res.data && res.data.length > 0) {
        console.log('First selection ingredients:', res.data[0]?.ingredients)
      }
      return res.data
    }),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000, // تحديث كل 30 ثانية
    }
  )

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
                            const ingredientCalories = ingredient.calories || ingredient.calories_per_100g || 0
                            const ingredientProtein = ingredient.protein || ingredient.protein_per_100g || 0
                            
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
                                  <small className="text-info ms-1">
                                    سعرات: {ingredientCalories} | بروتين: {ingredientProtein}g
                                  </small>
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

                  {/* حساب القيم الغذائية من المكونات */}
                  {(() => {
                    const validIngredients = selection.ingredients?.filter(ingredient => 
                      ingredient && (ingredient.food_name_ar || ingredient.food_name || ingredient.name)
                    ) || []
                    
                    const totalNutrition = validIngredients.reduce((total, ingredient) => {
                      const amount = ingredient.amount || ingredient.quantity || 0
                      const caloriesPer100g = ingredient.calories_per_100g || ingredient.calories || 0
                      const proteinPer100g = ingredient.protein_per_100g || ingredient.protein || 0
                      const carbsPer100g = ingredient.carbs_per_100g || ingredient.carbs || 0
                      const fatPer100g = ingredient.fat_per_100g || ingredient.fat || 0
                      
                      return {
                        calories: total.calories + (caloriesPer100g * amount / 100),
                        protein: total.protein + (proteinPer100g * amount / 100),
                        carbs: total.carbs + (carbsPer100g * amount / 100),
                        fat: total.fat + (fatPer100g * amount / 100)
                      }
                    }, { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 }
                    
                    return (
                      <div className="nutrition-summary">
                        <h6 className="text-success mb-2">
                          <i className="fas fa-chart-pie me-1"></i>
                          القيم الغذائية الإجمالية:
                        </h6>
                        <div className="row text-center">
                          <div className="col-3">
                            <div className="p-2 bg-primary text-white rounded">
                              <div className="fw-bold">{Math.round(totalNutrition.calories)}</div>
                              <small>سعرة</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="p-2 bg-success text-white rounded">
                              <div className="fw-bold">{Math.round(totalNutrition.protein)}g</div>
                              <small>بروتين</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="p-2 bg-info text-white rounded">
                              <div className="fw-bold">{Math.round(totalNutrition.carbs)}g</div>
                              <small>كربوهيدرات</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="p-2 bg-warning text-white rounded">
                              <div className="fw-bold">{Math.round(totalNutrition.fat)}g</div>
                              <small>دهون</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
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
      {mealSelections && mealSelections.length > 0 && (
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
                <div className="row text-center">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientSelectedMeals
