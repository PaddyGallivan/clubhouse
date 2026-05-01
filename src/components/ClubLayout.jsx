import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { isLoggedIn, clearToken } from '../lib/auth.js'

export default function ClubLayout({ club, children }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const loggedIn = isLoggedIn()

  const primary = club?.primary_colour || '#003087'
  const secondary = club?.secondary_colour || '#FFD700'

  function handleLogout() {
    clearToken()
    navigate(`/${slug}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root { --club-primary: ${primary}; --club-secondary: ${secondary}; }
        .club-bg { background-color: ${primary}; }
        .club-text { color: ${primary}; }
        .club-accent { background-color: ${secondary}; }
        .club-accent-text { color: ${secondary}; }
        .club-border { border-color: ${primary}; }
      `}</style>

      {/* Header */}
      <header className="club-bg shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Name */}
            <Link to={`/${slug}`} className="flex items-center gap-3">
              {club?.logo_url ? (
                <img src={club.logo_url} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full club-accent flex items-center justify-center font-bold text-sm club-text">
                  {club?.short_name?.slice(0,2) || '??'}
                </div>
              )}
              <div>
                <div className="text-white font-bold text-lg leading-tight">{club?.short_name || club?.name}</div>
                {club?.sport && <div className="text-white/60 text-xs uppercase tracking-wide">{club.sport}</div>}
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { to: `/${slug}`, label: 'Home' },
                { to: `/${slug}/fixtures`, label: 'Fixtures' },
                { to: `/${slug}/roster`, label: 'Roster' },
                { to: `/${slug}/teams`, label: 'Teams' },
                { to: `/${slug}/news`, label: 'News' },
                { to: `/${slug}/sponsors`, label: 'Sponsors' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                  {label}
                </Link>
              ))}
              {loggedIn ? (
                <>
                  <Link to={`/${slug}/dashboard`} className="ml-2 club-accent club-text px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-white/60 hover:text-white text-sm ml-2">
                    Log out
                  </button>
                </>
              ) : (
                <Link to={`/${slug}/login`} className="ml-2 club-accent club-text px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                  Log in
                </Link>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden pb-3 border-t border-white/20 mt-1">
              {[
                { to: `/${slug}`, label: 'Home' },
                { to: `/${slug}/fixtures`, label: 'Fixtures' },
                { to: `/${slug}/roster`, label: 'Roster' },
                { to: `/${slug}/teams`, label: 'Teams' },
                { to: `/${slug}/news`, label: 'News' },
                { to: `/${slug}/sponsors`, label: 'Sponsors' },
                loggedIn ? { to: `/${slug}/dashboard`, label: 'Dashboard' } : { to: `/${slug}/login`, label: 'Log in' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block text-white/90 hover:text-white px-3 py-2 text-sm font-medium">
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="club-bg mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/60 text-sm">
            {club?.name} — powered by{' '}
            <span className="club-accent-text font-semibold">Clubhouse</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
