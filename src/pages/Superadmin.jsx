import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { api } from '../lib/api.js'

export default function Superadmin() {
  const [stats, setStats] = useState(null)
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getSuperadminStats(), api.getAllClubs()])
      .then(([s, c]) => { setStats(s.stats || {}); setClubs(c.clubs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const SPORT_ICON = { AFL: '🏈', Cricket: '🏏', Netball: '🏐', Soccer: '⚽', Rugby: '🏉' }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`.sa-bg{background:#0f172a}.sa-text{color:#38bdf8}`}</style>
      <header className="sa-bg shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-xs font-black text-slate-900">LD</div>
            <span className="text-white font-bold">Clubhouse Platform</span>
            <span className="text-xs bg-sky-400/20 text-sky-400 px-2 py-0.5 rounded-full font-semibold">Superadmin</span>
          </div>
          <Link to="/" className="text-white/50 hover:text-white text-xs">← Public site</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Platform Overview</h1>
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[{label:'Clubs',value:stats?.club_count||0,icon:'🏟️'},{label:'Members',value:stats?.member_count||0,icon:'👥'},{label:'Fixtures',value:stats?.fixture_count||0,icon:'📅'},{label:'Sessions',value:stats?.session_count||0,icon:'🏃'}].map(({label,value,icon}) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-3xl font-black text-slate-800">{value}</div>
                  <div className="text-xs text-gray-400 font-semibold mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Clubs ({clubs.length})</h2>
                <Link to="/onboard" className="bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-600">+ Add Club</Link>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">{['Club','Sport','Slug','Members','Fixtures','Fees Owing'].map(h=><th key={h} className="px-6 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{clubs.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{backgroundColor:c.primary_colour||'#003087'}}>{c.short_name?.slice(0,1)||'?'}</div><div className="font-semibold text-gray-900">{c.name}</div></div></td>
                    <td className="px-6 py-3 text-gray-600">{SPORT_ICON[c.sport]||'🏆'} {c.sport}</td>
                    <td className="px-6 py-3"><Link to={`/${c.slug}/dashboard`} className="text-sky-500 font-mono text-xs hover:underline">{c.slug}</Link></td>
                    <td className="px-6 py-3 font-semibold">{c.member_count||0}</td>
                    <td className="px-6 py-3 font-semibold">{c.fixture_count||0}</td>
                    <td className="px-6 py-3">{c.fees_owing>0?<span className="text-red-600 font-bold">${c.fees_owing}</span>:<span className="text-green-600 font-semibold">–</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
