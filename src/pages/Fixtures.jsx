import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function Fixtures() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getFixtures(slug).then(d => { setFixtures(d.fixtures || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  const filtered = filter === 'all' ? fixtures : fixtures.filter(f => f.status === filter)

  const wins = fixtures.filter(f => f.status === 'played' && f.score_us > f.score_them).length
  const losses = fixtures.filter(f => f.status === 'played' && f.score_us < f.score_them).length
  const draws = fixtures.filter(f => f.status === 'played' && f.score_us === f.score_them).length

  return (
    <ClubLayout club={club}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Fixtures & Results</h1>
        {fixtures.some(f => f.status === 'played') && (
          <div className="flex gap-4 mt-3">
            {[{ label: 'W', val: wins, color: 'text-green-600' }, { label: 'L', val: losses, color: 'text-red-500' }, { label: 'D', val: draws, color: 'text-gray-500' }].map(({ label, val, color }) => (
              <div key={label} className="card py-2 px-4 text-center min-w-[60px]">
                <div className={`text-xl font-black ${color}`}>{val}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'upcoming', 'played'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? 'club-bg text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">No fixtures yet.</div>
          ) : filtered.map(f => (
            <div key={f.id} className="card flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold">Rd {f.round}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${f.is_home ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>{f.is_home ? 'Home' : 'Away'}</span>
                </div>
                <div className="font-bold text-gray-900">vs {f.opponent_name}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}
                  {f.time ? ` · ${f.time}` : ''}
                  {f.venue ? ` · ${f.venue}` : ''}
                </div>
              </div>
              <div className="text-right">
                {f.status === 'played' ? (
                  <div>
                    <div className={`text-2xl font-black ${f.score_us > f.score_them ? 'text-green-600' : f.score_us < f.score_them ? 'text-red-500' : 'text-gray-500'}`}>
                      {f.score_us} – {f.score_them}
                    </div>
                    <div className={`text-xs font-semibold ${f.score_us > f.score_them ? 'text-green-600' : f.score_us < f.score_them ? 'text-red-500' : 'text-gray-500'}`}>
                      {f.score_us > f.score_them ? 'WIN' : f.score_us < f.score_them ? 'LOSS' : 'DRAW'}
                    </div>
                  </div>
                ) : f.status === 'bye' ? (
                  <span className="text-sm font-semibold text-gray-400">BYE</span>
                ) : (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-semibold">Upcoming</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
