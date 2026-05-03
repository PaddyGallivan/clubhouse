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

  const sub = await request.json()
  const { endpoint, keys } = sub
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: 'Invalid subscription object' }), { status: 400 })
  }

  await env.DB.prepare(`
    INSERT INTO ch_push_subscriptions (user_id, club_id, endpoint, p256dh, auth)
    VALUES (?,?,?,?,?)
    ON CONFLICT(user_id, endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth
  `).bind(user.id, clubId, endpoint, keys.p256dh, keys.auth).run()

  return Response.json({ ok: true })
}
