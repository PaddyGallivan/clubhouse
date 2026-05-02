async function getAuthedUser(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(auth.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ request, env }) {
  const user = await getAuthedUser(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { results: memberships } = await env.DB.prepare(
    `SELECT m.*, c.slug as club_slug, c.name as club_name FROM ch_memberships m
     JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
  ).bind(user.id).all()
  return Response.json({ user: { ...user, memberships } })
}

export async function onRequestPatch({ request, env }) {
  const user = await getAuthedUser(request, env)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { name, phone } = await request.json()
  if (!name?.trim()) return new Response(JSON.stringify({ error: 'Name required' }), { status: 400 })
  await env.DB.prepare(
    'UPDATE ch_users SET name = ?, phone = ? WHERE id = ?'
  ).bind(name.trim(), phone?.trim() || null, user.id).run()
  const { results } = await env.DB.prepare('SELECT * FROM ch_users WHERE id = ?').bind(user.id).all()
  const { results: memberships } = await env.DB.prepare(
    `SELECT m.*, c.slug as club_slug, c.name as club_name FROM ch_memberships m
     JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
  ).bind(user.id).all()
  return Response.json({ user: { ...results[0], memberships } })
}
