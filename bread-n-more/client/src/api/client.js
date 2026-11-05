import axios from 'axios'
import { apiUrl } from '../config/siteConfig'

// One axios object used by every page. Its address and login header are set here, once.
const api = axios.create({ baseURL: apiUrl })

// Before EVERY request: add the saved login token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('breadToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// After EVERY reply: a 401 means the token is missing, fake or expired -> log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = (error.config?.url || '').includes('/auth/login')
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('breadToken')
      window.dispatchEvent(new Event('bread:logout')) // AuthContext listens for this
    }
    return Promise.reject(error)
  }
)

// A friendly message from any axios error (the server's own message when there is one)
export const errorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.request) return 'Cannot reach the server. Is it running?'
  return error.message
}

export default api
