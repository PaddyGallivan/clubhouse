import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn } from '../lib/auth.js'

export default function ClubHome() {
  const { slug } = useParams()
  const { club, loading, error } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [news, setNews] = useState([])
  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (!slug) return
    api.getFixtures(slug).then(d => setFixtures(d.fixtures || [])).catch(() => {})
    api.getAnnouncements(slug).then(d => setNews((d.announcements || []).slice(0, 3))).catch(() => {})
  }, [slug])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  if (error || !club) return <div className="min-h-screen flex items-center justify-center text-gray-500">Club not found.</div>

  const next = fixtures.find(f => f.status === 'upcoming')
  const recentPlayed = fixtures.filter(f => f.status === 'played').slice(-3).reverse()
  const upcoming = fixtures.filter(f => f.status === 'upcoming').slice(0, 3)

  const quickLinks = [
    { to: `/${slug}/fixtures`, icon: '📅', label: 'Fixtures' },
    { to: `/${slug}/roster`, icon: '👥', label: 'Roster' },
    { to: `/${slug}/teams`, icon: '🎽', label: 'Teams' },
    { to: `/${slug}/news`, icon: '📰', label: 'News' },
    { to: `/${slug}/events`, icon: '🎉', label: 'Events' },
    { to: `/${slug}/voting`, icon: '🏆', label: 'B&F Votes' },
    { to: `/${slug}/matchday`, icon: '⚽', label: 'Match Day' },
    { to: `/${slug}/chat`, icon: '💬', label: 'Team Chat' },
  ]

  return (
    <ClubLayout club={club}>
      {/* Hero banner */}
      <div className="club-bg rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-1">{club.name}</h1>
          {club.ground_name && <p className="text-white/70 mb-4">🏟️ {club.ground_name}</p>}
          {next ? (
            <div className="mt-3 bg-white/15 backdrop-blur rounded-xl px-5 py-4 inline-block">
              <div className="text-white/70 text-xs font-bold uppercase tracking-wide mb-1">Next Game</div>
              <div className="text-xl font-black">Rd {next.round} vs {next.opponent_name}</div>
              <div className="text-white/80 text-sm mt-0.5">
                {next.date ? new Date(next.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}
                {next.time ? ` · ${next.time}` : ''}
                {' · '}{next.is_home ? 'Home 🏠' : 'Away ✈️'}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-white/60 text-sm">Season underway — check fixtures for schedule</div>
          )}
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
        {quickLinks.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className="card flex flex-col items-center py-4 px-2 text-center hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
            <span className="text-2xl mb-1.5">{icon}</span>
            <span className="text-xs font-semibold text-gray-600 leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fixtures — upcoming first, then recent results */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Fixtures</h2>
            <Link to={`/${slug}/fixtures`} className="text-sm club-text font-semibold hover:underline">All →</Link>
          </div>
          {fixtures.length === 0 ? (
            <p className="text-gray-400 text-sm">No fixtures yet.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(f => (
                <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Rd {f.round} — {f.opponent_name}</div>
                    <div className="text-xs text-gray-400">
                      {f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'}
                      {' · '}{f.is_home ? 'Home' : 'Away'}
                    </div>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">Upcoming</span>
                </div>
              ))}
              {recentPlayed.map(f => (
                <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Rd {f.round} — {f.opponent_name}</div>
                    <div className="text-xs text-gray-400">
                      {f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${f.score_us > f.score_them ? 'text-green-600' : 'text-red-500'}`}>
                    {f.score_us > f.score_them ? 'W ' : 'L '}{f.score_us}–{f.score_them}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* News */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Latest News</h2>
            <Link to={`/${slug}/news`} className="text-sm club-text font-semibold hover:underline">All →</Link>
          </div>
          {news.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No announcements yet.</p>
              {loggedIn && (
                <Link to={`/${slug}/admin`} className="mt-3 inline-block text-xs club-text font-semibold">Post an announcement →</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {news.map(a => (
                <div key={a.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="font-semibold text-sm text-gray-800">{a.title}</div>
                  {a.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>}
                  <div className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member login CTA (only if not logged in) */}
      {!loggedIn && (
        <div className="mt-6 club-bg/5 border border-current/10 rounded-2xl p-6 text-center">
          <p className="text-gray-600 font-semibold mb-3">Member? Log in to access player profiles, voting, match day tools and team chat.</p>
          <Link to={`/${slug}/login`} className="club-bg text-white px-6 py-2.5 rounded-xl font-bold inline-block hover:opacity-90 transition-opacity">
            Member Login
          </Link>
        </div>
      )}
    </ClubLayout>
  )
}
