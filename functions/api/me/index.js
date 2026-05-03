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

  const body = await request.json()
  const { name, phone, club_slug, jumper_number, positions } = body

  if (name !== undefined && !name?.trim()) {
    return new Response(JSON.stringify({ error: 'Name cannot be empty' }), { status: 400 })
  }

  // Update user table fields if provided
  await env.DB.prepare(
    'UPDATE ch_users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?'
  ).bind(name?.trim() ?? null, phone?.trim() ?? null, user.id).run()

  // Update membership fields (jumper_number, positions) if club_slug provided
  if (club_slug) {
    const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(club_slug).all()
    if (clubs.length) {
      const clubId = clubs[0].id
      await env.DB.prepare(
        `UPDATE ch_memberships SET
           jumper_number = COALESCE(?, jumper_number),
           positions = COALESCE(?, positions)
         WHERE user_id = ? AND club_id = ?`
      ).bind(
        jumper_number !== undefined ? (jumper_number || null) : null,
        positions !== undefined ? (positions?.trim() || null) : null,
        user.id, clubId
      ).run()
    }
  }

  const { results } = await env.DB.prepare('SELECT * FROM ch_users WHERE id = ?').bind(user.id).all()
  const { results: memberships } = await env.DB.prepare(
    `SELECT m.*, c.slug as club_slug, c.name as club_name FROM ch_memberships m
     JOIN clubs c ON m.club_id = c.id WHERE m.user_id = ?`
  ).bind(user.id).all()
  return Response.json({ user: { ...results[0], memberships } })
}
