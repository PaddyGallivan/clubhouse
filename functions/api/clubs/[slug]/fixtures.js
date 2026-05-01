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
    `SELECT f.*, t.name as team_name FROM ch_fixtures f LEFT JOIN ch_teams t ON f.team_id = t.id WHERE f.club_id = ? ORDER BY f.date ASC`
  ).bind(clubs[0].id).all()
  return Response.json({ fixtures: results })
}
export async function onRequestPost({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(params.slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { round, opponent_name, date, time, venue, is_home } = await request.json()
  const result = await env.DB.prepare(
    `INSERT INTO ch_fixtures (club_id, round, opponent_name, date, time, venue, is_home) VALUES (?,?,?,?,?,?,?)`
  ).bind(clubs[0].id, round, opponent_name, date || null, time || null, venue || null, is_home ?? 1).run()
  const { results: rows } = await env.DB.prepare('SELECT * FROM ch_fixtures WHERE id = ?').bind(result.meta.last_row_id).all()
  return Response.json({ fixture: rows[0] })
}
