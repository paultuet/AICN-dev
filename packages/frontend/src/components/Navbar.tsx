import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { type LucideIcon, Layers, FileText, Newspaper, Calculator, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuth, useIsAdmin } from '@/contexts/AuthContext'

interface NavItemDef {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const isAdmin = useIsAdmin()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems: NavItemDef[] = [
    { to: '/', label: 'Référentiels', icon: Layers, end: true },
    { to: '/files', label: 'Fichiers', icon: FileText },
    { to: '/journal', label: 'Journal', icon: Newspaper },
    { to: '/simulateur', label: 'Simulateur DC', icon: Calculator },
  ]
  if (isAdmin) navItems.push({ to: '/admin', label: 'Admin', icon: Settings })

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
      isActive ? 'text-ink' : 'text-ink-2 hover:text-ink hover:bg-panel-3'
    }`

  return (
    <nav className="relative h-[60px] flex items-center gap-7 px-5 md:px-7 border-b border-hair bg-[color-mix(in_srgb,var(--panel)_82%,transparent)] backdrop-blur-md backdrop-saturate-150">
      {/* faint orange gradient underline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px opacity-50"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-line) 18%, var(--accent-line) 82%, transparent)' }}
      />

      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 select-none shrink-0">
        <img src="fidji-logo.png" alt="FIDJI logo" className="h-8 md:h-9 w-auto" />
        <span className="w-px h-4 bg-hair-strong" />
        <span className="font-mono text-[11px] tracking-[0.22em] font-medium text-ink-2">AICN</span>
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex items-center gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-brand' : 'opacity-70'} />
                {label}
                {isActive && (
                  <span className="absolute left-3.5 right-3.5 -bottom-px h-0.5 rounded bg-brand" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Right group (desktop) */}
      <div className="hidden md:flex items-center gap-3.5 ml-auto">
        {isAuthenticated && user && (
          <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-hair bg-panel-2">
            <span className="w-[7px] h-[7px] rounded-full bg-ok shadow-[0_0_0_3px_color-mix(in_srgb,var(--ok)_18%,transparent)]" />
            <span className="font-mono text-[12.5px] text-ink-2">{user.email}</span>
          </div>
        )}
        {isAuthenticated ? (
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium text-accent-ink bg-accent-soft border border-accent-line hover:bg-[color-mix(in_srgb,var(--orange)_18%,transparent)] active:translate-y-px transition-colors"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium text-accent-ink bg-accent-soft border border-accent-line hover:bg-[color-mix(in_srgb,var(--orange)_18%,transparent)] transition-colors"
          >
            Connexion
          </Link>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMenuOpen((o) => !o)}
        aria-label="Menu"
        className="md:hidden ml-auto p-2 rounded-md text-ink-2 hover:bg-panel-3 focus:outline-none focus:ring-2 focus:ring-accent-line"
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[60px] left-0 right-0 bg-panel border-b border-hair shadow-panel px-5 py-3 flex flex-col gap-1 z-50">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive ? 'text-ink bg-accent-soft' : 'text-ink-2 hover:bg-panel-3'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <div className="border-t border-hair mt-2 pt-2">
            {isAuthenticated && user && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-ink-2">
                <span className="w-[7px] h-[7px] rounded-full bg-ok shrink-0" />
                <span className="font-mono truncate">{user.email}</span>
              </div>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-accent-ink hover:bg-accent-soft"
              >
                Déconnexion
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-accent-ink hover:bg-accent-soft"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
