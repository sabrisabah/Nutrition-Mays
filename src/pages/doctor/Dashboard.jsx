import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatTime12Hour, formatDateGregorian } from '../../utils/timeUtils'
import api from '../../services/api'

const DoctorDashboard = () => {
  const { t } = useLanguage()
  const { user } = useAuth()

  // Fetch dashboard data
  const { data: appointments, isLoading: appointmentsLoading } = useQuery(
    'doctor-appointments',
    () => api.get('/api/bookings/appointments/?limit=5').then(res => res.data.results),
    { enabled: !!user }
  )

  const { data: patients, isLoading: patientsLoading } = useQuery(
    'doctor-patients',
    () => api.get('/api/bookings/appointments/?status=completed').then(res => {
      const uniquePatients = []
      const patientIds = new Set()
      res.data.results.forEach(apt => {
        if (!patientIds.has(apt.patient)) {
          patientIds.add(apt.patient)
          uniquePatients.push({
            id: apt.patient,
            name: apt.patient_name,
            lastVisit: apt.scheduled_date
          })
        }
      })
      return uniquePatients.slice(0, 5)
    }),
    { enabled: !!user }
  )

  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery(
    'doctor-meal-plans',
    () => api.get('/api/meals/meal-plans/?limit=5').then(res => res.data.results),
    { enabled: !!user }
  )


  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      completed: 'bg-success',
      cancelled: 'bg-danger'
    }
    const statusText = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      completed: 'مكتمل',
      cancelled: 'ملغي'
    }
    return {
      className: `badge ${statusClasses[status] || 'bg-secondary'}`,
      text: statusText[status] || status
    }
  }

  if (appointmentsLoading || patientsLoading || mealPlansLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-gradient-success text-white rounded-4 p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="mb-2">
                  مرحباً د. {user?.first_name} {user?.last_name}!
                </h2>
                <p className="mb-0 opacity-75">
                  لوحة تحكم الطبيب - إدارة مرضاك ومواعيدك وخطط الوجبات
                </p>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-white bg-opacity-25 rounded-circle p-3 d-inline-block">
                  <i className="fas fa-user-md fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-primary mb-2">
              <i className="fas fa-calendar-check fs-2"></i>
            </div>
            <h4 className="text-primary mb-1">{appointments?.length || 0}</h4>
            <p className="text-muted mb-0">المواعيد اليوم</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-success mb-2">
              <i className="fas fa-users fs-2"></i>
            </div>
            <h4 className="text-success mb-1">{patients?.length || 0}</h4>
            <p className="text-muted mb-0">المرضى النشطين</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-warning mb-2">
              <i className="fas fa-utensils fs-2"></i>
            </div>
            <h4 className="text-warning mb-1">{mealPlans?.length || 0}</h4>
            <p className="text-muted mb-0">خطط الوجبات النشطة</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-info mb-2">
              <i className="fas fa-star fs-2"></i>
            </div>
            <h4 className="text-info mb-1">4.8</h4>
            <p className="text-muted mb-0">تقييم الطبيب</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Today's Appointments */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-calendar-check text-primary me-2"></i>
                مواعيد اليوم
              </h5>
              <Link to="/appointments" className="btn btn-sm btn-outline-primary">
                عرض الكل
              </Link>
            </div>
            <div className="card-body">
              {appointments?.length > 0 ? (
                <div className="list-group list-group-flush">
                  {appointments.map((appointment) => {
                    const statusBadge = getStatusBadge(appointment.status)
                    return (
                      <div key={appointment.id} className="list-group-item px-0 border-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{appointment.patient_name}</h6>
                            <p className="mb-1 small text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {formatTime12Hour(appointment.scheduled_time)}
                            </p>
                            <p className="mb-0 small">{appointment.appointment_type_display}</p>
                          </div>
                          <div className="text-end">
                            <span className={statusBadge.className}>
                              {statusBadge.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-plus text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد مواعيد اليوم</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-users text-success me-2"></i>
                المرضى الحاليين
              </h5>
              <Link to="/patients" className="btn btn-sm btn-outline-success">
                عرض الكل
              </Link>
            </div>
            <div className="card-body">
              {patients?.length > 0 ? (
                <div className="list-group list-group-flush">
                  {patients.map((patient) => (
                    <div key={patient.id} className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                            <i className="fas fa-user text-success"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">{patient.name}</h6>
                            <small className="text-muted">
                              آخر زيارة: {formatDateGregorian(patient.lastVisit)}
                            </small>
                          </div>
                        </div>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-primary">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-success">
                            <i className="fas fa-utensils"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-users text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد زيارات حديثة</p>
                  <div className="alert alert-info mt-3">
                    <small>
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>نصيحة:</strong> المرضى سيظهرون هنا بعد أن يحجزوا مواعيد معك. 
                      تأكد من أن المرضى يعرفون كيفية حجز المواعيد من خلال النظام.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Meal Plans */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-utensils text-warning me-2"></i>
                خطط الوجبات الحديثة
              </h5>
              <Link to="/meal-plans" className="btn btn-sm btn-outline-warning">
                عرض الكل
              </Link>
            </div>
            <div className="card-body">
              {mealPlans?.length > 0 ? (
                <div className="list-group list-group-flush">
                  {mealPlans.map((plan) => (
                    <div key={plan.id} className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{plan.title}</h6>
                          <p className="mb-1 small text-muted">
                            <i className="fas fa-user me-1"></i>
                            {plan.patient_name}
                          </p>
                          <p className="mb-0 small">
                            <i className="fas fa-fire me-1"></i>
                            {plan.target_calories} سعرة حرارية
                          </p>
                        </div>
                        <span className={`badge ${plan.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {plan.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-utensils text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد خطط وجبات حديثة</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Weekly Schedule Preview */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-calendar-week text-primary me-2"></i>
                جدول الأسبوع
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                {['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'].map((day, index) => (
                  <div key={index} className="col">
                    <div className="border rounded p-3 mb-2">
                      <h6 className="mb-2">{day}</h6>
                      <div className="small text-muted">
                        <div>9:00 - 17:00</div>
                        <div className="text-success">متاح</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <Link to="/availability" className="btn btn-outline-primary">
                  إدارة الأوقات المتاحة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
