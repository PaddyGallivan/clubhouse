// API client — talks to CF Pages Functions at /functions/api/

const BASE = '/api'

async function req(path, opts = {}) {
  const token = localStorage.getItem('ch_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Club
  getClub: (slug) => req(`/clubs/${slug}`),

  // Fixtures
  getFixtures: (slug) => req(`/clubs/${slug}/fixtures`),

  // Roster
  getRoster: (slug) => req(`/clubs/${slug}/roster`),

  // Teams
  getTeams: (slug) => req(`/clubs/${slug}/teams`),
  getTeam: (slug, teamId) => req(`/clubs/${slug}/teams/${teamId}`),

  // Announcements
  getAnnouncements: (slug) => req(`/clubs/${slug}/announcements`),

  // Sponsors
  getSponsors: (slug) => req(`/clubs/${slug}/sponsors`),

  // Auth
  sendMagicLink: (email, slug) =>
    req('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, club_slug: slug }),
    }),
  verifyMagicLink: (token) =>
    req('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Me
  getMe: () => req('/me'),
}
