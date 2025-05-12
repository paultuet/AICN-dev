import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-700 text-white py-3 shadow-inner">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© {new Date().getFullYear()} AICN. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
