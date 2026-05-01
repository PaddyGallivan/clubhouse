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
  const [loading, setLoading] = useState(true)
  const me = getUser()

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    Promise.all([
      api.getFixtures(slug), api.getRoster(slug),
      api.getAnnouncements(slug), api.getSponsors(slug)
    ]).then(([fd, rd, ad, sd]) => {
      setFixtures(fd.fixtures || [])
      setRoster(rd.roster || [])
      setAnnouncements(ad.announcements || [])
      setSponsors(sd.sponsors || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

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

  const TABS = [['fixtures','📅 Fixtures'],['roster','👥 Roster'],['posts','📣 Posts'],['sponsors','🤝 Sponsors']]

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
