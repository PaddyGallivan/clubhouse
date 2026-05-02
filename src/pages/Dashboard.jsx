import { useParams, Link, useNavigate } from 'react-router-dom'
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
  const [fees, setFees] = useState([])
  const [feesOwing, setFeesOwing] = useState(0)
  const [feesLoading, setFeesLoading] = useState(true)

  const membership = me?.memberships?.find(m => m.club_slug === slug)
  const role = membership?.role || 'member'

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/' + slug + '/login'); return }
    // Refresh user
    api.getMe().then(d => { setMe(d.user); localStorage.setItem('ch_user', JSON.stringify(d.user)) }).catch(() => {})
    // Load my fees
    api.getMyFees(slug)
      .then(d => { setFees(d.fees || []); setFeesOwing(d.totalOwing || 0) })
      .catch(() => {})
      .finally(() => setFeesLoading(false))
  }, [slug])

  const playerCards = [
    { to: '/' + slug + '/fixtures', icon: '📅', title: 'Fixtures', desc: 'Season draw, results & availability' },
    { to: '/' + slug + '/voting', icon: '🏆', title: 'B&F Voting', desc: '3-2-1 votes after each game' },
    { to: '/' + slug + '/chat', icon: '💬', title: 'Team Chat', desc: 'Chat with your squad' },
    { to: '/' + slug + '/matchday', icon: '⚽', title: 'Match Day', desc: 'Live score & player feedback' },
    { to: '/' + slug + '/events', icon: '🎟️', title: 'Events', desc: 'Social nights, fundraisers, more' },
    { to: '/' + slug + '/teams', icon: '👥', title: 'My Team', desc: 'Squad list & team sheet' },
    { to: '/' + slug + '/news', icon: '📣', title: 'News', desc: 'Club announcements' },
    { to: '/' + slug + '/profile', icon: '👤', title: 'My Profile', desc: 'Update your details' },
  ]

  const feeStatus = (f) => {
    if (f.status === 'paid') return { label: 'Paid', cls: 'bg-green-100 text-green-700' }
    if (f.status === 'waived') return { label: 'Waived', cls: 'bg-gray-100 text-gray-500' }
    if (f.status === 'partial') return { label: `Partial — $${f.amount_paid} of $${f.amount_due}`, cls: 'bg-orange-100 text-orange-700' }
    return { label: `Owing — $${f.amount_due}`, cls: 'bg-red-100 text-red-700' }
  }

  return (
    <ClubLayout club={club}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back! 👋</h1>
          <p className="text-gray-500 mt-0.5 capitalize">{role} · {club?.name}</p>
        </div>
        <div className="flex gap-2">
          {(role === 'committee' || role === 'coach') && (
            <Link to={'/' + slug + '/admin'} className="text-xs club-text font-bold border club-border px-3 py-1.5 rounded-lg hover:bg-gray-50">Admin →</Link>
          )}
          <Link to={'/' + slug + '/profile'} className="text-xs text-gray-500 hover:text-gray-700 font-semibold border border-gray-200 px-3 py-1.5 rounded-lg">Profile</Link>
        </div>
      </div>

      {/* Fees banner */}
      {!feesLoading && feesOwing > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-red-800">💳 Fees outstanding: ${feesOwing.toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-0.5">Please settle with your club treasurer.</p>
          </div>
          <button onClick={() => document.getElementById('fees-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-bold text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 shrink-0">
            View details
          </button>
        </div>
      )}

      {/* Quick links grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {playerCards.map(({ to, icon, title, desc }) => (
          <Link key={to} to={to}
            className="card hover:shadow-md transition-all hover:scale-[1.01] group text-left">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-bold text-sm text-gray-800 group-hover:club-text">{title}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</div>
          </Link>
        ))}
      </div>

      {/* My Fees section */}
      {!feesLoading && fees.length > 0 && (
        <div id="fees-section" className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">💳 My Fees</h2>
            {feesOwing === 0
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">All paid ✅</span>
              : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold">${feesOwing.toFixed(2)} owing</span>
            }
          </div>
          <div className="space-y-3">
            {fees.map(f => {
              const s = feeStatus(f)
              return (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{f.fee_name}</div>
                    {f.due_date && <div className="text-xs text-gray-400 mt-0.5">Due {new Date(f.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-700">${f.fee_amount}</span>
                    <span className={'text-xs px-2 py-1 rounded-lg font-semibold ' + s.cls}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {feesLoading && (
        <div className="card mb-6 py-4 text-center"><LoadingSpinner /></div>
      )}
    </ClubLayout>
  )
}
