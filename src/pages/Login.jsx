import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'

export default function Login() {
  const { slug } = useParams()
  const { club } = useClub(slug)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const primary = club?.primary_colour || '#003087'
  const secondary = club?.secondary_colour || '#FFD700'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await api.sendMagicLink(email, slug)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <style>{`:root { --club-primary: ${primary}; --club-secondary: ${secondary}; }`}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl club-bg mb-4">
            <span className="text-3xl">🏟️</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">{club?.short_name || club?.name || 'Clubhouse'}</h1>
          <p className="text-gray-500 text-sm mt-1">Member login</p>
        </div>

        {sent ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-black text-gray-900 text-lg mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm">We sent a login link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">Try a different email</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full club-bg text-white py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Sending...' : 'Send login link'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">No account? You'll be registered automatically.</p>
          </form>
        )}

        <div className="text-center mt-6">
          <a href={`/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">← Back to {club?.short_name || 'club'}</a>
        </div>
        <div className="text-center mt-4">
          <span className="text-xs text-gray-300">
            <a href="/privacy" className="hover:text-gray-500 transition-colors">Privacy Policy</a>
            {' · '}
            <a href="/terms" className="hover:text-gray-500 transition-colors">Terms of Service</a>
          </span>
        </div>
      </div>
    </div>
  )
}
