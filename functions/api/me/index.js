export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const token = auth.slice(7)
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).all()
  if (!results.length) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const user = results[0]
  const { results: memberships } = await env.DB.prepare(
    `SELECT m.*, c.slug as club_slug, c.name as club_name FROM ch_memberships m
     JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
  ).bind(user.id).all()
  return Response.json({ user: { ...user, memberships } })
}
