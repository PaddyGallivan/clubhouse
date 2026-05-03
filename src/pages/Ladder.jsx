import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

function FormPip({ result }) {
  const cfg = result === 'W' ? 'bg-green-500 text-white' : result === 'L' ? 'bg-red-400 text-white' : 'bg-gray-300 text-gray-600'
  return <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${cfg}`}>{result}</span>
}

export default function Ladder() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFixtures(slug).then(d => { setFixtures(d.fixtures || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  const played = fixtures.filter(f => f.status === 'played' && f.score_us != null)
  const wins = played.filter(f => f.score_us > f.score_them).length
  const losses = played.filter(f => f.score_us < f.score_them).length
  const draws = played.filter(f => f.score_us === f.score_them).length
  const points = wins * 4 + draws * 2
  const pf = played.reduce((s, f) => s + (f.score_us || 0), 0)
  const pa = played.reduce((s, f) => s + (f.score_them || 0), 0)
  const pct = pa > 0 ? ((pf / pa) * 100).toFixed(1) : '–'
  const winPct = played.length > 0 ? Math.round((wins / played.length) * 100) : 0
  const recent = [...played].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(f => f.score_us > f.score_them ? 'W' : f.score_us < f.score_them ? 'L' : 'D')
  const biggest = played.filter(f => f.score_us > f.score_them).sort((a, b) => (b.score_us - b.score_them) - (a.score_us - a.score_them))[0]
  const worst = played.filter(f => f.score_us < f.score_them).sort((a, b) => (b.score_them - b.score_us) - (a.score_them - a.score_us))[0]
  const byRound = [...played].sort((a, b) => Number(a.round) - Number(b.round))

  return (
    <ClubLayout club={club}>
      <div className="mb-6"><h1 className="text-2xl font-black text-gray-900">Season Record</h1><p className="text-gray-400 text-sm mt-0.5">{new Date().getFullYear()} season</p></div>
      {loading ? <LoadingSpinner /> : played.length === 0 ? <div className="card text-center text-gray-400 py-12">No results recorded yet.</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[{label:'Wins',value:wins,colour:'text-green-600'},{label:'Losses',value:losses,colour:'text-red-500'},{label:'Draws',value:draws,colour:'text-gray-500'},{label:'Points',value:points,colour:'club-text'}].map(({label,value,colour}) => (
              <div key={label} className="card text-center"><div className={`text-3xl font-black ${colour}`}>{value}</div><div className="text-xs text-gray-400 font-semibold mt-1">{label}</div></div>
            ))}
          </div>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-gray-700">Win Rate</span><span className="text-sm font-black club-text">{winPct}%</span></div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full club-bg rounded-full transition-all" style={{width:`${winPct}%`}} /></div>
            <div className="flex justify-between text-xs text-gray-400 mt-2"><span>For: {pf}</span><span>Against: {pa}</span><span>%: {pct}</span></div>
          </div>
          <div className="card mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Recent Form</h3>
            <div className="flex gap-2">{recent.length > 0 ? recent.map((r,i) => <FormPip key={i} result={r} />) : <span className="text-sm text-gray-400">No results yet</span>}{recent.length < 5 && Array(5-recent.length).fill(null).map((_,i) => <span key={i} className="w-6 h-6 rounded-full bg-gray-100" />)}</div>
          </div>
          {(biggest||worst) && <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {biggest && <div className="card border-l-4 border-green-400"><div className="text-xs font-semibold text-green-600 mb-1">🏆 Biggest Win</div><div className="font-bold text-gray-800">vs {biggest.opponent_name}</div><div className="text-2xl font-black club-text">{biggest.score_us}–{biggest.score_them}</div><div className="text-xs text-gray-400">Rd {biggest.round}</div></div>}
            {worst && <div className="card border-l-4 border-red-300"><div className="text-xs font-semibold text-red-500 mb-1">📉 Heaviest Loss</div><div className="font-bold text-gray-800">vs {worst.opponent_name}</div><div className="text-2xl font-black text-red-500">{worst.score_us}–{worst.score_them}</div><div className="text-xs text-gray-400">Rd {worst.round}</div></div>}
          </div>}
          <div className="card overflow-x-auto"><h3 className="font-bold text-gray-800 mb-4">Results by Round</h3>
            <table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">{['Rd','Opponent','H/A','Score','Result'].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
              <tbody>{byRound.map(f => { const res = f.score_us>f.score_them?'W':f.score_us<f.score_them?'L':'D'; return <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50"><td className="py-2 pr-4 font-bold">{f.round}</td><td className="py-2 pr-4">{f.opponent_name}</td><td className="py-2 pr-4 text-gray-500">{f.is_home?'H':'A'}</td><td className="py-2 pr-4 font-bold">{f.score_us}–{f.score_them}</td><td className="py-2 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-black ${res==='W'?'bg-green-100 text-green-700':res==='L'?'bg-red-50 text-red-600':'bg-gray-100 text-gray-500'}`}>{res}</span></td></tr> })}</tbody>
            </table>
          </div>
        </>
      )}
    </ClubLayout>
  )
}
