import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatTime12Hour } from '../../utils/timeUtils'
import api from '../../services/api'

const DoctorProfile = () => {
  const { t } = useLanguage()
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [availabilityForm, setAvailabilityForm] = useState({
    weekday: '',
    start_time: '',
    end_time: ''
  })
  
  // State for available days checkboxes
  const [availableDays, setAvailableDays] = useState({
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false
  })

  // Fetch doctor profile
  const { data: profile, isLoading: profileLoading } = useQuery(
    'doctor-profile',
    () => api.get('/api/auth/doctor-profile/').then(res => res.data),
    { enabled: !!user }
  )

  // Update available days when profile loads
  React.useEffect(() => {
    if (profile?.available_days) {
      const days = profile.available_days.split(',')
      const newAvailableDays = {
        Mon: days.includes('Mon'),
        Tue: days.includes('Tue'),
        Wed: days.includes('Wed'),
        Thu: days.includes('Thu'),
        Fri: days.includes('Fri'),
        Sat: days.includes('Sat'),
        Sun: days.includes('Sun')
      }
      setAvailableDays(newAvailableDays)
    } else {
      // Set default days if none exist
      setAvailableDays({
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: false,
        Sun: false
      })
    }
  }, [profile])

  // Profile update mutation
  const profileMutation = useMutation(
    (data) => api.put('/api/auth/doctor-profile/', data),
    {
      onSuccess: (data) => {
        toast.success('تم تحديث الملف الشخصي بنجاح')
        queryClient.invalidateQueries('doctor-profile')
        if (data.user) {
          updateUser(data.user)
        }
      },
      onError: (error) => {
        console.error('Profile update error:', error)
        if (error.response?.data) {
          const errorData = error.response.data
          if (typeof errorData === 'object') {
            Object.keys(errorData).forEach(key => {
              if (Array.isArray(errorData[key])) {
                toast.error(`${key}: ${errorData[key][0]}`)
              } else {
                toast.error(`${key}: ${errorData[key]}`)
              }
            })
          } else {
            toast.error('فشل في تحديث الملف الشخصي')
          }
        } else {
          toast.error('فشل في تحديث الملف الشخصي')
        }
      }
    }
  )

  // Add availability mutation
  const availabilityMutation = useMutation(
    (data) => api.post('/api/bookings/availability/', data),
    {
      onSuccess: () => {
        toast.success('تم إضافة الوقت المتاح بنجاح')
        setAvailabilityForm({
          weekday: '',
          start_time: '',
          end_time: ''
        })
      },
      onError: (error) => {
        toast.error('فشل في إضافة الوقت المتاح')
      }
    }
  )

  // Handle checkbox change for available days
  const handleAvailableDayChange = (day) => {
    setAvailableDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }))
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Get selected days from state
    const selectedDays = Object.keys(availableDays).filter(day => availableDays[day])
    
    // Convert FormData to object, excluding checkboxes (handled separately)
    const data = {}
    for (let [key, value] of formData.entries()) {
      if (key !== 'available_days') {
        data[key] = value
      }
    }
    
    // Add selected days
    data.available_days = selectedDays.join(',')
    
    // Validate required fields
    if (!data.license_number?.trim()) {
      toast.error('رقم الترخيص مطلوب')
      return
    }
    
    if (!data.specialization?.trim()) {
      toast.error('التخصص مطلوب')
      return
    }
    
    if (!data.education?.trim()) {
      toast.error('التعليم والمؤهلات مطلوب')
      return
    }
    
    if (selectedDays.length === 0) {
      toast.error('يجب اختيار يوم واحد على الأقل')
      return
    }
    
    // Convert numeric fields
    if (data.years_of_experience) {
      const years = parseInt(data.years_of_experience)
      if (isNaN(years) || years < 0) {
        toast.error('سنوات الخبرة يجب أن تكون رقم صحيح')
        return
      }
      data.years_of_experience = years
    } else {
      data.years_of_experience = 0
    }
    
    if (data.consultation_fee) {
      const fee = parseFloat(data.consultation_fee)
      if (isNaN(fee) || fee < 0) {
        toast.error('رسوم الاستشارة يجب أن تكون رقم صحيح')
        return
      }
      data.consultation_fee = fee
    } else {
      data.consultation_fee = 0
    }
    
    // Set default values for optional fields
    data.certifications = data.certifications || ''
    data.bio = data.bio || ''
    
    // Format time fields
    if (data.available_hours_start && !data.available_hours_start.includes(':')) {
      data.available_hours_start = data.available_hours_start + ':00'
    }
    if (data.available_hours_end && !data.available_hours_end.includes(':')) {
      data.available_hours_end = data.available_hours_end + ':00'
    }
    
    console.log('Profile form data being sent:', data)
    console.log('Available days state:', availableDays)
    console.log('Selected days:', selectedDays)
    
    profileMutation.mutate(data)
  }

  const handleAvailabilitySubmit = (e) => {
    e.preventDefault()
    availabilityMutation.mutate(availabilityForm)
  }

  const handleAvailabilityChange = (e) => {
    setAvailabilityForm({
      ...availabilityForm,
      [e.target.name]: e.target.value
    })
  }

  const getDayName = (weekday) => {
    const days = {
      0: 'الاثنين',
      1: 'الثلاثاء',
      2: 'الأربعاء',
      3: 'الخميس',
      4: 'الجمعة',
      5: 'السبت',
      6: 'الأحد'
    }
    return days[weekday] || weekday
  }


  if (profileLoading) {
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
            <i className="fas fa-user-md text-primary me-2"></i>
            الملف الشخصي للطبيب
          </h2>
          <p className="text-muted">إدارة معلوماتك المهنية والأوقات المتاحة</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user me-2"></i>
            المعلومات المهنية
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            <i className="fas fa-calendar me-2"></i>
            الأوقات المتاحة
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <i className="fas fa-chart-bar me-2"></i>
            الإحصائيات
          </button>
        </li>
      </ul>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">المعلومات المهنية</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleProfileSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">رقم الترخيص *</label>
                    <input
                      type="text"
                      name="license_number"
                      className="form-control"
                      defaultValue={profile?.license_number || ''}
                      required
                      placeholder="أدخل رقم الترخيص"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">التخصص *</label>
                    <input
                      type="text"
                      name="specialization"
                      className="form-control"
                      defaultValue={profile?.specialization || ''}
                      required
                      placeholder="مثل: تغذية علاجية، طب باطني"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">سنوات الخبرة *</label>
                    <input
                      type="number"
                      name="years_of_experience"
                      className="form-control"
                      defaultValue={profile?.years_of_experience || ''}
                      min="0"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">رسوم الاستشارة (د.ع) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="consultation_fee"
                      className="form-control"
                      defaultValue={profile?.consultation_fee || ''}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">التعليم والمؤهلات *</label>
                    <textarea
                      name="education"
                      className="form-control"
                      rows="3"
                      defaultValue={profile?.education || ''}
                      required
                      placeholder="اذكر شهاداتك الجامعية والعليا..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">الشهادات المهنية</label>
                    <textarea
                      name="certifications"
                      className="form-control"
                      rows="3"
                      defaultValue={profile?.certifications || ''}
                      placeholder="اذكر الشهادات المهنية والدورات التدريبية..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">نبذة شخصية</label>
                    <textarea
                      name="bio"
                      className="form-control"
                      rows="3"
                      defaultValue={profile?.bio || ''}
                      placeholder="نبذة عن خبرتك ومجال تخصصك..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">الأيام المتاحة</label>
                    <div className="row">
                      {[
                        { value: 'Mon', label: 'الاثنين' },
                        { value: 'Tue', label: 'الثلاثاء' },
                        { value: 'Wed', label: 'الأربعاء' },
                        { value: 'Thu', label: 'الخميس' },
                        { value: 'Fri', label: 'الجمعة' },
                        { value: 'Sat', label: 'السبت' },
                        { value: 'Sun', label: 'الأحد' }
                      ].map((day) => (
                        <div key={day.value} className="col-6 col-md-4 col-lg-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="available_days"
                              value={day.value}
                              id={`day_${day.value}`}
                              checked={availableDays[day.value]}
                              onChange={() => handleAvailableDayChange(day.value)}
                            />
                            <label className="form-check-label" htmlFor={`day_${day.value}`}>
                              {day.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    <small className="text-muted">اختر الأيام التي تكون متاحاً فيها للمواعيد</small>
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">بداية الدوام</label>
                        <input
                          type="time"
                          name="available_hours_start"
                          className="form-control"
                          defaultValue={profile?.available_hours_start || '09:00'}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">نهاية الدوام</label>
                        <input
                          type="time"
                          name="available_hours_end"
                          className="form-control"
                          defaultValue={profile?.available_hours_end || '17:00'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-end">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={profileMutation.isLoading}
                >
                  {profileMutation.isLoading ? <LoadingSpinner size="sm" color="light" /> : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div>
          {/* Add New Availability */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-calendar-plus text-success me-2"></i>
                إدارة الأوقات المتاحة
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>ملاحظة:</strong> يتم إدارة الأوقات المتاحة من خلال "الأيام المتاحة" و "أوقات الدوام" في المعلومات المهنية أعلاه.
                يمكنك أيضاً إضافة أوقات محددة إضافية هنا.
              </div>
              
              <form onSubmit={handleAvailabilitySubmit}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">اليوم *</label>
                    <select
                      name="weekday"
                      className="form-select"
                      value={availabilityForm.weekday}
                      onChange={handleAvailabilityChange}
                      required
                    >
                      <option value="">اختر اليوم</option>
                      <option value="0">الاثنين</option>
                      <option value="1">الثلاثاء</option>
                      <option value="2">الأربعاء</option>
                      <option value="3">الخميس</option>
                      <option value="4">الجمعة</option>
                      <option value="5">السبت</option>
                      <option value="6">الأحد</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">من الساعة *</label>
                    <input
                      type="time"
                      name="start_time"
                      className="form-control"
                      value={availabilityForm.start_time}
                      onChange={handleAvailabilityChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">إلى الساعة *</label>
                    <input
                      type="time"
                      name="end_time"
                      className="form-control"
                      value={availabilityForm.end_time}
                      onChange={handleAvailabilityChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-8">
                    <small className="text-muted">
                      <i className="fas fa-lightbulb me-1"></i>
                      استخدم هذا النموذج لإضافة أوقات محددة إضافية (مثل: استراحة الغداء، مواعيد خاصة)
                    </small>
                  </div>
                  <div className="col-md-4 text-end">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={availabilityMutation.isLoading}
                    >
                      {availabilityMutation.isLoading ? <LoadingSpinner size="sm" color="light" /> : 'إضافة وقت إضافي'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>


        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">إحصائيات المواعيد</h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-primary mb-1">156</h3>
                      <small className="text-muted">إجمالي المواعيد</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="bg-success bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-success mb-1">142</h3>
                      <small className="text-muted">المواعيد المكتملة</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-warning mb-1">8</h3>
                      <small className="text-muted">المواعيد الملغية</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-info bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-info mb-1">91%</h3>
                      <small className="text-muted">معدل الإنجاز</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">التقييمات</h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <h2 className="text-warning mb-1">4.8</h2>
                  <div className="mb-2">
                    <i className="fas fa-star text-warning"></i>
                    <i className="fas fa-star text-warning"></i>
                    <i className="fas fa-star text-warning"></i>
                    <i className="fas fa-star text-warning"></i>
                    <i className="fas fa-star text-warning"></i>
                  </div>
                  <p className="text-muted">من 47 تقييم</p>
                </div>
                
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>5 نجوم</span>
                    <span>35</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '74%' }}></div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>4 نجوم</span>
                    <span>8</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '17%' }}></div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>3 نجوم</span>
                    <span>3</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '6%' }}></div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span>2 نجوم</span>
                    <span>1</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '2%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="d-flex justify-content-between">
                    <span>1 نجمة</span>
                    <span>0</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">إحصائيات خطط الوجبات</h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3 mb-3">
                    <div className="bg-success bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-success mb-1">23</h3>
                      <small className="text-muted">خطط الوجبات المنشأة</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-primary mb-1">18</h3>
                      <small className="text-muted">الخطط النشطة</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="bg-info bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-info mb-1">67</h3>
                      <small className="text-muted">إجمالي المرضى</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                      <h3 className="text-warning mb-1">78%</h3>
                      <small className="text-muted">معدل الالتزام</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorProfile
