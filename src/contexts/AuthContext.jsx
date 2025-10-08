import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      fetchProfile()
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile/')
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data,
          token: localStorage.getItem('token'),
        },
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      dispatch({ type: 'LOGOUT' })
    }
  }

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      // Convert phone to username for backend compatibility
      const loginData = {
        username: credentials.phone, // Use phone as username
        password: credentials.password
      }
      
      console.log('Logging in with data:', loginData)
      
      // Add timeout to prevent long waiting
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout
      
      const response = await api.post('/api/auth/login/', loginData, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('Login response:', response.data)
      
      const { token, user } = response.data

      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Token ${token}`

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      })

      toast.success('تم تسجيل الدخول بنجاح')
      
      // Force redirect to appropriate dashboard based on user role
      setTimeout(() => {
        let dashboardPath = '/dashboard'
        if (user.role === 'doctor') {
          dashboardPath = '/doctor/dashboard'
        } else if (user.role === 'admin') {
          dashboardPath = '/admin/dashboard'
        } else if (user.role === 'accountant') {
          dashboardPath = '/accountant/dashboard'
        }
        window.location.href = dashboardPath
      }, 100)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      let errorMessage = 'فشل في تسجيل الدخول'
      
      if (error.name === 'AbortError') {
        errorMessage = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      // Use phone number as username for backend compatibility
      const registerData = {
        ...userData,
        username: userData.phone, // Use phone as username
        role: 'patient', // Always set role to patient
        // Ensure physical information is properly formatted
        gender: userData.gender || 'male',
        height: userData.height ? parseFloat(userData.height) : 175.0,
        current_weight: userData.current_weight ? parseFloat(userData.current_weight) : 70.0,
        goal: userData.goal || 'maintain_weight'
      }
      
      console.log('Registering with data:', registerData)
      
      // Add timeout to prevent long waiting
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout
      
      const response = await api.post('/api/auth/register/', registerData, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('Registration response:', response.data)
      
      dispatch({ type: 'SET_LOADING', payload: false })
      toast.success('تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول.')
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different types of errors
      let errorMessage = 'فشل في إنشاء الحساب'
      
      if (error.name === 'AbortError') {
        errorMessage = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data) {
        // Handle field-specific errors
        const fieldErrors = Object.values(error.response.data).flat()
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(', ')
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      })
      toast.error(errorMessage)
      return { success: false, error: error.response?.data || { detail: errorMessage } }
    }
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      dispatch({ type: 'LOGOUT' })
      toast.success('تم تسجيل الخروج بنجاح')
    }
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
