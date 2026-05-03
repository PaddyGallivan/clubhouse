// API client — talks to CF Pages Functions at /functions/api/

const BASE = '/api'

async function req(path, opts = {}) {
  const token = localStorage.getItem('ch_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
  getAllClubs: () => req('/clubs'),
  getFixtures: (slug) => req(`/clubs/${slug}/fixtures`),
  getRoster: (slug) => req(`/clubs/${slug}/roster`),
  getTeams: (slug) => req(`/clubs/${slug}/teams`),
  getTeam: (slug, teamId) => req(`/clubs/${slug}/teams/${teamId}`),
  getAnnouncements: (slug) => req(`/clubs/${slug}/announcements`),
  getSponsors: (slug) => req(`/clubs/${slug}/sponsors`),
  sendMagicLink: (email, slug) => req('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email, club_slug: slug }) }),
  verifyMagicLink: (token) => req('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  getMe: () => req('/me'),
}

export const chatApi = {
  getChat: (slug, teamId) => req(`/clubs/${slug}/chat?team=${teamId}`),
  sendChat: (slug, teamId, message) => req(`/clubs/${slug}/chat`, { method: 'POST', body: JSON.stringify({ team_id: teamId, message }) }),
}

Object.assign(api, {
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
  getFees: (slug) => req(`/clubs/${slug}/fees`),
  getMyFees: (slug) => req(`/clubs/${slug}/fees/my`),
  addFeeType: (slug, data) => req(`/clubs/${slug}/fees`, { method: 'POST', body: JSON.stringify(data) }),
  markFeePaid: (slug, feeTypeId, data) => req(`/clubs/${slug}/fees/${feeTypeId}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  getAvailability: (slug, fixtureId) => req(`/clubs/${slug}/fixtures/${fixtureId}/availability`),
  setAvailability: (slug, fixtureId, status, note) => req(`/clubs/${slug}/fixtures/${fixtureId}/availability`, { method: 'POST', body: JSON.stringify({ status, note }) }),
  invitePlayer: (slug, email, role) => req(`/clubs/${slug}/invite`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  getTrainingSessions: (slug) => req(`/clubs/${slug}/training`),
  addTrainingSession: (slug, data) => req(`/clubs/${slug}/training`, { method: 'POST', body: JSON.stringify(data) }),
  getMyAttendance: (slug) => req(`/clubs/${slug}/training/my-attendance`),
  markAttendance: (slug, sessionId, status) => req(`/clubs/${slug}/training/${sessionId}/attend`, { method: 'POST', body: JSON.stringify({ status }) }),
  getSessionAttendance: (slug, sessionId) => req(`/clubs/${slug}/training/${sessionId}/attend`),
  getSuperadminStats: () => req('/superadmin'),
  onboardClub: (data) => req('/onboard', { method: 'POST', body: JSON.stringify(data) }),
  getVapidKey: (slug) => req(`/clubs/${slug}/push/vapid-key`),
  subscribePush: (slug, subscription) => req(`/clubs/${slug}/push/subscribe`, { method: 'POST', body: JSON.stringify(subscription) }),
  sendPush: (slug) => req(`/clubs/${slug}/push/send`, { method: 'POST', body: JSON.stringify({}) }),
  // Team roster management
  addTeamMember: (slug, teamId, userId, jumperNumber) => req(`/clubs/${slug}/teams/${teamId}/roster`, { method: 'POST', body: JSON.stringify({ user_id: userId, jumper_number: jumperNumber }) }),
  removeTeamMember: (slug, teamId, userId) => req(`/clubs/${slug}/teams/${teamId}/roster`, { method: 'DELETE', body: JSON.stringify({ user_id: userId }) }),
  createTeam: (slug, data) => req(`/clubs/${slug}/teams`, { method: 'POST', body: JSON.stringify(data) }),
  // Avatar upload
  uploadAvatar: (slug, formData) => {
    const token = localStorage.getItem('ch_token')
    return fetch(`/api/clubs/${slug}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error))))
  },
  // Feature toggles
  getClubFeatures: (slug) => req(`/clubs/${slug}/settings`),
  updateClubFeatures: (slug, features) => req(`/clubs/${slug}/settings`, { method: 'PATCH', body: JSON.stringify(features) }),
  // PlayHQ sync
  getPlayHQConfig: (slug) => req(`/clubs/${slug}/sync/playhq`),
  savePlayHQConfig: (slug, data) => req(`/clubs/${slug}/sync/playhq`, { method: 'PATCH', body: JSON.stringify(data) }),
  syncPlayHQ: (slug, apiKey) => req(`/clubs/${slug}/sync/playhq`, { method: 'POST', body: JSON.stringify({ api_key: apiKey }) }),
})
