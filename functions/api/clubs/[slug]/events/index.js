async function authed(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(auth.slice(7)).all()
  return results[0] || null
}
export async function onRequestGet({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }, { status: 404 }))
  const clubId = clubId
  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId, 'active').all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { results } = await env.DB.prepare(
    `SELECT e.*, (SELECT COUNT(*) FROM ch_event_rsvp r WHERE r.event_id=e.id AND r.status='yes') as rsvp_yes
     FROM ch_events e WHERE e.club_id = ? ORDER BY e.date ASC`
  ).bind(clubId).all()
  let withRsvp = results
  if (user) {
    const myRsvps = await env.DB.prepare('SELECT event_id, status FROM ch_event_rsvp WHERE user_id = ?').bind(user.id).all()
    const map = Object.fromEntries((myRsvps.results || []).map(r => [r.event_id, r.status]))
    withRsvp = results.map(e => ({ ...e, my_rsvp: map[e.id] || null }))
  }
  return Response.json({ events: withRsvp })
}
