import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const RegisterPage = () => {
  const { register, loading, user } = useAuth()
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'patient',
    // Physical information
    gender: '',
    height: '',
    current_weight: '',
    goal: ''
  })
  const [errors, setErrors] = useState({})

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    console.log('Submitting registration form:', formData)
    
    try {
      const result = await register(formData)
      console.log('Registration result:', result)
      
      if (!result.success && result.error) {
        setErrors(result.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: ['حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'] })
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                {/* Logo */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3">
                    <img src="/logo.svg" alt="Dr MAYS Logo" style={{ width: '240px', height: '240px' }} />
                  </div>
                  <h2 className="text-success fw-bold mb-2">Dr MAYS</h2>
                  <p className="text-muted">Nutrition & Wellness</p>
                  <h4 className="text-primary mb-3">
                    {language === 'ar' ? 'تسجيل حساب مريض جديد' : 'Register New Patient Account'}
                  </h4>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit}>
                  {/* General Error Display */}
                  {errors.general && (
                    <div className="alert alert-danger mb-3">
                      {errors.general.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="first_name" className="form-label">
                        {t('first_name')}
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                      {errors.first_name && (
                        <div className="invalid-feedback">{errors.first_name[0]}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="last_name" className="form-label">
                        {t('last_name')}
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                      {errors.last_name && (
                        <div className="invalid-feedback">{errors.last_name[0]}</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                    {errors.username && (
                      <div className="invalid-feedback">{errors.username[0]}</div>
                    )}
                  </div>


                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      {t('phone')} *
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone[0]}</div>
                    )}
                  </div>

                  {/* Physical Information Section */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="fas fa-ruler me-2"></i>
                        {language === 'ar' ? 'المعلومات البدنية' : 'Physical Information'}
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="gender" className="form-label">
                            {language === 'ar' ? 'الجنس *' : 'Gender *'}
                          </label>
                          <select
                            className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                          >
                            <option value="">{language === 'ar' ? 'اختر الجنس' : 'Select Gender'}</option>
                            <option value="male">{language === 'ar' ? 'ذكر' : 'Male'}</option>
                            <option value="female">{language === 'ar' ? 'أنثى' : 'Female'}</option>
                          </select>
                          {errors.gender && (
                            <div className="invalid-feedback">{errors.gender[0]}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="height" className="form-label">
                            {language === 'ar' ? 'الطول (سم) *' : 'Height (cm) *'}
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                            id="height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            placeholder="170"
                            min="100"
                            max="250"
                            required
                          />
                          {errors.height && (
                            <div className="invalid-feedback">{errors.height[0]}</div>
                          )}
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="current_weight" className="form-label">
                            {language === 'ar' ? 'الوزن (كجم) *' : 'Weight (kg) *'}
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.current_weight ? 'is-invalid' : ''}`}
                            id="current_weight"
                            name="current_weight"
                            value={formData.current_weight}
                            onChange={handleChange}
                            placeholder="70"
                            min="30"
                            max="300"
                            required
                          />
                          {errors.current_weight && (
                            <div className="invalid-feedback">{errors.current_weight[0]}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="goal" className="form-label">
                            {language === 'ar' ? 'أهداف اللياقة *' : 'Fitness Goals *'}
                          </label>
                          <select
                            className={`form-control ${errors.goal ? 'is-invalid' : ''}`}
                            id="goal"
                            name="goal"
                            value={formData.goal}
                            onChange={handleChange}
                            required
                          >
                            <option value="">{language === 'ar' ? 'اختر الهدف' : 'Select Goal'}</option>
                            <option value="lose_weight">{language === 'ar' ? 'إنقاص الوزن' : 'Lose Weight'}</option>
                            <option value="gain_weight">{language === 'ar' ? 'زيادة الوزن' : 'Gain Weight'}</option>
                            <option value="maintain_weight">{language === 'ar' ? 'الحفاظ على الوزن' : 'Maintain Weight'}</option>
                            <option value="build_muscle">{language === 'ar' ? 'بناء العضلات' : 'Build Muscle'}</option>
                            <option value="improve_health">{language === 'ar' ? 'تحسين الصحة العامة' : 'Improve Health'}</option>
                          </select>
                          {errors.goal && (
                            <div className="invalid-feedback">{errors.goal[0]}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role is automatically set to 'patient' */}
                  <input type="hidden" name="role" value="patient" />
                  
                  <div className="alert alert-info mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong> 
                    {language === 'ar' ? ' التسجيل متاح للمرضى فقط. سيتم إنشاء حساب مريض تلقائياً. رقم الهاتف سيستخدم كاسم مستخدم للدخول.' : ' Registration is available for patients only. A patient account will be created automatically. Phone number will be used as username for login.'}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        {t('password')}
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password[0]}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-4">
                      <label htmlFor="password_confirm" className="form-label">
                        {t('confirm_password')}
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                        id="password_confirm"
                        name="password_confirm"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                      />
                      {errors.password_confirm && (
                        <div className="invalid-feedback">{errors.password_confirm[0]}</div>
                      )}
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
                          {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...'}
                        </span>
                      </>
                    ) : (
                      t('register')
                    )}
                  </button>
                  
                  {loading && (
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        {language === 'ar' ? 'يرجى الانتظار، قد يستغرق هذا بضع ثوانٍ...' : 'Please wait, this may take a few seconds...'}
                      </small>
                    </div>
                  )}
                </form>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    {language === 'ar' ? 'لديك حساب بالفعل؟' : "Already have an account?"}
                    <Link to="/login" className="text-success fw-bold ms-1">
                      {t('login')}
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

export default RegisterPage
