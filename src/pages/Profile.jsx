import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClubLayout from '../components/ClubLayout.jsx'
import useClub from '../lib/useClub.js'
import { api } from '../lib/api.js'
import { isLoggedIn, getUser, setUser, clearToken } from '../lib/auth.js'

export default function Profile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { club } = useClub(slug)
  const [me, setMe] = useState(getUser())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { navigate(`/${slug}/login`); return }
    const user = getUser()
    if (user) { setName(user.name || ''); setPhone(user.phone || '') }
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ch_token')}`,
        },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      const data = await res.json()
      setUser(data.user)
      setMe(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch(e) { setError(e.message) }
    setSaving(false)
  }

  function handleSignOut() {
    clearToken()
    navigate(`/${slug}`)
  }

  return (
    <ClubLayout club={club}>
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Update your details</p>
        </div>

        {/* Avatar placeholder */}
        <div className="card mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full club-bg flex items-center justify-center text-white text-2xl font-black">
            {(name || me?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{name || me?.name || 'Member'}</p>
            <p className="text-sm text-gray-400">{me?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="card space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="04XX XXX XXX"
              type="tel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              value={me?.email || ''}
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">To change your email, contact the club.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && <p className="text-sm text-green-600 font-semibold">✅ Profile saved!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full club-bg text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Login info */}
        <div className="card mt-4 bg-blue-50 border-blue-100">
          <p className="text-sm font-semibold text-blue-900 mb-1">🔐 Passwordless login</p>
          <p className="text-xs text-blue-700">Clubhouse uses magic links — no password needed. Just enter your email on the login page and we'll send you a one-click sign-in link.</p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-4 border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-lg font-semibold text-sm transition-colors">
          Sign out
        </button>
      </div>
    </ClubLayout>
  )
}
