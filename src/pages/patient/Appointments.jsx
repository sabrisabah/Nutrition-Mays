import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatTime12Hour, formatDateGregorian } from '../../utils/timeUtils'
import api from '../../services/api'

const PatientAppointments = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showSimpleBookingModal, setShowSimpleBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    appointment_type: 'consultation',
    doctor: '',
    preferred_date: '',
    preferred_time: '',
    chief_complaint: 'استشارة تغذية',
    notes: '',
    payment_method: '', // 'online' or 'visit'
    phone_number: ''
  })
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])

  // Reset booking form
  const resetBookingForm = () => {
    setBookingForm({
      appointment_type: 'consultation',
      doctor: '',
      preferred_date: '',
      preferred_time: '',
      chief_complaint: 'استشارة تغذية',
      notes: '',
      payment_method: '',
      phone_number: ''
    })
    setAvailableTimeSlots([])
  }

  // Fetch patient appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery(
    'patient-appointments',
    () => api.get('/api/bookings/appointments/').then(res => res.data.results),
    { enabled: !!user }
  )

  // Fetch doctors list
  const { data: doctorsResponse, isLoading: doctorsLoading, refetch: refetchDoctors, error: doctorsError } = useQuery(
    'doctors-list',
    () => api.get('/api/auth/doctors/').then(res => res.data),
    { 
      enabled: !!user,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache the data
      refetchOnWindowFocus: true, // Refetch when window gains focus
      onError: (error) => {
        console.error('Error loading doctors:', error)
        toast.error('فشل في تحميل قائمة الأطباء')
      }
    }
  )

  // Extract doctors array from response
  let doctors = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse?.results || [])
  
  // If no doctors are loaded from server, use fallback data
  if (!doctors || doctors.length === 0) {
    doctors = [
      {
        id: 2, // Use the actual DoctorProfile ID from database
        user: { 
          id: 10, 
          first_name: 'Dr Mays', 
          last_name: 'Al-rubay',
          get_full_name: () => 'Dr Mays Al-rubay'
        },
        specialization: 'Therapeutic nutrition',
        consultation_fee: 50000,
        years_of_experience: 8
      },
      
    ]
  }
  
  // Debug logging
  console.log('Doctors Response:', doctorsResponse)
  console.log('Doctors Array:', doctors)
  console.log('Doctors Length:', doctors?.length)
  console.log('Is Array:', Array.isArray(doctors))
  console.log('Doctors Details:', doctors?.map(d => ({ id: d.id, user_id: d.user?.id, name: `${d.user?.first_name} ${d.user?.last_name}` })))

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    (appointmentId) => api.post(`/api/bookings/appointments/${appointmentId}/cancel/`),
    {
      onSuccess: () => {
        toast.success('تم إلغاء الموعد بنجاح')
        queryClient.invalidateQueries('patient-appointments')
        setSelectedAppointment(null)
      },
      onError: (error) => {
        toast.error('فشل في إلغاء الموعد')
        console.error('Cancel error:', error)
      }
    }
  )

  // Book appointment mutation
  const bookAppointmentMutation = useMutation(
    (bookingData) => api.post('/api/bookings/appointments/', bookingData),
    {
      onSuccess: () => {
        toast.success('تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً لتأكيد الموعد.')
        queryClient.invalidateQueries('patient-appointments')
        setShowSimpleBookingModal(false)
        setBookingForm({
          appointment_type: 'consultation',
          doctor: '',
          preferred_date: '',
          preferred_time: '',
          chief_complaint: 'استشارة تغذية',
          notes: '',
          payment_method: '',
          phone_number: ''
        })
        setAvailableTimeSlots([])
      },
      onError: (error) => {
        console.error('Booking error:', error)
        console.error('Error response:', error.response?.data)
        
        let errorMessage = 'فشل في إرسال طلب الحجز'
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response?.data) {
          const fieldErrors = Object.values(error.response.data).flat()
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ')
          }
        }
        
        toast.error(errorMessage)
      }
    }
  )



  const getUpcomingAppointments = () => {
    if (!appointments) return []
    const today = new Date()
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_date)
      return appointmentDate >= today && appointment.status !== 'cancelled'
    })
  }

  const getPastAppointments = () => {
    if (!appointments) return []
    const today = new Date()
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_date)
      return appointmentDate < today || appointment.status === 'cancelled'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge bg-success">مؤكد</span>
      case 'pending':
        return <span className="badge bg-warning">في الانتظار</span>
      case 'cancelled':
        return <span className="badge bg-danger">ملغي</span>
      case 'completed':
        return <span className="badge bg-info">مكتمل</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  const getAppointmentTypeText = (type) => {
    switch (type) {
      case 'consultation':
        return 'استشارة'
      case 'follow_up':
        return 'متابعة'
      default:
        return type
    }
  }

  // Function to format doctor name in Arabic format
  const formatDoctorName = (doctor) => {
    if (!doctor || !doctor.user) return 'غير محدد'
    const firstName = doctor.user.first_name || ''
    const lastName = doctor.user.last_name || ''
    
    // If we have both names, format as "د.ميس الربيعي"
    if (firstName && lastName) {
      return `د.${firstName} ${lastName}`
    }
    
    // Fallback to original format
    return `د. ${firstName} ${lastName}`.trim()
  }

  // Function to format doctor name from appointment data
  const formatDoctorNameFromAppointment = (doctorName) => {
    if (!doctorName) return 'غير محدد'
    
    // If the name already has "د." prefix, remove it and reformat
    let cleanName = doctorName.replace(/^د\.?\s*/, '')
    
    // Split by space to get first and last name
    const nameParts = cleanName.trim().split(/\s+/)
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')
      return `د.${firstName} ${lastName}`
    }
    
    // If only one name part, return as is with د. prefix
    return `د.${cleanName}`
  }

  const handleCancelAppointment = (appointmentId) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
      cancelAppointmentMutation.mutate(appointmentId)
    }
  }

  // Check if date is within allowed days (Saturday to Thursday)
  const isDateAllowed = (dateString) => {
    const date = new Date(dateString)
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Saturday = 6, Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4
    // Friday = 5 is not allowed
    return dayOfWeek !== 5 // Not Friday
  }

  // Generate available time slots (5 PM to 8 PM)
  const generateAvailableTimeSlots = () => {
    const slots = []
    const startHour = 17 // 5 PM
    const endHour = 20   // 8 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          end_time: minute === 30 ? `${hour.toString().padStart(2, '0')}:00` : `${(hour + 1).toString().padStart(2, '0')}:00`,
          duration: 30,
          available: true
        })
      }
    }
    
    return slots
  }

  // Fetch available time slots
  const fetchAvailableTimeSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableTimeSlots([])
      return
    }

    // Check if date is allowed (Saturday to Thursday)
    if (!isDateAllowed(date)) {
      setAvailableTimeSlots([])
      return
    }

    // Use generated time slots instead of API call
    const generatedSlots = generateAvailableTimeSlots()
    setAvailableTimeSlots(generatedSlots)
    console.log('Generated time slots:', generatedSlots)
  }

  const handleBookingFormChange = (e) => {
    const { name, value } = e.target
    console.log(`Form field changed: ${name} = ${value}`)
    
    if (name === 'doctor') {
      console.log('Doctor selected:', value)
      console.log('Available doctors:', doctors?.map(d => ({ id: d.user?.id, name: `${d.user?.first_name} ${d.user?.last_name}` })))
      
      // Clear time selection when doctor changes
      setBookingForm(prev => ({
        ...prev,
        [name]: value,
        preferred_time: ''
      }))
      
      // Fetch available time slots for the selected doctor and date
      if (value && bookingForm.preferred_date) {
        const selectedDoctor = doctors.find(doc => doc.id.toString() === value.toString())
        if (selectedDoctor) {
          fetchAvailableTimeSlots(selectedDoctor.user.id, bookingForm.preferred_date)
        }
      }
    } else if (name === 'preferred_date') {
      // Check if selected date is Friday
      if (value && !isDateAllowed(value)) {
        toast.error('يوم الجمعة عطلة رسمية. يرجى اختيار تاريخ آخر من السبت إلى الخميس.')
        setBookingForm(prev => ({
          ...prev,
          preferred_date: '',
          preferred_time: ''
        }))
        setAvailableTimeSlots([])
        return
      }
      
      // Fetch available time slots when date changes
      if (value && bookingForm.doctor) {
        const selectedDoctor = doctors.find(doc => doc.id.toString() === bookingForm.doctor.toString())
        if (selectedDoctor) {
          fetchAvailableTimeSlots(selectedDoctor.user.id, value)
        }
      }
      
      // Clear time selection when date changes
      setBookingForm(prev => ({
        ...prev,
        [name]: value,
        preferred_time: ''
      }))
    } else {
      setBookingForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleBookingSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!bookingForm.doctor || !bookingForm.preferred_date || !bookingForm.preferred_time) {
      toast.error('يرجى اختيار الطبيب والتاريخ والوقت المفضل')
      return
    }

    // Validate payment method
    if (!bookingForm.payment_method) {
      toast.error('يرجى اختيار طريقة الدفع')
      return
    }

    // No additional validation needed for online payment (Qcard info is displayed)

    // Check if date is allowed (Saturday to Thursday)
    if (!isDateAllowed(bookingForm.preferred_date)) {
      toast.error('التواريخ المتاحة من السبت إلى الخميس فقط')
      return
    }

    // Validate doctors are loaded
    if (!doctors || doctors.length === 0) {
      toast.error('لا توجد أطباء متاحين حالياً. يرجى المحاولة لاحقاً.')
      return
    }

    // Validate doctor exists
    const selectedDoctor = doctors.find(doc => doc.id.toString() === bookingForm.doctor.toString())
    if (!selectedDoctor) {
      toast.error('الطبيب المختار غير موجود')
      return
    }

    // Prepare booking data
    const bookingData = {
      doctor: selectedDoctor.user.id, // Use the user ID, not the doctor profile ID
      appointment_type: bookingForm.appointment_type,
      scheduled_date: bookingForm.preferred_date,
      scheduled_time: bookingForm.preferred_time,
      duration: 30, // Default duration in minutes
      chief_complaint: bookingForm.chief_complaint || '',
      notes_from_patient: bookingForm.notes || '',
      payment_method: bookingForm.payment_method
    }

    console.log('=== Booking Data Debug ===')
    console.log('bookingForm:', bookingForm)
    console.log('bookingData:', bookingData)
    console.log('doctor value type:', typeof bookingData.doctor)
    console.log('doctor value:', bookingData.doctor)

    bookAppointmentMutation.mutate(bookingData)
  }


  if (appointmentsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const upcomingAppointments = getUpcomingAppointments()
  const pastAppointments = getPastAppointments()

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-calendar-check text-success me-2"></i>
                المواعيد
              </h2>
              <p className="text-muted">إدارة مواعيدك مع الأطباء</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowBookingModal(true)}
              >
                <i className="fas fa-calendar-plus me-2"></i>
                حجز موعد جديد
              </button>
              <button 
                className="btn btn-outline-success"
                onClick={() => {
                  // Create CSV content
                  const csvContent = [
                    ['التاريخ', 'الوقت', 'نوع الموعد', 'الطبيب', 'الحالة'],
                    ...(appointments || []).map(apt => [
                      formatDateGregorian(apt.scheduled_date),
                      formatTime12Hour(apt.scheduled_time),
                      getAppointmentTypeText(apt.appointment_type),
                      formatDoctorNameFromAppointment(apt.doctor_name),
                      apt.status
                    ])
                  ].map(row => row.join(',')).join('\n')
                  
                  // Download CSV
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                  const link = document.createElement('a')
                  const url = URL.createObjectURL(blob)
                  link.setAttribute('href', url)
                  link.setAttribute('download', `مواعيد_${user?.first_name}_${new Date().toISOString().split('T')[0]}.csv`)
                  link.style.visibility = 'hidden'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  
                  toast.success('تم تصدير المواعيد بنجاح')
                }}
              >
                <i className="fas fa-download me-2"></i>
                تصدير المواعيد
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info Alert */}
      {user && (
        <div className="alert alert-info mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-info-circle me-2"></i>
            <div>
              <strong>مرحباً {user.first_name}!</strong>
              <br />
              <small>هنا يمكنك متابعة مواعيدك مع الأطباء وإدارتها.</small>
              <br />
              <small className="text-primary">
                <i className="fas fa-phone me-1"></i>
                للاستفسارات: <strong>+9647879558889</strong>
                <button 
                  className="btn btn-sm btn-outline-primary ms-2"
                  onClick={() => window.open('tel:+9647879558889', '_self')}
                >
                  <i className="fas fa-phone me-1"></i>
                  اتصل
                </button>
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <i className="fas fa-calendar-plus me-2"></i>
            المواعيد القادمة
            {upcomingAppointments.length > 0 && (
              <span className="badge bg-primary ms-2">{upcomingAppointments.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <i className="fas fa-calendar-times me-2"></i>
            المواعيد السابقة
            {pastAppointments.length > 0 && (
              <span className="badge bg-secondary ms-2">{pastAppointments.length}</span>
            )}
          </button>
        </li>
      </ul>

      {/* Upcoming Appointments Tab */}
      {activeTab === 'upcoming' && (
        <div className="row">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 border-primary">
                  <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="fas fa-calendar me-2"></i>
                        {getAppointmentTypeText(appointment.appointment_type)}
                      </h6>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      {formatDoctorNameFromAppointment(appointment.doctor_name)}
                      {appointment.doctor_specialization && (
                        <small className="text-muted d-block">
                          {(() => {
                            const specializationNames = {
                              'nutrition': 'تغذية علاجية',
                              'general': 'طب عام',
                              'specialist': 'أخصائي'
                            }
                            return specializationNames[appointment.doctor_specialization] || appointment.doctor_specialization
                          })()}
                        </small>
                      )}
                    </h6>
                    <p className="card-text text-muted">
                      {appointment.chief_complaint || 'لا يوجد شكوى رئيسية'}
                    </p>
                    
                    <div className="mb-3">
                      <small className="text-muted">التاريخ:</small>
                      <div className="fw-bold text-primary">
                        {formatDateGregorian(appointment.scheduled_date)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">الوقت:</small>
                      <div className="fw-bold text-info">
                        {formatTime12Hour(appointment.scheduled_time)}
                      </div>
                    </div>

                    <div className="row text-center mb-3">
                      <div className="col-12">
                        <small className="text-muted">المدة</small>
                        <div className="fw-bold text-success">{appointment.duration} دقيقة</div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mb-3">
                        <small className="text-muted">ملاحظات:</small>
                        <div className="small text-muted">{appointment.notes}</div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary flex-fill"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <i className="fas fa-eye me-2"></i>
                        عرض التفاصيل
                      </button>
                      {appointment.status === 'confirmed' && (
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancelAppointmentMutation.isLoading}
                        >
                          <i className="fas fa-times me-1"></i>
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <i className="fas fa-calendar-check text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">لا توجد مواعيد قادمة</h5>
              <p className="text-muted">يمكنك حجز موعد جديد مع طبيبك</p>
              <div className="mt-4">
                <button 
                  className="btn btn-success btn-lg"
                  onClick={() => setShowBookingModal(true)}
                >
                  <i className="fas fa-calendar-plus me-2"></i>
                  حجز موعد جديد
                </button>
              </div>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-muted">معلومات المريض:</h6>
                <p className="text-muted small mb-0">
                  <strong>الاسم:</strong> {user?.first_name} {user?.last_name}<br/>
                  <strong>رقم الهوية:</strong> {user?.id}<br/>
                  <strong>البريد الإلكتروني:</strong> {user?.email}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Appointments Tab */}
      {activeTab === 'past' && (
        <div className="row">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <div key={appointment.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 border-secondary">
                  <div className="card-header bg-secondary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="fas fa-calendar me-2"></i>
                        {getAppointmentTypeText(appointment.appointment_type)}
                      </h6>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title text-secondary">
                      {formatDoctorNameFromAppointment(appointment.doctor_name)}
                      {appointment.doctor_specialization && (
                        <small className="text-muted d-block">
                          {(() => {
                            const specializationNames = {
                              'nutrition': 'تغذية علاجية',
                              'general': 'طب عام',
                              'specialist': 'أخصائي'
                            }
                            return specializationNames[appointment.doctor_specialization] || appointment.doctor_specialization
                          })()}
                        </small>
                      )}
                    </h6>
                    <p className="card-text text-muted">
                      {appointment.chief_complaint || 'لا يوجد شكوى رئيسية'}
                    </p>
                    
                    <div className="mb-3">
                      <small className="text-muted">التاريخ:</small>
                      <div className="fw-bold text-secondary">
                        {formatDateGregorian(appointment.scheduled_date)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">الوقت:</small>
                      <div className="fw-bold text-info">
                        {formatTime12Hour(appointment.scheduled_time)}
                      </div>
                    </div>

                    <div className="row text-center">
                      <div className="col-12">
                        <small className="text-muted">المدة</small>
                        <div className="fw-bold text-success">{appointment.duration} دقيقة</div>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <i className="fas fa-calendar-times text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">لا توجد مواعيد سابقة</h5>
              <p className="text-muted">ستظهر هنا المواعيد المنتهية</p>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="text-muted">معلومات المريض:</h6>
                <p className="text-muted small mb-0">
                  <strong>الاسم:</strong> {user?.first_name} {user?.last_name}<br/>
                  <strong>رقم الهوية:</strong> {user?.id}<br/>
                  <strong>البريد الإلكتروني:</strong> {user?.email}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-check text-success me-2"></i>
                  تفاصيل الموعد
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAppointment(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">معلومات الموعد</h6>
                    <div className="mb-2">
                      <strong>نوع الموعد:</strong> {getAppointmentTypeText(selectedAppointment.appointment_type)}
                    </div>
                    <div className="mb-2">
                      <strong>التاريخ:</strong> {formatDateGregorian(selectedAppointment.scheduled_date)}
                    </div>
                    <div className="mb-2">
                      <strong>الوقت:</strong> {formatTime12Hour(selectedAppointment.scheduled_time)}
                    </div>
                    <div className="mb-2">
                      <strong>المدة:</strong> {selectedAppointment.duration} دقيقة
                    </div>
                    <div className="mb-2">
                      <strong>الحالة:</strong> {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-success mb-3">معلومات الطبيب</h6>
                    <div className="mb-2">
                      <strong>اسم الطبيب:</strong> {formatDoctorNameFromAppointment(selectedAppointment.doctor_name)}
                    </div>
                    <div className="mb-2">
                      <strong>الاختصاص:</strong> {(() => {
                        const specialization = selectedAppointment.doctor_specialization
                        const specializationNames = {
                          'nutrition': 'تغذية علاجية',
                          'general': 'طب عام',
                          'specialist': 'أخصائي'
                        }
                        return specializationNames[specialization] || specialization || 'غير محدد'
                      })()}
                    </div>
                  </div>
                </div>

                <div className="border-top pt-4">
                  <h6 className="mb-3">تفاصيل إضافية</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>الشكوى الرئيسية:</strong>
                        <div className="text-muted">
                          {selectedAppointment.chief_complaint || 'لا يوجد شكوى رئيسية'}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>الملاحظات:</strong>
                        <div className="text-muted">
                          {selectedAppointment.notes || 'لا توجد ملاحظات'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.status === 'completed' && selectedAppointment.diagnosis && (
                  <div className="border-top pt-4">
                    <h6 className="mb-3">التشخيص والعلاج</h6>
                    <div className="p-3 bg-light rounded">
                      <strong>التشخيص:</strong> {selectedAppointment.diagnosis}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAppointment(null)}
                >
                  إغلاق
                </button>
                {selectedAppointment.status === 'confirmed' && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    disabled={cancelAppointmentMutation.isLoading}
                  >
                    <i className="fas fa-times me-2"></i>
                    إلغاء الموعد
                  </button>
                )}
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    // Create appointment details text
                    const details = `
تفاصيل الموعد
================
نوع الموعد: ${getAppointmentTypeText(selectedAppointment.appointment_type)}
التاريخ: ${formatDateGregorian(selectedAppointment.scheduled_date)}
الوقت: ${formatTime12Hour(selectedAppointment.scheduled_time)}
المدة: ${selectedAppointment.duration} دقيقة
الحالة: ${selectedAppointment.status}

معلومات الطبيب
================
اسم الطبيب: ${formatDoctorNameFromAppointment(selectedAppointment.doctor_name)}
الاختصاص: ${(() => {
                        const specialization = selectedAppointment.doctor_specialization
                        const specializationNames = {
                          'nutrition': 'تغذية علاجية',
                          'general': 'طب عام',
                          'specialist': 'أخصائي'
                        }
                        return specializationNames[specialization] || specialization || 'غير محدد'
                      })()}

تفاصيل إضافية
================
الشكوى الرئيسية: ${selectedAppointment.chief_complaint || 'لا يوجد شكوى رئيسية'}
الملاحظات: ${selectedAppointment.notes || 'لا توجد ملاحظات'}

${selectedAppointment.status === 'completed' && selectedAppointment.diagnosis ? `
التشخيص والعلاج
================
التشخيص: ${selectedAppointment.diagnosis}
` : ''}
                    `.trim()
                    
                    // Download text file
                    const blob = new Blob([details], { type: 'text/plain;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', `تفاصيل_موعد_${formatDateGregorian(selectedAppointment.scheduled_date)}.txt`)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    
                    toast.success('تم تصدير تفاصيل الموعد بنجاح')
                  }}
                >
                  <i className="fas fa-download me-2"></i>
                  تصدير التفاصيل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal show d-block" style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999
        }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 10000 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-plus text-success me-2"></i>
                  حجز موعد جديد
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBookingModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>معلومات مهمة:</strong> لاستكمال حجز الموعد، يرجى استخدام نظام الحجز الإلكتروني أدناه.
                </div>
                
                <div className="row">
                  <div className="col-md-12">
                  
                    <div className="card border-success mx-auto" style={{ maxWidth: '400px' }}>
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-calendar-alt me-2"></i>
                          الحجز الإلكتروني
                        </h6>
                      </div>
                      <div className="card-body">
                        <p className="card-text">استخدم نظام الحجز الإلكتروني</p>
                        <div className="d-grid">
                          <button 
                            className="btn btn-outline-success"
                            onClick={() => {
                              // Create a simple booking form modal
                              setShowBookingModal(false)
                              setShowSimpleBookingModal(true)
                            }}
                          >
                            <i className="fas fa-external-link-alt me-2"></i>
                            فتح نظام الحجز
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h6 className="text-muted">معلومات المريض:</h6>
                  <div className="p-3 bg-light rounded">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>الاسم:</strong> {user?.first_name} {user?.last_name}
                      </div>
                      <div className="col-md-6">
                        <strong>رقم الهوية:</strong> {user?.id}
                      </div>
                      <div className="col-md-6">
                        <strong>البريد الإلكتروني:</strong> {user?.email}
                      </div>
                      <div className="col-md-6">
                        <strong>رقم الهاتف:</strong> {user?.phone || 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBookingModal(false)}
                >
                  إغلاق
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    toast.success('تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً لتأكيد الموعد.')
                    setShowBookingModal(false)
                  }}
                >
                  <i className="fas fa-calendar-check me-2"></i>
                  تأكيد الحجز
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Booking Modal */}
      {showSimpleBookingModal && (
        <div className="modal show d-block" style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999
        }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 10000 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-plus text-success me-2"></i>
                  حجز موعد جديد
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowSimpleBookingModal(false)
                    resetBookingForm()
                  }}
                ></button>
              </div>
              <form onSubmit={handleBookingSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>معلومات مهمة:</strong> يرجى ملء جميع الحقول المطلوبة. سيتم مراجعة طلبك والرد عليك قريباً.
                  </div>
                  
                  {/* Contact Information */}
                  <div className="alert alert-success mb-3">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-phone text-success me-2"></i>
                      <div>
                        <strong>للاستفسارات أو الحجز المباشر:</strong>
                        <br />
                        <span className="text-success fw-bold">+9647879558889</span>
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-success ms-2"
                          onClick={() => window.open('tel:+9647879558889', '_self')}
                        >
                          <i className="fas fa-phone me-1"></i>
                          اتصل
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          اختيار الطبيب *
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-primary ms-2"
                            onClick={() => refetchDoctors()}
                            disabled={doctorsLoading}
                            title="تحديث قائمة الأطباء"
                          >
                            <i className={`fas fa-sync-alt ${doctorsLoading ? 'fa-spin' : ''}`}></i>
                          </button>
                        </label>
                        <select 
                          className="form-select"
                          name="doctor"
                          value={bookingForm.doctor}
                          onChange={handleBookingFormChange}
                          required
                          style={{ minHeight: '40px' }}
                          onFocus={() => {
                            console.log('Select focused, doctors:', doctors)
                            console.log('Doctors count:', doctors?.length)
                            console.log('Doctors details:', doctors?.map(d => ({ 
                              id: d.id, 
                              user_id: d.user?.id, 
                              name: `${d.user?.first_name} ${d.user?.last_name}`,
                              specialization: d.specialization,
                              fee: d.consultation_fee
                            })))
                          }}
                        >
                          <option value="">اختر الطبيب</option>
                          {doctors && Array.isArray(doctors) && doctors.map(doctor => {
                            return (
                              <option key={doctor.id} value={doctor.id}>
                                {formatDoctorName(doctor)}
                              </option>
                            )
                          })}
                        </select>
                        {doctorsLoading && (
                          <div className="form-text">
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            جاري تحميل قائمة الأطباء...
                          </div>
                        )}
                        {!doctorsLoading && (!doctors || !Array.isArray(doctors) || doctors.length === 0) && (
                          <div className="form-text text-warning">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            لا توجد أطباء متاحين حالياً
                            <button 
                              type="button"
                              className="btn btn-sm btn-link p-0 ms-2"
                              onClick={() => refetchDoctors()}
                            >
                              <i className="fas fa-redo"></i> تحديث
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">نوع الموعد *</label>
                        <select 
                          className="form-select"
                          name="appointment_type"
                          value={bookingForm.appointment_type}
                          onChange={handleBookingFormChange}
                          required
                        >
                          <option value="consultation">استشارة</option>
                          <option value="follow_up">متابعة</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">التاريخ المفضل *</label>
                        <input 
                          type="date"
                          className="form-control"
                          name="preferred_date"
                          value={bookingForm.preferred_date}
                          onChange={handleBookingFormChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                        <div className="form-text text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          التواريخ المتاحة من السبت إلى الخميس فقط (يوم الجمعة عطلة رسمية)
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">الوقت المفضل *</label>
                        <select 
                          className="form-select"
                          name="preferred_time"
                          value={bookingForm.preferred_time}
                          onChange={handleBookingFormChange}
                          required
                          disabled={!bookingForm.doctor || !bookingForm.preferred_date}
                        >
                          <option value="">
                            {!bookingForm.doctor || !bookingForm.preferred_date 
                              ? 'اختر الطبيب والتاريخ أولاً' 
                              : !isDateAllowed(bookingForm.preferred_date)
                              ? 'التواريخ المتاحة من السبت إلى الخميس فقط'
                              : availableTimeSlots.length === 0 
                                ? 'لا توجد أوقات متاحة' 
                                : 'اختر الوقت'
                            }
                          </option>
                          {availableTimeSlots.map((slot, index) => {
                            const timeStr = slot.time
                            const displayTime = formatTime12Hour(timeStr)
                            
                            return (
                              <option key={index} value={timeStr}>
                                {displayTime}
                              </option>
                            )
                          })}
                        </select>
                        {bookingForm.doctor && bookingForm.preferred_date && (
                          <div className="form-text">
                            {availableTimeSlots.length > 0 
                              ? `متاح ${availableTimeSlots.length} وقت للحجز` 
                              : !isDateAllowed(bookingForm.preferred_date)
                              ? 'التواريخ المتاحة من السبت إلى الخميس فقط'
                              : 'لا توجد أوقات متاحة في هذا التاريخ'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">الشكوى الرئيسية</label>
                        <input 
                          type="text"
                          className="form-control"
                          name="chief_complaint"
                          value={bookingForm.chief_complaint}
                          onChange={handleBookingFormChange}
                          placeholder="وصف المشكلة الصحية"
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">طريقة الدفع *</label>
                        <select 
                          className="form-select"
                          name="payment_method"
                          value={bookingForm.payment_method}
                          onChange={handleBookingFormChange}
                          required
                        >
                          <option value="">اختر طريقة الدفع</option>
                          <option value="online">دفع إلكتروني</option>
                          <option value="visit">دفع عند الزيارة</option>
                        </select>
                        <div className="form-text text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          اختر طريقة الدفع المناسبة لك
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment details - only show for online payment */}
                  {bookingForm.payment_method === 'online' && (
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="alert alert-info">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-credit-card me-2"></i>
                              <div>
                                <strong>معلومات الدفع الإلكتروني</strong>
                                <div className="mt-2 p-3 bg-white rounded border">
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-university text-success me-2"></i>
                                    <div>
                                      <strong className="text-success">Qcard - بنك الرافدين</strong>
                                      <br />
                                      <span className="text-primary fs-5 fw-bold">7113596071</span>
                                    </div>
                                  </div>
                                </div>
                                <small className="text-muted mt-2 d-block">
                                  <i className="fas fa-info-circle me-1"></i>
                                  يرجى استخدام رقم Qcard أعلاه للدفع الإلكتروني
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">ملاحظات إضافية</label>
                    <textarea 
                      className="form-control"
                      name="notes"
                      value={bookingForm.notes}
                      onChange={handleBookingFormChange}
                      rows="3"
                      placeholder="أي معلومات إضافية تريد مشاركتها مع الطبيب"
                    ></textarea>
                  </div>

                  <div className="mt-4">
                    <h6 className="text-muted">تفاصيل الحجز:</h6>
                    <div className="p-3 bg-light rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <strong>الاسم:</strong> {user?.first_name} {user?.last_name}
                        </div>
                        <div className="col-md-6">
                          <strong>رقم الهوية:</strong> {user?.id}
                        </div>
                        <div className="col-md-6">
                          <strong>رقم الهاتف:</strong> {user?.phone || 'غير محدد'}
                        </div>
                        {bookingForm.doctor && doctors && Array.isArray(doctors) && (
                          <>
                            <div className="col-md-6">
                              <strong>الطبيب المختار:</strong> 
                              {(() => {
                                if (!doctors || !Array.isArray(doctors)) return 'غير محدد'
                                const selectedDoctor = doctors.find(doctor => doctor.id === parseInt(bookingForm.doctor))
                                return selectedDoctor ? 
                                  formatDoctorName(selectedDoctor) : 
                                  'غير محدد'
                              })()}
                            </div>
                            <div className="col-md-6">
                              <strong>نوع الموعد:</strong> 
                              {bookingForm.appointment_type === 'consultation' ? 'استشارة' :
                               bookingForm.appointment_type === 'follow_up' ? 'متابعة' : 'غير محدد'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowSimpleBookingModal(false)
                      resetBookingForm()
                    }}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-success"
                    disabled={bookAppointmentMutation.isLoading}
                  >
                    {bookAppointmentMutation.isLoading ? (
                      <LoadingSpinner size="sm" color="light" />
                    ) : (
                      <>
                        <i className="fas fa-calendar-check me-2"></i>
                        إرسال طلب الحجز
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientAppointments
