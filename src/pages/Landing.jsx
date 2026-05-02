import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const SPORT_ICONS = {
  afl: '🏉',
  cricket: '🏏',
  soccer: '⚽',
  netball: '🏐',
  basketball: '🏀',
  rugby: '🏈',
  hockey: '🏑',
  tennis: '🎾',
}

export default function Landing() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clubs')
      .then(r => r.json())
      .then(d => { setClubs(d.clubs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="mb-6">
          <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Beta</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-5 leading-tight">
          Everything your<br />
          <span className="text-yellow-400">sport club</span> needs.
        </h1>
        <p className="text-xl text-gray-400 mb-6 max-w-xl mx-auto">
          Fixtures, roster, comms, live scores, player stats, team management — one platform for every member.
        </p>
        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-400 mb-12">
          {['🏉 AFL', '🏏 Cricket', '⚽ Soccer', '🏐 Netball', '🏀 Basketball', '🏑 Hockey'].map(s => (
            <span key={s} className="bg-gray-800 px-3 py-1.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* Live clubs directory */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Live Clubs</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
            {loading ? '...' : clubs.length + ' club' + (clubs.length !== 1 ? 's' : '')}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12"><LoadingSpinner /></div>
        ) : clubs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No clubs yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map(club => (
              <Link key={club.id} to={'/' + club.slug}
                className="group block bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-500 rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                  {/* Club badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ backgroundColor: club.primary_colour || '#333', color: club.secondary_colour || '#fff' }}>
                    {club.short_name?.slice(0, 3) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-yellow-400 transition-colors">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-lg">{SPORT_ICONS[club.sport] || '🏆'}</span>
                      <span className="text-xs text-gray-400 capitalize">{club.sport}</span>
                    </div>
                  </div>
                </div>
                {club.ground_name && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>📍</span>
                    <span>{club.ground_name}{club.ground_address ? ', ' + club.ground_address : ''}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-600">Est. {club.founded_year || '–'}</span>
                  <span className="text-xs font-semibold text-yellow-400 group-hover:underline">View club →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-gray-800 border border-gray-700 rounded-2xl p-10">
          <h3 className="text-2xl font-black text-white mb-3">Get your club on Clubhouse</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">One platform for your entire club — players, coaches, committee, and supporters. Free to get started.</p>
          <a href="mailto:hello@luckdragon.io?subject=Get my club on Clubhouse"
            className="inline-block bg-yellow-400 text-gray-900 px-8 py-3 rounded-xl font-bold text-base hover:bg-yellow-300 transition-colors">
            Get in touch →
          </a>
        </div>
      </div>

      {/* Feature grid */}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-black text-white mb-8 text-center">Built for every role</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '📅', label: 'Fixtures & Results', desc: 'Full season draw, live scores, W/L tracker' },
              { icon: '👥', label: 'Roster & Teams', desc: 'Player cards, positions, jumper numbers' },
              { icon: '📊', label: 'Player Stats', desc: 'Per-game stats, season totals, profiles' },
              { icon: '🏆', label: 'B&F Voting', desc: '3-2-1 votes after every game' },
              { icon: '📣', label: 'Club Comms', desc: 'Pinned announcements, team news' },
              { icon: '💬', label: 'Team Chat', desc: 'Real-time chat per team group' },
              { icon: '🎟️', label: 'Events & RSVPs', desc: 'Socials, presentation nights, fundraisers' },
              { icon: '🔐', label: 'Magic Link Login', desc: 'No passwords — just your email' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-bold text-white mb-1">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-xs">Clubhouse · powered by <span className="text-yellow-400 font-semibold">Luck Dragon</span></p>
        </div>
      </footer>
    </div>
  )
}
