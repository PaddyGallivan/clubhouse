import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { isLoggedIn, clearToken } from '../lib/auth.js'

export default function ClubLayout({ club, children }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const loggedIn = isLoggedIn()
  const primary = club?.primary_colour || '#003087'
  const secondary = club?.secondary_colour || '#FFD700'

  function handleLogout() { clearToken(); navigate(`/${slug}`) }
  function active(path) { return location.pathname === `/${slug}${path}` }

  const navLinks = [
    { to: '', label: 'Home' },
    { to: '/fixtures', label: 'Fixtures' },
    { to: '/roster', label: 'Roster' },
    { to: '/teams', label: 'Teams' },
    { to: '/training', label: 'Training' },
    { to: '/news', label: 'News' },
    { to: '/events', label: 'Events' },
    { to: '/voting', label: 'B&F' },
    { to: '/matchday', label: 'Match Day' },
    { to: '/chat', label: 'Chat' },
    { to: '/sponsors', label: 'Sponsors' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`:root{--club-primary:${primary};--club-secondary:${secondary}}.club-bg{background-color:${primary}}.club-text{color:${primary}}.club-accent{background-color:${secondary}}.club-accent-text{color:${secondary}}.club-border{border-color:${primary}}`}</style>

      <header className="club-bg shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to={`/${slug}`} className="flex items-center gap-2.5 shrink-0">
              <div className="h-9 w-9 rounded-full club-accent flex items-center justify-center font-black text-sm club-text">
                {club?.short_name?.slice(0,2) || '??'}
              </div>
              <span className="text-white font-bold text-base hidden sm:block">{club?.short_name || club?.name}</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={`/${slug}${to}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${active(to) ? 'bg-white/20 text-white' : 'text-white/75 hover:text-white hover:bg-white/10'}`}>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              {loggedIn ? (
                <>
                  <Link to={`/${slug}/admin`}
                    className={`hidden lg:block text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${active('/admin') ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                    Admin
                  </Link>
                  <Link to={`/${slug}/dashboard`}
                    className="club-accent club-text px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="hidden lg:flex items-center gap-1 text-white/60 hover:text-white text-xs font-semibold hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors">
                    Sign out
                  </button>
                </>
              ) : (
                <Link to={`/${slug}/login`}
                  className="club-accent club-text px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                  Log in
                </Link>
              )}
              {/* Hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-1 rounded hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/20 mt-1 pt-3">
              <div className="grid grid-cols-3 gap-1 mb-3">
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={`/${slug}${to}`} onClick={() => setMenuOpen(false)}
                    className={`text-xs font-medium text-center px-2 py-2 rounded-lg transition-colors ${active(to) ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                    {label}
                  </Link>
                ))}
              </div>
              {/* Auth actions in mobile menu */}
              <div className="border-t border-white/20 pt-3 flex gap-2 justify-end">
                {loggedIn ? (
                  <>
                    <Link to={`/${slug}/admin`} onClick={() => setMenuOpen(false)}
                      className="text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/10">
                      Admin
                    </Link>
                    <Link to={`/${slug}/dashboard`} onClick={() => setMenuOpen(false)}
                      className="club-accent club-text text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90">
                      Dashboard
                    </Link>
                    <button onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/10 border border-white/20">
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link to={`/${slug}/login`} onClick={() => setMenuOpen(false)}
                    className="club-accent club-text text-xs font-bold px-4 py-1.5 rounded-lg">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      <footer className="club-bg mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/50 text-xs">{club?.name} · powered by <span className="club-accent-text font-semibold">Clubhouse</span></p>
        </div>
      </footer>
    </div>
  )
}
