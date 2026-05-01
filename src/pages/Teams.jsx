import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function Teams() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTeams(slug).then(d => { setTeams(d.teams || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  return (
    <ClubLayout club={club}>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Teams</h1>
      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {teams.length === 0 ? (
            <div className="col-span-full card text-center text-gray-400 py-12">No teams yet.</div>
          ) : teams.map(t => (
            <Link key={t.id} to={`/${slug}/teams/${t.id}`} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="club-bg w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <span className="text-white font-black text-lg">🎽</span>
              </div>
              <div className="font-bold text-gray-900">{t.name}</div>
              {t.age_group && <div className="text-sm text-gray-500 mt-0.5">{t.age_group} · {t.gender}</div>}
              {t.season && <div className="text-xs text-gray-400 mt-1">Season {t.season}</div>}
              <div className="mt-3 text-xs font-semibold club-text">View team →</div>
            </Link>
          ))}
        </div>
      )}
    </ClubLayout>
  )
}
