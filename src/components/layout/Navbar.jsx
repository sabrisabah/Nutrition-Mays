import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { t, toggleLanguage, language } = useLanguage()

  const handleLogout = () => {
    if (window.confirm(t('confirm_logout') || 'هل أنت متأكد من تسجيل الخروج؟')) {
      logout()
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" href="/">
          <img src="/logo.svg" alt="Dr MAYS Logo" style={{ width: '120px', height: '120px' }} className="me-2" />
          <span className="fw-bold">Dr MAYS - Nutrition & Wellness</span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* Language Toggle */}
            <li className="nav-item">
              <button
                className="nav-link btn btn-link text-white"
                onClick={toggleLanguage}
              >
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
            </li>

            {/* Direct Logout Button */}
            <li className="nav-item">
              <button
                className="btn btn-outline-light btn-sm d-flex align-items-center"
                onClick={handleLogout}
                title="تسجيل الخروج"
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                <span className="d-none d-lg-inline">خروج</span>
              </button>
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <div className="bg-white rounded-circle p-1 me-2">
                  <i className="fas fa-user text-success"></i>
                </div>
                <span>{user?.first_name} {user?.last_name}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <h6 className="dropdown-header">
                    {t(user?.role)} - {user?.email}
                  </h6>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item" href="/profile">
                    <i className="fas fa-user me-2"></i>
                    {t('profile')}
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/settings">
                    <i className="fas fa-cog me-2"></i>
                    {t('settings')}
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item text-danger" 
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    {t('logout')}
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
