import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const PatientProfile = () => {
  const { t } = useLanguage()
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    allergies: '',
    medical_conditions: '',
    medications: '',
    target_weight: ''
  })

  // Fetch patient profile
  const { data: patientProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery(
    'patient-profile',
    async () => {
      try {
        const response = await api.get('/api/auth/patient-profile/')
        console.log('Patient profile API Response:', response.data)
        console.log('Patient height:', response.data?.height)
        console.log('Patient weight:', response.data?.current_weight)
        return response.data
      } catch (error) {
        console.error('Error fetching patient profile:', error)
        throw error
      }
    },
    { 
      enabled: !!user,
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache the data
      refetchOnWindowFocus: true, // Enable to get latest weight updates
      retry: 3, // Retry failed requests
      retryDelay: 1000 // Wait 1 second between retries
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      try {
        const response = await api.put('/api/auth/patient-profile/', data)
        return response
      } catch (error) {
        console.error('Profile update API error:', error)
        throw error
      }
    },
    {
      onSuccess: (response) => {
        console.log('Profile update success:', response.data)
        toast.success('تم تحديث الملف الشخصي بنجاح')
        queryClient.invalidateQueries('patient-profile')
        queryClient.invalidateQueries('user-profile')
        // Use setTimeout to avoid race conditions
        setTimeout(() => {
          refetchProfile()
        }, 100)
        setIsEditing(false)
      },
      onError: (error) => {
        console.error('Profile update error:', error)
        console.error('Error response:', error.response?.data)
        
        let errorMessage = 'فشل في تحديث الملف الشخصي'
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

  // Update user mutation
  const updateUserMutation = useMutation(
    async (data) => {
      try {
        const response = await api.put('/api/auth/user/', data)
        return response
      } catch (error) {
        console.error('User update API error:', error)
        throw error
      }
    },
    {
      onSuccess: (response) => {
        console.log('User update success:', response.data)
        toast.success('تم تحديث بيانات الحساب بنجاح')
        queryClient.invalidateQueries('patient-profile')
        queryClient.invalidateQueries('user-profile')
        // Use setTimeout to avoid race conditions
        setTimeout(() => {
          refetchProfile()
        }, 100)
        updateUser(response.data)
      },
      onError: (error) => {
        console.error('User update error:', error)
        console.error('Error response:', error.response?.data)
        
        let errorMessage = 'فشل في تحديث بيانات الحساب'
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

  useEffect(() => {
    if (patientProfile) {
      console.log('Loading patient profile data:', patientProfile)
      setFormData({
        first_name: patientProfile.user?.first_name || '',
        last_name: patientProfile.user?.last_name || '',
        phone: patientProfile.user?.phone || '',
        date_of_birth: patientProfile.user?.date_of_birth ? 
          (typeof patientProfile.user.date_of_birth === 'string' ? 
            patientProfile.user.date_of_birth : 
            patientProfile.user.date_of_birth.split('T')[0]) : '',
        gender: patientProfile.gender || '',
        address: patientProfile.user?.address || '',
        allergies: patientProfile.dietary_restrictions || '',
        medical_conditions: patientProfile.medical_conditions || '',
        medications: patientProfile.medications || '',
        target_weight: patientProfile.target_weight || ''
      })
      
    }
  }, [patientProfile])

  // Auto-refresh profile data every 30 seconds to get latest weight updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refetchProfile()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, refetchProfile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    console.log(`Updating field ${name} to:`, value)
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('Submitting profile update with data:', formData)
    
    try {
      // Update user data
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
      }
      
      console.log('Updating user data:', userData)
      await updateUserMutation.mutateAsync(userData)
      
      console.log('User update completed successfully')
      
      // Update profile data (only fields that can be updated by patient)
      const profileData = {
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        medical_conditions: formData.medical_conditions || '',
        dietary_restrictions: formData.allergies || '',
        medications: formData.medications || ''
      }
      
      console.log('Updating profile data:', profileData)
      await updateProfileMutation.mutateAsync(profileData)
      
      console.log('Profile update completed successfully')
      
    } catch (error) {
      console.error('Submit error:', error)
      console.error('Error details:', error.response?.data)
      
      // Show specific error message
      let errorMessage = 'فشل في تحديث الملف الشخصي'
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

  const handleCancel = () => {
    if (patientProfile) {
      console.log('Cancelling edit, resetting form data')
      setFormData({
        first_name: patientProfile.user?.first_name || '',
        last_name: patientProfile.user?.last_name || '',
        phone: patientProfile.user?.phone || '',
        date_of_birth: patientProfile.user?.date_of_birth ? 
          (typeof patientProfile.user.date_of_birth === 'string' ? 
            patientProfile.user.date_of_birth : 
            patientProfile.user.date_of_birth.split('T')[0]) : '',
        gender: patientProfile.gender || '',
        address: '',
        allergies: patientProfile.dietary_restrictions || '',
        medical_conditions: patientProfile.medical_conditions || '',
        medications: patientProfile.medications || '',
        target_weight: patientProfile.target_weight || ''
      })
    }
    setIsEditing(false)
    toast.info('تم إلغاء التعديل')
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-user text-success me-2"></i>
                الملف الشخصي
              </h2>
              <p className="text-muted">إدارة معلوماتك الشخصية والصحية</p>
            </div>
            <div className="d-flex gap-2">
              {!isEditing ? (
                <button
                  className="btn btn-success"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-edit me-2"></i>
                  تعديل الملف
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times me-2"></i>
                    إلغاء
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={updateProfileMutation.isLoading || updateUserMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading || updateUserMutation.isLoading ? (
                      <LoadingSpinner size="sm" color="light" />
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Personal Information */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-user me-2"></i>
                  المعلومات الشخصية
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">الاسم الأول *</label>
                    <input
                      type="text"
                      name="first_name"
                      className="form-control"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">اسم العائلة *</label>
                    <input
                      type="text"
                      name="last_name"
                      className="form-control"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditing}
                    />
                  </div>
                </div>


                <div className="mb-3">
                  <label className="form-label">رقم الهاتف *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                    placeholder="+964 750 123 4567"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">تاريخ الميلاد</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      className="form-control"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">الجنس *</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditing}
                    >
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">العنوان</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <i className="fas fa-heartbeat me-2"></i>
                  المعلومات الطبية
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">الحساسية</label>
                  <textarea
                    name="allergies"
                    className="form-control"
                    rows="2"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="اذكر أي حساسية لديك (طعام، دواء، إلخ)"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">الأمراض المزمنة</label>
                  <textarea
                    name="medical_conditions"
                    className="form-control"
                    rows="2"
                    value={formData.medical_conditions}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="اذكر أي أمراض مزمنة أو حالات طبية"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">الأدوية الحالية</label>
                  <textarea
                    name="medications"
                    className="form-control"
                    rows="2"
                    value={formData.medications}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="اذكر الأدوية التي تتناولها حالياً"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Information - Read Only */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-ruler me-2"></i>
                  المعلومات البدنية
                  <span className="ms-2">
                    <i className="fas fa-lock"></i>
                    (مقفلة)
                  </span>
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      الطول (سم) *
                    </label>
                    <div className="form-control-plaintext bg-light p-2 rounded">
                      {patientProfile?.height ? `${patientProfile.height} سم` : 'غير محدد'}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      الوزن (كجم) *
                    </label>
                    <div className="form-control-plaintext bg-light p-2 rounded">
                      {patientProfile?.current_weight ? `${patientProfile.current_weight} كجم` : 'غير محدد'}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    أهداف اللياقة *
                  </label>
                  <div className="form-control-plaintext bg-light p-2 rounded">
                    {patientProfile?.goal === 'lose_weight' ? 'إنقاص الوزن' :
                     patientProfile?.goal === 'gain_weight' ? 'زيادة الوزن' :
                     patientProfile?.goal === 'maintain_weight' ? 'الحفاظ على الوزن' :
                     patientProfile?.goal === 'build_muscle' ? 'بناء العضلات' :
                     patientProfile?.goal === 'improve_health' ? 'تحسين الصحة العامة' :
                     'غير محدد'}
                  </div>
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <small>
                    <strong>ملاحظة:</strong> الحقول المميزة بـ (*) تم إدخالها أثناء التسجيل ولا يمكن تعديلها. 
                    يرجى التواصل مع الطبيب لتعديل هذه المعلومات.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        {!isEditing && patientProfile && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="text-muted mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    ملخص الملف الشخصي
                  </h6>
                  <div className="row">
                    <div className="col-md-3 text-center">
                      <div className="p-3">
                        <div className="fw-bold text-primary fs-4">
                          {patientProfile.height ? `${patientProfile.height} سم` : 'غير محدد'}
                        </div>
                        <small className="text-muted">الطول</small>
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="p-3">
                        <div className="fw-bold text-success fs-4">
                          {patientProfile.current_weight ? `${patientProfile.current_weight} كجم` : 'غير محدد'}
                        </div>
                        <small className="text-muted">الوزن</small>
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="p-3">
                        <div className="fw-bold text-warning fs-4">
                          {patientProfile.gender === 'male' ? 'ذكر' : 
                           patientProfile.gender === 'female' ? 'أنثى' : 'غير محدد'}
                        </div>
                        <small className="text-muted">الجنس</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default PatientProfile
