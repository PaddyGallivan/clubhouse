import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function ClubHome() {
  const { slug } = useParams()
  const { club, loading, error } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [news, setNews] = useState([])

  useEffect(() => {
    if (!slug) return
    api.getFixtures(slug).then(d => setFixtures((d.fixtures || []).slice(0, 3))).catch(() => {})
    api.getAnnouncements(slug).then(d => setNews((d.announcements || []).slice(0, 3))).catch(() => {})
  }, [slug])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  if (error || !club) return <div className="min-h-screen flex items-center justify-center text-gray-500">Club not found.</div>

  const next = fixtures.find(f => f.status === 'upcoming')

  return (
    <ClubLayout club={club}>
      {/* Hero */}
      <div className="club-bg rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-1">{club.name}</h1>
          {club.ground_name && <p className="text-white/70 mb-4">🏟️ {club.ground_name}</p>}
          {next && (
            <div className="inline-block club-accent club-text rounded-xl px-4 py-2 text-sm font-bold">
              Next: Rd {next.round} vs {next.opponent_name} — {next.date ? new Date(next.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'} {next.is_home ? '(H)' : '(A)'}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent/upcoming fixtures */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Fixtures</h2>
            <Link to={`/${slug}/fixtures`} className="text-sm club-text font-semibold hover:underline">All →</Link>
          </div>
          {fixtures.length === 0 ? (
            <p className="text-gray-400 text-sm">No fixtures yet.</p>
          ) : (
            <div className="space-y-3">
              {fixtures.map(f => (
                <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Rd {f.round} — {f.opponent_name}</div>
                    <div className="text-xs text-gray-400">{f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'} · {f.is_home ? 'Home' : 'Away'}</div>
                  </div>
                  {f.status === 'played' ? (
                    <div className={`text-sm font-bold ${f.score_us > f.score_them ? 'text-green-600' : 'text-red-500'}`}>
                      {f.score_us} – {f.score_them}
                    </div>
                  ) : (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">Upcoming</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* News */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-lg">News</h2>
            <Link to={`/${slug}/news`} className="text-sm club-text font-semibold hover:underline">All →</Link>
          </div>
          {news.length === 0 ? (
            <p className="text-gray-400 text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {news.map(a => (
                <div key={a.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="font-semibold text-sm text-gray-800">{a.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { to: `/${slug}/roster`, icon: '👥', label: 'Roster' },
          { to: `/${slug}/teams`, icon: '🎽', label: 'Teams' },
          { to: `/${slug}/sponsors`, icon: '🤝', label: 'Sponsors' },
          { to: `/${slug}/login`, icon: '🔐', label: 'Member Login' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} className="card text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">{icon}</div>
            <div className="font-semibold text-sm text-gray-700">{label}</div>
          </Link>
        ))}
      </div>
    </ClubLayout>
  )
}
