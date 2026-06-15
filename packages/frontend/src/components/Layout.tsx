import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg app-bg">
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="border-t border-hair py-3">
        <div className="max-w-[1480px] mx-auto px-7 text-center">
          <p className="text-xs text-ink-3 font-mono">© {new Date().getFullYear()} AICN · FIDJI — Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
