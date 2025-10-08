import axios from 'axios'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('ليس لديك صلاحية للوصول إلى هذا المورد')
    } else if (error.response?.status === 404) {
      toast.error('المورد المطلوب غير موجود')
    } else if (error.response?.status >= 500) {
      toast.error('حدث خطأ في الخادم. يرجى المحاولة لاحقاً')
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('خطأ في الاتصال بالخادم')
    }
    
    return Promise.reject(error)
  }
)

export default api
