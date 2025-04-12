import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">AICN</Link>
          <div className="flex space-x-4 items-center">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            
            {isAuthenticated ? (
              <>
                {user && (
                  <span className="text-blue-200 mr-2">
                    {user.email}
                  </span>
                )}
                <button 
                  onClick={() => logout()}
                  className="hover:text-blue-200 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-blue-200">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar