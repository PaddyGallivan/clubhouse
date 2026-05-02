import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser } from '../lib/auth.js'

export default function Admin() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { club } = useClub(slug)
  const [tab, setTab] = useState('fixtures')
  const [fixtures, setFixtures] = useState([])
  const [roster, setRoster] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [feeTotals, setFeeTotals] = useState({ totalOwing: 0, totalCollected: 0 })
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/' + slug + '/login'); return }
    Promise.all([
      api.getFixtures(slug),
      api.getRoster(slug),
      api.getAnnouncements(slug),
      api.getSponsors(slug),
      api.getFees(slug),
    ]).then(([fd, rd, ad, sd, feesD]) => {
      setFixtures(fd.fixtures || [])
      setRoster(rd.roster || [])
      setAnnouncements(ad.announcements || [])
      setSponsors(sd.sponsors || [])
      setFeeTypes(feesD.feeTypes || [])
      setFeeRecords(feesD.records || [])
      setFeeTotals({ totalOwing: feesD.totalOwing || 0, totalCollected: feesD.totalCollected || 0 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  // Load availability for upcoming fixtures when tab switches
  useEffect(() => {
    if (tab !== 'availability') return
    const upcoming = fixtures.filter(f => f.status === 'upcoming')
    Promise.all(upcoming.map(f =>
      api.getAvailability(slug, f.id).then(d => ({ id: f.id, ...d }))
    )).then(results => {
      const map = {}
      results.forEach(r => { map[r.id] = r })
      setAvailability(map)
    }).catch(() => {})
  }, [tab, fixtures])

  const [newFixture, setNewFixture] = useState({ round: '', opponent_name: '', date: '', time: '', venue: '', is_home: 1 })
  const [savingFixture, setSavingFixture] = useState(false)
  async function addFixture(e) {
    e.preventDefault(); setSavingFixture(true)
    try {
      const d = await api.addFixture(slug, newFixture)
      setFixtures(f => [...f, d.fixture])
      setNewFixture({ round: '', opponent_name: '', date: '', time: '', venue: '', is_home: 1 })
    } catch (err) { alert(err.message) }
    setSavingFixture(false)
  }

  const [newPost, setNewPost] = useState({ title: '', body: '', pinned: 0 })
  const [savingPost, setSavingPost] = useState(false)
  async function addPost(e) {
    e.preventDefault(); setSavingPost(true)
    try {
      const d = await api.addAnnouncement(slug, newPost)
      setAnnouncements(a => [d.announcement, ...a])
      setNewPost({ title: '', body: '', pinned: 0 })
    } catch (err) { alert(err.message) }
    setSavingPost(false)
  }

  const [newFeeType, setNewFeeType] = useState({ name: '', amount: '', season: '', due_date: '', description: '' })
  const [savingFee, setSavingFee] = useState(false)
  async function addFeeType(e) {
    e.preventDefault(); setSavingFee(true)
    try {
      const d = await api.addFeeType(slug, newFeeType)
      setFeeTypes(f => [...f, d.feeType])
      setNewFeeType({ name: '', amount: '', season: '', due_date: '', description: '' })
    } catch (err) { alert(err.message) }
    setSavingFee(false)
  }

  async function markPaid(feeTypeId, userId) {
    try {
      await api.markFeePaid(slug, feeTypeId, { user_id: userId, status: 'paid', amount_paid: feeTypes.find(f => f.id === feeTypeId)?.amount })
      setFeeRecords(rs => rs.map(r => r.fee_type_id === feeTypeId && r.user_id === userId ? { ...r, status: 'paid', amount_paid: r.amount_due, paid_at: new Date().toISOString() } : r))
    } catch (err) { alert(err.message) }
  }

  const TABS = [['fixtures','📅 Fixtures'],['roster','👥 Roster'],['posts','📣 Posts'],['fees','💳 Fees'],['availability','📋 Availability'],['sponsors','🤝 Sponsors']]

  const statusBadge = (status) => {
    const map = { played:'bg-green-100 text-green-700', upcoming:'bg-blue-50 text-blue-600', bye:'bg-gray-100 text-gray-500' }
    return <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + (map[status] || 'bg-gray-100 text-gray-500')}>{status}</span>
  }

  return (
    <ClubLayout club={club}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage {club?.name}</p>
        </div>
        <Link to={'/' + slug + '/dashboard'} className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={'px-4 py-2 rounded-lg text-sm font-semibold transition-colors ' + (tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500')}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Fixtures */}
          {tab === 'fixtures' && (
            <div className="space-y-5">
              <form onSubmit={addFixture} className="card">
                <h3 className="font-bold text-gray-800 mb-4">Add Fixture</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[['round','Round (e.g. 7)'],['opponent_name','Opponent'],['date','Date'],['time','Time (e.g. 2:00 PM)'],['venue','Venue']].map(([key, ph]) => (
                    <input key={key} type={key === 'date' ? 'date' : 'text'} placeholder={ph} value={newFixture[key]}
                      onChange={e => setNewFixture(f => ({ ...f, [key]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  ))}
                  <select value={newFixture.is_home} onChange={e => setNewFixture(f => ({ ...f, is_home: parseInt(e.target.value) }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value={1}>Home</option><option value={0}>Away</option>
                  </select>
                </div>
                <button type="submit" disabled={savingFixture || !newFixture.opponent_name}
                  className="mt-4 club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                  {savingFixture ? 'Adding...' : 'Add Fixture'}
                </button>
              </form>
              <div className="card overflow-x-auto">
                <h3 className="font-bold text-gray-800 mb-4">All Fixtures ({fixtures.length})</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    {['Rd','Opponent','Date','Venue','H/A','Score','Status'].map(h => <th key={h} className="pb-2 pr-4">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {fixtures.map(f => (
                      <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-4 font-bold">{f.round}</td>
                        <td className="py-2 pr-4">{f.opponent_name}</td>
                        <td className="py-2 pr-4 text-gray-500">{f.date || '–'}</td>
                        <td className="py-2 pr-4 text-gray-500 text-xs">{f.venue || '–'}</td>
                        <td className="py-2 pr-4">{f.is_home ? 'H' : 'A'}</td>
                        <td className="py-2 pr-4 font-bold">{f.score_us != null ? f.score_us + '–' + f.score_them : '–'}</td>
                        <td className="py-2 pr-4">{statusBadge(f.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Roster */}
          {tab === 'roster' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Registered Players ({roster.length})</h3>
              <div className="space-y-2">
                {roster.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">{p.jumper_number || '?'}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                        {p.positions && <div className="text-xs text-gray-400">{p.positions}</div>}
                      </div>
                    </div>
                    <Link to={'/' + slug + '/player/' + p.id} className="text-xs club-text font-semibold hover:underline">Profile →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {tab === 'posts' && (
            <div className="space-y-5">
              <form onSubmit={addPost} className="card">
                <h3 className="font-bold text-gray-800 mb-4">New Announcement</h3>
                <input placeholder="Title" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <textarea placeholder="Body..." value={newPost.body} onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-28 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
                  <input type="checkbox" checked={!!newPost.pinned} onChange={e => setNewPost(p => ({ ...p, pinned: e.target.checked ? 1 : 0 }))} />
                  Pin to top
                </label>
                <button type="submit" disabled={savingPost || !newPost.title || !newPost.body}
                  className="club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                  {savingPost ? 'Posting...' : 'Post'}
                </button>
              </form>
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">All Posts ({announcements.length})</h3>
                <div className="space-y-3">
                  {announcements.map(a => (
                    <div key={a.id} className="py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        {a.pinned ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">📌</span> : null}
                        <span className="font-semibold text-sm text-gray-800">{a.title}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleDateString('en-AU')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fees */}
          {tab === 'fees' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {[{ label: 'Fee Types', val: feeTypes.length, icon: '📋' },
                  { label: 'Total Collected', val: '$' + feeTotals.totalCollected.toFixed(2), icon: '💰' },
                  { label: 'Still Owing', val: '$' + feeTotals.totalOwing.toFixed(2), icon: '⚠️' }].map(({ label, val, icon }) => (
                  <div key={label} className="card text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="font-black text-xl text-gray-900">{val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={addFeeType} className="card">
                <h3 className="font-bold text-gray-800 mb-4">Add Fee Type</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Fee name (e.g. Season Registration)" value={newFeeType.name}
                    onChange={e => setNewFeeType(f => ({ ...f, name: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Amount ($)" type="number" value={newFeeType.amount}
                    onChange={e => setNewFeeType(f => ({ ...f, amount: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Season (e.g. 2026)" value={newFeeType.season}
                    onChange={e => setNewFeeType(f => ({ ...f, season: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="date" placeholder="Due date" value={newFeeType.due_date}
                    onChange={e => setNewFeeType(f => ({ ...f, due_date: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Description (optional)" value={newFeeType.description}
                    onChange={e => setNewFeeType(f => ({ ...f, description: e.target.value }))}
                    className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <button type="submit" disabled={savingFee || !newFeeType.name || !newFeeType.amount}
                  className="mt-4 club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                  {savingFee ? 'Adding...' : 'Add Fee'}
                </button>
              </form>

              {feeTypes.map(ft => {
                const typeRecords = feeRecords.filter(r => r.fee_type_id === ft.id)
                const paid = typeRecords.filter(r => r.status === 'paid' || r.status === 'waived').length
                return (
                  <div key={ft.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{ft.name}</h3>
                        <p className="text-sm text-gray-400">${ft.amount} · {ft.season || 'All seasons'}{ft.due_date ? ' · Due ' + ft.due_date : ''}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-semibold">{paid}/{typeRecords.length} paid</span>
                    </div>
                    {typeRecords.length === 0 ? (
                      <p className="text-xs text-gray-400">No records yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {typeRecords.map(r => (
                          <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-800">{r.player_name}</span>
                            <div className="flex items-center gap-2">
                              <span className={'text-xs px-2 py-0.5 rounded font-semibold ' + (r.status === 'paid' ? 'bg-green-100 text-green-700' : r.status === 'waived' ? 'bg-gray-100 text-gray-500' : r.status === 'partial' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600')}>
                                {r.status === 'paid' ? '✅ Paid' : r.status === 'waived' ? 'Waived' : r.status === 'partial' ? '½ Partial' : '⚠️ Owing'}
                              </span>
                              {r.status !== 'paid' && r.status !== 'waived' && (
                                <button onClick={() => markPaid(ft.id, r.user_id)}
                                  className="text-xs club-bg text-white px-2 py-0.5 rounded font-semibold hover:opacity-80">
                                  Mark paid
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Availability */}
          {tab === 'availability' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Player availability for upcoming fixtures. Use this to plan your team selection.</p>
              {fixtures.filter(f => f.status === 'upcoming').length === 0 ? (
                <div className="card text-center text-gray-400 py-12">No upcoming fixtures.</div>
              ) : fixtures.filter(f => f.status === 'upcoming').map(f => {
                const av = availability[f.id]
                const players = av?.availability || []
                return (
                  <div key={f.id} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Rd {f.round} vs {f.opponent_name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{f.date ? new Date(f.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBC'}</p>
                      </div>
                      {av?.summary && (
                        <div className="flex gap-3 text-sm font-bold">
                          <span className="text-green-600">✅ {av.summary.available}</span>
                          <span className="text-yellow-500">❓ {av.summary.maybe}</span>
                          <span className="text-red-500">❌ {av.summary.unavailable}</span>
                        </div>
                      )}
                    </div>
                    {!av ? (
                      <p className="text-xs text-gray-400">Loading...</p>
                    ) : players.length === 0 ? (
                      <p className="text-xs text-gray-400">No responses yet.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {players.map(p => (
                          <div key={p.user_id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50">
                            <span className="text-sm font-medium text-gray-800">{p.name}</span>
                            <div className="flex items-center gap-1.5">
                              {p.note && <span className="text-xs text-gray-400 italic max-w-[120px] truncate">{p.note}</span>}
                              <span className={'text-xs px-2 py-0.5 rounded font-semibold ' + (p.status === 'available' ? 'bg-green-100 text-green-700' : p.status === 'unavailable' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700')}>
                                {p.status === 'available' ? '✅ In' : p.status === 'unavailable' ? '❌ Out' : '❓ Maybe'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Sponsors */}
          {tab === 'sponsors' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Sponsors ({sponsors.length})</h3>
              <div className="space-y-2">
                {sponsors.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{s.name}</span>
                      <span className={'ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ' + (s.tier==='platinum'?'bg-gray-200 text-gray-700':s.tier==='gold'?'bg-yellow-100 text-yellow-700':s.tier==='silver'?'bg-gray-100 text-gray-500':'bg-orange-50 text-orange-600')}>{s.tier}</span>
                    </div>
                    {s.contract_end && <span className="text-xs text-gray-400">Expires {s.contract_end}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ClubLayout>
  )
}
