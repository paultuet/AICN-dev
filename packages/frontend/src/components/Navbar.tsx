import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from './ui'

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="text-white shadow-lg bg-primary">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Logo width={50} />
            <span className="text-gray-300 text-xl md:text-2xl font-bold tracking-tight hidden sm:block">AICN</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-primary"
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
            <Link to="/" className="hover:text-gray-300 transition-colors py-1 px-2 rounded-md font-medium">
              Référentiels
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-gray-300 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">{user.email}</span>
                  </span>
                )}
                <button 
                  onClick={() => logout()}
                  className="bg-secondary hover:bg-secondary-hover py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-secondary hover:bg-secondary-hover py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-2 pb-3 border-t border-gray-700/30`}>
          <Link to="/" className="block py-2 hover:bg-primary-hover rounded-md px-3" onClick={() => setIsMenuOpen(false)}>
            Référentiels
          </Link>
          
          {isAuthenticated ? (
            <div className="border-t border-gray-700/30 mt-2 pt-2">
              {user && (
                <div className="px-3 py-2 text-sm text-gray-300 flex items-center">
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
                className="block w-full text-left px-3 py-2 hover:bg-primary-hover rounded-md mt-1"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="block py-2 hover:bg-primary-hover rounded-md px-3 mt-1 border-t border-gray-700/30"
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
