import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatTime12Hour, formatDateGregorian } from '../../utils/timeUtils'
import PatientSelectedMeals from '../../components/patient/PatientSelectedMeals'
import api from '../../services/api'

const PatientDashboard = () => {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Fetch patient data
  const { data: mealPlans, isLoading: plansLoading } = useQuery(
    'patient-meal-plans',
    () => api.get(`/api/meals/meal-plans/?patient=${user?.id}`).then(res => {
      console.log('🔄 Dashboard: Fetched meal plans:', res.data.results)
      res.data.results.forEach((plan, index) => {
        console.log(`Dashboard Plan ${index + 1} (ID: ${plan.id}): ${plan.title} - Start: ${plan.start_date}, End: ${plan.end_date} - Active: ${plan.is_active}`)
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

  const { data: appointments, isLoading: appointmentsLoading } = useQuery(
    'patient-appointments',
    () => api.get('/api/bookings/appointments/').then(res => res.data.results),
    { enabled: !!user }
  )

  const { data: measurements, isLoading: measurementsLoading } = useQuery(
    'patient-measurements',
    () => api.get('/api/auth/measurements/').then(res => res.data.results),
    { enabled: !!user }
  )


  const getCurrentPlans = () => {
    console.log('🔄 getCurrentPlans called with mealPlans:', mealPlans)
    if (!mealPlans) {
      console.log('❌ No mealPlans data')
      return []
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    console.log('📅 Today:', today.toISOString())
    
    // Filter plans that are active (is_active = true) and either:
    // 1. Currently active (within date range)
    // 2. Future plans (start date in the future)
    const activePlans = mealPlans.filter(plan => {
      console.log(`🔍 Processing plan ${plan.id}: ${plan.title}`)
      console.log(`  - is_active: ${plan.is_active}`)
      console.log(`  - start_date: ${plan.start_date}`)
      console.log(`  - end_date: ${plan.end_date}`)
      
      if (!plan.is_active) {
        console.log(`  ❌ Plan ${plan.id} is not active`)
        return false
      }
      
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999) // End of day
      
      console.log(`  - startDate: ${startDate.toISOString()}`)
      console.log(`  - endDate: ${endDate.toISOString()}`)
      
      // Include plans that are currently active or will be active in the future
      const isCurrentlyActive = startDate <= today && endDate >= today
      const isFuturePlan = startDate >= today
      const shouldInclude = isCurrentlyActive || isFuturePlan
      
      console.log(`  - isCurrentlyActive: ${isCurrentlyActive}`)
      console.log(`  - isFuturePlan: ${isFuturePlan}`)
      console.log(`  - shouldInclude: ${shouldInclude}`)
      
      return shouldInclude
    })
    
    console.log(`✅ Found ${activePlans.length} active plans`)
    
    // Sort by start date (earliest first) to prioritize current/future plans
    const sortedPlans = activePlans.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    console.log('📋 Sorted plans:', sortedPlans.map(p => `${p.id}: ${p.title}`))
    return sortedPlans
  }

  const getUpcomingAppointments = () => {
    if (!appointments) return []
    const today = new Date()
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_date)
      return appointmentDate >= today && appointment.status !== 'cancelled'
    })
  }

  const getLatestMeasurement = () => {
    return measurements?.[0] || null
  }

  // دوال مساعدة لتحديد حالة الخطة
  const getPlanStatus = (plan) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date(plan.start_date)
    const endDate = new Date(plan.end_date)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    
    if (startDate > today) {
      return 'future' // مستقبلية
    } else if (startDate <= today && endDate >= today) {
      return 'active' // نشطة
    } else {
      return 'expired' // منتهية
    }
  }

  const getPlanStatusText = (plan) => {
    const status = getPlanStatus(plan)
    switch (status) {
      case 'future': return 'مستقبلية'
      case 'active': return 'نشطة'
      case 'expired': return 'منتهية'
      default: return 'غير محددة'
    }
  }

  const getPlanStatusBadgeClass = (plan) => {
    const status = getPlanStatus(plan)
    switch (status) {
      case 'future': return 'bg-warning text-dark'
      case 'active': return 'bg-success'
      case 'expired': return 'bg-secondary'
      default: return 'bg-light text-dark'
    }
  }

  const getPlanStatusAlertClass = (plan) => {
    const status = getPlanStatus(plan)
    switch (status) {
      case 'future': return 'alert-warning'
      case 'active': return 'alert-success'
      case 'expired': return 'alert-secondary'
      default: return 'alert-info'
    }
  }

  const getPlanStatusIcon = (plan) => {
    const status = getPlanStatus(plan)
    switch (status) {
      case 'future': return 'fa-clock'
      case 'active': return 'fa-check-circle'
      case 'expired': return 'fa-times-circle'
      default: return 'fa-info-circle'
    }
  }

  const getPlanStatusTitle = (plan) => {
    const status = getPlanStatus(plan)
    switch (status) {
      case 'future': return 'خطة الوجبات المستقبلية'
      case 'active': return 'خطة الوجبات النشطة'
      case 'expired': return 'خطة الوجبات المنتهية'
      default: return 'خطة الوجبات'
    }
  }

  if (plansLoading || appointmentsLoading || measurementsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentPlans = getCurrentPlans()
  const upcomingAppointments = getUpcomingAppointments()
  const latestMeasurement = getLatestMeasurement()

  return (
    <div className="fade-in">
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="mb-2">
                    <i className="fas fa-heart me-2"></i>
                    مرحباً {user?.first_name}!
                  </h2>
                  <p className="mb-0 fs-5">
                    نتمنى لك يوماً صحياً ومليئاً بالطاقة. تابع تقدمك الصحي وخطط وجباتك
                  </p>
                </div>
                <div className="col-md-4 text-center">
                  <div className="display-4">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="mt-2">
                    <span className="badge bg-light text-dark fs-6">مريض</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Alert */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-success">
            <div className="d-flex align-items-center">
              <i className="fas fa-credit-card me-3 fs-4"></i>
              <div>
                <h5 className="mb-2">
                  <strong>معلومات الدفع الإلكتروني</strong>
                </h5>
                <p className="mb-2">للدفع الإلكتروني، يرجى استخدام رقم Qcard التالي:</p>
                <div className="p-3 bg-white rounded border">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-university text-success me-2"></i>
                    <div>
                      <strong className="text-success">Qcard - بنك الرافدين</strong>
                      <br />
                      <span className="text-primary fs-5 fw-bold">7113596071</span>
                    </div>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block">
                  <i className="fas fa-info-circle me-1"></i>
                  يرجى استخدام رقم Qcard أعلاه للدفع الإلكتروني في حجز المواعيد
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-utensils text-primary fs-1 me-3"></i>
                <div>
                  <div className="fw-bold text-primary fs-2">{currentPlans.length}</div>
                  <small className="text-muted">خطط وجبات نشطة</small>
                </div>
              </div>
              {currentPlans.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    آخر خطة: {currentPlans[0]?.title || 'غير محدد'}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center border-success">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-calendar-check text-success fs-1 me-3"></i>
                <div>
                  <div className="fw-bold text-success fs-2">{upcomingAppointments.length}</div>
                  <small className="text-muted">مواعيد قادمة</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center border-info">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-chart-line text-info fs-1 me-3"></i>
                <div>
                  <div className="fw-bold text-info fs-2">{measurements?.length || 0}</div>
                  <small className="text-muted">قياسات مسجلة</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center border-warning">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-weight text-warning fs-1 me-3"></i>
                <div>
                  <div className="fw-bold text-warning fs-2">
                    {latestMeasurement?.weight || '--'}
                  </div>
                  <small className="text-muted">الوزن الحالي (كجم)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="row mb-4">
        <div className="col-md-12 mb-3">
          <div className="card text-center border-primary h-100">
            <div className="card-body d-flex flex-column">
              <i className="fas fa-utensils text-primary fs-1 mb-3"></i>
              <h6 className="text-primary mb-2">خطط الوجبات</h6>
              <p className="text-muted small mb-3">عرض خطط الوجبات المخصصة</p>
              <a href="/meal-plans" className="btn btn-outline-primary btn-sm mt-auto">
                <i className="fas fa-utensils me-1"></i>
                عرض الخطط
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* All Meal Plans */}
      {mealPlans && mealPlans.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  جميع خطط الوجبات
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {mealPlans.map((plan) => (
                    <div key={plan.id} className="col-md-6 mb-3">
                      <div className={`card h-100 ${getPlanStatus(plan) === 'active' ? 'border-success' : getPlanStatus(plan) === 'future' ? 'border-warning' : 'border-secondary'}`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title">{plan.title}</h6>
                            <span className={`badge ${getPlanStatusBadgeClass(plan)}`}>
                              {getPlanStatusText(plan)}
                            </span>
                          </div>
                          <p className="card-text small text-muted">
                            {plan.description?.substring(0, 100)}...
                          </p>
                          <div className="row text-center mb-2">
                            <div className="col-4">
                              <small className="text-muted">السعرات</small>
                              <div className="fw-bold text-primary">{plan.target_calories} سعرة</div>
                            </div>
                            <div className="col-4">
                              <small className="text-muted">البروتين</small>
                              <div className="fw-bold text-success">{plan.target_protein}g</div>
                            </div>
                            <div className="col-4">
                              <small className="text-muted">الكربوهيدرات</small>
                              <div className="fw-bold text-warning">{plan.target_carbs || '--'}g</div>
                            </div>
                          </div>
                          <p className="small text-muted mb-0">
                            <i className="fas fa-calendar me-1"></i>
                            من {new Date(plan.start_date).toLocaleDateString('ar-SA')} إلى {new Date(plan.end_date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div className="card-footer">
                          <div className="d-flex gap-2">
                            <a href="/meal-plans" className="btn btn-primary btn-sm flex-fill">
                              <i className="fas fa-eye me-2"></i>
                              عرض التفاصيل
                            </a>
                            {getPlanStatus(plan) === 'active' && (
                              <a href="/iraqi-nutrition/meal-planner" className="btn btn-success btn-sm">
                                <i className="fas fa-utensils"></i>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Meal Plans */}
      {currentPlans.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-utensils me-2"></i>
                  خطط الوجبات النشطة
                </h5>
              </div>
              <div className="card-body">
                {/* عرض تفاصيل الخطة الحالية */}
                {currentPlans[0] && (
                  <div className={`alert ${getPlanStatusAlertClass(currentPlans[0])} mb-4`}>
                    <h6 className="alert-heading">
                      <i className={`fas ${getPlanStatusIcon(currentPlans[0])} me-2`}></i>
                      {getPlanStatusTitle(currentPlans[0])}
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>اسم الخطة:</strong> {currentPlans[0].title}</p>
                        <p className="mb-1"><strong>الوصف:</strong> {currentPlans[0].description || 'لا يوجد وصف'}</p>
                        <p className="mb-1"><strong>الفترة:</strong> من {new Date(currentPlans[0].start_date).toLocaleDateString('ar-SA')} إلى {new Date(currentPlans[0].end_date).toLocaleDateString('ar-SA')}</p>
                        <p className="mb-1"><strong>الحالة:</strong> <span className={`badge ${getPlanStatusBadgeClass(currentPlans[0])}`}>{getPlanStatusText(currentPlans[0])}</span></p>
                      </div>
                      <div className="col-md-6">
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="fw-bold text-primary">{currentPlans[0].target_calories}</div>
                            <small className="text-muted">سعرة</small>
                          </div>
                          <div className="col-4">
                            <div className="fw-bold text-success">{currentPlans[0].target_protein}g</div>
                            <small className="text-muted">بروتين</small>
                          </div>
                          <div className="col-4">
                            <div className="fw-bold text-warning">{currentPlans[0].target_carbs || '--'}g</div>
                            <small className="text-muted">كربوهيدرات</small>
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr />
                    <div className="d-flex gap-2">
                      <a href="/meal-plans" className="btn btn-primary btn-sm">
                        <i className="fas fa-eye me-2"></i>
                        عرض الخطة كاملة
                      </a>
                      <a href="/iraqi-nutrition/meal-planner" className="btn btn-success btn-sm">
                        <i className="fas fa-utensils me-2"></i>
                        مخطط الوجبات العراقية
                      </a>
                    </div>
                  </div>
                )}

                <div className="row">
                  {currentPlans.slice(0, 3).map((plan) => (
                    <div key={plan.id} className="col-md-4 mb-3">
                      <div className="card h-100 border-success">
                        <div className="card-body">
                          <h6 className="card-title text-success">{plan.title}</h6>
                          <p className="card-text small text-muted">
                            {plan.description?.substring(0, 100)}...
                          </p>
                          <div className="row text-center">
                            <div className="col-6">
                              <small className="text-muted">السعرات</small>
                              <div className="fw-bold text-primary">{plan.target_calories} سعرة</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">البروتين</small>
                              <div className="fw-bold text-success">{plan.target_protein}g</div>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer">
                        <div className="d-flex gap-2">
                            <a href="/meal-plans" className="btn btn-success btn-sm flex-fill">
                              <i className="fas fa-eye me-2"></i>
                              عرض التفاصيل
                            </a>
                            <button 
                              className="btn btn-outline-success btn-sm"
                              onClick={() => {
                                // عرض تفاصيل الخطة في modal أو قسم منفصل
                                const planDetails = `
                                  <div class="meal-plan-details">
                                    <h5>${plan.title}</h5>
                                    <p><strong>الوصف:</strong> ${plan.description || 'لا يوجد وصف'}</p>
                                    <p><strong>السعرات المستهدفة:</strong> ${plan.target_calories} سعرة</p>
                                    <p><strong>البروتين المستهدف:</strong> ${plan.target_protein}g</p>
                                    <p><strong>الكربوهيدرات المستهدفة:</strong> ${plan.target_carbs || 'غير محدد'}g</p>
                                    <p><strong>الدهون المستهدفة:</strong> ${plan.target_fat || 'غير محدد'}g</p>
                                    <p><strong>من:</strong> ${new Date(plan.start_date).toLocaleDateString('ar-SA')}</p>
                                    <p><strong>إلى:</strong> ${new Date(plan.end_date).toLocaleDateString('ar-SA')}</p>
                                    <p><strong>الحالة:</strong> ${plan.is_active ? 'نشطة' : 'غير نشطة'}</p>
                                  </div>
                                `;
                                // إنشاء modal لعرض التفاصيل
                                const modal = document.createElement('div');
                                modal.className = 'modal fade';
                                modal.innerHTML = `
                                  <div class="modal-dialog modal-lg">
                                    <div class="modal-content">
                                      <div class="modal-header">
                                        <h5 class="modal-title">تفاصيل خطة الوجبات</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                      </div>
                                      <div class="modal-body">
                                        ${planDetails}
                                      </div>
                                      <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                                        <a href="/meal-plans" class="btn btn-primary">عرض كامل</a>
                                      </div>
                                    </div>
                                  </div>
                                `;
                                document.body.appendChild(modal);
                                const bsModal = new bootstrap.Modal(modal);
                                bsModal.show();
                                modal.addEventListener('hidden.bs.modal', () => {
                                  document.body.removeChild(modal);
                                });
                              }}
                            >
                              <i className="fas fa-info-circle"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {currentPlans.length > 3 && (
                  <div className="text-center mt-3">
                    <a href="/meal-plans" className="btn btn-outline-success">
                      <i className="fas fa-list me-2"></i>
                      عرض جميع الخطط ({currentPlans.length})
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-check me-2"></i>
                  المواعيد القادمة
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>الطبيب</th>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>نوع الموعد</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAppointments.slice(0, 5).map((appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <div className="fw-bold">د. {appointment.doctor_name}</div>
                            <small className="text-muted">{appointment.doctor_specialization}</small>
                          </td>
                          <td>{formatDateGregorian(appointment.scheduled_date)}</td>
                          <td>{formatTime12Hour(appointment.scheduled_time)}</td>
                          <td>
                            <span className="badge bg-info">
                              {appointment.appointment_type === 'consultation' ? 'استشارة' : 
                               appointment.appointment_type === 'follow_up' ? 'متابعة' : 
                               appointment.appointment_type}
                            </span>
                          </td>
                          <td>
                            {appointment.status === 'confirmed' ? (
                              <span className="badge bg-success">مؤكد</span>
                            ) : (
                              <span className="badge bg-warning">في الانتظار</span>
                            )}
                          </td>
                          <td>
                            <a href="/appointments" className="btn btn-sm btn-outline-primary">
                              <i className="fas fa-eye me-1"></i>
                              عرض
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {upcomingAppointments.length > 5 && (
                  <div className="text-center mt-3">
                    <a href="/appointments" className="btn btn-outline-primary">
                      <i className="fas fa-list me-2"></i>
                      عرض جميع المواعيد ({upcomingAppointments.length})
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Measurements */}
      {latestMeasurement && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-chart-line me-2"></i>
                  آخر القياسات الصحية
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 text-center mb-3">
                    <div className="p-3 bg-primary text-white rounded">
                      <div className="fw-bold fs-4">{latestMeasurement.weight} كجم</div>
                      <small>الوزن</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center mb-3">
                    <div className="p-3 bg-success text-white rounded">
                      <div className="fw-bold fs-4">{latestMeasurement.body_fat_percentage}%</div>
                      <small>نسبة الدهون</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center mb-3">
                    <div className="p-3 bg-warning text-white rounded">
                      <div className="fw-bold fs-4">{latestMeasurement.waist_circumference || '--'} سم</div>
                      <small>محيط الخصر</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center mb-3">
                    <div className="p-3 bg-danger text-white rounded">
                      <div className="fw-bold fs-4">
                        {latestMeasurement.blood_pressure_systolic && latestMeasurement.blood_pressure_diastolic 
                          ? `${latestMeasurement.blood_pressure_systolic}/${latestMeasurement.blood_pressure_diastolic}` 
                          : '--'
                        }
                      </div>
                      <small>ضغط الدم</small>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <a href="/measurements" className="btn btn-outline-info">
                    <i className="fas fa-chart-area me-2"></i>
                    عرض جميع القياسات
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Selected Meals */}
      <div className="row mb-4">
        <div className="col-12">
          <PatientSelectedMeals />
        </div>
      </div>

      {/* Health Tips */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="text-muted mb-3">
                <i className="fas fa-lightbulb text-warning me-2"></i>
                نصائح صحية
              </h6>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                    <div>
                      <strong>اشرب الماء بكثرة:</strong>
                      <br />
                      <small className="text-muted">8-10 أكواب يومياً للحفاظ على رطوبة الجسم</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                    <div>
                      <strong>مارس الرياضة بانتظام:</strong>
                      <br />
                      <small className="text-muted">30 دقيقة يومياً على الأقل</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                    <div>
                      <strong>تناول وجبات متوازنة:</strong>
                      <br />
                      <small className="text-muted">اتبع خطة وجباتك المخصصة</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
