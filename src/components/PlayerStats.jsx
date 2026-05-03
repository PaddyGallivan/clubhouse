import { useState, useEffect } from 'react'

const AFL_LABELS = {
  goals:'Goals', behinds:'Behinds', kicks:'Kicks', handballs:'HB',
  disposals:'Disp', marks:'Marks', tackles:'Tackles', hitouts:'HO',
  frees_for:'FF', frees_against:'FA', votes:'Votes',
}
const CRICKET_LABELS = {
  runs:'Runs', balls:'Balls', fours:'4s', sixes:'6s', not_out:'NO',
  overs:'Overs', maidens:'Maidens', wickets:'Wkts', runs_conceded:'Runs',
}

function Pill({ label, value, highlight }) {
  return (
    <div className={`text-center rounded-xl p-2.5 ${highlight ? 'club-bg text-white' : 'bg-gray-50'}`}>
      <p className={`text-lg font-bold leading-none ${highlight ? 'text-white' : 'text-gray-800'}`}>
        {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : '—'}
      </p>
      <p className={`text-xs mt-0.5 ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{label}</p>
    </div>
  )
}

export default function PlayerStats({ slug, userId, sport = 'afl' }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('season')

  useEffect(() => {
    if (!slug || !userId) return
    fetch(`/api/clubs/${slug}/stats/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ch_token')}` }
    }).then(r => r.json()).then(setData).catch(() => {})
  }, [slug, userId])

  if (!data?.totals?.length) return (
    <div className="text-center py-6 text-gray-400 text-sm">
      <p className="text-2xl mb-2">📊</p><p>No stats recorded yet</p>
    </div>
  )

  const labels = sport === 'afl' ? AFL_LABELS : CRICKET_LABELS
  const totals = Object.fromEntries(data.totals.map(t => [t.stat_key, t]))
  const games = data.games_played || 0
  const highlights = sport === 'afl' ? ['goals','disposals','votes'] : ['runs','wickets']
  const activeKeys = Object.entries(labels).filter(([k]) => totals[k])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['season','games'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${tab === t ? 'club-bg text-white' : 'bg-gray-100 text-gray-500'}`}>
            {t === 'season' ? `Season (${games} games)` : 'Game Log'}
          </button>
        ))}
      </div>
      {tab === 'season' && (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
            {activeKeys.map(([k, l]) => <Pill key={k} label={l} value={totals[k]?.total} highlight={highlights.includes(k)} />)}
          </div>
          {games > 0 && (
            <>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Per game avg</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {activeKeys.map(([k, l]) => <Pill key={k} label={l} value={totals[k]?.average} />)}
              </div>
            </>
          )}
        </>
      )}
      {tab === 'games' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-3 font-semibold text-gray-500">Game</th>
                {activeKeys.filter(([k]) => data.games?.some(g => g.stats[k] != null))
                  .map(([k, l]) => <th key={k} className="text-center py-2 px-1 font-semibold text-gray-500 min-w-[36px]">{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.games?.map(g => (
                <tr key={g.fixture_id} className="border-b border-gray-50">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-gray-700">{g.is_home ? 'vs' : '@'} {g.opponent_name || g.opponent}</p>
                    <p className="text-gray-400">R{g.round} · {g.score_us ?? '?'}-{g.score_them ?? '?'}</p>
                  </td>
                  {activeKeys.filter(([k]) => data.games?.some(gg => gg.stats[k] != null))
                    .map(([k]) => (
                      <td key={k} className="py-2 px-1 text-center text-gray-700">
                        {g.stats[k] ?? <span className="text-gray-200">—</span>}
                      </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}