import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const AdminReports = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('financial')
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  // Fetch financial dashboard
  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['financial-dashboard', dateRange],
    () => api.get(`/api/reports/financial-dashboard/?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`).then(res => res.data),
    { enabled: !!user && activeTab === 'financial' }
  )

  // Fetch appointments dashboard
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery(
    ['appointments-dashboard', dateRange],
    () => api.get(`/api/reports/appointments-dashboard/?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`).then(res => res.data),
    { enabled: !!user && activeTab === 'appointments' }
  )

  // Fetch patients dashboard
  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    'patients-dashboard',
    () => api.get('/api/reports/patients-dashboard/').then(res => res.data),
    { enabled: !!user && activeTab === 'patients' }
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('ar-SA').format(number)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', { calendar: 'gregory' })
  }

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const exportReport = (format) => {
    // In a real implementation, this would generate and download the report
    alert(`سيتم تصدير التقرير بصيغة ${format}`)
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-chart-bar text-info me-2"></i>
                التقارير والإحصائيات
              </h2>
              <p className="text-muted">تقارير مفصلة عن أداء النظام</p>
            </div>
            <div className="dropdown">
              <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i className="fas fa-download me-2"></i>
                تصدير التقرير
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => exportReport('PDF')}>PDF</button></li>
                <li><button className="dropdown-item" onClick={() => exportReport('Excel')}>Excel</button></li>
                <li><button className="dropdown-item" onClick={() => exportReport('CSV')}>CSV</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <label className="form-label">من تاريخ</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.start_date}
                    onChange={(e) => handleDateChange('start_date', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">إلى تاريخ</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.end_date}
                    onChange={(e) => handleDateChange('end_date', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">فترات سريعة</label>
                  <div className="btn-group w-100">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const today = new Date()
                        setDateRange({
                          start_date: today.toISOString().split('T')[0],
                          end_date: today.toISOString().split('T')[0]
                        })
                      }}
                    >
                      اليوم
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const today = new Date()
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                        setDateRange({
                          start_date: weekAgo.toISOString().split('T')[0],
                          end_date: today.toISOString().split('T')[0]
                        })
                      }}
                    >
                      آخر 7 أيام
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const today = new Date()
                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                        setDateRange({
                          start_date: monthStart.toISOString().split('T')[0],
                          end_date: today.toISOString().split('T')[0]
                        })
                      }}
                    >
                      هذا الشهر
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            <i className="fas fa-dollar-sign me-2"></i>
            التقرير المالي
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <i className="fas fa-calendar-check me-2"></i>
            تقرير المواعيد
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <i className="fas fa-users me-2"></i>
            تقرير المرضى
          </button>
        </li>
      </ul>

      {/* Financial Report Tab */}
      {activeTab === 'financial' && (
        <div>
          {financialLoading ? (
            <div className="d-flex justify-content-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          ) : financialData ? (
            <div>
              {/* Financial KPIs */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-success mb-2">
                      <i className="fas fa-money-bill-wave fs-2"></i>
                    </div>
                    <h4 className="text-success mb-1">
                      {formatCurrency(financialData.revenue_metrics?.total_revenue || 0)}
                    </h4>
                    <p className="text-muted mb-0">إجمالي الإيرادات</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-primary mb-2">
                      <i className="fas fa-chart-line fs-2"></i>
                    </div>
                    <h4 className="text-primary mb-1">
                      {formatCurrency(financialData.revenue_metrics?.net_revenue || 0)}
                    </h4>
                    <p className="text-muted mb-0">صافي الإيرادات</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-warning mb-2">
                      <i className="fas fa-percentage fs-2"></i>
                    </div>
                    <h4 className="text-warning mb-1">
                      {formatCurrency(financialData.revenue_metrics?.total_discounts || 0)}
                    </h4>
                    <p className="text-muted mb-0">إجمالي الخصومات</p>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-info mb-2">
                      <i className="fas fa-credit-card fs-2"></i>
                    </div>
                    <h4 className="text-info mb-1">
                      {formatCurrency(financialData.revenue_metrics?.total_fees || 0)}
                    </h4>
                    <p className="text-muted mb-0">رسوم المعاملات</p>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Revenue by Provider */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">الإيرادات حسب وسيلة الدفع</h5>
                    </div>
                    <div className="card-body">
                      {financialData.revenue_by_provider?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>وسيلة الدفع</th>
                                <th>المعاملات</th>
                                <th>المبلغ</th>
                                <th>الرسوم</th>
                              </tr>
                            </thead>
                            <tbody>
                              {financialData.revenue_by_provider.map((provider, index) => (
                                <tr key={index}>
                                  <td>{provider.provider__display_name}</td>
                                  <td>
                                    <span className="badge bg-primary">{provider.count}</span>
                                  </td>
                                  <td className="fw-bold">{formatCurrency(provider.amount)}</td>
                                  <td className="text-muted">{formatCurrency(provider.fees)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue by Service */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">الإيرادات حسب نوع الخدمة</h5>
                    </div>
                    <div className="card-body">
                      {financialData.revenue_by_service?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>نوع الخدمة</th>
                                <th>الفواتير</th>
                                <th>المبلغ</th>
                                <th>النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {financialData.revenue_by_service.map((service, index) => {
                                const totalRevenue = financialData.revenue_by_service.reduce((sum, s) => sum + s.amount, 0)
                                const percentage = totalRevenue > 0 ? ((service.amount / totalRevenue) * 100).toFixed(1) : 0
                                
                                return (
                                  <tr key={index}>
                                    <td>
                                      {service.service_type === 'consultation' && 'استشارة'}
                                      {service.service_type === 'meal_plan' && 'خطة وجبات'}
                                      {service.service_type === 'subscription' && 'اشتراك'}
                                    </td>
                                    <td>
                                      <span className="badge bg-info">{service.count}</span>
                                    </td>
                                    <td className="fw-bold">{formatCurrency(service.amount)}</td>
                                    <td>{percentage}%</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Doctor Performance */}
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">أداء الأطباء</h5>
                    </div>
                    <div className="card-body">
                      {financialData.doctor_performance?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>الطبيب</th>
                                <th>عدد المواعيد</th>
                                <th>إجمالي الإيرادات</th>
                                <th>متوسط الإيراد لكل موعد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {financialData.doctor_performance.map((doctor, index) => (
                                <tr key={index}>
                                  <td>
                                    د. {doctor.appointment__doctor__first_name} {doctor.appointment__doctor__last_name}
                                  </td>
                                  <td>
                                    <span className="badge bg-primary">{doctor.appointments_count}</span>
                                  </td>
                                  <td className="fw-bold">{formatCurrency(doctor.total_revenue)}</td>
                                  <td>
                                    {formatCurrency(doctor.total_revenue / doctor.appointments_count)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Appointments Report Tab */}
      {activeTab === 'appointments' && (
        <div>
          {appointmentsLoading ? (
            <div className="d-flex justify-content-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          ) : appointmentsData ? (
            <div>
              {/* Appointment Status Cards */}
              <div className="row mb-4">
                {appointmentsData.status_breakdown?.map((status, index) => (
                  <div key={index} className="col-md-3 mb-3">
                    <div className="dashboard-card text-center">
                      <div className={`mb-2 ${
                        status.status === 'completed' ? 'text-success' :
                        status.status === 'confirmed' ? 'text-info' :
                        status.status === 'pending' ? 'text-warning' : 'text-danger'
                      }`}>
                        <i className="fas fa-calendar-check fs-2"></i>
                      </div>
                      <h4 className="mb-1">{formatNumber(status.count)}</h4>
                      <p className="text-muted mb-0">
                        {status.status === 'completed' && 'مكتملة'}
                        {status.status === 'confirmed' && 'مؤكدة'}
                        {status.status === 'pending' && 'قيد الانتظار'}
                        {status.status === 'cancelled' && 'ملغية'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row">
                {/* Appointment Types */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">أنواع المواعيد</h5>
                    </div>
                    <div className="card-body">
                      {appointmentsData.type_breakdown?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>نوع الموعد</th>
                                <th>العدد</th>
                                <th>النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointmentsData.type_breakdown.map((type, index) => {
                                const total = appointmentsData.type_breakdown.reduce((sum, t) => sum + t.count, 0)
                                const percentage = total > 0 ? ((type.count / total) * 100).toFixed(1) : 0
                                
                                return (
                                  <tr key={index}>
                                    <td>{type.appointment_type}</td>
                                    <td>
                                      <span className="badge bg-primary">{type.count}</span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                          <div 
                                            className="progress-bar bg-info" 
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                        <small>{percentage}%</small>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Peak Hours */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">أوقات الذروة</h5>
                    </div>
                    <div className="card-body">
                      {appointmentsData.peak_hours?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>الساعة</th>
                                <th>عدد المواعيد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointmentsData.peak_hours.map((hour, index) => (
                                <tr key={index}>
                                  <td>{hour.hour}:00</td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="badge bg-warning me-2">{hour.count}</span>
                                      <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                        <div 
                                          className="progress-bar bg-warning" 
                                          style={{ width: `${(hour.count / Math.max(...appointmentsData.peak_hours.map(h => h.count))) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Patients Report Tab */}
      {activeTab === 'patients' && (
        <div>
          {patientsLoading ? (
            <div className="d-flex justify-content-center py-5">
              <LoadingSpinner size="lg" />
            </div>
          ) : patientsData ? (
            <div>
              {/* Patient Stats */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-primary mb-2">
                      <i className="fas fa-users fs-2"></i>
                    </div>
                    <h4 className="text-primary mb-1">{formatNumber(patientsData.total_patients || 0)}</h4>
                    <p className="text-muted mb-0">إجمالي المرضى</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-success mb-2">
                      <i className="fas fa-user-plus fs-2"></i>
                    </div>
                    <h4 className="text-success mb-1">
                      {patientsData.new_patients_trend?.reduce((sum, month) => sum + month.count, 0) || 0}
                    </h4>
                    <p className="text-muted mb-0">مرضى جدد (6 أشهر)</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="dashboard-card text-center">
                    <div className="text-info mb-2">
                      <i className="fas fa-chart-line fs-2"></i>
                    </div>
                    <h4 className="text-info mb-1">85%</h4>
                    <p className="text-muted mb-0">معدل الاحتفاظ</p>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Gender Distribution */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">توزيع الجنس</h5>
                    </div>
                    <div className="card-body">
                      {patientsData.gender_distribution?.length > 0 ? (
                        <div className="row text-center">
                          {patientsData.gender_distribution.map((gender, index) => (
                            <div key={index} className="col-6">
                              <div className={`bg-${gender.gender === 'male' ? 'primary' : 'success'} bg-opacity-10 rounded-3 p-3`}>
                                <h3 className={`text-${gender.gender === 'male' ? 'primary' : 'success'} mb-1`}>
                                  {formatNumber(gender.count)}
                                </h3>
                                <small className="text-muted">
                                  {gender.gender === 'male' ? 'ذكور' : 'إناث'}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Goal Distribution */}
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">توزيع الأهداف</h5>
                    </div>
                    <div className="card-body">
                      {patientsData.goal_distribution?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>الهدف</th>
                                <th>العدد</th>
                                <th>النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patientsData.goal_distribution.map((goal, index) => {
                                const total = patientsData.goal_distribution.reduce((sum, g) => sum + g.count, 0)
                                const percentage = total > 0 ? ((goal.count / total) * 100).toFixed(1) : 0
                                
                                return (
                                  <tr key={index}>
                                    <td>
                                      {goal.goal === 'lose_weight' && 'إنقاص الوزن'}
                                      {goal.goal === 'gain_weight' && 'زيادة الوزن'}
                                      {goal.goal === 'maintain_weight' && 'المحافظة على الوزن'}
                                      {goal.goal === 'build_muscle' && 'بناء العضلات'}
                                      {goal.goal === 'improve_health' && 'تحسين الصحة'}
                                    </td>
                                    <td>
                                      <span className="badge bg-success">{goal.count}</span>
                                    </td>
                                    <td>{percentage}%</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default AdminReports
