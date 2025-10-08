import React from 'react'
import { useLanguage } from '../../hooks/useLanguage'

const AdminDoctors = () => {
  const { t } = useLanguage()

  return (
    <div className="fade-in">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-0">
            <i className="fas fa-user-md text-success me-2"></i>
            إدارة الأطباء
          </h2>
          <p className="text-muted">إدارة الأطباء وطلبات الانضمام</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-5">
          <i className="fas fa-user-md text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">إدارة الأطباء</h5>
          <p className="text-muted">هذه الصفحة قيد التطوير</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDoctors
