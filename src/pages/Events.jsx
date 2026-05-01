import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn } from '../lib/auth.js'

const TYPE_ICONS = { social:'🎉', fundraiser:'💰', training_camp:'⛺', agm:'📋', presentation:'🏆', trivia:'🧠', golf:'⛳', other:'📅' }

export default function Events() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState(null)

  useEffect(() => {
    api.getEvents(slug).then(d => { setEvents(d.events || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  async function rsvp(eventId, status) {
    if (!isLoggedIn()) { window.location.href = `/${slug}/login`; return }
    setRsvping(eventId)
    try {
      await api.rsvpEvent(slug, eventId, status)
      setEvents(evs => evs.map(e => e.id === eventId ? { ...e, my_rsvp: status } : e))
    } catch (e) { alert(e.message) }
    setRsvping(null)
  }

  return (
    <ClubLayout club={club}>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Events & Calendar</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">No upcoming events.</div>
          ) : events.map(ev => (
            <div key={ev.id} className="card">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl club-bg flex items-center justify-center text-2xl shrink-0">
                    {TYPE_ICONS[ev.type] || '📅'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{ev.title}</h3>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {ev.date ? new Date(ev.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}
                      {ev.time ? ` · ${ev.time}` : ''}
                      {ev.venue ? ` · ${ev.venue}` : ''}
                    </div>
                    {ev.cost > 0 && <div className="text-xs text-gray-400 mt-0.5">${ev.cost} per person</div>}
                    {ev.description && <p className="text-sm text-gray-600 mt-2">{ev.description}</p>}
                    {ev.rsvp_yes > 0 && <p className="text-xs text-green-600 mt-2 font-semibold">✓ {ev.rsvp_yes} going</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {['yes','maybe','no'].map(s => (
                    <button key={s} onClick={() => rsvp(ev.id, s)} disabled={rsvping === ev.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${ev.my_rsvp === s
                        ? s === 'yes' ? 'bg-green-500 text-white border-green-500'
                          : s === 'no' ? 'bg-red-400 text-white border-red-400'
                          : 'bg-yellow-400 text-white border-yellow-400'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {s === 'yes' ? '✓ Going' : s === 'maybe' ? '? Maybe' : '✗ Can\'t'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
