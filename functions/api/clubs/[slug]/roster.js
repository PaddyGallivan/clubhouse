export async function onRequestGet({ params, env }) {
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.avatar_url, m.jumper_number, m.positions, m.role
     FROM memberships m JOIN users u ON m.user_id = u.id
     WHERE m.club_id = ? AND m.role = 'player' AND m.status = 'active'
     ORDER BY m.jumper_number ASC`
  ).bind(clubs[0].id).all()
  return Response.json({ roster: results })
}
