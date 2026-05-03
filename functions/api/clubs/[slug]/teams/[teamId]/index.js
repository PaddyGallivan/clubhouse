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

  const { slug, teamId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return Response.json({ error: 'Not found' }, { status: 404 })
  const clubId = clubs[0].id

  const { results: mem } = await env.DB.prepare(
    "SELECT role FROM ch_memberships WHERE user_id = ? AND club_id = ? AND status = 'active'"
  ).bind(user.id, clubId).all()
  if (!mem.length) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { results: teams } = await env.DB.prepare(
    'SELECT * FROM ch_teams WHERE id = ? AND club_id = ?'
  ).bind(teamId, clubId).all()
  if (!teams.length) return Response.json({ error: 'Team not found' }, { status: 404 })

  const { results: members } = await env.DB.prepare(
    `SELECT tm.*, u.name, u.avatar_url, m.jumper_number, m.positions
     FROM ch_team_members tm
     JOIN ch_users u ON tm.user_id = u.id
     JOIN ch_memberships m ON m.user_id = u.id AND m.club_id = ?
     WHERE tm.team_id = ? ORDER BY tm.jumper_number ASC`
  ).bind(clubId, teamId).all()
  return Response.json({ team: { ...teams[0], members } })
}
