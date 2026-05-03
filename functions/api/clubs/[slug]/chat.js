async function getClubId(env, slug) {
  const { results } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  return results[0]?.id || null
}
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
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { slug } = params
  const url = new URL(request.url)
  const teamId = url.searchParams.get('team')
  const clubId = await getClubId(env, slug)
  if (!clubId) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT c.*, u.name as author_name FROM ch_team_chat c
     JOIN ch_users u ON c.user_id = u.id
     WHERE c.team_id = ? ORDER BY c.created_at ASC LIMIT 100`
  ).bind(teamId).all()
  return Response.json({ messages: results })
}

export async function onRequestPost({ params, request, env }) {
  const user = await authed(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { slug } = params
  const { team_id, message } = await request.json()
  if (!message?.trim()) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
  await env.DB.prepare('INSERT INTO ch_team_chat (team_id, user_id, message) VALUES (?, ?, ?)')
    .bind(team_id, user.id, message.trim()).run()
  return Response.json({ ok: true })
}
