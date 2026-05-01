import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function News() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.getAnnouncements(slug).then(d => { setPosts(d.announcements || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  return (
    <ClubLayout club={club}>
      <h1 className="text-2xl font-black text-gray-900 mb-6">News & Announcements</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">No announcements yet.</div>
          ) : posts.map(a => (
            <div key={a.id} className={`card cursor-pointer hover:shadow-md transition-shadow ${a.pinned ? 'border-l-4 border-yellow-400' : ''}`} onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {a.pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">📌 Pinned</span>}
                    {a.team_name && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">{a.team_name}</span>}
                  </div>
                  <h3 className="font-bold text-gray-900">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className="text-gray-400 ml-4">{expanded === a.id ? '▲' : '▼'}</span>
              </div>
              {expanded === a.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {a.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
