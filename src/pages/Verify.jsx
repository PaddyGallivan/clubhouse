import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { setToken, setUser } from '../lib/auth.js'

export default function Verify() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('invalid'); return }
    api.verifyMagicLink(token)
      .then(data => {
        setToken(data.session_token)
        setUser(data.user)
        setStatus('success')
        setTimeout(() => navigate(`/${slug}/dashboard`), 1500)
      })
      .catch(() => setStatus('invalid'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {status === 'verifying' && (
        <>
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-900 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Signing you in…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-black text-gray-900">You're in!</h2>
          <p className="text-gray-500 mt-2 text-sm">Taking you to your dashboard…</p>
        </>
      )}
      {status === 'invalid' && (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-black text-gray-900">Link expired or invalid</h2>
          <p className="text-gray-500 mt-2 text-sm">Login links expire after 15 minutes.</p>
          <a href={`/${slug}/login`} className="mt-4 btn-primary">Try again</a>
        </>
      )}
    </div>
  )
}
