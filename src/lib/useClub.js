import { useState, useEffect } from 'react'
import { api } from './api.js'

// Simple in-memory cache
const cache = {}

export default function useClub(slug) {
  const [club, setClub] = useState(cache[slug] || null)
  const [loading, setLoading] = useState(!cache[slug])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    if (cache[slug]) { setClub(cache[slug]); setLoading(false); return }
    api.getClub(slug)
      .then(data => { cache[slug] = data.club; setClub(data.club); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [slug])

  return { club, loading, error }
}
