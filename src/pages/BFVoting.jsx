import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn } from '../lib/auth.js'

export default function BFVoting() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [roster, setRoster] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [votes, setVotes] = useState({ v1: null, v2: null, v3: null })
  const [submitted, setSubmitted] = useState(false)
  const [tally, setTally] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getFixtures(slug), api.getRoster(slug)]).then(([fd, rd]) => {
      const played = (fd.fixtures || []).filter(f => f.status === 'played')
      setFixtures(played)
      if (played.length) setActiveRound(played[played.length - 1].round)
      setRoster(rd.roster || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!activeRound) return
    api.getBFTally(slug, activeRound).then(d => setTally(d.tally || [])).catch(() => {})
    api.getMyBFVote(slug, activeRound).then(d => {
      if (d.vote) { setSubmitted(true); setVotes({ v1: d.vote.vote_1, v2: d.vote.vote_2, v3: d.vote.vote_3 }) }
    }).catch(() => {})
  }, [activeRound])

  async function submit() {
    if (!votes.v1) return
    try {
      await api.submitBFVote(slug, activeRound, votes)
      setSubmitted(true)
      api.getBFTally(slug, activeRound).then(d => setTally(d.tally || [])).catch(() => {})
    } catch (e) { alert(e.message) }
  }

  function pickPlayer(slot, id) {
    const other = Object.entries(votes).filter(([k]) => k !== slot).map(([, v]) => v)
    if (other.includes(id)) return
    setVotes(v => ({ ...v, [slot]: id }))
  }

  const fixture = fixtures.find(f => f.round === activeRound)

  return (
    <ClubLayout club={club}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Best & Fairest Voting</h1>
        <p className="text-gray-500 mt-1">3-2-1 votes after each game</p>
      </div>

      {/* Round selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {fixtures.map(f => (
          <button key={f.round} onClick={() => setActiveRound(f.round)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeRound === f.round ? 'club-bg text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Rd {f.round}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : !activeRound ? (
        <div className="card text-center text-gray-400 py-12">No played games yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Voting form */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-1">Rd {activeRound} — vs {fixture?.opponent_name}</h2>
            <p className="text-xs text-gray-400 mb-5">Pick your 3 best players</p>

            {submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🗳️</div>
                <p className="font-bold text-gray-800">Votes submitted!</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {['v1','v2','v3'].map((k,i) => {
                    const p = roster.find(r => r.id === votes[k])
                    return p ? <div key={k}><span className="font-bold">{3-i} votes</span> → {p.name}</div> : null
                  })}
                </div>
              </div>
            ) : !isLoggedIn() ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <Link to={`/${slug}/login`} className="club-text font-semibold">Log in</Link> to vote
              </div>
            ) : (
              <>
                {[{ key: 'v1', label: '3 votes', color: 'bg-yellow-100 border-yellow-400' },
                  { key: 'v2', label: '2 votes', color: 'bg-gray-100 border-gray-300' },
                  { key: 'v3', label: '1 vote', color: 'bg-orange-50 border-orange-300' }].map(({ key, label, color }) => (
                  <div key={key} className="mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{label}</p>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {roster.map(p => {
                        const sel = votes[key] === p.id
                        const taken = Object.entries(votes).filter(([k]) => k !== key).map(([,v]) => v).includes(p.id)
                        return (
                          <button key={p.id} onClick={() => pickPlayer(key, p.id)} disabled={taken}
                            className={`text-left px-3 py-2 rounded-lg text-sm border-2 transition-all ${sel ? color + ' font-bold' : 'border-transparent bg-gray-50 hover:bg-gray-100'} ${taken ? 'opacity-30 cursor-not-allowed' : ''}`}>
                            {p.name} {p.jumper_number ? `#${p.jumper_number}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button onClick={submit} disabled={!votes.v1} className="w-full club-bg text-white py-3 rounded-lg font-bold text-sm disabled:opacity-40 mt-2">
                  Submit votes
                </button>
              </>
            )}
          </div>

          {/* Tally */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Season tally</h2>
            {tally.length === 0 ? (
              <p className="text-gray-400 text-sm">No votes yet this season.</p>
            ) : (
              <div className="space-y-2">
                {tally.slice(0, 15).map((p, i) => (
                  <div key={p.user_id} className="flex items-center gap-3">
                    <span className={`w-6 text-center font-black text-sm ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-gray-300'}`}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                        <span className="text-sm font-black club-text">{p.total_votes} pts</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-1.5 club-bg rounded-full transition-all" style={{ width: `${Math.min(100, (p.total_votes / (tally[0]?.total_votes || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ClubLayout>
  )
}
