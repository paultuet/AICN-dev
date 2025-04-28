import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResendVerificationPage from './pages/ResendVerificationPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

// Composant qui redirige les utilisateurs déjà authentifiés vers la page d'accueil
const AuthRedirect = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth()
  
  // Pendant la vérification de l'authentification, afficher un loader
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  
  // Si déjà authentifié, rediriger vers la page d'accueil
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  // Sinon, afficher la page demandée
  return children
}

function App() {
  return (
    <Routes>
      {/* Routes d'authentification (accessibles uniquement aux utilisateurs non connectés) */}
      <Route path="/login" element={
        <AuthRedirect>
          <LoginPage />
        </AuthRedirect>
      } />
      <Route path="/register" element={
        <AuthRedirect>
          <RegisterPage />
        </AuthRedirect>
      } />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      
      {/* Routes protégées (accessibles uniquement aux utilisateurs connectés) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App