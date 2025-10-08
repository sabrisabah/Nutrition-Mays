import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'

const NotFound = () => {
  const { t, language } = useLanguage()

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="mb-4">
          <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '5rem' }}></i>
        </div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="mb-4">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        <p className="text-muted mb-4">
          {language === 'ar' 
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
            : 'Sorry, the page you are looking for does not exist or has been moved.'
          }
        </p>
        <Link to="/" className="btn btn-primary">
          <i className="fas fa-home me-2"></i>
          {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
        </Link>
      </div>
    </div>
  )
}

export default NotFound
