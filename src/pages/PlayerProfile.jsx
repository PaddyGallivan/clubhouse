import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function PlayerProfile() {
  const { slug, userId } = useParams()
  const { club } = useClub(slug)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    api.getPlayerProfile(slug, userId)
      .then(d => { setProfile(d.player); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, userId])

  if (loading) return <ClubLayout club={club}><LoadingSpinner /></ClubLayout>
  if (!profile) return <ClubLayout club={club}><div className="card text-center py-12 text-gray-400">Player not found.</div></ClubLayout>

  const gamesPlayed = profile.stats?.length || 0
  const totalGoals = profile.stats?.reduce((sum, s) => sum + (s.goals || 0), 0) || 0
  const totalDisposals = profile.stats?.reduce((sum, s) => sum + (s.disposals || 0), 0) || 0

  return (
    <ClubLayout club={club}>
      <Link to={`/${slug}/roster`} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← Roster</Link>

      {/* Player card */}
      <div className="club-bg rounded-2xl p-6 text-white mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black">
          {profile.jumper_number || '#'}
        </div>
        <div>
          <h1 className="text-2xl font-black">{profile.name}</h1>
          <div className="text-white/70 mt-1">
            {profile.positions && <span>{profile.positions} · </span>}
            {profile.team_name && <span>{profile.team_name}</span>}
          </div>
          {profile.milestones?.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {profile.milestones.map(m => (
                <span key={m.id} className="text-xs club-accent club-text px-2 py-0.5 rounded-full font-bold">🏅 {m.label}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{ label: 'Games', val: gamesPlayed }, { label: 'Goals', val: totalGoals }, { label: 'Disposals', val: totalDisposals }].map(({ label, val }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-black club-text">{val}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['stats', '📊 Stats'], ['goals', '🎯 Dev Goals'], ['fitness', '💪 Fitness']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="card overflow-x-auto">
          {!profile.stats?.length ? <p className="text-gray-400 text-sm">No stats recorded yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                {['Rd', 'Opponent', 'G', 'B', 'D', 'M', 'T'].map(h => <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {profile.stats.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-semibold">{s.round}</td>
                    <td className="py-2 pr-4 text-gray-600">{s.opponent_name}</td>
                    <td className="py-2 pr-4 font-bold club-text">{s.goals}</td>
                    <td className="py-2 pr-4">{s.behinds}</td>
                    <td className="py-2 pr-4">{s.disposals}</td>
                    <td className="py-2 pr-4">{s.marks}</td>
                    <td className="py-2 pr-4">{s.tackles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="card">
          {!profile.dev_goals?.length ? <p className="text-gray-400 text-sm">No development goals set yet.</p> : (
            <div className="space-y-3">
              {profile.dev_goals.map(g => (
                <div key={g.id} className={`flex items-start gap-3 p-3 rounded-lg ${g.status === 'achieved' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <span className="text-lg">{g.status === 'achieved' ? '✅' : '🎯'}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.goal}</p>
                    {g.coach_note && <p className="text-xs text-gray-500 mt-1">Coach: {g.coach_note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'fitness' && (
        <div className="card">
          {!profile.fitness?.length ? <p className="text-gray-400 text-sm">No fitness tests recorded yet.</p> : (
            <div className="space-y-3">
              {profile.fitness.map(f => (
                <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{f.test_type.replace(/_/g,' ')}</p>
                    <p className="text-xs text-gray-400">{f.season} · {f.tested_at}</p>
                  </div>
                  <span className="font-black text-lg club-text">{f.value} <span className="text-xs font-normal text-gray-400">{f.unit}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ClubLayout>
  )
}
