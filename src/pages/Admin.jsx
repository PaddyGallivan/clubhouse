import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser, clearToken } from '../lib/auth.js'

export default function Admin() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { club } = useClub(slug)
  const [tab, setTab] = useState('fixtures')
  const [fixtures, setFixtures] = useState([])
  const [roster, setRoster] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [fees, setFees] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const me = getUser()

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    Promise.all([
      api.getFixtures(slug), api.getRoster(slug),
      api.getAnnouncements(slug), api.getSponsors(slug),
      api.getFees(slug).catch(() => ({ fee_types: [], records: [] })),
    ]).then(([fd, rd, ad, sd, feesData]) => {
      setFixtures(fd.fixtures || [])
      setRoster(rd.roster || [])
      setAnnouncements(ad.announcements || [])
      setSponsors(sd.sponsors || [])
      setFees(feesData.fee_types || [])
      setFeeRecords(feesData.records || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  // Load availability data when tab changes
  useEffect(() => {
    if (tab !== 'availability') return
    const upcoming = fixtures.filter(f => f.status === 'upcoming')
    Promise.all(upcoming.map(f =>
      api.getAvailability(slug, f.id).then(d => ({ id: f.id, data: d })).catch(() => null)
    )).then(results => {
      const map = {}
      results.filter(Boolean).forEach(r => { map[r.id] = r.data })
      setAvailability(map)
    })
  }, [tab, fixtures])

  // New fixture form
  const [newFixture, setNewFixture] = useState({ round: '', opponent_name: '', date: '', time: '', venue: '', is_home: 1 })
  const [savingFixture, setSavingFixture] = useState(false)
  async function addFixture(e) {
    e.preventDefault()
    setSavingFixture(true)
    try {
      const d = await api.addFixture(slug, newFixture)
      setFixtures(f => [...f, d.fixture])
      setNewFixture({ round: '', opponent_name: '', date: '', time: '', venue: '', is_home: 1 })
    } catch (err) { alert(err.message) }
    setSavingFixture(false)
  }

  // New announcement form
  const [newPost, setNewPost] = useState({ title: '', body: '', pinned: 0 })
  const [savingPost, setSavingPost] = useState(false)
  async function addPost(e) {
    e.preventDefault()
    setSavingPost(true)
    try {
      const d = await api.addAnnouncement(slug, newPost)
      setAnnouncements(a => [d.announcement, ...a])
      setNewPost({ title: '', body: '', pinned: 0 })
    } catch (err) { alert(err.message) }
    setSavingPost(false)
  }

  // Fee type form
  const [newFee, setNewFee] = useState({ name: '', amount: '', season: '', due_date: '', description: '' })
  const [savingFee, setSavingFee] = useState(false)
  async function addFeeType(e) {
    e.preventDefault()
    setSavingFee(true)
    try {
      const d = await api.addFeeType(slug, newFee)
      setFees(f => [...f, d.fee_type])
      setNewFee({ name: '', amount: '', season: '', due_date: '', description: '' })
    } catch (err) { alert(err.message) }
    setSavingFee(false)
  }

  async function markPaid(feeTypeId, userId) {
    try {
      await api.markFeePaid(slug, feeTypeId, { user_id: userId, status: 'paid', method: 'admin' })
      const d = await api.getFees(slug)
      setFeeRecords(d.records || [])
    } catch (err) { alert(err.message) }
  }

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('player')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(null)
  async function sendInvite(e) {
    e.preventDefault()
    setInviteSending(true)
    try {
      await api.invitePlayer(slug, inviteEmail, inviteRole)
      setInviteSent(inviteEmail)
      setInviteEmail('')
    } catch (err) { alert(err.message) }
    setInviteSending(false)
  }

  const TABS = [['fixtures','📅 Fixtures'],['roster','👥 Roster'],['posts','📣 Posts'],['fees','💳 Fees'],['availability','📡 Availability'],['sponsors','🤝 Sponsors']]

  return (
    <ClubLayout club={club}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage {club?.name}</p>
        </div>
        <Link to={`/${slug}/dashboard`} className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Fixtures tab */}
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
                        <td className="py-2 pr-4 text-gray-500">{f.venue || '–'}</td>
                        <td className="py-2 pr-4">{f.is_home ? 'H' : 'A'}</td>
                        <td className="py-2 pr-4 font-bold">{f.score_us != null ? `${f.score_us}–${f.score_them}` : '–'}</td>
                        <td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.status==='played'?'bg-green-100 text-green-700':f.status==='upcoming'?'bg-blue-50 text-blue-600':'bg-gray-100 text-gray-500'}`}>{f.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Roster tab */}
          {tab === 'roster' && (
            <div className="space-y-5">
              {/* Invite form */}
              <form onSubmit={sendInvite} className="card">
                <h3 className="font-bold text-gray-800 mb-1">Invite a Player</h3>
                <p className="text-sm text-gray-400 mb-4">Send a magic-link invite. They'll be added to the club roster automatically when they click it.</p>
                {inviteSent && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-semibold">
                    ✅ Invite sent to {inviteSent}
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  <input type="email" placeholder="player@email.com" value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteSent(null) }}
                    className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="player">Player</option>
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                  </select>
                  <button type="submit" disabled={inviteSending || !inviteEmail}
                    className="club-bg text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                    {inviteSending ? 'Sending...' : '✉️ Send Invite'}
                  </button>
                </div>
              </form>

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
                      <Link to={`/${slug}/player/${p.id}`} className="text-xs club-text font-semibold hover:underline">Profile →</Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Posts tab */}
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

          {/* Fees tab */}
          {tab === 'fees' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Fee Types', value: fees.length },
                  { label: 'Collected', value: `$${feeRecords.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount_paid || 0), 0).toFixed(0)}` },
                  { label: 'Owing', value: `$${feeRecords.filter(r => r.status === 'owing' || r.status === 'partial').reduce((s, r) => s + ((r.amount_due || 0) - (r.amount_paid || 0)), 0).toFixed(0)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="card text-center">
                    <div className="text-2xl font-black club-text">{value}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-1">{label}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={addFeeType} className="card">
                <h3 className="font-bold text-gray-800 mb-4">Add Fee Type</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Name (e.g. Season Rego)" value={newFee.name} onChange={e => setNewFee(f => ({ ...f, name: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="number" placeholder="Amount ($)" value={newFee.amount} onChange={e => setNewFee(f => ({ ...f, amount: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Season (e.g. 2025)" value={newFee.season} onChange={e => setNewFee(f => ({ ...f, season: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="date" placeholder="Due Date" value={newFee.due_date} onChange={e => setNewFee(f => ({ ...f, due_date: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <button type="submit" disabled={savingFee || !newFee.name || !newFee.amount}
                  className="mt-4 club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                  {savingFee ? 'Adding...' : 'Add Fee Type'}
                </button>
              </form>

              {fees.map(fee => {
                const records = feeRecords.filter(r => r.fee_type_id === fee.id)
                return (
                  <div key={fee.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{fee.name}</h3>
                        <div className="text-xs text-gray-400">${fee.amount} · {fee.season || 'No season'}{fee.due_date ? ` · Due ${fee.due_date}` : ''}</div>
                      </div>
                      <span className="text-sm font-bold club-text">{records.filter(r => r.status === 'paid').length}/{roster.length} paid</span>
                    </div>
                    <div className="space-y-1">
                      {roster.map(player => {
                        const rec = records.find(r => r.user_id === player.id)
                        const status = rec?.status || 'owing'
                        return (
                          <div key={player.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">{player.jumper_number || '?'}</span>
                              <span className="text-sm text-gray-700">{player.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status==='paid'?'bg-green-100 text-green-700':status==='partial'?'bg-yellow-100 text-yellow-700':status==='waived'?'bg-gray-100 text-gray-500':'bg-red-50 text-red-600'}`}>{status}</span>
                              {status !== 'paid' && status !== 'waived' && (
                                <button onClick={() => markPaid(fee.id, player.id)}
                                  className="text-xs club-bg text-white px-2 py-0.5 rounded font-semibold">Mark paid</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Availability tab */}
          {tab === 'availability' && (
            <div className="space-y-5">
              {fixtures.filter(f => f.status === 'upcoming').length === 0 ? (
                <div className="card text-center text-gray-400 py-12">No upcoming fixtures.</div>
              ) : (
                fixtures.filter(f => f.status === 'upcoming').map(f => {
                  const avail = availability[f.id] || {}
                  const players = avail.players || []
                  const summary = avail.summary || {}
                  return (
                    <div key={f.id} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">Rd {f.round} vs {f.opponent_name}</h3>
                          <div className="text-xs text-gray-400">{f.date || 'Date TBC'}</div>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {summary.available || 0}</span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">❓ {summary.maybe || 0}</span>
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">❌ {summary.unavailable || 0}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {players.map(p => (
                          <div key={p.user_id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-700">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{p.status === 'available' ? '✅' : p.status === 'unavailable' ? '❌' : '❓'}</span>
                              {p.note && <span className="text-xs text-gray-400 italic">"{p.note}"</span>}
                            </div>
                          </div>
                        ))}
                        {players.length === 0 && <p className="text-xs text-gray-400">No responses yet.</p>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Sponsors tab */}
          {tab === 'sponsors' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Sponsors ({sponsors.length})</h3>
              <div className="space-y-2">
                {sponsors.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{s.name}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                        s.tier==='platinum'?'bg-gray-200 text-gray-700':s.tier==='gold'?'bg-yellow-100 text-yellow-700':s.tier==='silver'?'bg-gray-100 text-gray-500':'bg-orange-50 text-orange-600'
                      }`}>{s.tier}</span>
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
