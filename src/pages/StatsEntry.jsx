import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Avatar from '../components/Avatar'

const AFL_STATS = [
  { key: 'goals', label: 'Goals' }, { key: 'behinds', label: 'Behinds' },
  { key: 'kicks', label: 'Kicks' }, { key: 'handballs', label: 'HB' },
  { key: 'disposals', label: 'Disp' }, { key: 'marks', label: 'Marks' },
  { key: 'tackles', label: 'Tackles' }, { key: 'hitouts', label: 'HO' },
  { key: 'frees_for', label: 'FF' }, { key: 'frees_against', label: 'FA' },
  { key: 'votes', label: 'Votes' },
]
const CRICKET_BAT = [
  { key: 'runs', label: 'Runs' }, { key: 'balls', label: 'Balls' },
  { key: 'fours', label: '4s' }, { key: 'sixes', label: '6s' },
  { key: 'not_out', label: 'NO' },
]
const CRICKET_BOWL = [
  { key: 'overs', label: 'Overs' }, { key: 'maidens', label: 'Maidens' },
  { key: 'wickets', label: 'Wkts' }, { key: 'runs_conceded', label: 'Runs' },
]

function StatsGrid({ players, statKeys, playerStats, onChange }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-3 font-semibold text-gray-600 min-w-[130px]">Player</th>
            {statKeys.map(s => (
              <th key={s.key} className="text-center py-2 px-1 font-semibold text-gray-500 min-w-[52px]">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <Avatar user={p} size="sm" />
                  <div>
                    <p className="font-medium text-gray-800 text-xs leading-tight">{p.name}</p>
                    {p.jumper_number && <p className="text-xs text-gray-400">#{p.jumper_number}</p>}
                  </div>
                </div>
              </td>
              {statKeys.map(s => (
                <td key={s.key} className="py-1 px-1 text-center">
                  <input
                    type="number" min="0" step={s.key === 'overs' ? '0.1' : '1'}
                    className="w-12 text-center border border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-400"
                    value={playerStats[p.id]?.[s.key] ?? ''}
                    onChange={e => onChange(p.id, s.key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function StatsEntry() {
  const { slug, fixtureId } = useParams()
  const [fixture, setFixture] = useState(null)
  const [roster, setRoster] = useState([])
  const [sport, setSport] = useState('afl')
  const [cricketMode, setCricketMode] = useState('bat')
  const [playerStats, setPlayerStats] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ch_token')
    Promise.all([
      fetch(`/api/clubs/${slug}/fixtures`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/clubs/${slug}/roster`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/clubs/${slug}/fixtures/${fixtureId}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([fixtures, rosterData, statsData]) => {
      const fx = (fixtures.fixtures || []).find(f => String(f.id) === String(fixtureId))
      setFixture(fx)
      if (fx?.sport) setSport(fx.sport)
      setRoster(rosterData.roster || [])
      const existing = {}
      for (const p of (statsData.players || [])) existing[p.user_id] = { ...p.stats }
      setPlayerStats(existing)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug, fixtureId])

  const updateStat = useCallback((userId, key, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [key]: value === '' ? '' : Number(value) }
    }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const players = roster
        .map(p => ({ user_id: p.id, stats: Object.fromEntries(Object.entries(playerStats[p.id] || {}).filter(([, v]) => v !== '')) }))
        .filter(p => Object.keys(p.stats).length > 0)
      const resp = await fetch(`/api/clubs/${slug}/fixtures/${fixtureId}/stats`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('ch_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, players }),
      })
      const data = await resp.json()
      if (data.ok) setSaved(true)
      else throw new Error(data.error || 'Save failed')
    } catch (e) {
      alert('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Loading…</div>
  const statKeys = sport === 'afl' ? AFL_STATS : cricketMode === 'bat' ? CRICKET_BAT : CRICKET_BOWL

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/club/${slug}/fixtures`} className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stats Entry</h1>
            {fixture && (
              <p className="text-sm text-gray-500">
                Round {fixture.round} · {fixture.is_home ? 'vs' : '@'} {fixture.opponent}
                {fixture.date && ` · ${new Date(fixture.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
              </p>
            )}
          </div>
        </div>

        <div className="card mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-600">Sport:</span>
            {['afl', 'cricket'].map(s => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sport === s ? 'club-bg text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === 'afl' ? '🏉 AFL' : '🏏 Cricket'}
              </button>
            ))}
            {sport === 'cricket' && (
              <>
                <span className="text-gray-300">|</span>
                {[['bat','🏏 Batting'],['bowl','⚾ Bowling']].map(([m,l]) => (
                  <button key={m} onClick={() => setCricketMode(m)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${cricketMode === m ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {l}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="card mb-5">
          <h2 className="font-bold text-gray-800 mb-4">
            {roster.length} Players
            <span className="text-sm font-normal text-gray-400 ml-2">Leave blank to skip</span>
          </h2>
          {roster.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No roster members found.</p>
            : <StatsGrid players={roster} statKeys={statKeys} playerStats={playerStats} onChange={updateStat} />
          }
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="btn club-bg text-white px-6 py-2.5 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : '💾 Save Stats'}
          </button>
          {saved && <span className="text-green-600 text-sm font-medium">✅ Saved!</span>}
        </div>
      </div>
    </div>
  )
}