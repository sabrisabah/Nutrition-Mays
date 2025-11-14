import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PatientMeasurements = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [selectedMeasurement, setSelectedMeasurement] = useState(null)
  const [showChart, setShowChart] = useState(false)

  // Fetch patient measurements
  const { data: measurements, isLoading: measurementsLoading } = useQuery(
    'patient-measurements',
    () => api.get('/api/auth/measurements/').then(res => res.data.results),
    { enabled: !!user }
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', { calendar: 'gregory' })
  }

  const getMeasurementTrend = (measurements, field) => {
    if (!measurements || measurements.length < 2) return 'stable'
    
    const sorted = [...measurements].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
    const first = parseFloat(sorted[0][field]) || 0
    const last = parseFloat(sorted[sorted.length - 1][field]) || 0
    
    if (last > first) return 'increasing'
    if (last < first) return 'decreasing'
    return 'stable'
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return 'fas fa-arrow-up text-danger'
      case 'decreasing': return 'fas fa-arrow-down text-success'
      default: return 'fas fa-minus text-muted'
    }
  }

  const getTrendText = (trend) => {
    switch (trend) {
      case 'increasing': return 'متزايد'
      case 'decreasing': return 'متناقص'
      default: return 'مستقر'
    }
  }

  // تحضير البيانات للرسم البياني
  const chartData = useMemo(() => {
    if (!measurements || measurements.length === 0) return []
    
    // ترتيب القياسات حسب التاريخ (من الأقدم للأحدث)
    const sortedMeasurements = [...measurements].sort((a, b) => {
      const dateA = new Date(a.measured_at || a.recorded_date || a.measured_date)
      const dateB = new Date(b.measured_at || b.recorded_date || b.measured_date)
      return dateA - dateB
    })
    
    return sortedMeasurements.map((measurement) => {
      const date = new Date(measurement.measured_at || measurement.recorded_date || measurement.measured_date)
      return {
        date: date.toLocaleDateString('ar-SA', { 
          calendar: 'gregory',
          month: 'short',
          day: 'numeric'
        }),
        fullDate: date.toLocaleDateString('ar-SA', { calendar: 'gregory' }),
        weight: parseFloat(measurement.weight) || 0,
        bodyFat: parseFloat(measurement.body_fat_percentage) || 0,
        muscleMass: parseFloat(measurement.muscle_mass) || 0,
        waistCircumference: parseFloat(measurement.waist_circumference) || 0,
      }
    })
  }, [measurements])

  if (measurementsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const latestMeasurement = measurements?.[0]
  const weightTrend = getMeasurementTrend(measurements, 'weight')
  const bodyFatTrend = getMeasurementTrend(measurements, 'body_fat_percentage')

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-chart-line text-success me-2"></i>
                القياسات الصحية
              </h2>
              <p className="text-muted">متابعة تقدمك الصحي والقياسات</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowChart(!showChart)}
              >
                <i className="fas fa-chart-area me-2"></i>
                {showChart ? 'إخفاء الرسوم البيانية' : 'عرض الرسوم البيانية'}
              </button>
              <button className="btn btn-outline-success">
                <i className="fas fa-download me-2"></i>
                تصدير التقرير
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
              <small>هنا يمكنك متابعة قياساتك الصحية وتطورها عبر الزمن.</small>
            </div>
          </div>
        </div>
      )}

      {/* Latest Measurements Summary */}
      {latestMeasurement && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card text-center border-primary">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-weight text-primary fs-4 me-2"></i>
                  <div>
                    <div className="fw-bold text-primary fs-4">
                      {latestMeasurement.weight} كجم
                    </div>
                    <small className="text-muted">الوزن الحالي</small>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <i className={getTrendIcon(weightTrend)}></i>
                  <small className="text-muted ms-1">{getTrendText(weightTrend)}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center border-success">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-percentage text-success fs-4 me-2"></i>
                  <div>
                    <div className="fw-bold text-success fs-4">
                      {latestMeasurement.body_fat_percentage}%
                    </div>
                    <small className="text-muted">نسبة الدهون</small>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <i className={getTrendIcon(bodyFatTrend)}></i>
                  <small className="text-muted ms-1">{getTrendText(bodyFatTrend)}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center border-info">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-dumbbell text-info fs-4 me-2"></i>
                  <div>
                    <div className="fw-bold text-info fs-4">
                      {latestMeasurement.muscle_mass || '--'} كجم
                    </div>
                    <small className="text-muted">كتلة العضلات</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center border-warning">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-ruler text-warning fs-4 me-2"></i>
                  <div>
                    <div className="fw-bold text-warning fs-4">
                      {latestMeasurement.waist_circumference || '--'} سم
                    </div>
                    <small className="text-muted">محيط الخصر</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Progress Chart */}
      {showChart && measurements && measurements.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-chart-line me-2"></i>
                  متابعة تطور الوزن
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      label={{ value: 'الوزن (كجم)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        textAlign: 'right'
                      }}
                      formatter={(value, name) => {
                        if (name === 'weight') return [`${value} كجم`, 'الوزن']
                        if (name === 'bodyFat') return [`${value}%`, 'نسبة الدهون']
                        if (name === 'muscleMass') return [`${value} كجم`, 'كتلة العضلات']
                        if (name === 'waistCircumference') return [`${value} سم`, 'محيط الخصر']
                        return [value, name]
                      }}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => {
                        if (value === 'weight') return 'الوزن (كجم)'
                        if (value === 'bodyFat') return 'نسبة الدهون (%)'
                        if (value === 'muscleMass') return 'كتلة العضلات (كجم)'
                        if (value === 'waistCircumference') return 'محيط الخصر (سم)'
                        return value
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#0d6efd" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#0d6efd' }}
                      activeDot={{ r: 8 }}
                      name="weight"
                    />
                    {chartData.some(d => d.bodyFat > 0) && (
                      <Line 
                        type="monotone" 
                        dataKey="bodyFat" 
                        stroke="#198754" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#198754' }}
                        name="bodyFat"
                      />
                    )}
                    {chartData.some(d => d.muscleMass > 0) && (
                      <Line 
                        type="monotone" 
                        dataKey="muscleMass" 
                        stroke="#0dcaf0" 
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 4, fill: '#0dcaf0' }}
                        name="muscleMass"
                      />
                    )}
                    {chartData.some(d => d.waistCircumference > 0) && (
                      <Line 
                        type="monotone" 
                        dataKey="waistCircumference" 
                        stroke="#ffc107" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 4, fill: '#ffc107' }}
                        name="waistCircumference"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                
                {/* إحصائيات سريعة */}
                {chartData.length > 1 && (
                  <div className="row mt-4">
                    <div className="col-md-3 mb-2">
                      <div className="p-3 bg-primary bg-opacity-10 rounded text-center">
                        <div className="fw-bold text-primary">
                          {chartData[0].weight} كجم
                        </div>
                        <small className="text-muted">الوزن الأول</small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-2">
                      <div className="p-3 bg-success bg-opacity-10 rounded text-center">
                        <div className="fw-bold text-success">
                          {chartData[chartData.length - 1].weight} كجم
                        </div>
                        <small className="text-muted">الوزن الحالي</small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-2">
                      <div className="p-3 bg-info bg-opacity-10 rounded text-center">
                        <div className="fw-bold text-info">
                          {(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)} كجم
                        </div>
                        <small className="text-muted">
                          {chartData[chartData.length - 1].weight >= chartData[0].weight ? 'زيادة' : 'نقصان'}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-2">
                      <div className="p-3 bg-warning bg-opacity-10 rounded text-center">
                        <div className="fw-bold text-warning">
                          {chartData.length}
                        </div>
                        <small className="text-muted">عدد القياسات</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurements Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            سجل القياسات
          </h5>
        </div>
        <div className="card-body">
          {measurements && measurements.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوزن (كجم)</th>
                    <th>نسبة الدهون (%)</th>
                    <th>كتلة العضلات (كجم)</th>
                    <th>محيط الخصر (سم)</th>
                    <th>محيط الورك (سم)</th>
                    <th>ضغط الدم</th>
                    <th>مستوى السكر</th>
                    <th>الملاحظات</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((measurement) => (
                    <tr key={measurement.id}>
                      <td>
                        <div className="fw-bold">{formatDate(measurement.recorded_date)}</div>
                        <small className="text-muted">{measurement.recorded_time}</small>
                      </td>
                      <td>
                        <span className="badge bg-primary fs-6">
                          {measurement.weight} كجم
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success fs-6">
                          {measurement.body_fat_percentage}%
                        </span>
                      </td>
                      <td>
                        {measurement.muscle_mass ? (
                          <span className="badge bg-info fs-6">
                            {measurement.muscle_mass} كجم
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {measurement.waist_circumference ? (
                          <span className="badge bg-warning fs-6">
                            {measurement.waist_circumference} سم
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {measurement.hip_circumference ? (
                          <span className="badge bg-secondary fs-6">
                            {measurement.hip_circumference} سم
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {measurement.blood_pressure_systolic && measurement.blood_pressure_diastolic ? (
                          <span className="badge bg-danger fs-6">
                            {measurement.blood_pressure_systolic}/{measurement.blood_pressure_diastolic}
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {measurement.blood_sugar ? (
                          <span className="badge bg-dark fs-6">
                            {measurement.blood_sugar} mg/dL
                          </span>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {measurement.notes ? (
                          <small className="text-muted" title={measurement.notes}>
                            {measurement.notes.length > 30 
                              ? `${measurement.notes.substring(0, 30)}...` 
                              : measurement.notes
                            }
                          </small>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedMeasurement(measurement)}
                        >
                          <i className="fas fa-eye me-1"></i>
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-chart-line text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">لا توجد قياسات مسجلة</h5>
              <p className="text-muted">ستظهر هنا القياسات التي يسجلها طبيبك</p>
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
      </div>

      {/* Measurement Details Modal */}
      {selectedMeasurement && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-chart-line text-success me-2"></i>
                  تفاصيل القياس
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedMeasurement(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">معلومات القياس</h6>
                    <div className="mb-2">
                      <strong>التاريخ:</strong> {formatDate(selectedMeasurement.recorded_date)}
                    </div>
                    <div className="mb-2">
                      <strong>الوقت:</strong> {selectedMeasurement.recorded_time}
                    </div>
                    <div className="mb-2">
                      <strong>المسجل بواسطة:</strong> {selectedMeasurement.recorded_by_name || 'طبيبك'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-success mb-3">القياسات الأساسية</h6>
                    <div className="row text-center">
                      <div className="col-6 mb-2">
                        <div className="p-2 bg-primary text-white rounded">
                          <div className="fw-bold fs-5">{selectedMeasurement.weight} كجم</div>
                          <small>الوزن</small>
                        </div>
                      </div>
                      <div className="col-6 mb-2">
                        <div className="p-2 bg-success text-white rounded">
                          <div className="fw-bold fs-5">{selectedMeasurement.body_fat_percentage}%</div>
                          <small>نسبة الدهون</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-4">
                  <h6 className="mb-3">جميع القياسات</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>كتلة العضلات:</strong> {selectedMeasurement.muscle_mass || '--'} كجم
                      </div>
                      <div className="mb-2">
                        <strong>محيط الخصر:</strong> {selectedMeasurement.waist_circumference || '--'} سم
                      </div>
                      <div className="mb-2">
                        <strong>محيط الورك:</strong> {selectedMeasurement.hip_circumference || '--'} سم
                      </div>
                      <div className="mb-2">
                        <strong>محيط الصدر:</strong> {selectedMeasurement.chest_circumference || '--'} سم
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>محيط الذراع:</strong> {selectedMeasurement.arm_circumference || '--'} سم
                      </div>
                      <div className="mb-2">
                        <strong>ضغط الدم:</strong> {selectedMeasurement.blood_pressure_systolic && selectedMeasurement.blood_pressure_diastolic 
                          ? `${selectedMeasurement.blood_pressure_systolic}/${selectedMeasurement.blood_pressure_diastolic}` 
                          : '--'
                        }
                      </div>
                      <div className="mb-2">
                        <strong>مستوى السكر:</strong> {selectedMeasurement.blood_sugar || '--'} mg/dL
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMeasurement.notes && (
                  <div className="border-top pt-4">
                    <h6 className="mb-3">الملاحظات</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedMeasurement.notes}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedMeasurement(null)}
                >
                  إغلاق
                </button>
                <button className="btn btn-success">
                  <i className="fas fa-download me-2"></i>
                  تصدير القياس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientMeasurements
