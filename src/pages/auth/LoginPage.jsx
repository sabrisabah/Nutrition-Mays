import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const LoginPage = () => {
  const { login, loading, user } = useAuth()
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })

  // Redirect if already logged in
  if (user) {
    let dashboardPath = '/dashboard'
    if (user.role === 'doctor') {
      dashboardPath = '/doctor/dashboard'
    } else if (user.role === 'admin') {
      dashboardPath = '/admin/dashboard'
    } else if (user.role === 'accountant') {
      dashboardPath = '/accountant/dashboard'
    }
    return <Navigate to={dashboardPath} replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(formData)
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                {/* Logo */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3">
                    <img src="/logo.svg" alt="Dr MAYS Logo" style={{ width: '240px', height: '240px' }} />
                  </div>
                
                  <h4 className="text-primary mb-3">
                    {language === 'ar' ? 'تسجيل الدخول للمريض' : 'Patient Login'}
                  </h4>
                </div>

                {/* Login Form */}
                <div className="alert alert-info mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong> 
                  {language === 'ar' ? ' استخدم رقم الهاتف المسجل في حسابك للدخول. رقم الهاتف هو اسم المستخدم الخاص بك.' : ' Use your registered phone number to login. Phone number is your username.'}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-phone text-muted"></i>
                      </span>
                      <input
                        type="tel"
                        className="form-control border-start-0"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      {t('password')}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2 fw-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" color="light" />
                        <span className="ms-2">
                          {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}
                        </span>
                      </>
                    ) : (
                      t('login')
                    )}
                  </button>
                  
                  {loading && (
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        {language === 'ar' ? 'يرجى الانتظار...' : 'Please wait...'}
                      </small>
                    </div>
                  )}
                </form>

                {/* Register Link */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
                    <Link to="/register" className="text-success fw-bold ms-1">
                      {t('register')}
                    </Link>
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
