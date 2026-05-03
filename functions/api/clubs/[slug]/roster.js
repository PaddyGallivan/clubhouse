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
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.avatar_url, m.jumper_number, m.positions, m.role
     FROM ch_memberships m JOIN ch_users u ON m.user_id = u.id
     WHERE m.club_id = ? AND m.role = 'player' AND m.status = 'active'
     ORDER BY m.jumper_number ASC`
  ).bind(clubs[0].id).all()
  return Response.json({ roster: results })
}
