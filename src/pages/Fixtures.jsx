import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn } from '../lib/auth.js'

function AvailabilityWidget({ slug, fixture }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.getAvailability(slug, fixture.id)
      .then(d => { setStatus(d.myStatus); setSummary(d.summary) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fixture.id])

  async function respond(s) {
    if (!isLoggedIn()) { window.location.href = '/' + slug + '/login'; return }
    setSaving(s)
    try {
      await api.setAvailability(slug, fixture.id, s, null)
      setStatus(s)
      setSummary(prev => {
        if (!prev) return prev
        const next = { ...prev }
        if (status) next[status] = Math.max(0, next[status] - 1)
        next[s] = (next[s] || 0) + 1
        return next
      })
    } catch (e) { alert(e.message) }
    setSaving(null)
  }

  if (loading) return null

  const options = [
    { key: 'available', label: 'Available', emoji: '✅', active: 'bg-green-500 text-white border-green-500', inactive: 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600' },
    { key: 'maybe', label: 'Maybe', emoji: '❓', active: 'bg-yellow-400 text-gray-900 border-yellow-400', inactive: 'border-gray-200 text-gray-500 hover:border-yellow-300 hover:text-yellow-600' },
    { key: 'unavailable', label: "Can't play", emoji: '❌', active: 'bg-red-500 text-white border-red-500', inactive: 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500' },
  ]

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 font-semibold mr-1">Your availability:</span>
          {options.map(o => (
            <button key={o.key} disabled={saving !== null} onClick={() => respond(o.key)}
              className={'px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all ' + (status === o.key ? o.active : o.inactive)}>
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
        {summary && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="text-green-600 font-bold">✅ {summary.available}</span>
            <span className="text-yellow-500 font-bold">❓ {summary.maybe}</span>
            <span className="text-red-500 font-bold">❌ {summary.unavailable}</span>
          </div>
        )}
      </div>
    </div>
  )
}

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
                <div className={'text-xl font-black ' + color}>{val}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'upcoming', 'played'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ' + (filter === f ? 'club-bg text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">No fixtures yet.</div>
          ) : filtered.map(f => (
            <div key={f.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold">Rd {f.round}</span>
                    <span className={'text-xs px-2 py-0.5 rounded font-semibold ' + (f.is_home ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500')}>{f.is_home ? 'Home' : 'Away'}</span>
                    {f.team_name && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-semibold">{f.team_name}</span>}
                  </div>
                  <div className="font-bold text-gray-900">vs {f.opponent_name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}
                    {f.time ? ' · ' + f.time : ''}
                    {f.venue ? ' · ' + f.venue : ''}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {f.status === 'played' ? (
                    <div>
                      <div className={'text-2xl font-black ' + (f.score_us > f.score_them ? 'text-green-600' : f.score_us < f.score_them ? 'text-red-500' : 'text-gray-500')}>
                        {f.score_us} – {f.score_them}
                      </div>
                      <div className={'text-xs font-semibold ' + (f.score_us > f.score_them ? 'text-green-600' : f.score_us < f.score_them ? 'text-red-500' : 'text-gray-500')}>
                        {f.score_us > f.score_them ? 'WIN' : f.score_us < f.score_them ? 'LOSS' : 'DRAW'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-semibold">Upcoming</span>
                      <Link to={'/' + slug + '/matchday?fixture=' + f.id}
                        className="text-xs club-text font-semibold hover:underline">Match Day →</Link>
                    </div>
                  )}
                </div>
              </div>
              {f.status === 'upcoming' && isLoggedIn() && (
                <AvailabilityWidget slug={slug} fixture={f} />
              )}
            </div>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
