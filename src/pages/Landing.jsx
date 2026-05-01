import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="mb-8">
          <span className="inline-block bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide">Beta</span>
        </div>
        <h1 className="text-5xl font-black mb-6 leading-tight">
          Everything your<br />
          <span className="text-yellow-400">sport club</span> needs.
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">
          Fixtures, roster, comms, sponsors, team management — one platform for players, coaches, committee, and supporters.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/wcyms" className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors">
            View Demo Club →
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {[
            { icon: '🏆', label: 'Fixtures & Results' },
            { icon: '👥', label: 'Roster & Teams' },
            { icon: '📣', label: 'Club Comms' },
            { icon: '🤝', label: 'Sponsors' },
            { icon: '📊', label: 'Player Stats' },
            { icon: '🔐', label: 'Role-based Login' },
            { icon: '📱', label: 'Mobile-first' },
            { icon: '⚡', label: 'Live Scores' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-gray-300">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
