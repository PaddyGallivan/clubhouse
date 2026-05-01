async function authed(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(auth.slice(7)).all()
  return results[0] || null
}
export async function onRequestGet({ params, env }) {
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT a.*, u.name as author_name, t.name as team_name FROM ch_announcements a
     LEFT JOIN ch_users u ON a.author_id = u.id LEFT JOIN ch_teams t ON a.team_id = t.id
     WHERE a.club_id = ? ORDER BY a.pinned DESC, a.created_at DESC`
  ).bind(clubs[0].id).all()
  return Response.json({ announcements: results })
}
export async function onRequestPost({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { title, body, pinned, team_id } = await request.json()
  const result = await env.DB.prepare(
    `INSERT INTO ch_announcements (club_id, author_id, title, body, pinned, team_id) VALUES (?,?,?,?,?,?)`
  ).bind(clubs[0].id, user.id, title, body, pinned || 0, team_id || null).run()
  const { results: rows } = await env.DB.prepare('SELECT * FROM ch_announcements WHERE id = ?').bind(result.meta.last_row_id).all()
  return Response.json({ announcement: rows[0] })
}
