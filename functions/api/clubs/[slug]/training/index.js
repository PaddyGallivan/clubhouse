export async function onRequestGet({ params, env }) {
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id
  const { results } = await env.DB.prepare(
    `SELECT * FROM ch_training_sessions WHERE club_id = ? ORDER BY date ASC, time ASC`
  ).bind(clubId).all()
  return Response.json({ sessions: results })
}

const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const clubId = clubs[0].id
  const { date, time, venue, notes, drill_notes, team_id } = await request.json()
  const { results } = await env.DB.prepare(
    `INSERT INTO ch_training_sessions (club_id, team_id, date, time, venue, notes, drill_notes, created_by)
     VALUES (?,?,?,?,?,?,?,?) RETURNING *`
  ).bind(clubId, team_id || null, date, time || null, venue || null, notes || null, drill_notes || null, user.id).all()
  return Response.json({ session: results[0] })
}
