import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { useAuth } from './hooks/useAuth'
import { useLanguage } from './hooks/useLanguage'

// Layout Components
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientProfile from './pages/patient/Profile'
import PatientMealPlans from './pages/patient/MealPlans'
import PatientAppointments from './pages/patient/Appointments'
import PatientPayments from './pages/patient/Payments'

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorProfile from './pages/doctor/Profile'
import DoctorPatients from './pages/doctor/Patients'
import DoctorPatientProfile from './pages/doctor/PatientProfile'
import DoctorMealPlans from './pages/doctor/MealPlans'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDoctors from './pages/admin/Doctors'
import AdminPayments from './pages/admin/Payments'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

// Common Pages
import NotFound from './pages/NotFound'

function App() {
  const { user, loading } = useAuth()
  const { language, direction } = useLanguage()

  // Update document attributes for RTL support
  React.useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.body.className = direction === 'rtl' ? 'rtl' : 'ltr'
  }, [language, direction])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Public routes (no authentication required)
  if (!user) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={direction === 'rtl'}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    )
  }

  // Authenticated routes
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <main className="flex-grow-1 p-4">
          <div className="container-fluid">
            <Routes>
              {/* Patient Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientProfile />
                </ProtectedRoute>
              } />
              <Route path="/meal-plans" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientMealPlans />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientAppointments />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientPayments />
                </ProtectedRoute>
              } />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/profile" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorProfile />
                </ProtectedRoute>
              } />
              <Route path="/doctor/patients" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPatients />
                </ProtectedRoute>
              } />
              <Route path="/doctor/patient/:patientId" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPatientProfile />
                </ProtectedRoute>
              } />
              <Route path="/doctor/meal-plans" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorMealPlans />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/doctors" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDoctors />
                </ProtectedRoute>
              } />
              <Route path="/admin/payments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPayments />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Accountant Routes */}
              <Route path="/accountant/dashboard" element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/accountant/payments" element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AdminPayments />
                </ProtectedRoute>
              } />
              <Route path="/accountant/reports" element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AdminReports />
                </ProtectedRoute>
              } />

              {/* Root redirect based on user role */}
              <Route path="/" element={
                user.role === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
                user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                user.role === 'accountant' ? <Navigate to="/accountant/dashboard" replace /> :
                <Navigate to="/dashboard" replace />
              } />
              
              {/* Fallback - redirect to appropriate dashboard */}
              <Route path="*" element={
                user.role === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
                user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                user.role === 'accountant' ? <Navigate to="/accountant/dashboard" replace /> :
                <Navigate to="/dashboard" replace />
              } />
            </Routes>
          </div>
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={direction === 'rtl'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
