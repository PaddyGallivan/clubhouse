import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser, clearToken } from '../lib/auth.js'

export default function Dashboard() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { club } = useClub(slug)
  const [me, setMe] = useState(getUser())
  const [loading, setLoading] = useState(!getUser())

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    if (!me) {
      api.getMe().then(d => { setMe(d.user); setLoading(false) }).catch(() => { clearToken(); navigate(`/${slug}/login`) })
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>

  const role = me?.memberships?.find(m => m.club_slug === slug)?.role || 'supporter'

  return (
    <ClubLayout club={club}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Welcome back{me?.name ? `, ${me.name.split(' ')[0]}` : ''}! 👋</h1>
        <p className="text-gray-500 mt-1 capitalize">{role} · {club?.name}</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {/* Quick actions based on role */}
        {role === 'coach' && (
          <>
            <DashCard icon="📋" title="Set lineup" desc="Pick your team for the next game" />
            <DashCard icon="✅" title="Mark attendance" desc="Record who turned up to training" />
            <DashCard icon="📣" title="Message your team" desc="Send a note to the whole squad" />
            <DashCard icon="📝" title="Player notes" desc="Track development per player" />
          </>
        )}
        {role === 'committee' && (
          <>
            <DashCard icon="👥" title="Members" desc="Manage registrations & renewals" />
            <DashCard icon="💰" title="Finances" desc="Fees, payments, expenses" />
            <DashCard icon="📅" title="Fixtures" desc="Edit the season schedule" />
            <DashCard icon="🤝" title="Sponsors" desc="Manage sponsor contracts" />
            <DashCard icon="🛡️" title="Compliance" desc="WWCC expiry tracker" />
          </>
        )}
        {(role === 'player' || role === 'supporter') && (
          <>
            <Link to={`/${slug}/fixtures`}><DashCard icon="🏆" title="Fixtures" desc="See the full season schedule" /></Link>
            <Link to={`/${slug}/teams`}><DashCard icon="🎽" title="My team" desc="Squad list & comms" /></Link>
            <Link to={`/${slug}/news`}><DashCard icon="📣" title="News" desc="Latest from the club" /></Link>
          </>
        )}
        {role === 'parent' && (
          <>
            <DashCard icon="👶" title="My child" desc="Profile, payments, season" />
            <DashCard icon="🚗" title="Transport" desc="Coordinate pickups & dropoffs" />
            <Link to={`/${slug}/fixtures`}><DashCard icon="📅" title="Fixtures" desc="When & where is the next game?" /></Link>
          </>
        )}
        {role === 'sponsor' && (
          <>
            <Link to={`/${slug}/sponsors`}><DashCard icon="🏅" title="Your listing" desc="Update logo & link" /></Link>
            <DashCard icon="📊" title="Exposure stats" desc="Views, clicks, impressions" />
          </>
        )}

        {/* Universal */}
        <Link to={`/${slug}/news`}><DashCard icon="🔔" title="Announcements" desc="Club-wide news" /></Link>
      </div>

      <div className="mt-8 card bg-gray-50">
        <p className="text-sm text-gray-500">Signed in as <strong>{me?.email}</strong></p>
        <p className="text-xs text-gray-400 mt-0.5">More features coming soon — this is the v1 dashboard.</p>
      </div>
    </ClubLayout>
  )
}

function DashCard({ icon, title, desc }) {
  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </div>
  )
}
