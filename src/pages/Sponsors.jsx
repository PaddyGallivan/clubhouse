import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

const TIERS = ['platinum', 'gold', 'silver', 'bronze']
const TIER_STYLES = {
  platinum: { bg: 'bg-gradient-to-br from-gray-100 to-gray-200', badge: 'bg-gray-700 text-white', size: 'h-28' },
  gold: { bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', badge: 'bg-yellow-500 text-white', size: 'h-24' },
  silver: { bg: 'bg-gradient-to-br from-gray-50 to-gray-100', badge: 'bg-gray-400 text-white', size: 'h-20' },
  bronze: { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', badge: 'bg-orange-600 text-white', size: 'h-16' },
}

export default function Sponsors() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSponsors(slug).then(d => { setSponsors(d.sponsors || []); setLoading(false) }).catch(() => setLoading(false))
  }, [slug])

  return (
    <ClubLayout club={club}>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Our Sponsors</h1>
      <p className="text-gray-500 mb-8">These businesses make {club?.short_name || 'our club'} possible. Please support them.</p>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-10">
          {TIERS.map(tier => {
            const group = sponsors.filter(s => s.tier === tier)
            if (!group.length) return null
            const style = TIER_STYLES[tier]
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${style.badge}`}>{tier}</span>
                </div>
                <div className={`grid gap-4 ${tier === 'platinum' ? 'grid-cols-1 md:grid-cols-2' : tier === 'gold' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {group.map(s => (
                    <a key={s.id} href={s.website_url || '#'} target="_blank" rel="noopener noreferrer"
                      className={`card ${style.bg} flex flex-col items-center justify-center ${style.size} hover:shadow-md transition-shadow`}>
                      {s.logo_url
                        ? <img src={s.logo_url} alt={s.name} className="max-h-16 max-w-full object-contain" />
                        : <div className="text-center">
                            <div className="font-bold text-gray-700">{s.name}</div>
                            {s.description && <div className="text-xs text-gray-500 mt-1">{s.description}</div>}
                          </div>
                      }
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
          {sponsors.length === 0 && <div className="card text-center text-gray-400 py-12">No sponsors listed yet.</div>}
        </div>
      )}

      <div className="card mt-10 club-bg text-white text-center py-8">
        <h2 className="font-black text-xl mb-2">Become a Sponsor</h2>
        <p className="text-white/70 mb-4 text-sm">Support {club?.name} and get your business in front of our community.</p>
        <a href={`mailto:admin@${slug}.com`} className="inline-block club-accent club-text px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
          Get in touch →
        </a>
      </div>
    </ClubLayout>
  )
}
