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
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { results } = await env.DB.prepare(
    `SELECT t.*, u.name as coach_name,
       (SELECT COUNT(*) FROM ch_team_members tm WHERE tm.team_id = t.id) as member_count
     FROM ch_teams t
     LEFT JOIN ch_users u ON t.coach_id = u.id
     WHERE t.club_id = ? ORDER BY t.name ASC`
  ).bind(clubId).all()
  return Response.json({ teams: results })
}

export async function onRequestPost({ params, request, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })
  if (!['admin','committee'].includes(mem[0].role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { name, age_group, season, coach_id } = await request.json()
  if (!name) return Response.json({ error: 'name required' }, { status: 400 })

  const { results: created } = await env.DB.prepare(
    'INSERT INTO ch_teams (club_id, name, age_group, season, coach_id) VALUES (?, ?, ?, ?, ?) RETURNING *'
  ).bind(clubId, name, age_group || null, season || null, coach_id || null).all()

  return Response.json({ team: created[0] }, { status: 201 })
}
