import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const getMenuItems = () => {
    switch (user?.role) {
      case 'patient':
        return [
          { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: t('dashboard') },
          { path: '/profile', icon: 'fas fa-user', label: t('profile') },
          { path: '/meal-plans', icon: 'fas fa-utensils', label: t('meal_plans') },
          { path: '/appointments', icon: 'fas fa-calendar-check', label: t('appointments') },
          { path: '/payments', icon: 'fas fa-credit-card', label: t('payments') },
        ]
      
      case 'doctor':
        return [
          { path: '/doctor/dashboard', icon: 'fas fa-tachometer-alt', label: t('dashboard') },
          { path: '/doctor/profile', icon: 'fas fa-user', label: t('profile') },
          { path: '/doctor/patients', icon: 'fas fa-users', label: t('patients') },
          { path: '/doctor/meal-plans', icon: 'fas fa-utensils', label: t('meal_plans') },
        ]
      
      case 'admin':
        return [
          { path: '/admin/dashboard', icon: 'fas fa-tachometer-alt', label: t('dashboard') },
          { path: '/admin/users', icon: 'fas fa-users', label: t('users') },
          { path: '/admin/doctors', icon: 'fas fa-user-md', label: t('doctors') },
          { path: '/admin/payments', icon: 'fas fa-credit-card', label: t('payments') },
          { path: '/admin/reports', icon: 'fas fa-chart-bar', label: t('reports') },
          { path: '/admin/settings', icon: 'fas fa-cog', label: t('settings') },
        ]
      
      case 'accountant':
        return [
          { path: '/accountant/dashboard', icon: 'fas fa-tachometer-alt', label: t('dashboard') },
          { path: '/accountant/payments', icon: 'fas fa-credit-card', label: t('payments') },
          { path: '/accountant/reports', icon: 'fas fa-chart-bar', label: t('reports') },
        ]
      
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div className="sidebar bg-dark" style={{ minWidth: '250px', minHeight: '100vh' }}>
      <div className="p-3">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center">
            <img src="/logo.svg" alt="Dr MAYS Logo" style={{ width: '160px', height: '160px' }} />
          </div>
          <h6 className="text-white mt-2 mb-0">Dr MAYS</h6>
          <small className="text-white-50">Nutrition & Wellness</small>
        </div>

        <nav className="nav flex-column">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link text-white d-flex align-items-center p-3 rounded mb-1 ${
                  isActive ? 'bg-success' : ''
                }`
              }
            >
              <i className={`${item.icon} me-3`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Role Badge */}
        <div className="mt-4 pt-4 border-top border-secondary">
          <div className="d-flex align-items-center mb-3">
            <div className="bg-success rounded-circle p-2 me-2">
              <i className="fas fa-user text-white"></i>
            </div>
            <div>
              <div className="text-white small fw-bold">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-white-50 small">
                {t(user?.role)}
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                logout()
              }
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
