import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * A wrapper component that redirects unauthenticated users to the login page
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  
  // While checking authentication status, show nothing or a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  // If not authenticated, redirect to login with the return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // If authenticated, render the child routes
  return <Outlet />
}

export default ProtectedRoute
