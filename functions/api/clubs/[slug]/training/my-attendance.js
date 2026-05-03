const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id

  // Verify user is a member of this club
  const { results: membership } = await env.DB.prepare(
    'SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = ?'
  ).bind(user.id, clubId, 'active').all()
  if (!membership.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const myRole = membership[0].role
  const { results } = await env.DB.prepare(
    `SELECT a.session_id, a.status, a.note, t.date, t.time, t.venue
     FROM ch_attendance a
     JOIN ch_training_sessions t ON a.session_id = t.id
     WHERE a.user_id = ? AND t.club_id = ?
     ORDER BY t.date DESC`
  ).bind(user.id, clubId).all()
  return Response.json({ attendance: results })
}
