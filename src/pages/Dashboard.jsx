import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser, clearToken } from '../lib/auth.js'

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4-b64.length%4)%4)
  const b = (b64+pad).replace(/-/g,'+').replace(/_/g,'/')
  return new Uint8Array([...atob(b)].map(c=>c.charCodeAt(0)))
}

export default function Dashboard() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { club } = useClub(slug)
  const [me, setMe] = useState(getUser())
  const [loading, setLoading] = useState(!getUser())
  const [pushState, setPushState] = useState('idle')
  const [pushMsg, setPushMsg] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    if (!me) { api.getMe().then(d=>{setMe(d.user);setLoading(false)}).catch(()=>{clearToken();navigate(`/${slug}/login`)}) }
    else setLoading(false)
    if (!('serviceWorker' in navigator)||!('PushManager' in window)) setPushState('unsupported')
    else if (Notification.permission==='denied') setPushState('denied')
    else navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>{if(s)setPushState('subscribed')}).catch(()=>{})
  }, [])

  async function subscribePush() {
    if (!('serviceWorker' in navigator)||!('PushManager' in window)) return setPushMsg('Push notifications are not supported in this browser.')
    setPushState('requesting'); setPushMsg('')
    try {
      const permission = await Notification.requestPermission()
      if (permission!=='granted') { setPushState('denied'); setPushMsg('Notification permission was denied. You can enable it in browser settings.'); return }
      const { publicKey } = await api.getVapidKey(slug)
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(publicKey) })
      const cache = await caches.open('ch-meta')
      await cache.put('/push-slug', new Response(slug))
      await api.subscribePush(slug, sub.toJSON())
      setPushState('subscribed')
      setPushMsg("Notifications enabled! You'll get updates from "+(club?.name||'your club')+'.')
    } catch(err) {
      setPushState('idle')
      setPushMsg(err.message?.includes('not configured') ? 'Push notifications are not yet set up for this club.' : 'Could not enable notifications: '+err.message)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  const role = me?.memberships?.find(m=>m.club_slug===slug)?.role||'player'
  const myUserId = me?.id

  const playerCards = [
    {to:`/${slug}/fixtures`,icon:'📅',title:'Fixtures',desc:'Full season schedule & results'},
    {to:`/${slug}/voting`,icon:'🏆',title:'B&F Voting',desc:'Cast your 3-2-1 votes'},
    {to:`/${slug}/chat`,icon:'💬',title:'Team Chat',desc:'Talk to your teammates'},
    {to:`/${slug}/matchday`,icon:'⚽',title:'Match Day',desc:'Live scores & player feedback'},
    {to:`/${slug}/events`,icon:'🎉',title:'Events',desc:'Club social calendar'},
    {to:`/${slug}/teams`,icon:'🎽',title:'My Team',desc:'Squad & team info'},
    {to:`/${slug}/news`,icon:'📰',title:'News',desc:'Latest club announcements'},
    {to:myUserId?`/${slug}/player/${myUserId}`:`/${slug}/roster`,icon:'👤',title:'My Profile',desc:'Stats, goals & milestones'},
  ]
  const coachCards = [
    {to:`/${slug}/matchday`,icon:'📋',title:'Match Day',desc:'Score, team sheet & feedback'},
    {to:`/${slug}/roster`,icon:'✅',title:'Roster',desc:'Full player list'},
    {to:`/${slug}/teams`,icon:'🎽',title:'Teams',desc:'Squad management'},
    {to:`/${slug}/chat`,icon:'📣',title:'Team Chat',desc:'Message your squad'},
    {to:`/${slug}/fixtures`,icon:'📅',title:'Fixtures',desc:'Season schedule'},
    {to:`/${slug}/events`,icon:'🎉',title:'Events',desc:'Club calendar'},
  ]
  const committeeCards = [
    {to:`/${slug}/admin`,icon:'⚙️',title:'Admin Panel',desc:'Manage the club'},
    {to:`/${slug}/roster`,icon:'👥',title:'Members',desc:'Player registrations'},
    {to:`/${slug}/fixtures`,icon:'📅',title:'Fixtures',desc:'Edit the season schedule'},
    {to:`/${slug}/sponsors`,icon:'🤝',title:'Sponsors',desc:'Manage sponsor listings'},
    {to:`/${slug}/events`,icon:'🎉',title:'Events',desc:'Club calendar & RSVPs'},
    {to:`/${slug}/news`,icon:'📣',title:'Post News',desc:'Club-wide announcements'},
  ]
  const cards = role==='coach'?coachCards:role==='committee'?committeeCards:playerCards

  return (
    <ClubLayout club={club}>
      <div className="mb-8"><h1 className="text-2xl font-black text-gray-900">Welcome back{me?.name?`, ${me.name.split(' ')[0]}`:''}! 👋</h1><p className="text-gray-500 mt-1 capitalize">{role} · {club?.name}</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({to,icon,title,desc})=>(
          <Link key={to} to={to} className="card hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer block">
            <div className="text-3xl mb-2">{icon}</div><div className="font-bold text-gray-900 text-sm">{title}</div><div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>
          </Link>
        ))}
      </div>
      <div className="card bg-gray-50 border-gray-200 flex items-center justify-between gap-4 flex-wrap mb-4">
        <div><p className="text-sm font-semibold text-gray-700">{me?.name||'Member'}</p><p className="text-xs text-gray-400 mt-0.5">{me?.email}</p></div>
        <div className="flex gap-2 flex-wrap">
          {myUserId && <Link to={`/${slug}/player/${myUserId}`} className="text-xs font-semibold club-text hover:underline px-3 py-1.5 border club-border rounded-lg">View my profile</Link>}
          <Link to={`/${slug}/profile`} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100">Edit profile</Link>
        </div>
      </div>
      {pushState!=='unsupported' && (
        <div className={`card border flex items-center justify-between gap-4 flex-wrap ${pushState==='subscribed'?'bg-green-50 border-green-200':'bg-blue-50 border-blue-200'}`}>
          <div>
            <p className="text-sm font-semibold text-gray-800">{pushState==='subscribed'?'🔔 Notifications enabled':'🔔 Stay in the loop'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{pushState==='subscribed'?pushMsg||"You'll receive club updates as push notifications.":pushState==='denied'?'Notifications blocked. Enable them in your browser settings.':pushMsg||'Get push notifications for scores, news & announcements.'}</p>
          </div>
          {pushState==='idle' && <button onClick={subscribePush} className="club-accent club-text text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 whitespace-nowrap shrink-0">Enable notifications</button>}
          {pushState==='requesting' && <span className="text-xs text-gray-400 shrink-0">Setting up…</span>}
        </div>
      )}
    </ClubLayout>
  )
}
