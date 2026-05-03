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
  const [teams, setTeams] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [fees, setFees] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [availability, setAvailability] = useState({})
  const [trainingSessions, setTrainingSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const me = getUser()
  const [clubFeatures, setClubFeatures] = useState({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [playhqConfig, setPlayhqConfig] = useState({ playhq_org_id: '', playhq_season_id: '' })
  const [playhqSyncing, setPlayhqSyncing] = useState(false)
  const [playhqResult, setPlayhqResult] = useState(null)
  const [playhqSaving, setPlayhqSaving] = useState(false)
// CSV Import
  const [importTab, setImportTab] = useState('fixtures')
  const [csvText, setCsvText] = useState('')
  const [importPreview, setImportPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    Promise.all([
      api.getFixtures(slug), api.getRoster(slug),
      api.getTeams(slug).catch(() => ({ teams: [] })),
      api.getAnnouncements(slug), api.getSponsors(slug),
      api.getFees(slug).catch(() => ({ fee_types: [], records: [] })),
      api.getTrainingSessions(slug).catch(() => ({ sessions: [] })),
    ]).then(([fd, rd, td, ad, sd, feesData, trainingData]) => {
      setFixtures(fd.fixtures || [])
      setRoster(rd.roster || [])
      setTeams(td.teams || [])
      setAnnouncements(ad.announcements || [])
      setSponsors(sd.sponsors || [])
      setFees(feesData.fee_types || [])
      setFeeRecords(feesData.records || [])
      setTrainingSessions(trainingData.sessions || [])
      setLoading(false)
      // features loaded separately
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

  // Training form
  const [newSession, setNewSession] = useState({ date: '', time: '', venue: '', notes: '', drill_notes: '' })
  const [savingSession, setSavingSession] = useState(false)
  async function addSession(e) {
    e.preventDefault()
    setSavingSession(true)
    try {
      const d = await api.addTrainingSession(slug, newSession)
      setTrainingSessions(s => [...s, d.session])
      setNewSession({ date: '', time: '', venue: '', notes: '', drill_notes: '' })
    } catch (err) { alert(err.message) }
    setSavingSession(false)
  }

  // Push notifications
  const [notifyState, setNotifyState] = useState('idle')
  const [notifyResult, setNotifyResult] = useState(null)
  async function sendPushNotification() {
    setNotifyState('sending')
    try {
      const d = await api.sendPush(slug)
      setNotifyResult(d)
      setNotifyState('done')
    } catch (err) {
      setNotifyResult({ error: err.message })
      setNotifyState('error')
    }
  }

  // Teams management
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [teamDetail, setTeamDetail] = useState(null)
  const [teamDetailLoading, setTeamDetailLoading] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', age_group: '', season: '' })
  const [savingTeam, setSavingTeam] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState(null)
  const [removingPlayer, setRemovingPlayer] = useState(null)
  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  useEffect(() => {
    if (!selectedTeamId) { setTeamDetail(null); return }
    setTeamDetailLoading(true)
    api.getTeam(slug, selectedTeamId)
      .then(d => { setTeamDetail(d.team); setTeamDetailLoading(false) })
      .catch(() => setTeamDetailLoading(false))
  }, [selectedTeamId, slug])

  async function createTeam(e) {
    e.preventDefault()
    if (!newTeam.name) return
    setSavingTeam(true)
    try {
      const d = await api.createTeam(slug, newTeam)
      setTeams(t => [...t, d.team])
      setNewTeam({ name: '', age_group: '', season: '' })
      setSelectedTeamId(d.team.id)
    } catch (err) { alert(err.message) }
    setSavingTeam(false)
  }

  async function addPlayerToTeam(userId) {
    if (!selectedTeamId) return
    setAddingPlayer(userId)
    try {
      await api.addTeamMember(slug, selectedTeamId, userId)
      const d = await api.getTeam(slug, selectedTeamId)
      setTeamDetail(d.team)
      setTeams(ts => ts.map(t => t.id === selectedTeamId ? { ...t, member_count: (t.member_count || 0) + 1 } : t))
    } catch (err) { alert(err.message) }
    setAddingPlayer(null)
  }

  async function removePlayerFromTeam(userId) {
    if (!selectedTeamId) return
    setRemovingPlayer(userId)
    try {
      await api.removeTeamMember(slug, selectedTeamId, userId)
      const d = await api.getTeam(slug, selectedTeamId)
      setTeamDetail(d.team)
      setTeams(ts => ts.map(t => t.id === selectedTeamId ? { ...t, member_count: Math.max(0, (t.member_count || 1) - 1) } : t))
    } catch (err) { alert(err.message) }
    setRemovingPlayer(null)
  }

  const teamMemberIds = new Set((teamDetail?.members || []).map(m => m.user_id))
  const unassignedPlayers = roster.filter(p => !teamMemberIds.has(p.id))

  const TABS = [
    ['fixtures','📅 Fixtures'],
    ['roster','👥 Roster'],
    ['teams','🏅 Teams'],
    ['posts','📣 Posts'],
    ['fees','💳 Fees'],
    ['training','🏋️ Training'],
    ['availability','📡 Avail.'],
    ['sponsors','🤝 Sponsors'],
    ['settings','⚙️ Settings'],
    ['import','📥 Import'],
  ]

  // Load features on mount
  useEffect(() => {
    if (isLoggedIn()) api.getClubFeatures(slug).then(d => setClubFeatures(d.features || {})).catch(() => {})
  }, [slug])

function parseCSVText(text) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return null
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    const rows = lines.slice(1).map(line => {
      const fields = []
      let current = '', inQuote = false
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote }
        else if (ch === ',' && !inQuote) { fields.push(current.trim()); current = '' }
        else { current += ch }
      }
      fields.push(current.trim())
      return Object.fromEntries(headers.map((h, i) => [h, fields[i] || '']))
    }).filter(r => Object.values(r).some(v => v))
    return { headers, rows }
  }

  function handleCSVFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setCsvText(ev.target.result); setImportPreview(null); setImportResult(null) }
    reader.readAsText(file)
  }

  async function previewImport() {
    const parsed = parseCSVText(csvText)
    if (!parsed) return alert('Could not parse CSV — check formatting')
    setImportPreview(parsed)
  }

  async function runImport() {
    const parsed = parseCSVText(csvText)
    if (!parsed) return
    setImporting(true); setImportResult(null)
    try {
      const token = localStorage.getItem('ch_token')
      const res = await fetch(`/api/clubs/${slug}/import?type=${importTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: parsed.rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImportResult(data)
      if (importTab === 'roster') {
        const rd = await api.getRoster(slug)
        setRoster(rd.roster || [])
      } else {
        const fd = await api.getFixtures(slug)
        setFixtures(fd.fixtures || [])
      }
    } catch (err) { alert(err.message) }
    setImporting(false)
  }

  async function toggleFeature(key) {
    const updated = { ...clubFeatures, [key]: !clubFeatures[key] }
    setClubFeatures(updated)
    setSavingSettings(true)
    try {
      await api.updateClubFeatures(slug, updated)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (err) { alert(err.message) }
    setSavingSettings(false)
  }

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

          {/* Teams tab */}
          {tab === 'teams' && (
            <div className="space-y-5">
              {/* Create team form */}
              <form onSubmit={createTeam} className="card">
                <h3 className="font-bold text-gray-800 mb-4">Create Team</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input placeholder="Team name (e.g. Seniors)" value={newTeam.name}
                    onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Age group (e.g. U18)" value={newTeam.age_group}
                    onChange={e => setNewTeam(t => ({ ...t, age_group: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input placeholder="Season (e.g. 2026)" value={newTeam.season}
                    onChange={e => setNewTeam(t => ({ ...t, season: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <button type="submit" disabled={savingTeam || !newTeam.name}
                  className="mt-4 club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">
                  {savingTeam ? 'Creating...' : '+ Create Team'}
                </button>
              </form>

              {/* Team list */}
              {teams.length === 0 ? (
                <div className="card text-center text-gray-400 py-8 text-sm">No teams yet. Create one above.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teams.map(t => (
                    <button key={t.id} onClick={() => setSelectedTeamId(t.id === selectedTeamId ? null : t.id)}
                      className={`card text-left transition-all hover:shadow-md ${selectedTeamId === t.id ? 'ring-2 ring-offset-1' : ''}`}
                      style={selectedTeamId === t.id ? { ringColor: 'var(--club-primary)' } : {}}>
                      <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                      {t.age_group && <div className="text-xs text-gray-400 mt-0.5">{t.age_group}{t.season ? ` · ${t.season}` : ''}</div>}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-semibold club-text">{t.member_count || 0} players</span>
                        {t.coach_name && <span className="text-xs text-gray-400">· Coach: {t.coach_name}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Team detail / roster assignment */}
              {selectedTeamId && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">{selectedTeam?.name} — Roster</h3>
                    <button onClick={() => setSelectedTeamId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
                  </div>

                  {teamDetailLoading ? (
                    <div className="text-center text-gray-400 py-6 text-sm">Loading...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Current members */}
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Current Members ({teamDetail?.members?.length || 0})</div>
                        {(!teamDetail?.members?.length) ? (
                          <p className="text-sm text-gray-400 italic">No players assigned yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {teamDetail.members.map(m => (
                              <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">{m.jumper_number || '?'}</span>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">{m.name}</div>
                                    {m.positions && <div className="text-xs text-gray-400">{m.positions}</div>}
                                  </div>
                                </div>
                                <button onClick={() => removePlayerFromTeam(m.user_id)}
                                  disabled={removingPlayer === m.user_id}
                                  className="text-xs text-red-400 hover:text-red-600 font-semibold disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                  {removingPlayer === m.user_id ? '…' : 'Remove'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add players */}
                      {unassignedPlayers.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Add Players</div>
                          <div className="space-y-1">
                            {unassignedPlayers.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-black text-gray-300">{p.jumper_number || '?'}</span>
                                  <div>
                                    <div className="text-sm text-gray-600">{p.name}</div>
                                    {p.positions && <div className="text-xs text-gray-400">{p.positions}</div>}
                                  </div>
                                </div>
                                <button onClick={() => addPlayerToTeam(p.id)}
                                  disabled={addingPlayer === p.id}
                                  className="text-xs club-bg text-white px-3 py-1 rounded font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                                  {addingPlayer === p.id ? '…' : '+ Add'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {unassignedPlayers.length === 0 && teamDetail?.members?.length > 0 && (
                        <p className="text-xs text-green-600 font-semibold">✅ All rostered players are assigned to this team.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Training tab */}
          {tab === 'training' && (
            <div className="space-y-5">
              <form onSubmit={addSession} className="card">
                <h3 className="font-bold text-gray-800 mb-4">Schedule Training Session</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input type="date" value={newSession.date} onChange={e => setNewSession(s => ({ ...s, date: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="text" placeholder="Time (e.g. 6:30 PM)" value={newSession.time} onChange={e => setNewSession(s => ({ ...s, time: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="text" placeholder="Venue" value={newSession.venue} onChange={e => setNewSession(s => ({ ...s, venue: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 sm:col-span-2" />
                  <input type="text" placeholder="Session notes (optional)" value={newSession.notes} onChange={e => setNewSession(s => ({ ...s, notes: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <input type="text" placeholder="Drill notes (optional)" value={newSession.drill_notes} onChange={e => setNewSession(s => ({ ...s, drill_notes: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <button type="submit" disabled={savingSession || !newSession.date} className="mt-4 club-bg text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-40">{savingSession ? 'Scheduling...' : '+ Schedule Session'}</button>
              </form>
              <div className="card overflow-x-auto">
                <h3 className="font-bold text-gray-800 mb-4">All Sessions ({trainingSessions.length})</h3>
                {trainingSessions.length === 0 ? <p className="text-gray-400 text-sm">No sessions scheduled yet.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">{['Date','Time','Venue','Notes'].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                    <tbody>{[...trainingSessions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>(
                      <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-4 font-semibold">{new Date(s.date).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})}</td>
                        <td className="py-2 pr-4 text-gray-500">{s.time||'–'}</td>
                        <td className="py-2 pr-4 text-gray-500">{s.venue||'–'}</td>
                        <td className="py-2 pr-4 text-gray-400 text-xs italic">{s.notes||'–'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
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

          {/* Notifications tab */}
          {tab === 'notify' && (
            <div className="space-y-5">
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-1">Push Notifications</h3>
                <p className="text-xs text-gray-400 mb-5">Send a push notification to all club members who have enabled notifications.</p>
                <button onClick={sendPushNotification} disabled={notifyState === 'sending'}
                  className="club-bg text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity">
                  {notifyState === 'sending' ? '🔔 Sending…' : '🔔 Notify All Subscribers'}
                </button>
                {notifyState === 'done' && notifyResult && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
                    <p className="font-semibold">Push sent!</p>
                    <p>Delivered to {notifyResult.sent} device{notifyResult.sent !== 1 ? 's' : ''}.</p>
                  </div>
                )}
                {notifyState === 'error' && notifyResult && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    <p className="font-semibold">Error</p><p>{notifyResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* PlayHQ Sync */}
          <div className="card mt-5">
            <h3 className="font-bold text-gray-800 mb-1">🏉 PlayHQ Fixture Sync</h3>
            <p className="text-sm text-gray-400 mb-4">
              Connect your club's PlayHQ competition to automatically import fixtures and results.
              Find your IDs at <a href="https://www.playhq.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">playhq.com</a> — copy them from your season URL.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PlayHQ Org ID</label>
                <input
                  type="text"
                  className="input w-full text-sm font-mono"
                  placeholder="e.g. abc12345-1234-..."
                  value={playhqConfig.playhq_org_id}
                  onChange={e => setPlayhqConfig(c => ({ ...c, playhq_org_id: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Your club's organisation ID in PlayHQ (filters games to your teams only)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Season ID <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="input w-full text-sm font-mono"
                  placeholder="e.g. def67890-5678-..."
                  value={playhqConfig.playhq_season_id}
                  onChange={e => setPlayhqConfig(c => ({ ...c, playhq_season_id: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">The competition season ID — found in the URL when viewing your season on PlayHQ</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-secondary text-sm"
                disabled={playhqSaving}
                onClick={async () => {
                  setPlayhqSaving(true)
                  try {
                    await api.savePlayHQConfig(club.slug, playhqConfig)
                    setPlayhqResult({ ok: true, message: 'Config saved!' })
                  } catch (e) {
                    setPlayhqResult({ error: e.message })
                  } finally {
                    setPlayhqSaving(false)
                  }
                }}>
                {playhqSaving ? 'Saving…' : '💾 Save Config'}
              </button>
              <button
                className="btn club-bg text-white text-sm"
                disabled={playhqSyncing || !playhqConfig.playhq_season_id}
                onClick={async () => {
                  setPlayhqSyncing(true)
                  setPlayhqResult(null)
                  try {
                    // Save config first, then sync
                    await api.savePlayHQConfig(club.slug, playhqConfig)
                    const result = await api.syncPlayHQ(club.slug, null)
                    setPlayhqResult(result)
                  } catch (e) {
                    setPlayhqResult({ error: e.message })
                  } finally {
                    setPlayhqSyncing(false)
                  }
                }}>
                {playhqSyncing ? '⏳ Syncing…' : '🔄 Sync Now'}
              </button>
            </div>
            {playhqResult && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${playhqResult.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {playhqResult.error ? (
                  <><span className="font-semibold">⚠️ Error: </span>{playhqResult.error}</>
                ) : playhqResult.message ? (
                  <span>✅ {playhqResult.message}</span>
                ) : (
                  <>
                    <p className="font-semibold mb-1">✅ Sync complete — {playhqResult.season}</p>
                    <p>Imported {playhqResult.inserted} new · Updated {playhqResult.updated} · Skipped {playhqResult.skipped}</p>
                    {playhqResult.message && <p className="mt-1 text-xs">{playhqResult.message}</p>}
                  </>
                )}
              </div>
            )}
          </div>



{/* Import tab */}
          {tab === 'import' && (
            <div className="space-y-5">
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-1">Bulk Import</h3>
                <p className="text-sm text-gray-400 mb-4">Import fixtures or players from a CSV file. Existing records are updated, not duplicated.</p>

                <div className="flex gap-2 mb-5">
                  {[['fixtures','📅 Fixtures'],['roster','👥 Roster']].map(([id,label]) => (
                    <button key={id} onClick={() => { setImportTab(id); setCsvText(''); setImportPreview(null); setImportResult(null) }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${importTab === id ? 'club-bg text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Column guide */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500">
                  <p className="font-semibold text-gray-700 mb-1">{importTab === 'fixtures' ? 'Fixtures CSV columns:' : 'Roster CSV columns:'}</p>
                  {importTab === 'fixtures' ? (
                    <p><code className="bg-white px-1 rounded border border-gray-200">round</code>, <code className="bg-white px-1 rounded border border-gray-200">opponent</code>, <code className="bg-white px-1 rounded border border-gray-200">date</code> (YYYY-MM-DD), <code className="bg-white px-1 rounded border border-gray-200">time</code>, <code className="bg-white px-1 rounded border border-gray-200">venue</code>, <code className="bg-white px-1 rounded border border-gray-200">home_away</code> (Home/Away), <code className="bg-white px-1 rounded border border-gray-200">score_us</code>, <code className="bg-white px-1 rounded border border-gray-200">score_them</code></p>
                  ) : (
                    <p><code className="bg-white px-1 rounded border border-gray-200">email</code> (required), <code className="bg-white px-1 rounded border border-gray-200">name</code>, <code className="bg-white px-1 rounded border border-gray-200">jumper</code>, <code className="bg-white px-1 rounded border border-gray-200">positions</code>, <code className="bg-white px-1 rounded border border-gray-200">role</code> (player/coach/committee)</p>
                  )}
                </div>

                {/* File upload or paste */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-semibold text-gray-600">Upload CSV file</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleCSVFile} className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:club-bg file:text-white" />
                  </label>
                  <p className="text-xs text-gray-400">— or paste CSV below —</p>
                  <textarea
                    value={csvText}
                    onChange={e => { setCsvText(e.target.value); setImportPreview(null); setImportResult(null) }}
                    placeholder={importTab === 'fixtures' ? 'round,opponent,date,time,venue,home_away\n1,Carlton,2026-04-12,2:00 PM,Princes Park,Away' : 'email,name,jumper,positions\njohn@example.com,John Smith,12,CHF'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono h-32 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={previewImport} disabled={!csvText.trim()}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                    Preview
                  </button>
                  <button onClick={runImport} disabled={!csvText.trim() || importing}
                    className="px-5 py-2 club-bg text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:opacity-90">
                    {importing ? 'Importing…' : `Import ${importTab}`}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {importPreview && (
                <div className="card overflow-x-auto">
                  <h3 className="font-bold text-gray-800 mb-3">Preview — {importPreview.rows.length} rows</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        {importPreview.headers.map(h => <th key={h} className="pb-2 pr-4 text-gray-400 font-semibold uppercase">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.rows.slice(0,5).map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          {importPreview.headers.map(h => <td key={h} className="py-1.5 pr-4 text-gray-600">{row[h] || '–'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.rows.length > 5 && (
                    <p className="text-xs text-gray-400 mt-2">…and {importPreview.rows.length - 5} more rows</p>
                  )}
                </div>
              )}

              {/* Result */}
              {importResult && (
                <div className={`card ${importResult.imported > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className="font-bold text-gray-800 mb-1">Import complete</p>
                  <p className="text-sm text-gray-600">✅ {importResult.imported} imported &nbsp;·&nbsp; ⏭️ {importResult.skipped} skipped</p>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                      {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings tab */}
          {tab === 'settings' && (
            <div className="space-y-5">
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-1">Feature Toggles</h3>
                <p className="text-sm text-gray-400 mb-5">Turn features on or off for all members of {club?.name}. Changes take effect immediately.</p>
                {settingsSaved && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-semibold">✅ Settings saved!</div>}
                <div className="space-y-3">
                  {[
                    ['ladder', '🏆 Ladder / Standings'],
                    ['teams', '🏅 Teams'],
                    ['training', '🏋️ Training'],
                    ['events', '📅 Events & Calendar'],
                    ['bf_voting', '⭐ Best & Fairest Voting'],
                    ['matchday', '🎯 Match Day'],
                    ['chat', '💬 Team Chat'],
                    ['fees', '💳 Fees'],
                    ['news', '📣 News / Announcements'],
                    ['sponsors', '🤝 Sponsors'],
                    ['push', '🔔 Push Notifications'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <button
                        onClick={() => toggleFeature(key)}
                        disabled={savingSettings}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 ${clubFeatures[key] ? 'club-bg' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${clubFeatures[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
