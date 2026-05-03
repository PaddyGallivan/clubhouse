import Avatar from '../components/Avatar.jsx'
import { useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { getUser, isLoggedIn } from '../lib/auth.js'

export default function Chat() {
  const { slug, teamId } = useParams()
  const { club } = useClub(slug)
  const [messages, setMessages] = useState([])
  const [teams, setTeams] = useState([])
  const [activeTeam, setActiveTeam] = useState(teamId || null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const me = getUser()

  useEffect(() => {
    api.getTeams(slug).then(d => {
      setTeams(d.teams || [])
      if (!activeTeam && d.teams?.length) setActiveTeam(String(d.teams[0].id))
    }).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!activeTeam) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [activeTeam])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function fetchMessages() {
    api.getChat(slug, activeTeam).then(d => setMessages(d.messages || [])).catch(() => {})
  }

  async function send(e) {
    e.preventDefault()
    if (!input.trim() || !isLoggedIn()) return
    setSending(true)
    try {
      await api.sendChat(slug, activeTeam, input.trim())
      setInput('')
      fetchMessages()
    } catch {}
    setSending(false)
  }

  const activeTeamName = teams.find(t => String(t.id) === String(activeTeam))?.name || 'Team'

  return (
    <ClubLayout club={club}>
      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Team sidebar */}
        <div className="w-40 shrink-0 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2 mb-2">Teams</p>
          {teams.map(t => (
            <button key={t.id} onClick={() => setActiveTeam(String(t.id))}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${String(activeTeam) === String(t.id) ? 'club-bg text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-800">{activeTeamName} Chat</div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && <p className="text-gray-400 text-sm text-center pt-8">No messages yet — say something! 👋</p>}
            {messages.map(m => {
              const isMe = m.user_id === me?.id
              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.author_name?.charAt(0) || '?'}
                  </div>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && <span className="text-xs text-gray-400 mb-1 px-1">{m.author_name}</span>}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'club-bg text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {m.message}
                    </div>
                    <span className="text-xs text-gray-300 mt-1 px-1">{new Date(m.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {isLoggedIn() ? (
            <form onSubmit={send} className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Message the team..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              <button type="submit" disabled={sending || !input.trim()} className="club-bg text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-40">
                {sending ? '...' : 'Send'}
              </button>
            </form>
          ) : (
            <div className="px-4 py-3 border-t border-gray-100 text-center text-sm text-gray-400">
              <a href={`/${slug}/login`} className="club-text font-semibold">Log in</a> to join the chat
            </div>
          )}
        </div>
      </div>
    </ClubLayout>
  )
}
