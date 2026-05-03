const AUTH = async (req, env) => {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM ch_sessions s JOIN ch_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(h.slice(7)).all()
  return results[0] || null
}

export async function onRequestGet({ params, env }) {
  const user = await AUTH(request, env)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { slug, teamId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results: teams } = await env.DB.prepare(
    'SELECT * FROM ch_teams WHERE id = ? AND club_id = ?'
  ).bind(teamId, clubs[0].id).all()
  if (!teams.length) return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404 })
  const { results: members } = await env.DB.prepare(
    `SELECT tm.*, u.name, u.avatar_url FROM ch_team_members tm
     JOIN ch_users u ON tm.user_id = u.id
     WHERE tm.team_id = ? ORDER BY tm.jumper_number ASC`
  ).bind(teamId).all()
  return Response.json({ team: { ...teams[0], members } })
}
