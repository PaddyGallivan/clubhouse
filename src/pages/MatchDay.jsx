import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser } from '../lib/auth.js'

export default function MatchDay() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { club } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [activeId, setActiveId] = useState(searchParams.get('fixture') || null)
  const [events, setEvents] = useState([])
  const [teamSheet, setTeamSheet] = useState([])
  const [feedback, setFeedback] = useState({ self_rating: 7, effort: 7, highlight: '', improve: '' })
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [scoreInput, setScoreInput] = useState({ us: '', them: '' })
  const [tab, setTab] = useState('live')
  const [loading, setLoading] = useState(true)
  const me = getUser()

  useEffect(() => {
    api.getFixtures(slug).then(d => {
      const all = d.fixtures || []
      setFixtures(all)
      if (!activeId) {
        const next = all.find(f => f.status === 'upcoming') || all[all.length - 1]
        if (next) setActiveId(String(next.id))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  const fixture = fixtures.find(f => String(f.id) === String(activeId))

  const mapsUrl = fixture?.venue
    ? `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`
    : null

  const weatherUrl = fixture?.venue
    ? `https://www.bom.gov.au/vic/forecasts/melbourne.shtml`
    : null

  async function submitScore() {
    if (!scoreInput.us || !scoreInput.them) return
    try {
      await api.updateScore(slug, activeId, parseInt(scoreInput.us), parseInt(scoreInput.them))
      setFixtures(fxs => fxs.map(f => String(f.id) === String(activeId)
        ? { ...f, score_us: parseInt(scoreInput.us), score_them: parseInt(scoreInput.them), status: 'played' }
        : f))
    } catch (e) { alert(e.message) }
  }

  async function submitFeedback() {
    try {
      await api.submitFeedback(slug, activeId, feedback)
      setFeedbackSent(true)
    } catch (e) { alert(e.message) }
  }

  return (
    <ClubLayout club={club}>
      <div className="mb-4">
        <h1 className="text-2xl font-black text-gray-900">Match Day</h1>
      </div>

      {/* Fixture selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {fixtures.map(f => (
          <button key={f.id} onClick={() => setActiveId(String(f.id))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${String(activeId) === String(f.id) ? 'club-bg text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            Rd {f.round} vs {f.opponent_name}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : !fixture ? (
        <div className="card text-center text-gray-400 py-12">No fixture selected.</div>
      ) : (
        <>
          {/* Fixture hero */}
          <div className="club-bg rounded-2xl p-6 text-white mb-6">
            <div className="text-white/60 text-sm mb-1">Round {fixture.round} · {fixture.is_home ? 'Home' : 'Away'}</div>
            <div className="text-2xl font-black mb-2">vs {fixture.opponent_name}</div>
            <div className="text-white/80 text-sm mb-4">
              {fixture.date ? new Date(fixture.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}
              {fixture.time ? ` · ${fixture.time}` : ''}
            </div>
            {fixture.status === 'played' ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black">{fixture.score_us}</span>
                <span className="text-white/40 text-2xl">–</span>
                <span className="text-4xl font-black">{fixture.score_them}</span>
                <span className={`ml-2 text-lg font-black ${fixture.score_us > fixture.score_them ? 'text-green-300' : 'text-red-300'}`}>
                  {fixture.score_us > fixture.score_them ? 'WIN' : fixture.score_us < fixture.score_them ? 'LOSS' : 'DRAW'}
                </span>
              </div>
            ) : (
              <div className="flex gap-3">
                {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="club-accent club-text px-4 py-2 rounded-lg text-sm font-bold">📍 Directions</a>}
                {weatherUrl && <a href={weatherUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold">🌤 Weather</a>}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {[['live', '📡 Live'], ['sheet', '📋 Team Sheet'], ['feedback', '💬 Feedback']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Live score tab */}
          {tab === 'live' && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Live Score Entry</h3>
              {!isLoggedIn() ? (
                <p className="text-gray-400 text-sm"><Link to={`/${slug}/login`} className="club-text font-semibold">Log in</Link> to update score</p>
              ) : (
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">{club?.short_name}</label>
                    <input type="number" min="0" value={scoreInput.us} onChange={e => setScoreInput(s => ({ ...s, us: e.target.value }))}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div className="text-2xl text-gray-300 pb-2">–</div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">{fixture.opponent_name}</label>
                    <input type="number" min="0" value={scoreInput.them} onChange={e => setScoreInput(s => ({ ...s, them: e.target.value }))}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <button onClick={submitScore} disabled={!scoreInput.us || !scoreInput.them}
                    className="club-bg text-white px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40">
                    Update Score
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Team sheet tab */}
          {tab === 'sheet' && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Team Sheet — Rd {fixture.round}</h3>
              {teamSheet.length === 0 ? (
                <p className="text-gray-400 text-sm">Team sheet not set yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {teamSheet.map(p => (
                    <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">{p.jumper_number || '#'}</div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                        {p.position && <div className="text-xs text-gray-400">{p.position}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback tab */}
          {tab === 'feedback' && (
            <div className="card max-w-lg">
              <h3 className="font-bold text-gray-900 mb-1">Post-Game Feedback</h3>
              <p className="text-sm text-gray-400 mb-5">How did you go? Only you and your coach can see this.</p>
              {!isLoggedIn() ? (
                <p className="text-gray-400 text-sm"><Link to={`/${slug}/login`} className="club-text font-semibold">Log in</Link> to submit feedback</p>
              ) : feedbackSent ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-bold text-gray-800">Feedback submitted. Good work.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {[{ key: 'self_rating', label: 'How did you play?', min: 1, max: 10 },
                    { key: 'effort', label: 'Effort rating', min: 1, max: 10 }].map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-semibold text-gray-700">{label}</label>
                        <span className="text-sm font-black club-text">{feedback[key]}/10</span>
                      </div>
                      <input type="range" min="1" max="10" value={feedback[key]}
                        onChange={e => setFeedback(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                        className="w-full" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Best thing about today</label>
                    <textarea value={feedback.highlight} onChange={e => setFeedback(f => ({ ...f, highlight: e.target.value }))}
                      placeholder="e.g. First-quarter intensity, won my one-on-ones..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">One thing to work on</label>
                    <textarea value={feedback.improve} onChange={e => setFeedback(f => ({ ...f, improve: e.target.value }))}
                      placeholder="e.g. Dropping marks under pressure..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <button onClick={submitFeedback} className="w-full club-bg text-white py-3 rounded-lg font-bold text-sm">
                    Submit feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ClubLayout>
  )
}
