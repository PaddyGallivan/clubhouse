import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser } from '../lib/auth.js'

const STATUS_CONFIG = {
  present:  { emoji: '✅', label: "I'll be there", bg: 'bg-green-100', text: 'text-green-700' },
  absent:   { emoji: '❌', label: "Can't make it", bg: 'bg-red-50',    text: 'text-red-600' },
  injured:  { emoji: '🤕', label: 'Injured',        bg: 'bg-orange-50', text: 'text-orange-600' },
  late:     { emoji: '🕐', label: 'Running late',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">–</span>
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.emoji} {status}</span>
}

export default function Training() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [sessions, setSessions] = useState([])
  const [myAttendance, setMyAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    const promises = [api.getTrainingSessions(slug)]
    if (isLoggedIn()) promises.push(api.getMyAttendance(slug).catch(() => ({ attendance: [] })))
    Promise.all(promises).then(([sd, attd]) => {
      setSessions(sd.sessions || [])
      if (attd) setMyAttendance(attd.attendance || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  async function setStatus(sessionId, status) {
    try {
      await api.markAttendance(slug, sessionId, status)
      setMyAttendance(prev => {
        const exists = prev.find(a => a.session_id === sessionId)
        if (exists) return prev.map(a => a.session_id === sessionId ? { ...a, status } : a)
        return [...prev, { session_id: sessionId, status }]
      })
    } catch (e) { alert(e.message) }
  }

  const now = new Date()
  const upcoming = sessions.filter(s => new Date(s.date) >= now)
  const past = sessions.filter(s => new Date(s.date) < now)
  const displayed = tab === 'upcoming' ? upcoming : past

  // My attendance rate
  const responded = past.filter(s => myAttendance.find(a => a.session_id === s.id))
  const attended = responded.filter(s => {
    const rec = myAttendance.find(a => a.session_id === s.id)
    return rec?.status === 'present'
  })
  const attendRate = responded.length > 0 ? Math.round((attended.length / past.length) * 100) : null

  return (
    <ClubLayout club={club}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Training</h1>
      </div>

      {isLoggedIn() && attendRate !== null && (
        <div className="card mb-5 flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="text-3xl font-black club-text">{attendRate}%</div>
            <div className="text-xs text-gray-400 font-semibold">Season Attendance</div>
          </div>
          <div className="text-sm text-gray-500">
            {attended.length} of {past.length} sessions attended.{' '}
            {attendRate >= 80 ? '🔥 Great work!' : attendRate >= 60 ? 'Keep it up!' : 'Try to get to more sessions!'}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['upcoming','📅 Upcoming'],['past','📋 Past']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : displayed.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          {tab === 'upcoming' ? 'No upcoming training sessions scheduled.' : 'No past sessions yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(session => {
            const myRec = myAttendance.find(a => a.session_id === session.id)
            const myStatus = myRec?.status
            const isPast = new Date(session.date) < now
            const dateStr = session.date
              ? new Date(session.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Date TBC'

            return (
              <div key={session.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-black text-gray-900 mb-1">
                      {dateStr}{session.time ? ` · ${session.time}` : ''}
                    </div>
                    {session.venue && <div className="text-xs text-gray-400 mb-1">📍 {session.venue}</div>}
                    {session.notes && <div className="text-sm text-gray-600 mt-1 italic">"{session.notes}"</div>}
                    {session.drill_notes && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
                        <span className="font-semibold">Drills:</span> {session.drill_notes}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isPast ? (
                      <StatusBadge status={myStatus} />
                    ) : isLoggedIn() ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-400 font-semibold text-right mb-1">RSVP</div>
                        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                          <button key={s} onClick={() => setStatus(session.id, s)}
                            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                              myStatus === s ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {cfg.emoji} {cfg.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoggedIn() && (
        <div className="card mt-5 text-center py-8">
          <p className="text-gray-500 text-sm mb-3">Log in to mark your training attendance</p>
          <Link to={`/${slug}/login`} className="club-bg text-white px-5 py-2 rounded-lg text-sm font-bold inline-block">Log in</Link>
        </div>
      )}
    </ClubLayout>
  )
}
