import api from './api'
// import { formUrlencoded } from '../utils/request'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
  organization: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterResponse {
  message: string
  user: {
    id: string
    email: string
    name: string
    organization: string
    role: string
  }
}

export interface AuthUser {
  id: string
  email: string
  exp: number
  role: string
}

const authService = {
  /**
   * Login user with credentials
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Utiliser l'endpoint correct du backend
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterCredentials): Promise<RegisterResponse> => {
    console.log("Registering user with data:", userData);
    
    try {
      // Utiliser l'endpoint correct du backend
      const response = await api.post<RegisterResponse>('/auth/register', userData);
      console.log("Register response data:", response.data);
      return response.data;
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    }
  },
  
  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.get(`/auth/verify-email?token=${token}`)
    return response.data
  },
  
  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/resend-verification', { email })
    return response.data
  },

  /**
   * Get current user info from token
   */
  getCurrentUser: (): AuthUser | null => {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    try {
      // Decode JWT token (assumes token is in format: header.payload.signature)
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      return JSON.parse(jsonPayload) as AuthUser
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const user = authService.getCurrentUser()
    if (!user) return false
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000)
    return user.exp > currentTime
  },

  /**
   * Logout user by removing token
   */
  logout: (): void => {
    localStorage.removeItem('authToken')
    delete api.defaults.headers.common['Authorization']
  },

  /**
   * Get user profile from the API (with current auth token)
   */
  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data
  }
}

export default authService
