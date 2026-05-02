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
  getClub: (slug) => req(`/clubs/${slug}`),
  getFixtures: (slug) => req(`/clubs/${slug}/fixtures`),
  getRoster: (slug) => req(`/clubs/${slug}/roster`),
  getTeams: (slug) => req(`/clubs/${slug}/teams`),
  getTeam: (slug, teamId) => req(`/clubs/${slug}/teams/${teamId}`),
  getAnnouncements: (slug) => req(`/clubs/${slug}/announcements`),
  getSponsors: (slug) => req(`/clubs/${slug}/sponsors`),
  sendMagicLink: (email, slug) => req('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email, club_slug: slug }) }),
  verifyMagicLink: (token) => req('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  getMe: () => req('/me'),
  getChat: (slug, teamId) => req(`/clubs/${slug}/chat?team=${teamId}`),
  sendChat: (slug, teamId, message) => req(`/clubs/${slug}/chat`, { method: 'POST', body: JSON.stringify({ team_id: teamId, message }) }),
  getBFTally: (slug, round) => req(`/clubs/${slug}/bf-tally?round=${round}`),
  getMyBFVote: (slug, round) => req(`/clubs/${slug}/bf-vote?round=${round}`),
  submitBFVote: (slug, round, votes) => req(`/clubs/${slug}/bf-vote`, { method: 'POST', body: JSON.stringify({ round, ...votes }) }),
  updateScore: (slug, fixtureId, score_us, score_them) => req(`/clubs/${slug}/fixtures/${fixtureId}/score`, { method: 'POST', body: JSON.stringify({ score_us, score_them }) }),
  submitFeedback: (slug, fixtureId, data) => req(`/clubs/${slug}/fixtures/${fixtureId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  getPlayerProfile: (slug, userId) => req(`/clubs/${slug}/player/${userId}`),
  getEvents: (slug) => req(`/clubs/${slug}/events`),
  rsvpEvent: (slug, eventId, status) => req(`/clubs/${slug}/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  addFixture: (slug, data) => req(`/clubs/${slug}/fixtures`, { method: 'POST', body: JSON.stringify(data) }),
  addAnnouncement: (slug, data) => req(`/clubs/${slug}/announcements`, { method: 'POST', body: JSON.stringify(data) }),
  // Fees
  getFees: (slug) => req(`/clubs/${slug}/fees`),
  getMyFees: (slug) => req(`/clubs/${slug}/fees/my`),
  addFeeType: (slug, data) => req(`/clubs/${slug}/fees`, { method: 'POST', body: JSON.stringify(data) }),
  markFeePaid: (slug, feeTypeId, data) => req(`/clubs/${slug}/fees/${feeTypeId}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  // Availability
  getAvailability: (slug, fixtureId) => req(`/clubs/${slug}/fixtures/${fixtureId}/availability`),
  setAvailability: (slug, fixtureId, status, note) => req(`/clubs/${slug}/fixtures/${fixtureId}/availability`, { method: 'POST', body: JSON.stringify({ status, note }) }),
}
