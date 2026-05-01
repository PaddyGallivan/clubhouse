export async function onRequestGet({ params, env }) {
  const { slug } = params
  const club = await getClub(env, slug)
  if (!club) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT f.*, t.name as team_name FROM fixtures f
     LEFT JOIN teams t ON f.team_id = t.id
     WHERE f.club_id = ? ORDER BY f.date ASC`
  ).bind(club.id).all()
  return Response.json({ fixtures: results })
}
async function getClub(env, slug) {
  const { results } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  return results[0] || null
}
