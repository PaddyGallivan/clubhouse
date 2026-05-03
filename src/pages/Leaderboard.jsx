import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Avatar from '../components/Avatar'

const AFL_STATS = [
  { key:'goals',label:'Goals' },{ key:'disposals',label:'Disposals' },
  { key:'marks',label:'Marks' },{ key:'tackles',label:'Tackles' },
  { key:'kicks',label:'Kicks' },{ key:'handballs',label:'Handballs' },
  { key:'hitouts',label:'Hitouts' },{ key:'votes',label:'Coach Votes' },
]
const CRICKET_STATS = [
  { key:'runs',label:'Runs' },{ key:'wickets',label:'Wickets' },
  { key:'fours',label:'4s' },{ key:'sixes',label:'6s' },{ key:'maidens',label:'Maidens' },
]

const MEDALS = ['🥇','🥈','🥉']

export default function Leaderboard() {
  const { slug } = useParams()
  const [sport, setSport] = useState('afl')
  const [stat, setStat] = useState('goals')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const statOptions = sport === 'afl' ? AFL_STATS : CRICKET_STATS

  useEffect(() => {
    if (!statOptions.find(s => s.key === stat)) setStat(statOptions[0].key)
  }, [sport])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/clubs/${slug}/stats/leaderboard?stat=${stat}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ch_token')}` }
    }).then(r => r.json()).then(d => { setData(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, stat])

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">📊 Stats Leaderboard</h1>
      <p className="text-sm text-gray-400 mb-5">Season leaders by category</p>

      <div className="flex gap-2 mb-4">
        {['afl','cricket'].map(s => (
          <button key={s} onClick={() => setSport(s)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${sport===s ? 'club-bg text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s === 'afl' ? '🏉 AFL' : '🏏 Cricket'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {statOptions.map(s => (
          <button key={s.key} onClick={() => setStat(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${stat===s.key ? 'border-transparent club-bg text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-800 mb-4">{statOptions.find(s => s.key===stat)?.label} Leaders</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : !data.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p>No stats recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((row, i) => (
              <div key={row.user_id} className={`flex items-center gap-3 p-3 rounded-xl ${i===0 ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
                <span className="text-xl w-8 text-center">{MEDALS[i] || i+1}</span>
                <Avatar user={row} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link to={`/club/${slug}/player/${row.user_id}`}
                    className="font-semibold text-gray-800 hover:text-blue-600 block truncate">
                    {row.name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {row.jumper_number && `#${row.jumper_number} · `}
                    {row.games} games · avg {(row.average||0).toFixed(1)}/game
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold club-text">{row.total}</p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}