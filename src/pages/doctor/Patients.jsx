import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatTime12Hour, formatDateGregorian } from '../../utils/timeUtils'
import api from '../../services/api'

const DoctorPatients = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientDetails, setPatientDetails] = useState(null)
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState(null)
  const [measurementForm, setMeasurementForm] = useState({
    date: '',
    weight: '',
    waist: '',
    hip: '',
    fatPercentage: '',
    autoUpdateProfile: true
  })
  const [measurements, setMeasurements] = useState([
    {
      id: 1,
      date: '15/01/2024',
      weight: '80 كغ',
      waist: '95 سم',
      hip: '105 سم',
      fatPercentage: '22%'
    },
    {
      id: 2,
      date: '08/01/2024',
      weight: '82 كغ',
      waist: '97 سم',
      hip: '107 سم',
      fatPercentage: '24%'
    },
    {
      id: 3,
      date: '01/01/2024',
      weight: '85 كغ',
      waist: '100 سم',
      hip: '110 سم',
      fatPercentage: '26%'
    }
  ])

  // Fetch patient appointments to get additional data
  const { data: patientAppointments, refetch: refetchAppointments } = useQuery(
    'doctor-patient-appointments',
    async () => {
      try {
        console.log('Fetching appointments for doctor:', user?.id)
        const response = await api.get('/api/bookings/appointments/')
        console.log('Appointments API Response:', response.data)
        return response.data
      } catch (error) {
        console.error('Error fetching appointments:', error)
        return []
      }
    },
    { 
      enabled: !!user && user?.role === 'doctor',
      retry: 1,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache the data
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Fetch patient details when a patient is selected
  const { data: selectedPatientDetails, isLoading: patientDetailsLoading } = useQuery(
    ['patient-details', selectedPatient],
    async () => {
      if (!selectedPatient) return null
      try {
        const response = await api.get(`/api/auth/doctor-patient-profile/?patient_id=${selectedPatient}`)
        console.log('Patient details API Response:', response.data)
        console.log('Patient height:', response.data?.height)
        console.log('Patient weight:', response.data?.current_weight)
        return response.data
      } catch (error) {
        console.error('Error fetching patient details:', error)
        return null
      }
    },
    {
      enabled: !!selectedPatient,
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Fetch patient measurements when a patient is selected
  const { data: patientMeasurements, refetch: refetchMeasurements } = useQuery(
    ['patient-measurements', selectedPatient],
    async () => {
      if (!selectedPatient) return []
      try {
        const response = await api.get(`/api/auth/measurements/?patient_id=${selectedPatient}`)
        console.log('Patient measurements API Response:', response.data)
        return Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Error fetching patient measurements:', error)
        return []
      }
    },
    {
      enabled: !!selectedPatient,
      staleTime: 0,
      cacheTime: 0,
      initialData: [],
    }
  )

  // Sample measurements data
  const sampleMeasurements = [
    {
      id: 1,
      date: '15/01/2024',
      weight: '80 كغ',
      waist: '95 سم',
      hip: '105 سم',
      fatPercentage: '22%'
    },
    {
      id: 2,
      date: '08/01/2024',
      weight: '82 كغ',
      waist: '97 سم',
      hip: '107 سم',
      fatPercentage: '24%'
    },
    {
      id: 3,
      date: '01/01/2024',
      weight: '85 كغ',
      waist: '100 سم',
      hip: '110 سم',
      fatPercentage: '26%'
    }
  ]

  // Fetch doctor's patients
  const { data: patients, isLoading: patientsLoading, error: patientsError, refetch: refetchPatients } = useQuery(
    'doctor-patients',
    async () => {
      try {
        console.log('Fetching patients for user:', user?.id, 'role:', user?.role)
        console.log('Token exists:', !!localStorage.getItem('token'))
        
        // Check if user is properly authenticated
        if (!user || user.role !== 'doctor') {
          throw new Error('User not authenticated as doctor')
        }
        
        const response = await api.get('/api/auth/patients/')
        console.log('API Response:', response)
        return response.data
      } catch (error) {
        console.error('API Error:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        
        // Handle specific error cases
        if (error.response?.status === 403) {
          console.error('403 Forbidden - Check user permissions')
          toast.error('ليس لديك صلاحية للوصول إلى قائمة المرضى')
        } else if (error.response?.status === 401) {
          console.error('401 Unauthorized - Token may be invalid')
          toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى')
        } else if (error.code === 'NETWORK_ERROR') {
          console.error('Network Error')
          toast.error('خطأ في الاتصال بالخادم')
        }
        
        throw error
      }
    },
    { 
      enabled: !!user && user?.role === 'doctor' && !!localStorage.getItem('token'),
      retry: 2,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache the data
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        console.log('Patients data received:', data)
        console.log('Patients count:', data?.length || 0)
      },
      onError: (error) => {
        console.error('Error fetching patients:', error)
        // Don't show generic error message here as we handle specific errors above
      }
    }
  )

  // Process patients data with appointment information
  const displayPatients = React.useMemo(() => {
    console.log('Processing patients data...')
    console.log('Raw patients data:', patients)
    console.log('Raw patientAppointments data:', patientAppointments)
    
    // Ensure patients is an array
    const patientsArray = Array.isArray(patients) ? patients : (patients?.results || [])
    console.log('Patients array:', patientsArray)
    console.log('Patients array length:', patientsArray.length)
    
    if (!patientsArray || patientsArray.length === 0) {
      console.log('No patients found')
      return []
    }
    
    const processedPatients = patientsArray.map(patient => {
      // Find the latest appointment for this patient
      const patientAppointmentsList = patientAppointments?.results || patientAppointments || []
      console.log(`Processing patient ${patient.id} (${patient.first_name} ${patient.last_name})`)
      console.log(`Available appointments:`, patientAppointmentsList)
      
      const patientAppointmentsFiltered = patientAppointmentsList.filter(apt => apt.patient === patient.id)
      console.log(`Appointments for patient ${patient.id}:`, patientAppointmentsFiltered)
      
      const latestAppointment = patientAppointmentsFiltered
        .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0]
      
      const processedPatient = {
        ...patient,
        last_appointment: latestAppointment?.scheduled_date || null,
        last_appointment_time: latestAppointment?.scheduled_time || null,
        consultation_fee: latestAppointment?.consultation_fee || 0,
        total_appointments: patientAppointmentsFiltered.length
      }
      
      console.log(`Processed patient:`, processedPatient)
      return processedPatient
    })
    
    console.log('Final processed patients:', processedPatients)
    return processedPatients
  }, [patients, patientAppointments])

  // Update data when component mounts or user changes
  useEffect(() => {
    if (user && user.role === 'doctor') {
      // Force refetch data when component mounts
      console.log('Component mounted, forcing data refresh...')
      refetchPatients()
      refetchAppointments()
      
      // Also invalidate queries to force fresh data
      queryClient.invalidateQueries('doctor-patients')
      queryClient.invalidateQueries('doctor-patient-appointments')
    }
  }, [user, refetchPatients, refetchAppointments, queryClient])

  // Add window focus listener for immediate refresh
  useEffect(() => {
    const handleWindowFocus = () => {
      if (user && user.role === 'doctor') {
        console.log('Window focused, refreshing data...')
        refetchPatients()
        refetchAppointments()
        queryClient.invalidateQueries('doctor-patients')
        queryClient.invalidateQueries('doctor-patient-appointments')
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [user, refetchPatients, refetchAppointments, queryClient])

  // Debug logging for modal state
  console.log('Modal Debug:', { showPatientModal, selectedPatient })

  // Helper functions for formatting


  const formatCurrency = (amount) => {
    if (!amount) return '--'
    return `${amount.toLocaleString()} د.ع`
  }

  // Measurement functions
  const handleAddMeasurement = () => {
    setEditingMeasurement(null)
    setMeasurementForm({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      waist: '',
      hip: '',
      fatPercentage: '',
      autoUpdateProfile: true
    })
    setShowMeasurementModal(true)
  }

  const handleEditMeasurement = (measurement) => {
    setEditingMeasurement(measurement)
    setMeasurementForm({
      date: measurement.date,
      weight: measurement.weight,
      waist: measurement.waist,
      hip: measurement.hip,
      fatPercentage: measurement.fatPercentage,
      autoUpdateProfile: true
    })
    setShowMeasurementModal(true)
  }

  const handleDeleteMeasurement = (measurement) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القياس؟')) {
      setMeasurements(prev => prev.filter(m => m.id !== measurement.id))
      toast.success('تم حذف القياس بنجاح')
    }
  }

  const handleMeasurementSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingMeasurement) {
        // Update existing measurement
        setMeasurements(prev => prev.map(m => 
          m.id === editingMeasurement.id 
            ? { ...m, ...measurementForm }
            : m
        ))
        toast.success('تم تحديث القياس بنجاح')
      } else {
        // Add new measurement via API
        const measurementData = {
          weight: parseFloat(measurementForm.weight),
          waist_circumference: measurementForm.waist ? parseFloat(measurementForm.waist) : null,
          hip_circumference: measurementForm.hip ? parseFloat(measurementForm.hip) : null,
          body_fat_percentage: measurementForm.fatPercentage ? parseFloat(measurementForm.fatPercentage) : null,
          measured_at: measurementForm.date,
          auto_update_profile: measurementForm.autoUpdateProfile
        }
        
        const response = await api.post('/api/auth/measurements/', {
          ...measurementData,
          patient_id: selectedPatient
        })
        
        // Add to local state for immediate display
        const newMeasurement = {
          id: response.data.id,
          date: measurementForm.date,
          weight: `${measurementForm.weight} كغ`,
          waist: measurementForm.waist ? `${measurementForm.waist} سم` : '',
          hip: measurementForm.hip ? `${measurementForm.hip} سم` : '',
          fatPercentage: measurementForm.fatPercentage ? `${measurementForm.fatPercentage}%` : ''
        }
        
        setMeasurements(prev => [newMeasurement, ...prev])
        // Refresh measurements from API
        refetchMeasurements()
        toast.success('تم إضافة القياس بنجاح')
      }
      
      setShowMeasurementModal(false)
      setEditingMeasurement(null)
      setMeasurementForm({
        date: '',
        weight: '',
        waist: '',
        hip: '',
        fatPercentage: '',
        autoUpdateProfile: true
      })
    } catch (error) {
      console.error('Error saving measurement:', error)
      toast.error('فشل في حفظ القياس')
    }
  }

  const handleMeasurementChange = (e) => {
    const { name, value, type, checked } = e.target
    setMeasurementForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (patientsLoading) {
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
            <i className="fas fa-users text-success me-2"></i>
            المرضى
          </h2>
          <p className="text-muted">إدارة ومتابعة مرضاك</p>
        </div>
      </div>

      {/* Patients List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                قائمة المرضى ({displayPatients?.length || 0})
              </h5>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={async () => {
                    try {
                      console.log('Manual refresh triggered...')
                      await Promise.all([
                        refetchPatients(),
                        refetchAppointments()
                      ])
                      queryClient.invalidateQueries('doctor-patients')
                      queryClient.invalidateQueries('doctor-patient-appointments')
                      toast.success('تم تحديث البيانات بنجاح')
                    } catch (error) {
                      console.error('Error refreshing data:', error)
                      toast.error('فشل في تحديث البيانات')
                    }
                  }}
                  disabled={patientsLoading}
                >
                  <i className="fas fa-refresh me-1"></i>
                  تحديث
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={async () => {
                    try {
                      console.log('Force refresh triggered...')
                      // Clear all caches
                      queryClient.clear()
                      // Refetch all data
                      await Promise.all([
                        refetchPatients(),
                        refetchAppointments()
                      ])
                      toast.success('تم إعادة تحميل البيانات بالكامل')
                    } catch (error) {
                      console.error('Error force refreshing data:', error)
                      toast.error('فشل في إعادة تحميل البيانات')
                    }
                  }}
                  disabled={patientsLoading}
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  إعادة تحميل
                </button>
              </div>
            </div>
            <div className="card-body">
              {patientsError && (
                <div className="alert alert-danger">
                  <h6>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    خطأ في جلب البيانات
                  </h6>
                  <p className="mb-2">
                    {patientsError.response?.status === 403 
                      ? 'ليس لديك صلاحية للوصول إلى قائمة المرضى' 
                      : patientsError.response?.status === 401
                      ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
                      : patientsError.message || 'حدث خطأ غير متوقع'
                    }
                  </p>
                  <div className="small">
                    <strong>تفاصيل الخطأ:</strong><br/>
                    <code>Status: {patientsError.response?.status || 'غير محدد'}</code><br/>
                    <code>URL: /api/auth/patients/</code><br/>
                    <code>User Role: {user?.role || 'غير محدد'}</code><br/>
                    <code>User ID: {user?.id || 'غير محدد'}</code><br/>
                    <code>Token Exists: {localStorage.getItem('token') ? 'نعم' : 'لا'}</code>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={() => {
                      refetchPatients()
                      refetchAppointments()
                      queryClient.invalidateQueries('doctor-patients')
                      queryClient.invalidateQueries('doctor-patient-appointments')
                    }}
                  >
                    <i className="fas fa-redo me-1"></i>
                    إعادة المحاولة
                  </button>
                </div>
              )}
              
              {displayPatients?.length > 0 ? (
                <div>
                  
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>المريض</th>
                          <th>آخر موعد</th>
                          <th>الوقت</th>
                          <th>إجمالي المواعيد</th>
                          <th>الحالة</th>
                          <th>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayPatients.map((patient) => (
                          <tr key={patient.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                  <i className="fas fa-user text-success"></i>
                                </div>
                                <div>
                                  <div className="fw-bold">
                                    {patient.first_name} {patient.last_name}
                                  </div>
                                  <small className="text-muted">{patient.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">
                                {formatDateGregorian(patient.last_appointment)}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted">
                                {formatTime12Hour(patient.last_appointment_time)}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-primary">{patient.total_appointments || 0}</span>
                            </td>
                            <td>
                              <span className="badge bg-success">مريض نشط</span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    console.log('Opening modal for patient:', patient.id)
                                    setSelectedPatient(patient.id)
                                    setShowPatientModal(true)
                                    console.log('Modal state:', { selectedPatient: patient.id, showModal: true })
                                  }}
                                  title="عرض الملف الكامل"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-success"
                                  title="خطة وجبات جديدة"
                                >
                                  <i className="fas fa-utensils"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-info"
                                  title="حجز موعد"
                                >
                                  <i className="fas fa-calendar-plus"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-users text-muted fs-1 mb-3"></i>
                  <h5 className="text-muted">لا توجد مرضى</h5>
                  <p className="text-muted">
                    {patientsLoading ? 'جاري التحميل...' : 'سيظهر المرضى هنا بعد حجز المواعيد معك'}
                  </p>
                  <div className="alert alert-info mt-3">
                    <small>
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>كيف يعمل النظام:</strong> المرضى سيظهرون هنا فقط بعد أن يحجزوا مواعيد معك. 
                      هذا يعني أن المريض يجب أن يقوم بالتسجيل أولاً، ثم حجز موعد معك من خلال النظام.
                    </small>
                  </div>
                  
                  <div className="alert alert-success mt-2">
                    <small>
                      <i className="fas fa-check-circle me-2"></i>
                      <strong>الخطوات المطلوبة:</strong>
                      <ol className="mb-0 mt-2">
                        <li>المريض يسجل حساب جديد في النظام</li>
                        <li>المريض يختار طبيب (أنت) من قائمة الأطباء</li>
                        <li>المريض يحجز موعد معك</li>
                        <li>سيظهر المريض هنا في قائمة مرضاك</li>
                      </ol>
                    </small>
                  </div>
                  
                  <div className="alert alert-warning mt-2">
                    <small>
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>ملاحظة مهمة:</strong> إذا كان لديك مرضى في Django Admin ولكنهم لا يظهرون هنا، 
                      تأكد من أنهم قد حجزوا مواعيد معك وليس مع طبيب آخر.
                    </small>
                  </div>
                  
                  <div className="alert alert-info mt-2">
                    <small>
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>معلومات التشخيص:</strong><br/>
                      الطبيب الحالي: {user?.first_name} {user?.last_name} (ID: {user?.id})<br/>
                      عدد المرضى المحملين: {displayPatients?.length || 0}<br/>
                      حالة التحميل: {patientsLoading ? 'جاري التحميل...' : 'مكتمل'}
                    </small>
                  </div>
                  
                  {!patientsLoading && !patientsError && (
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={async () => {
                          try {
                            await Promise.all([
                              refetchPatients(),
                              refetchAppointments()
                            ])
                            queryClient.invalidateQueries('doctor-patients')
                            queryClient.invalidateQueries('doctor-patient-appointments')
                            toast.success('تم تحديث البيانات')
                          } catch (error) {
                            console.error('Error refreshing data:', error)
                            toast.error('فشل في تحديث البيانات')
                          }
                        }}
                      >
                        <i className="fas fa-refresh me-1"></i>
                        تحديث البيانات
                      </button>
                    </div>
                  )}
                  
                  {!patientsLoading && !patientsError && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="text-muted">معلومات الطبيب:</h6>
                      <p className="text-muted small mb-0">
                        <strong>الاسم:</strong> {user?.first_name} {user?.last_name}<br/>
                        <strong>الدور:</strong> {user?.role === 'doctor' ? 'طبيب' : user?.role}<br/>
                        <strong>الاختصاص:</strong> {user?.doctor_profile?.specialization || 'غير محدد'}<br/>
                        <strong>البريد الإلكتروني:</strong> {user?.email}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (() => {
        const currentPatient = displayPatients.find(p => p.id === selectedPatient)
        const patientAppointmentsList = patientAppointments?.results || patientAppointments || []
        const patientAppointmentsData = patientAppointmentsList.filter(apt => apt.patient === selectedPatient)
        
        return (
        <div 
          className="modal show d-block" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1050
          }}
        >
          <div 
            className="modal-dialog modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-user text-success me-2"></i>
                  تفاصيل المريض
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    console.log('Closing modal')
                    setShowPatientModal(false)
                    setSelectedPatient(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Patient Header */}
                <div className="alert alert-success">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">
                        <i className="fas fa-user me-2"></i>
                        ملف المريض: {currentPatient?.first_name} {currentPatient?.last_name}
                      </h6>
                      <small>آخر موعد: {formatDateGregorian(currentPatient?.last_appointment)} في {formatTime12Hour(currentPatient?.last_appointment_time)}</small>
                    </div>
                    <span className="badge bg-primary">{currentPatient?.total_appointments || 0} موعد</span>
                  </div>
                </div>

                {/* Modal Navigation Tabs */}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className="nav-link active"
                      onClick={() => {}}
                    >
                      <i className="fas fa-user me-2"></i>
                      المعلومات الأساسية
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link"
                      onClick={() => {}}
                    >
                      <i className="fas fa-calendar-check me-2"></i>
                      تاريخ المواعيد
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link"
                      onClick={() => {}}
                    >
                      <i className="fas fa-weight me-2"></i>
                      القياسات
                    </button>
                  </li>
                </ul>

                {/* Basic Info Tab */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="fas fa-user text-primary me-2"></i>
                      معلومات المريض الأساسية
                    </h6>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          // Refresh patient details
                          queryClient.invalidateQueries(['patient-details', selectedPatient])
                          toast.success('تم تحديث البيانات')
                        }}
                      >
                        <i className="fas fa-refresh me-1"></i>
                        تحديث
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          // Navigate to patient profile page
                          window.location.href = `/doctor/patient/${currentPatient?.id}`
                        }}
                        style={{ 
                          backgroundColor: '#dc3545', 
                          borderColor: '#dc3545',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        <i className="fas fa-edit me-1"></i>
                        تعديل
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {patientDetailsLoading ? (
                      <div className="text-center py-4">
                        <LoadingSpinner />
                        <p className="text-muted mt-2">جاري تحميل تفاصيل المريض...</p>
                      </div>
                    ) : (
                      <>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <small className="text-muted">الاسم الكامل:</small>
                              <div className="fw-bold">{currentPatient?.first_name} {currentPatient?.last_name}</div>
                            </div>
                         
                            <div className="mb-3">
                              <small className="text-muted">إجمالي المواعيد:</small>
                              <div className="fw-bold text-primary">{currentPatient?.total_appointments || 0}</div>
                            </div>
                          </div>
                        
                          <div className="col-md-6">
                            <div className="mb-3">
                              <small className="text-muted">الجنس:</small>
                              <div>{selectedPatientDetails?.gender === 'male' ? 'ذكر' : selectedPatientDetails?.gender === 'female' ? 'أنثى' : 'غير محدد'}</div>
                            </div>
                            <div className="mb-3">
                              <small className="text-muted">الطول:</small>
                              <div>{selectedPatientDetails?.height ? `${selectedPatientDetails.height} سم` : 'غير محدد'}</div>
                            </div>
                            <div className="mb-3">
                              <small className="text-muted">الوزن الحالي:</small>
                              <div className="fw-bold text-success">{selectedPatientDetails?.current_weight ? `${selectedPatientDetails.current_weight} كغ` : 'غير محدد'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-top">
                          <div className="row">
                            <div className="col-md-6">
                              <small className="text-muted">الهدف:</small>
                              <div className="fw-bold">
                                {selectedPatientDetails?.goal === 'lose_weight' ? 'إنقاص الوزن' :
                                 selectedPatientDetails?.goal === 'gain_weight' ? 'زيادة الوزن' :
                                 selectedPatientDetails?.goal === 'maintain_weight' ? 'الحفاظ على الوزن' :
                                 selectedPatientDetails?.goal === 'build_muscle' ? 'بناء العضلات' :
                                 selectedPatientDetails?.goal === 'improve_health' ? 'تحسين الصحة العامة' :
                                 'غير محدد'}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted">الحالات المرضية:</small>
                              <div>{selectedPatientDetails?.medical_conditions || 'لا توجد'}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Appointments Tab */}
                <div className="card mt-4">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-calendar-check text-primary me-2"></i>
                      تاريخ المواعيد
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>التاريخ</th>
                            <th>الوقت</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientAppointmentsData.length > 0 ? (
                            patientAppointmentsData.map((appointment) => (
                              <tr key={appointment.id}>
                                <td>{formatDateGregorian(appointment.scheduled_date)}</td>
                                <td>{formatTime12Hour(appointment.scheduled_time)}</td>
                                <td>
                                  <span className={`badge ${
                                    appointment.status === 'completed' ? 'bg-success' :
                                    appointment.status === 'pending' ? 'bg-warning' :
                                    appointment.status === 'cancelled' ? 'bg-danger' :
                                    'bg-info'
                                  }`}>
                                    {appointment.status === 'completed' ? 'مكتمل' :
                                     appointment.status === 'pending' ? 'في الانتظار' :
                                     appointment.status === 'cancelled' ? 'ملغي' :
                                     appointment.status}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary">
                                    <i className="fas fa-eye"></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted">
                                لا توجد مواعيد
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Measurements Tab */}
                <div className="card mt-4">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-weight text-primary me-2"></i>
                      القياسات الصحية
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h5 className="text-primary">الوزن</h5>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditMeasurement({
                                  date: '15/01/2024',
                                  weight: '80',
                                  waist: '95',
                                  hip: '105',
                                  fatPercentage: '22'
                                })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="display-6 text-success">80</div>
                            <small className="text-muted">كيلوغرام</small>
                            <div className="mt-2">
                              <span className="badge bg-info">آخر تحديث: 15/01/2024</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card bg-light">
                          <div className="card-body text-center">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h5 className="text-primary">مؤشر كتلة الجسم</h5>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditMeasurement({
                                  date: '15/01/2024',
                                  weight: '80',
                                  waist: '95',
                                  hip: '105',
                                  fatPercentage: '22'
                                })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="display-6 text-warning">26.1</div>
                            <small className="text-muted">BMI</small>
                            <div className="mt-2">
                              <span className="badge bg-warning">وزن زائد</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mt-3">
                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-body text-center">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="text-primary">محيط الخصر</h6>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditMeasurement({
                                  date: '15/01/2024',
                                  weight: '80',
                                  waist: '95',
                                  hip: '105',
                                  fatPercentage: '22'
                                })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="h4 text-success">95</div>
                            <small className="text-muted">سم</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-body text-center">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="text-primary">محيط الورك</h6>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditMeasurement({
                                  date: '15/01/2024',
                                  weight: '80',
                                  waist: '95',
                                  hip: '105',
                                  fatPercentage: '22'
                                })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="h4 text-info">105</div>
                            <small className="text-muted">سم</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-body text-center">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="text-primary">نسبة الدهون</h6>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEditMeasurement({
                                  date: '15/01/2024',
                                  weight: '80',
                                  waist: '95',
                                  hip: '105',
                                  fatPercentage: '22'
                                })}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </div>
                            <div className="h4 text-warning">22%</div>
                            <small className="text-muted">نسبة مئوية</small>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    console.log('Closing modal from footer button')
                    setShowPatientModal(false)
                    setSelectedPatient(null)
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Measurement Modal */}
      {showMeasurementModal && (
        <div 
          className="modal show d-block" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1060
          }}
        >
          <div 
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-weight text-primary me-2"></i>
                  {editingMeasurement ? 'تعديل القياس' : 'إضافة قياس جديد'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMeasurementModal(false)}
                ></button>
              </div>
              <form onSubmit={handleMeasurementSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">التاريخ *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={measurementForm.date}
                          onChange={handleMeasurementChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">الوزن (كغ) *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="weight"
                          value={measurementForm.weight}
                          onChange={handleMeasurementChange}
                          step="0.1"
                          min="0"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">محيط الخصر (سم)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="waist"
                          value={measurementForm.waist}
                          onChange={handleMeasurementChange}
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">محيط الورك (سم)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="hip"
                          value={measurementForm.hip}
                          onChange={handleMeasurementChange}
                          step="0.1"
                          min="0"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">نسبة الدهون (%)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="fatPercentage"
                          value={measurementForm.fatPercentage}
                          onChange={handleMeasurementChange}
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Auto Update Profile Option */}
                  <div className="row">
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="autoUpdateProfile"
                          id="autoUpdateProfile"
                          checked={measurementForm.autoUpdateProfile}
                          onChange={handleMeasurementChange}
                        />
                        <label className="form-check-label" htmlFor="autoUpdateProfile">
                          <i className="fas fa-sync-alt me-2 text-primary"></i>
                          تحديث ملف المريض تلقائياً بالوزن الجديد
                        </label>
                        <small className="form-text text-muted d-block">
                          عند تفعيل هذا الخيار، سيتم تحديث الوزن الحالي في ملف المريض تلقائياً
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMeasurementModal(false)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingMeasurement ? 'تحديث' : 'إضافة'}
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

export default DoctorPatients
