import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function TeamDetail() {
  const { slug, teamId } = useParams()
  const { club } = useClub(slug)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTeam(slug, teamId).then(d => { setTeam(d.team); setLoading(false) }).catch(() => setLoading(false))
  }, [slug, teamId])

  return (
    <ClubLayout club={club}>
      <Link to={`/${slug}/teams`} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← All teams</Link>
      {loading ? <LoadingSpinner /> : !team ? (
        <div className="card text-center text-gray-400 py-12">Team not found.</div>
      ) : (
        <>
          <h1 className="text-2xl font-black text-gray-900 mb-1">{team.name}</h1>
          {team.age_group && <p className="text-gray-500 mb-6">{team.age_group} · {team.gender} · {team.season}</p>}
          <div className="card">
            <h2 className="font-bold text-gray-700 mb-4">Squad</h2>
            {!team.members?.length ? (
              <p className="text-gray-400 text-sm">Squad not yet set.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {team.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-400">
                      {m.jumper_number || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{m.name}</div>
                      {m.position && <div className="text-xs text-gray-400">{m.position}</div>}
                    </div>
                    {m.is_captain ? <span className="text-xs font-bold text-yellow-600 ml-auto">C</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </ClubLayout>
  )
}
