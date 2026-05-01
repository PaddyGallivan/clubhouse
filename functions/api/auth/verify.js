export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json()
    if (!token) return new Response(JSON.stringify({ error: 'Token required' }), { status: 400 })

    const { results } = await env.DB.prepare(
      'SELECT * FROM ch_magic_links WHERE token = ? AND used_at IS NULL AND expires_at > datetime("now")'
    ).bind(token).all()

    if (!results.length) return new Response(JSON.stringify({ error: 'Link expired or already used' }), { status: 401 })

    const link = results[0]
    await env.DB.prepare('UPDATE ch_magic_links SET used_at = datetime("now") WHERE id = ?').bind(link.id).run()

    // Upsert user
    await env.DB.prepare('INSERT OR IGNORE INTO ch_users (email) VALUES (?)').bind(link.email).run()
    const { results: users } = await env.DB.prepare('SELECT * FROM ch_users WHERE email = ?').bind(link.email).all()
    const user = users[0]

    // Create session
    const sessionToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await env.DB.prepare(
      'INSERT INTO ch_sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expires).run()

    // Get memberships
    const { results: memberships } = await env.DB.prepare(
      `SELECT m.*, c.slug as club_slug, c.name as club_name FROM memberships m
       JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
    ).bind(user.id).all()

    return Response.json({ session_token: sessionToken, user: { ...user, memberships } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
