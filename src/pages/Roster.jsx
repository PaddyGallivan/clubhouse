import { useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function Roster() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getRoster(slug).then(d => { setRoster(d.roster || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  const filtered = roster.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.positions?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ClubLayout club={club}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900">Player Roster</h1>
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12 card">No players found.</div>
          ) : filtered.map(p => (
            <div key={p.id} className="card text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center overflow-hidden">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-gray-300">{p.jumper_number || '?'}</span>
                }
              </div>
              <div className="font-bold text-gray-900 text-sm">{p.name}</div>
              {p.jumper_number && <div className="text-xs text-gray-400 mt-0.5">#{p.jumper_number}</div>}
              {p.positions && <div className="text-xs text-gray-500 mt-1">{p.positions}</div>}
            </div>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
