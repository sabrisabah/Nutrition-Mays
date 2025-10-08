import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const PatientPayments = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('invoices')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [paymentProvider, setPaymentProvider] = useState('')

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery(
    'patient-invoices',
    () => api.get('/api/payments/invoices/').then(res => res.data.results),
    { enabled: !!user }
  )

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery(
    'patient-payments',
    () => api.get('/api/payments/payments/').then(res => res.data.results),
    { enabled: !!user }
  )

  // Fetch payment providers
  const { data: providers, isLoading: providersLoading } = useQuery(
    'payment-providers',
    () => api.get('/api/payments/providers/').then(res => res.data),
    { enabled: !!user }
  )

  // Validate coupon mutation
  const validateCouponMutation = useMutation(
    (data) => api.post('/api/payments/coupons/validate/', data),
    {
      onSuccess: (response) => {
        toast.success(`تم تطبيق الكوبون! خصم ${response.data.discount_amount} د.ع`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'كوبون غير صحيح')
      }
    }
  )

  // Process payment mutation
  const processPaymentMutation = useMutation(
    (data) => api.post('/api/payments/payments/', data),
    {
      onSuccess: (response) => {
        toast.success('تم إنشاء عملية الدفع بنجاح')
        queryClient.invalidateQueries('patient-payments')
        queryClient.invalidateQueries('patient-invoices')
        setShowPaymentModal(false)
        // In a real app, redirect to payment provider
        window.open(`/payment-gateway/${response.data.payment_id}`, '_blank')
      },
      onError: (error) => {
        toast.error('فشل في معالجة الدفع')
      }
    }
  )

  const handleValidateCoupon = () => {
    if (!couponCode.trim() || !selectedInvoice) return
    
    validateCouponMutation.mutate({
      code: couponCode,
      amount: selectedInvoice.total_amount,
      service_type: selectedInvoice.service_type
    })
  }

  const handleProcessPayment = () => {
    if (!paymentProvider || !selectedInvoice) return
    
    processPaymentMutation.mutate({
      invoice: selectedInvoice.id,
      provider: paymentProvider,
      amount: selectedInvoice.outstanding_amount
    })
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'bg-secondary',
      pending: 'bg-warning',
      paid: 'bg-success',
      partially_paid: 'bg-info',
      cancelled: 'bg-danger',
      refunded: 'bg-dark',
      completed: 'bg-success',
      failed: 'bg-danger'
    }
    const statusText = {
      draft: 'مسودة',
      pending: 'قيد الانتظار',
      paid: 'مدفوع',
      partially_paid: 'مدفوع جزئياً',
      cancelled: 'ملغي',
      refunded: 'مسترد',
      completed: 'مكتمل',
      failed: 'فاشل',
      processing: 'قيد المعالجة'
    }
    return {
      className: `badge ${statusClasses[status] || 'bg-secondary'}`,
      text: statusText[status] || status
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  const getServiceTypeName = (serviceType) => {
    const serviceTypes = {
      consultation: 'استشارة',
      meal_plan: 'خطة وجبات',
      subscription: 'اشتراك'
    }
    return serviceTypes[serviceType] || serviceType
  }

  if (invoicesLoading || paymentsLoading || providersLoading) {
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
          <h2 className="mb-0">
            <i className="fas fa-credit-card text-warning me-2"></i>
            المدفوعات والفواتير
          </h2>
          <p className="text-muted">إدارة فواتيرك ومدفوعاتك</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <i className="fas fa-file-invoice me-2"></i>
            الفواتير
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <i className="fas fa-credit-card me-2"></i>
            المدفوعات
          </button>
        </li>
      </ul>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">فواتيري</h5>
          </div>
          <div className="card-body">
            {invoices?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>نوع الخدمة</th>
                      <th>المبلغ الإجمالي</th>
                      <th>المبلغ المدفوع</th>
                      <th>المبلغ المتبقي</th>
                      <th>الحالة</th>
                      <th>تاريخ الإصدار</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const statusBadge = getStatusBadge(invoice.status)
                      return (
                        <tr key={invoice.id}>
                          <td className="fw-bold">{invoice.invoice_number}</td>
                          <td>{getServiceTypeName(invoice.service_type)}</td>
                          <td>{invoice.total_amount} د.ع</td>
                          <td>{invoice.paid_amount} د.ع</td>
                          <td className="fw-bold text-danger">
                            {invoice.outstanding_amount} د.ع
                          </td>
                          <td>
                            <span className={statusBadge.className}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td>{formatDate(invoice.issue_date)}</td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-secondary">
                                <i className="fas fa-download"></i>
                              </button>
                              {invoice.status === 'pending' && invoice.outstanding_amount > 0 && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedInvoice(invoice)
                                    setShowPaymentModal(true)
                                  }}
                                >
                                  <i className="fas fa-credit-card me-1"></i>
                                  دفع
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-file-invoice text-muted fs-1 mb-3"></i>
                <h5 className="text-muted">لا توجد فواتير</h5>
                <p className="text-muted">ستظهر فواتيرك هنا عند إنشائها</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">سجل المدفوعات</h5>
          </div>
          <div className="card-body">
            {payments?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>معرف الدفع</th>
                      <th>رقم الفاتورة</th>
                      <th>المبلغ</th>
                      <th>الرسوم</th>
                      <th>المبلغ الصافي</th>
                      <th>وسيلة الدفع</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const statusBadge = getStatusBadge(payment.status)
                      return (
                        <tr key={payment.id}>
                          <td className="font-monospace small">
                            {payment.payment_id.slice(0, 8)}...
                          </td>
                          <td>{payment.invoice_number}</td>
                          <td className="fw-bold">{payment.amount} د.ع</td>
                          <td className="text-muted">{payment.fee_amount} د.ع</td>
                          <td>{payment.net_amount} د.ع</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-credit-card text-primary me-2"></i>
                              {payment.provider_name}
                            </div>
                          </td>
                          <td>
                            <span className={statusBadge.className}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td>{formatDate(payment.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-credit-card text-muted fs-1 mb-3"></i>
                <h5 className="text-muted">لا توجد مدفوعات</h5>
                <p className="text-muted">ستظهر مدفوعاتك هنا بعد إجرائها</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">دفع الفاتورة</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedInvoice(null)
                    setCouponCode('')
                    setPaymentProvider('')
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Invoice Details */}
                <div className="card mb-3">
                  <div className="card-body">
                    <h6>تفاصيل الفاتورة</h6>
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">رقم الفاتورة:</small>
                        <div className="fw-bold">{selectedInvoice.invoice_number}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">نوع الخدمة:</small>
                        <div>{getServiceTypeName(selectedInvoice.service_type)}</div>
                      </div>
                      <div className="col-6 mt-2">
                        <small className="text-muted">المبلغ الأساسي:</small>
                        <div>{selectedInvoice.subtotal} د.ع</div>
                      </div>
                      <div className="col-6 mt-2">
                        <small className="text-muted">الخصم:</small>
                        <div className="text-success">{selectedInvoice.discount_amount} د.ع</div>
                      </div>
                      <div className="col-12 mt-2">
                        <hr />
                        <div className="d-flex justify-content-between">
                          <strong>المبلغ المطلوب دفعه:</strong>
                          <strong className="text-primary">{selectedInvoice.outstanding_amount} د.ع</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mb-3">
                  <label className="form-label">كوبون الخصم (اختياري)</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="أدخل كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim() || validateCouponMutation.isLoading}
                    >
                      {validateCouponMutation.isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        'تطبيق'
                      )}
                    </button>
                  </div>
                </div>

                {/* Payment Provider */}
                <div className="mb-3">
                  <label className="form-label">وسيلة الدفع *</label>
                  <div className="row">
                    {providers?.map((provider) => (
                      <div key={provider.id} className="col-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="paymentProvider"
                            id={`provider-${provider.id}`}
                            value={provider.id}
                            checked={paymentProvider == provider.id}
                            onChange={(e) => setPaymentProvider(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor={`provider-${provider.id}`}>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-credit-card text-primary me-2"></i>
                              <div>
                                <div className="fw-bold">{provider.display_name}</div>
                                <small className="text-muted">
                                  رسوم: {provider.transaction_fee_percentage}% + {provider.transaction_fee_fixed} د.ع
                                </small>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                {paymentProvider && (
                  <div className="alert alert-info">
                    <h6>ملخص الدفع:</h6>
                    {(() => {
                      const provider = providers?.find(p => p.id == paymentProvider)
                      const amount = selectedInvoice.outstanding_amount
                      const fee = provider ? (amount * provider.transaction_fee_percentage / 100) + provider.transaction_fee_fixed : 0
                      const total = amount + fee
                      
                      return (
                        <div>
                          <div className="d-flex justify-content-between">
                            <span>مبلغ الفاتورة:</span>
                            <span>{amount} د.ع</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>رسوم المعاملة:</span>
                            <span>{fee.toFixed(2)} د.ع</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>المجموع:</span>
                            <span>{total.toFixed(2)} د.ع</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedInvoice(null)
                    setCouponCode('')
                    setPaymentProvider('')
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleProcessPayment}
                  disabled={!paymentProvider || processPaymentMutation.isLoading}
                >
                  {processPaymentMutation.isLoading ? (
                    <LoadingSpinner size="sm" color="light" />
                  ) : (
                    'متابعة الدفع'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientPayments
