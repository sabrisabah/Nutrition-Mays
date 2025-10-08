import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const AdminDashboard = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Fetch financial dashboard data
  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['financial-dashboard', selectedPeriod],
    () => {
      const params = new URLSearchParams()
      const now = new Date()
      
      if (selectedPeriod === 'month') {
        params.append('start_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
        params.append('end_date', now.toISOString().split('T')[0])
      } else if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        params.append('start_date', weekAgo.toISOString().split('T')[0])
        params.append('end_date', now.toISOString().split('T')[0])
      }
      
      return api.get(`/api/reports/financial-dashboard/?${params}`).then(res => res.data)
    },
    { enabled: !!user }
  )

  // Fetch system overview
  const { data: systemData, isLoading: systemLoading } = useQuery(
    'system-overview',
    () => api.get('/api/reports/system-overview/').then(res => res.data),
    { enabled: !!user }
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

  if (financialLoading || systemLoading) {
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
          <div className="bg-gradient-primary text-white rounded-4 p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="mb-2">
                  مرحباً {user?.first_name}، مرحباً بك في لوحة الإدارة
                </h2>
                <p className="mb-0 opacity-75">
                  نظرة شاملة على أداء النظام والإحصائيات المالية
                </p>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-white bg-opacity-25 rounded-circle p-3 d-inline-block">
                  <i className="fas fa-chart-line fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">الإحصائيات المالية</h5>
                <div className="btn-group">
                  <button
                    className={`btn btn-sm ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedPeriod('week')}
                  >
                    أسبوعي
                  </button>
                  <button
                    className={`btn btn-sm ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedPeriod('month')}
                  >
                    شهري
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-success mb-2">
              <i className="fas fa-dollar-sign fs-2"></i>
            </div>
            <h4 className="text-success mb-1">
              {formatCurrency(financialData?.revenue_metrics?.total_revenue || 0)}
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
              {formatCurrency(financialData?.revenue_metrics?.net_revenue || 0)}
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
              {formatCurrency(financialData?.revenue_metrics?.total_discounts || 0)}
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
              {formatCurrency(financialData?.revenue_metrics?.total_fees || 0)}
            </h4>
            <p className="text-muted mb-0">رسوم المعاملات</p>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-primary mb-2">
              <i className="fas fa-users fs-2"></i>
            </div>
            <h4 className="text-primary mb-1">
              {formatNumber(systemData?.user_counts?.find(u => u.role === 'patient')?.count || 0)}
            </h4>
            <p className="text-muted mb-0">المرضى</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-success mb-2">
              <i className="fas fa-user-md fs-2"></i>
            </div>
            <h4 className="text-success mb-1">
              {formatNumber(systemData?.user_counts?.find(u => u.role === 'doctor')?.count || 0)}
            </h4>
            <p className="text-muted mb-0">الأطباء</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-warning mb-2">
              <i className="fas fa-calendar-check fs-2"></i>
            </div>
            <h4 className="text-warning mb-1">
              {formatNumber(systemData?.health_metrics?.pending_appointments || 0)}
            </h4>
            <p className="text-muted mb-0">المواعيد المعلقة</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="dashboard-card text-center">
            <div className="text-info mb-2">
              <i className="fas fa-utensils fs-2"></i>
            </div>
            <h4 className="text-info mb-1">
              {formatNumber(systemData?.health_metrics?.active_meal_plans || 0)}
            </h4>
            <p className="text-muted mb-0">خطط الوجبات النشطة</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Revenue by Provider */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-credit-card text-primary me-2"></i>
                الإيرادات حسب وسيلة الدفع
              </h5>
            </div>
            <div className="card-body">
              {financialData?.revenue_by_provider?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>وسيلة الدفع</th>
                        <th>عدد المعاملات</th>
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
                <div className="text-center py-4">
                  <i className="fas fa-credit-card text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد معاملات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie text-success me-2"></i>
                الإيرادات حسب نوع الخدمة
              </h5>
            </div>
            <div className="card-body">
              {financialData?.revenue_by_service?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>نوع الخدمة</th>
                        <th>عدد الفواتير</th>
                        <th>المبلغ</th>
                        <th>النسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.revenue_by_service.map((service, index) => {
                        const totalRevenue = financialData.revenue_by_service.reduce((sum, s) => sum + s.amount, 0)
                        const percentage = ((service.amount / totalRevenue) * 100).toFixed(1)
                        
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
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
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
                <div className="text-center py-4">
                  <i className="fas fa-chart-pie text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد خدمات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Doctors */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-star text-warning me-2"></i>
                أفضل الأطباء
              </h5>
            </div>
            <div className="card-body">
              {systemData?.top_doctors?.length > 0 ? (
                <div className="list-group list-group-flush">
                  {systemData.top_doctors.map((doctor, index) => (
                    <div key={index} className="list-group-item px-0 border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                            <i className="fas fa-user-md text-warning"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">{doctor.name}</h6>
                            <small className="text-muted">{doctor.specialization}</small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="d-flex align-items-center">
                            <span className="text-warning me-1">{doctor.rating}</span>
                            <i className="fas fa-star text-warning"></i>
                          </div>
                          <small className="text-muted">{doctor.total_reviews} تقييم</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-user-md text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لا توجد بيانات أطباء</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-clock text-info me-2"></i>
                النشاط الأخير (7 أيام)
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                    <h4 className="text-primary mb-1">{systemData?.recent_activity?.new_users || 0}</h4>
                    <small className="text-muted">مستخدمين جدد</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="bg-success bg-opacity-10 rounded-3 p-3">
                    <h4 className="text-success mb-1">{systemData?.recent_activity?.new_appointments || 0}</h4>
                    <small className="text-muted">مواعيد جديدة</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                    <h4 className="text-warning mb-1">{systemData?.recent_activity?.completed_payments || 0}</h4>
                    <small className="text-muted">مدفوعات مكتملة</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-info bg-opacity-10 rounded-3 p-3">
                    <h4 className="text-info mb-1">{systemData?.recent_activity?.new_meal_plans || 0}</h4>
                    <small className="text-muted">خطط وجبات جديدة</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Coupons */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-tags text-success me-2"></i>
                أفضل الكوبونات أداءً
              </h5>
            </div>
            <div className="card-body">
              {financialData?.coupon_usage?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>الكوبون</th>
                        <th>الاستخدام</th>
                        <th>إجمالي الخصم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.coupon_usage.map((coupon, index) => (
                        <tr key={index}>
                          <td>
                            <div>
                              <div className="fw-bold">{coupon.coupon__code}</div>
                              <small className="text-muted">{coupon.coupon__name}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">{coupon.usage_count}</span>
                          </td>
                          <td className="fw-bold text-success">
                            {formatCurrency(coupon.total_discount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-tags text-muted fs-2 mb-3"></i>
                  <p className="text-muted">لم يتم استخدام كوبونات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                الفواتير المعلقة
              </h5>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="bg-danger bg-opacity-10 rounded-3 p-4 mb-3">
                  <h3 className="text-danger mb-2">
                    {formatNumber(financialData?.outstanding_invoices?.count || 0)}
                  </h3>
                  <p className="text-muted mb-0">فاتورة معلقة</p>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                  <h4 className="text-warning mb-1">
                    {formatCurrency(financialData?.outstanding_invoices?.amount || 0)}
                  </h4>
                  <p className="text-muted mb-0">إجمالي المبلغ المعلق</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AdminDashboard
