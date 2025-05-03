import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="text-white shadow-lg" style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)' }}>
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-indigo-600 text-lg md:text-xl font-extrabold">A</span>
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight hidden sm:block">AICN</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-indigo-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center space-x-6">
            <Link to="/" className="hover:text-indigo-100 transition-colors py-1 px-2 rounded-md font-medium">
              Référentiels
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-indigo-100 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">{user.email}</span>
                  </span>
                )}
                <button 
                  onClick={() => logout()}
                  className="bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-2 pb-3 border-t border-indigo-400/30`}>
          <Link to="/" className="block py-2 hover:bg-indigo-700 rounded-md px-3" onClick={() => setIsMenuOpen(false)}>
            Référentiels
          </Link>
          
          {isAuthenticated ? (
            <div className="border-t border-indigo-400/30 mt-2 pt-2">
              {user && (
                <div className="px-3 py-2 text-sm text-indigo-100 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <button 
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 hover:bg-indigo-700 rounded-md mt-1"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="block py-2 hover:bg-indigo-700 rounded-md px-3 mt-1 border-t border-indigo-400/30"
              onClick={() => setIsMenuOpen(false)}
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
