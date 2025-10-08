import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { toast } from 'react-toastify'
import LoadingSpinner from '../common/LoadingSpinner'
import api from '../../services/api'

const PatientMealSelections = ({ patientId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // جلب اختيارات المريض
  const { data: mealSelections, isLoading, error } = useQuery(
    ['patient-meal-selections', patientId, selectedDate],
    () => api.get(`/api/meals/patients/${patientId}/selected-meals/?date=${selectedDate}`).then(res => {
      console.log('Patient meal selections API response:', res.data)
      return res.data
    }),
    { 
      enabled: !!patientId,
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
        فشل في تحميل اختيارات المريض
      </div>
    )
  }

  return (
    <div className="patient-meal-selections">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-shopping-cart me-2"></i>
                اختيارات المريض للوجبات
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

      {/* معلومات التشخيص */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="alert alert-info">
            <h6 className="mb-2">
              <i className="fas fa-info-circle me-2"></i>
              معلومات التشخيص - اختيارات المريض
            </h6>
            <p className="mb-1">
              <strong>معرف المريض:</strong> {patientId}
            </p>
            <p className="mb-1">
              <strong>التاريخ المحدد:</strong> {selectedDate}
            </p>
            <p className="mb-1">
              <strong>عدد الاختيارات:</strong> {mealSelections ? mealSelections.length : 'غير محدد'}
            </p>
            <p className="mb-0">
              <strong>حالة التحميل:</strong> {isLoading ? 'جاري التحميل...' : 'مكتمل'}
            </p>
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
                  {selection.ingredients && selection.ingredients.length > 0 && (
                    <div className="ingredients-section mb-3">
                      <h6 className="text-primary mb-2">
                        <i className="fas fa-shopping-basket me-1"></i>
                        المكونات:
                      </h6>
                      <div className="ingredients-list">
                        {selection.ingredients.map((ingredient, idx) => (
                          <div key={idx} className="ingredient-item d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-circle text-success me-2" style={{ fontSize: '0.5rem' }}></i>
                              <span className="fw-bold">{ingredient.food_name_ar || ingredient.food?.name_ar || ingredient.food?.name || ingredient.name}</span>
                            </div>
                            <div className="text-muted">
                              <span className="badge bg-primary">
                                {ingredient.amount || ingredient.quantity}g
                              </span>
                              {ingredient.notes && (
                                <small className="text-info ms-1">- {ingredient.notes}</small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selection.nutrition_info && (
                    <div className="nutrition-summary">
                      <h6 className="text-success mb-2">
                        <i className="fas fa-chart-pie me-1"></i>
                        القيم الغذائية:
                      </h6>
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="p-2 bg-primary text-white rounded">
                            <div className="fw-bold">{selection.nutrition_info.calories || 0}</div>
                            <small>سعرة</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 bg-success text-white rounded">
                            <div className="fw-bold">{selection.nutrition_info.protein || 0}g</div>
                            <small>بروتين</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 bg-info text-white rounded">
                            <div className="fw-bold">{selection.nutrition_info.carbs || 0}g</div>
                            <small>كربوهيدرات</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
              <h5 className="text-muted mt-3">لا توجد اختيارات للوجبات</h5>
              <p className="text-muted">
                المريض لم يختر أي وجبات لهذا التاريخ
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
                  إحصائيات الاختيارات
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

export default PatientMealSelections
