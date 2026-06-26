import axios from 'axios'

// Dynamically determine backend host
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Check if running on localhost to fallback to port 8000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return `http://${hostname}:8000`
  }
  return 'http://localhost:8000'
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Inject JWT bearer token into requests if it exists in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smarterp_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
