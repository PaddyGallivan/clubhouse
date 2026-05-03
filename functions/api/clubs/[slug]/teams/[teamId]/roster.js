const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

async function getClubAndCheckRole(env, slug, userId, allowedRoles) {
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return { error: 'Not found', status: 404 }
  const clubId = clubs[0].id
  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(userId, clubId).all()
  if (!mem.length) return { error: 'Forbidden', status: 403 }
  if (allowedRoles && !allowedRoles.includes(mem[0].role)) return { error: 'Forbidden', status: 403 }
  return { clubId, role: mem[0].role }
}

// POST — add a player to the team
export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await getClubAndCheckRole(env, params.slug, user.id, ['admin', 'committee', 'coach'])
  if (check.error) return Response.json({ error: check.error }, { status: check.status })

  const { user_id, jumper_number } = await request.json()
  if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 })

  await env.DB.prepare(
    `INSERT OR REPLACE INTO ch_team_members (team_id, user_id, jumper_number) VALUES (?, ?, ?)`
  ).bind(params.teamId, user_id, jumper_number || null).run()

  return Response.json({ ok: true })
}

// DELETE — remove a player from the team
export async function onRequestDelete({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await getClubAndCheckRole(env, params.slug, user.id, ['admin', 'committee', 'coach'])
  if (check.error) return Response.json({ error: check.error }, { status: check.status })

  const { user_id } = await request.json()
  if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 })

  await env.DB.prepare(
    'DELETE FROM ch_team_members WHERE team_id = ? AND user_id = ?'
  ).bind(params.teamId, user_id).run()

  return Response.json({ ok: true })
}
