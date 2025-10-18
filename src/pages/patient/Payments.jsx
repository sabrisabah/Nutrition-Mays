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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [paymentProvider, setPaymentProvider] = useState('')

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery(
    'patient-invoices',
    () => api.get('/api/payments/invoices/').then(res => {
      console.log('Invoices API response:', res.data)
      return res.data?.results || []
    }).catch(error => {
      console.error('Invoices API error:', error)
      return []
    }),
    { enabled: !!user }
  )

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = useQuery(
    'patient-payments',
    () => api.get('/api/payments/payments/').then(res => {
      console.log('Payments API response:', res.data)
      return res.data?.results || []
    }).catch(error => {
      console.error('Payments API error:', error)
      return []
    }),
    { enabled: !!user }
  )

  // Fetch payment providers
  const { data: providers, isLoading: providersLoading, error: providersError } = useQuery(
    'payment-providers',
    () => api.get('/api/payments/providers/').then(res => {
      console.log('Payment providers API response:', res.data)
      console.log('Payment providers API response type:', typeof res.data)
      console.log('Payment providers API response isArray:', Array.isArray(res.data))
      // Ensure we always return an array
      return Array.isArray(res.data) ? res.data : (res.data?.results || [])
    }).catch(error => {
      console.error('Payment providers API error:', error)
      console.error('Payment providers API error response:', error.response?.data)
      return [] // Return empty array on error
    }),
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
    return new Date(dateString).toLocaleDateString('ar-SA', {
      calendar: 'gregory',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getServiceTypeName = (serviceType) => {
    const serviceTypes = {
      consultation: 'استشارة',
      meal_plan: 'خطة وجبات',
      subscription: 'اشتراك'
    }
    return serviceTypes[serviceType] || serviceType
  }

  // Handle viewing invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceModal(true)
  }

  // Handle downloading invoice as PDF
  const handleDownloadInvoice = async (invoice) => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة ${invoice.invoice_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Cairo', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              background: white;
              color: #333;
              line-height: 1.6;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #007bff;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #007bff;
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .header h2 {
              color: #666;
              font-size: 24px;
              font-weight: 600;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              flex-wrap: wrap;
            }
            .info-section {
              flex: 1;
              min-width: 300px;
              margin: 10px;
            }
            .info-section h3 {
              color: #007bff;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .amounts-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .amount-row:last-child {
              border-bottom: none;
              font-weight: 700;
              font-size: 18px;
              color: #dc3545;
            }
            .amount-label {
              font-weight: 600;
            }
            .amount-value {
              font-weight: 600;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-partially_paid { background: #cce7ff; color: #004085; }
            .status-cancelled { background: #f8d7da; color: #721c24; }
            .status-refunded { background: #e2e3e5; color: #383d41; }
            .description-section {
              margin: 30px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .description-section h3 {
              color: #007bff;
              margin-bottom: 15px;
            }
            .notes-section {
              margin: 30px 0;
              padding: 20px;
              background: #fff3cd;
              border-radius: 8px;
              border-right: 4px solid #ffc107;
            }
            .notes-section h3 {
              color: #856404;
              margin-bottom: 15px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e9ecef;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; }
              .invoice-container { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>فاتورة مالية</h1>
              <h2>رقم الفاتورة: ${invoice.invoice_number}</h2>
            </div>

            <div class="invoice-info">
              <div class="info-section">
                <h3>معلومات الفاتورة</h3>
                <div class="info-row">
                  <span class="info-label">رقم الفاتورة:</span>
                  <span class="info-value">${invoice.invoice_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">نوع الخدمة:</span>
                  <span class="info-value">${getServiceTypeName(invoice.service_type)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">الحالة:</span>
                  <span class="info-value">
                    <span class="status-badge status-${invoice.status}">
                      ${getStatusBadge(invoice.status).text}
                    </span>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">تاريخ الإصدار:</span>
                  <span class="info-value">${formatDate(invoice.issue_date)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">تاريخ الاستحقاق:</span>
                  <span class="info-value">${formatDate(invoice.due_date)}</span>
                </div>
              </div>

              <div class="info-section">
                <h3>المبالغ المالية</h3>
                <div class="amounts-section">
                  <div class="amount-row">
                    <span class="amount-label">المبلغ الإجمالي:</span>
                    <span class="amount-value">${invoice.total_amount} د.ع</span>
                  </div>
                  <div class="amount-row">
                    <span class="amount-label">المبلغ المدفوع:</span>
                    <span class="amount-value">${invoice.paid_amount} د.ع</span>
                  </div>
                  ${invoice.discount_amount > 0 ? `
                  <div class="amount-row">
                    <span class="amount-label">مبلغ الخصم:</span>
                    <span class="amount-value">-${invoice.discount_amount} د.ع</span>
                  </div>
                  ` : ''}
                  <div class="amount-row">
                    <span class="amount-label">المبلغ المتبقي:</span>
                    <span class="amount-value">${invoice.outstanding_amount} د.ع</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="description-section">
              <h3>وصف الخدمة</h3>
              <p>${invoice.service_description}</p>
            </div>

            ${invoice.notes ? `
            <div class="notes-section">
              <h3>ملاحظات</h3>
              <p>${invoice.notes}</p>
            </div>
            ` : ''}

            <div class="footer">
              <p>تم إنشاء هذه الفاتورة تلقائياً من نظام إدارة العيادة</p>
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Create a new window to print the HTML as PDF
      const printWindow = window.open('', '_blank')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Close the window after printing
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }, 500)
      }
      
      toast.success('تم فتح نافذة الطباعة لتحميل الفاتورة كـ PDF')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('حدث خطأ في تحميل الفاتورة')
    }
  }

  if (invoicesLoading || paymentsLoading || providersLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Debug information and error handling
  if (invoicesError) {
    console.error('Invoices error:', invoicesError)
  }
  if (paymentsError) {
    console.error('Payments error:', paymentsError)
  }
  if (providersError) {
    console.error('Payment providers error:', providersError)
  }

  // Show error message if there are critical errors
  if (invoicesError || paymentsError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="alert alert-danger">
            <h5>حدث خطأ في تحميل البيانات</h5>
            <p>يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
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
                    {(invoices || []).map((invoice) => {
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
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewInvoice(invoice)}
                                title="عرض الفاتورة"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleDownloadInvoice(invoice)}
                                title="تحميل الفاتورة"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                              {invoice.status === 'pending' && invoice.outstanding_amount > 0 && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    setSelectedInvoice(invoice)
                                    setShowPaymentModal(true)
                                  }}
                                  title="دفع الفاتورة"
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
                    {(payments || []).map((payment) => {
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
                  
                  {/* QiCard - Selectable */}
                  <div className="row mb-3">
                    {(providers || []).filter(provider => provider.name === 'qicard').map((provider) => (
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

                  {/* Other Payment Methods - Information Only */}
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">وسائل الدفع الأخرى (للمعلومات فقط):</h6>
                    <div className="row">
                      {(providers || []).filter(provider => provider.name !== 'qicard').map((provider) => (
                        <div key={provider.id} className="col-6 mb-2">
                          <div className="card border-secondary">
                            <div className="card-body p-2">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-credit-card text-secondary me-2"></i>
                                <div>
                                  <div className="fw-bold text-secondary">{provider.display_name}</div>
                                  <small className="text-muted">
                                    رسوم: {provider.transaction_fee_percentage}% + {provider.transaction_fee_fixed} د.ع
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                {paymentProvider && (
                  <div className="alert alert-info">
                    <h6>ملخص الدفع:</h6>
                    {(() => {
                      const provider = (providers || []).find(p => p.id == paymentProvider)
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

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تفاصيل الفاتورة</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedInvoice(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary">معلومات الفاتورة</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold">رقم الفاتورة:</td>
                          <td>{selectedInvoice.invoice_number}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">نوع الخدمة:</td>
                          <td>{getServiceTypeName(selectedInvoice.service_type)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">الحالة:</td>
                          <td>
                            <span className={getStatusBadge(selectedInvoice.status).className}>
                              {getStatusBadge(selectedInvoice.status).text}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">تاريخ الإصدار:</td>
                          <td>{formatDate(selectedInvoice.issue_date)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">تاريخ الاستحقاق:</td>
                          <td>{formatDate(selectedInvoice.due_date)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary">المبالغ المالية</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold">المبلغ الإجمالي:</td>
                          <td className="text-success fw-bold">{selectedInvoice.total_amount} د.ع</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">المبلغ المدفوع:</td>
                          <td className="text-info">{selectedInvoice.paid_amount} د.ع</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">المبلغ المتبقي:</td>
                          <td className="text-danger fw-bold">{selectedInvoice.outstanding_amount} د.ع</td>
                        </tr>
                        {selectedInvoice.discount_amount > 0 && (
                          <tr>
                            <td className="fw-bold">مبلغ الخصم:</td>
                            <td className="text-warning">-{selectedInvoice.discount_amount} د.ع</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="row mt-3">
                  <div className="col-12">
                    <h6 className="text-primary">وصف الخدمة</h6>
                    <p className="text-muted">{selectedInvoice.service_description}</p>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="row mt-3">
                    <div className="col-12">
                      <h6 className="text-primary">ملاحظات</h6>
                      <p className="text-muted">{selectedInvoice.notes}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setSelectedInvoice(null)
                  }}
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                >
                  <i className="fas fa-download me-1"></i>
                  تحميل الفاتورة
                </button>
                {selectedInvoice.status === 'pending' && selectedInvoice.outstanding_amount > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setShowInvoiceModal(false)
                      setShowPaymentModal(true)
                    }}
                  >
                    <i className="fas fa-credit-card me-1"></i>
                    دفع الفاتورة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientPayments
