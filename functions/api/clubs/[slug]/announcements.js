export async function onRequestGet({ params, env }) {
  const { slug } = params
  const { results: clubs } = await env.DB.prepare('SELECT id FROM clubs WHERE slug = ?').bind(slug).all()
  if (!clubs.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  const { results } = await env.DB.prepare(
    `SELECT a.*, u.name as author_name, t.name as team_name
     FROM announcements a
     LEFT JOIN users u ON a.author_id = u.id
     LEFT JOIN teams t ON a.team_id = t.id
     WHERE a.club_id = ?
     ORDER BY a.pinned DESC, a.created_at DESC`
  ).bind(clubs[0].id).all()
  return Response.json({ announcements: results })
}
