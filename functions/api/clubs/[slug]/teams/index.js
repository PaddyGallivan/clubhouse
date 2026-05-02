export async function onRequestGet({ params, env }) {
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT t.*, u.name as coach_name FROM ch_teams t
     LEFT JOIN ch_users u ON t.coach_id = u.id
     WHERE t.club_id = ? ORDER BY t.name ASC`
  ).bind(clubs[0].id).all()
  return Response.json({ teams: results })
}
