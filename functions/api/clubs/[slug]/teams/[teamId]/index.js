export async function onRequestGet({ params, env }) {
  const { slug, teamId } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results: teams } = await env.DB.prepare(
    'SELECT * FROM teams WHERE id = ? AND club_id = ?'
  ).bind(teamId, clubs[0].id).all()
  if (!teams.length) return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404 })
  const { results: members } = await env.DB.prepare(
    `SELECT tm.*, u.name, u.avatar_url FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = ? ORDER BY tm.jumper_number ASC`
  ).bind(teamId).all()
  return Response.json({ team: { ...teams[0], members } })
}
