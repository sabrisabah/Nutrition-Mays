import React from 'react'
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
    () => api.get(`/api/meals/meal-plans/?patient=${user?.id}`).then(res => res.data.results),
    { enabled: !!user }
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
    if (!mealPlans) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    // Filter plans that are currently active (within date range and is_active = true)
    const activePlans = mealPlans.filter(plan => {
      const startDate = new Date(plan.start_date)
      const endDate = new Date(plan.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999) // End of day
      return startDate <= today && endDate >= today && plan.is_active
    })
    
    // Sort by creation date (newest first) and return only the first one (most recent)
    const sortedPlans = activePlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sortedPlans.length > 0 ? [sortedPlans[0]] : []
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
                          <a href="/meal-plans" className="btn btn-success btn-sm w-100">
                            <i className="fas fa-eye me-2"></i>
                            عرض التفاصيل
                          </a>
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
