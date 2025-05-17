import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService from '@/services/auth'
import api from '@/services/api'
import { AxiosError } from 'axios'

// Utilisez ces interfaces temporairement jusqu'à ce que le backend fonctionne
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  organization: string;
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterCredentials) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      const token = localStorage.getItem('authToken')

      if (token) {
        // Set default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // Get user from token
        const userData = authService.getCurrentUser()

        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          // Token invalid, clear it
          localStorage.removeItem('authToken')
          delete api.defaults.headers.common['Authorization']
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      // console.log("Login with:", credentials);
      const { token } = await authService.login(credentials)

      // Save token
      localStorage.setItem('authToken', token)

      // Set in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Get user from token
      const userData = authService.getCurrentUser()

      // Set user
      setUser(userData)
      setIsAuthenticated(true)

    } catch (error) {
      console.error("Login error:", error);
      throw error
    }
  }

  const register = async (userData: RegisterCredentials) => {
    try {
      // console.log("Register with:", userData);
      const { user } = await authService.register(userData)

      if (!user) {
        throw new Error("Error on registration");
      }


      // Save token
      // localStorage.setItem('authToken', token)

      // Set in axios headers
      // api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Get user from token
      // const userDataFromToken = authService.getCurrentUser()

      // Set user
      // setUser(userDataFromToken)
      // setIsAuthenticated(true)

    } catch (error) {
      console.error("Register error:", error);
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
